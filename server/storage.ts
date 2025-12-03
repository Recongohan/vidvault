import { 
  users, 
  videos, 
  authRequests, 
  verificationRequests, 
  passkeys,
  notifications,
  type User, 
  type InsertUser, 
  type Video,
  type InsertVideo,
  type AuthRequest,
  type InsertAuthRequest,
  type VerificationRequest,
  type InsertVerificationRequest,
  type Passkey,
  type InsertPasskey,
  type VideoWithUploader,
  type AuthRequestWithCreator,
  type VerificationRequestWithDetails,
  type Notification,
  type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getVips(): Promise<User[]>;
  
  getVideos(search?: string): Promise<VideoWithUploader[]>;
  getCreatorStats(creatorId: string): Promise<{ totalVideos: number; totalViews: number; verifiedCount: number; pendingCount: number; rejectedCount: number }>;
  getVideoById(id: string): Promise<VideoWithUploader | undefined>;
  getVideosByUploader(uploaderId: string): Promise<VideoWithUploader[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  incrementViewCount(videoId: string): Promise<void>;
  
  getAuthRequests(): Promise<AuthRequestWithCreator[]>;
  getAuthRequestByCreator(creatorId: string): Promise<AuthRequest | undefined>;
  createAuthRequest(request: InsertAuthRequest): Promise<AuthRequest>;
  updateAuthRequestStatus(id: string, status: "approved" | "rejected"): Promise<AuthRequest | undefined>;
  
  getVerificationRequest(id: string): Promise<VerificationRequest | undefined>;
  getVerificationRequestsByVip(vipId: string): Promise<VerificationRequestWithDetails[]>;
  getVerificationRequestsByVideo(videoId: string): Promise<(VerificationRequest & { vip: User })[]>;
  createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest>;
  updateVerificationRequestStatus(id: string, status: "verified" | "rejected" | "ignored"): Promise<VerificationRequest | undefined>;
  
  getPasskeysByUser(userId: string): Promise<Passkey[]>;
  getPasskeyByCredentialId(credentialId: string): Promise<Passkey | undefined>;
  createPasskey(passkey: InsertPasskey): Promise<Passkey>;
  updatePasskeyCounter(id: string, counter: number): Promise<void>;
  
  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getVips(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, "vip"));
  }

  async getCreatorStats(creatorId: string): Promise<{ totalVideos: number; totalViews: number; verifiedCount: number; pendingCount: number; rejectedCount: number }> {
    const creatorVideos = await db.select().from(videos).where(eq(videos.uploaderId, creatorId));
    const totalVideos = creatorVideos.length;
    const totalViews = creatorVideos.reduce((sum, v) => sum + (v.viewCount || 0), 0);

    let verifiedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;

    for (const video of creatorVideos) {
      const verifications = await db.select().from(verificationRequests).where(eq(verificationRequests.videoId, video.id));
      const hasVerified = verifications.some(v => v.status === "verified");
      const hasRejected = verifications.some(v => v.status === "rejected");
      const hasPending = verifications.some(v => v.status === "pending");
      
      if (hasVerified) verifiedCount++;
      else if (hasRejected) rejectedCount++;
      else if (hasPending) pendingCount++;
    }

    return { totalVideos, totalViews, verifiedCount, pendingCount, rejectedCount };
  }

  async getVideos(search?: string): Promise<VideoWithUploader[]> {
    const result = await db.query.videos.findMany({
      where: search ? or(
        ilike(videos.title, `%${search}%`),
        ilike(videos.description, `%${search}%`)
      ) : undefined,
      with: {
        uploader: true,
        verificationRequests: {
          with: {
            vip: true,
          },
        },
      },
      orderBy: [desc(videos.createdAt)],
    });
    return result as VideoWithUploader[];
  }

  async getVideoById(id: string): Promise<VideoWithUploader | undefined> {
    const result = await db.query.videos.findFirst({
      where: eq(videos.id, id),
      with: {
        uploader: true,
        verificationRequests: {
          with: {
            vip: true,
          },
        },
      },
    });
    return result as VideoWithUploader | undefined;
  }

  async getVideosByUploader(uploaderId: string): Promise<VideoWithUploader[]> {
    const result = await db.query.videos.findMany({
      where: eq(videos.uploaderId, uploaderId),
      with: {
        uploader: true,
        verificationRequests: {
          with: {
            vip: true,
          },
        },
      },
      orderBy: [desc(videos.createdAt)],
    });
    return result as VideoWithUploader[];
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const [created] = await db.insert(videos).values(video).returning();
    return created;
  }

  async incrementViewCount(videoId: string): Promise<void> {
    const video = await db.select().from(videos).where(eq(videos.id, videoId));
    if (video[0]) {
      await db.update(videos)
        .set({ viewCount: (video[0].viewCount || 0) + 1 })
        .where(eq(videos.id, videoId));
    }
  }

  async getAuthRequests(): Promise<AuthRequestWithCreator[]> {
    const result = await db.query.authRequests.findMany({
      with: {
        creator: true,
      },
      orderBy: [desc(authRequests.createdAt)],
    });
    return result as AuthRequestWithCreator[];
  }

  async getAuthRequestByCreator(creatorId: string): Promise<AuthRequest | undefined> {
    const [request] = await db.select().from(authRequests).where(eq(authRequests.creatorId, creatorId));
    return request || undefined;
  }

  async createAuthRequest(request: InsertAuthRequest): Promise<AuthRequest> {
    const [created] = await db.insert(authRequests).values(request).returning();
    await db.update(users).set({ hasRequestedAuth: true }).where(eq(users.id, request.creatorId));
    return created;
  }

  async updateAuthRequestStatus(id: string, status: "approved" | "rejected"): Promise<AuthRequest | undefined> {
    const [updated] = await db.update(authRequests)
      .set({ status, processedAt: new Date() })
      .where(eq(authRequests.id, id))
      .returning();
    
    if (updated && status === "approved") {
      await db.update(users).set({ isAuthApproved: true }).where(eq(users.id, updated.creatorId));
    }
    
    return updated || undefined;
  }

  async getVerificationRequest(id: string): Promise<VerificationRequest | undefined> {
    const [request] = await db.select().from(verificationRequests).where(eq(verificationRequests.id, id));
    return request || undefined;
  }

  async getVerificationRequestsByVip(vipId: string): Promise<VerificationRequestWithDetails[]> {
    const result = await db.query.verificationRequests.findMany({
      where: eq(verificationRequests.vipId, vipId),
      with: {
        video: {
          with: {
            uploader: true,
          },
        },
        vip: true,
      },
      orderBy: [desc(verificationRequests.createdAt)],
    });
    return result as VerificationRequestWithDetails[];
  }

  async getVerificationRequestsByVideo(videoId: string): Promise<(VerificationRequest & { vip: User })[]> {
    const result = await db.query.verificationRequests.findMany({
      where: eq(verificationRequests.videoId, videoId),
      with: {
        vip: true,
      },
    });
    return result;
  }

  async createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest> {
    const [created] = await db.insert(verificationRequests).values(request).returning();
    return created;
  }

  async updateVerificationRequestStatus(id: string, status: "verified" | "rejected" | "ignored"): Promise<VerificationRequest | undefined> {
    const [updated] = await db.update(verificationRequests)
      .set({ status, processedAt: new Date() })
      .where(eq(verificationRequests.id, id))
      .returning();
    return updated || undefined;
  }

  async getPasskeysByUser(userId: string): Promise<Passkey[]> {
    return db.select().from(passkeys).where(eq(passkeys.userId, userId));
  }

  async getPasskeyByCredentialId(credentialId: string): Promise<Passkey | undefined> {
    const [passkey] = await db.select().from(passkeys).where(eq(passkeys.credentialId, credentialId));
    return passkey || undefined;
  }

  async createPasskey(passkey: InsertPasskey): Promise<Passkey> {
    const [created] = await db.insert(passkeys).values(passkey).returning();
    return created;
  }

  async updatePasskeyCounter(id: string, counter: number): Promise<void> {
    await db.update(passkeys).set({ counter }).where(eq(passkeys.id, id));
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return Number(result[0]?.count || 0);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  }
}

export const storage = new DatabaseStorage();
