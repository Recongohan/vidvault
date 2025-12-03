import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { loginSchema, signupSchema, type User } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/types";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    challenge?: string;
  }
}

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"));
    }
  },
});

const rpName = "VideoVault";

function getWebAuthnConfig(req: Request) {
  const host = req.get("host") || "localhost";
  const protocol = req.get("x-forwarded-proto") || req.protocol || "https";
  const rpID = process.env.RP_ID || host.split(":")[0];
  const origin = process.env.ORIGIN || `${protocol}://${host}`;
  return { rpID, origin };
}

async function seedVips() {
  const vipData = [
    { username: "Anthony", displayName: "Anthony", title: "CEO", country: "USA", avatarUrl: "/vip-avatars/anthony.png" },
    { username: "Charles", displayName: "Charles", title: "President", country: "UK", avatarUrl: "/vip-avatars/charles.png" },
    { username: "Jan", displayName: "Jan", title: "CEO", country: "Germany", avatarUrl: "/vip-avatars/jan.png" },
    { username: "Yuki", displayName: "Yuki", title: "Director", country: "Japan", avatarUrl: "/vip-avatars/yuki.png" },
    { username: "Raj", displayName: "Raj", title: "Chairman", country: "India", avatarUrl: "/vip-avatars/raj.png" },
  ];

  for (const vip of vipData) {
    const existing = await storage.getUserByUsername(vip.username);
    if (!existing) {
      await storage.createUser({
        ...vip,
        password: "123",
        role: "vip",
      });
      console.log(`Created VIP: ${vip.username}`);
    }
  }

  const adminExists = await storage.getUserByUsername("admin");
  if (!adminExists) {
    await storage.createUser({
      username: "admin",
      password: "admin123",
      displayName: "Administrator",
      role: "admin",
    });
    console.log("Created admin user");
  }
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    (req as any).user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}

function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }
      if (!roles.includes(user.role)) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      (req as any).user = user;
      next();
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "videovault-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  await seedVips();

  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input" });
      }

      const { username, password } = result.data;
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.userId = user.id;
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const result = signupSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
      }

      const { username, password, displayName } = result.data;
      const existing = await storage.getUserByUsername(username);

      if (existing) {
        return res.status(400).json({ error: "Username already taken" });
      }

      const user = await storage.createUser({
        username,
        password,
        displayName,
        role: "creator",
      });

      req.session.userId = user.id;
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Could not log out" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({ user: { ...user, password: undefined } });
  });

  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getVideos();
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const video = await storage.getVideoById(req.params.id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      await storage.incrementViewCount(req.params.id);
      res.json(video);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/my-videos", requireAuth, async (req, res) => {
    try {
      const videos = await storage.getVideosByUploader(req.session.userId!);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/videos", requireAuth, upload.single("video"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (user.role === "vip") {
        return res.status(403).json({ error: "VIPs cannot upload videos" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No video file provided" });
      }

      const { title, description } = req.body;
      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      const videoUrl = `/uploads/${req.file.filename}`;
      
      const video = await storage.createVideo({
        title,
        description: description || null,
        videoUrl,
        uploaderId: user.id,
        thumbnailUrl: null,
      });

      let vipIds: string[] = [];
      try {
        vipIds = JSON.parse(req.body.vipIds || "[]");
      } catch {}

      if (user.isAuthApproved && vipIds.length > 0) {
        for (const vipId of vipIds) {
          await storage.createVerificationRequest({
            videoId: video.id,
            vipId,
          });
        }
      }

      res.json(video);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/vips", requireAuth, async (req, res) => {
    try {
      const vips = await storage.getVips();
      res.json(vips.map((v) => ({ ...v, password: undefined })));
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/auth-requests/my", requireAuth, async (req, res) => {
    try {
      const request = await storage.getAuthRequestByCreator(req.session.userId!);
      res.json(request || null);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/auth-requests", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (user.role !== "creator") {
        return res.status(403).json({ error: "Only creators can request auth" });
      }

      const existing = await storage.getAuthRequestByCreator(user.id);
      if (existing) {
        return res.status(400).json({ error: "Request already submitted" });
      }

      const request = await storage.createAuthRequest({ creatorId: user.id });
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/admin/auth-requests", requireRole("admin"), async (req, res) => {
    try {
      const requests = await storage.getAuthRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/admin/auth-requests/:id/:action", requireRole("admin"), async (req, res) => {
    try {
      const { id, action } = req.params;
      if (action !== "approve" && action !== "reject") {
        return res.status(400).json({ error: "Invalid action" });
      }

      const updated = await storage.updateAuthRequestStatus(id, action === "approve" ? "approved" : "rejected");
      if (!updated) {
        return res.status(404).json({ error: "Request not found" });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/admin/users", requireRole("admin"), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map((u) => ({ ...u, password: undefined })));
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/vip/verification-requests", requireRole("vip"), async (req, res) => {
    try {
      const requests = await storage.getVerificationRequestsByVip(req.session.userId!);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/vip/has-passkey", requireRole("vip"), async (req, res) => {
    try {
      const passkeys = await storage.getPasskeysByUser(req.session.userId!);
      res.json({ hasPasskey: passkeys.length > 0 });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/vip/verification-requests/:id/:action", requireRole("vip"), async (req, res) => {
    try {
      const { id, action } = req.params;
      if (!["verify", "reject", "ignore"].includes(action)) {
        return res.status(400).json({ error: "Invalid action" });
      }

      const passkeys = await storage.getPasskeysByUser(req.session.userId!);
      
      if (action !== "ignore" && passkeys.length > 0) {
        const { authResult } = req.body;
        if (!authResult) {
          return res.status(400).json({ error: "Passkey authentication required" });
        }

        try {
          const passkey = await storage.getPasskeyByCredentialId(authResult.id);
          if (!passkey) {
            return res.status(400).json({ error: "Invalid passkey" });
          }

          const { rpID, origin } = getWebAuthnConfig(req);

          const verification = await verifyAuthenticationResponse({
            response: authResult as AuthenticationResponseJSON,
            expectedChallenge: req.session.challenge || "",
            expectedOrigin: origin,
            expectedRPID: rpID,
            credential: {
              id: passkey.credentialId,
              publicKey: Buffer.from(passkey.publicKey, "base64url"),
              counter: passkey.counter,
              transports: passkey.transports?.split(",") as AuthenticatorTransportFuture[] || undefined,
            },
          });

          if (!verification.verified) {
            return res.status(400).json({ error: "Passkey verification failed" });
          }

          await storage.updatePasskeyCounter(passkey.id, verification.authenticationInfo.newCounter);
        } catch (error) {
          console.error("Auth verification error:", error);
          return res.status(400).json({ error: "Passkey verification failed" });
        }
      }

      const status = action === "verify" ? "verified" : action === "reject" ? "rejected" : "ignored";
      const updated = await storage.updateVerificationRequestStatus(id, status);
      
      if (!updated) {
        return res.status(404).json({ error: "Request not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/webauthn/register/options", requireRole("vip"), async (req, res) => {
    try {
      const user = (req as any).user as User;
      const existingPasskeys = await storage.getPasskeysByUser(user.id);
      const { rpID } = getWebAuthnConfig(req);

      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: new TextEncoder().encode(user.id),
        userName: user.username,
        userDisplayName: user.displayName || user.username,
        attestationType: "none",
        excludeCredentials: existingPasskeys.map((p) => ({
          id: p.credentialId,
          transports: p.transports?.split(",") as AuthenticatorTransportFuture[] || undefined,
        })),
        authenticatorSelection: {
          residentKey: "required",
          userVerification: "required",
          authenticatorAttachment: "platform",
        },
      });

      req.session.challenge = options.challenge;
      res.json(options);
    } catch (error) {
      console.error("Registration options error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/webauthn/register/verify", requireRole("vip"), async (req, res) => {
    try {
      const user = (req as any).user as User;
      const response = req.body as RegistrationResponseJSON;
      const { rpID, origin } = getWebAuthnConfig(req);

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: req.session.challenge || "",
        expectedOrigin: origin,
        expectedRPID: rpID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return res.status(400).json({ error: "Verification failed" });
      }

      const { credential } = verification.registrationInfo;

      await storage.createPasskey({
        userId: user.id,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString("base64url"),
        counter: credential.counter,
        transports: response.response.transports?.join(",") || null,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Registration verify error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/webauthn/authenticate/options", requireRole("vip"), async (req, res) => {
    try {
      const user = (req as any).user as User;
      const passkeys = await storage.getPasskeysByUser(user.id);
      const { rpID } = getWebAuthnConfig(req);

      if (passkeys.length === 0) {
        return res.status(400).json({ error: "No passkeys registered" });
      }

      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: passkeys.map((p) => ({
          id: p.credentialId,
          transports: p.transports?.split(",") as AuthenticatorTransportFuture[] || undefined,
        })),
        userVerification: "required",
      });

      req.session.challenge = options.challenge;
      res.json(options);
    } catch (error) {
      console.error("Auth options error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.use("/uploads", (req, res, next) => {
    res.setHeader("Accept-Ranges", "bytes");
    next();
  }, express.static(uploadDir));

  return httpServer;
}
