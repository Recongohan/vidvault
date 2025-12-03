import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "creator", "vip"]);
export const authRequestStatusEnum = pgEnum("auth_request_status", ["pending", "approved", "rejected"]);
export const verificationStatusEnum = pgEnum("verification_status", ["pending", "verified", "rejected", "ignored"]);

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("creator"),
  displayName: text("display_name"),
  title: text("title"),
  country: text("country"),
  avatarUrl: text("avatar_url"),
  isAuthApproved: boolean("is_auth_approved").default(false),
  hasRequestedAuth: boolean("has_requested_auth").default(false),
});

export const usersRelations = relations(users, ({ many }) => ({
  videos: many(videos),
  passkeys: many(passkeys),
  authRequests: many(authRequests),
  verificationRequests: many(verificationRequests),
}));

export const videos = pgTable("videos", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url").notNull(),
  uploaderId: varchar("uploader_id", { length: 36 }).notNull().references(() => users.id),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videosRelations = relations(videos, ({ one, many }) => ({
  uploader: one(users, {
    fields: [videos.uploaderId],
    references: [users.id],
  }),
  verificationRequests: many(verificationRequests),
}));

export const authRequests = pgTable("auth_requests", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id", { length: 36 }).notNull().references(() => users.id),
  status: authRequestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const authRequestsRelations = relations(authRequests, ({ one }) => ({
  creator: one(users, {
    fields: [authRequests.creatorId],
    references: [users.id],
  }),
}));

export const verificationRequests = pgTable("verification_requests", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id", { length: 36 }).notNull().references(() => videos.id),
  vipId: varchar("vip_id", { length: 36 }).notNull().references(() => users.id),
  status: verificationStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const verificationRequestsRelations = relations(verificationRequests, ({ one }) => ({
  video: one(videos, {
    fields: [verificationRequests.videoId],
    references: [videos.id],
  }),
  vip: one(users, {
    fields: [verificationRequests.vipId],
    references: [users.id],
  }),
}));

export const passkeys = pgTable("passkeys", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  credentialId: text("credential_id").notNull().unique(),
  publicKey: text("public_key").notNull(),
  counter: integer("counter").notNull().default(0),
  transports: text("transports"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const passkeysRelations = relations(passkeys, ({ one }) => ({
  user: one(users, {
    fields: [passkeys.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
  viewCount: true,
});

export const insertAuthRequestSchema = createInsertSchema(authRequests).omit({
  id: true,
  createdAt: true,
  processedAt: true,
  status: true,
});

export const insertVerificationRequestSchema = createInsertSchema(verificationRequests).omit({
  id: true,
  createdAt: true,
  processedAt: true,
  status: true,
});

export const insertPasskeySchema = createInsertSchema(passkeys).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  displayName: z.string().min(1, "Display name is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertAuthRequest = z.infer<typeof insertAuthRequestSchema>;
export type AuthRequest = typeof authRequests.$inferSelect;
export type InsertVerificationRequest = z.infer<typeof insertVerificationRequestSchema>;
export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type InsertPasskey = z.infer<typeof insertPasskeySchema>;
export type Passkey = typeof passkeys.$inferSelect;

export type UserRole = "admin" | "creator" | "vip";
export type AuthRequestStatus = "pending" | "approved" | "rejected";
export type VerificationStatus = "pending" | "verified" | "rejected" | "ignored";

export type VideoWithUploader = Video & {
  uploader: User;
  verificationRequests?: (VerificationRequest & { vip: User })[];
};

export type AuthRequestWithCreator = AuthRequest & {
  creator: User;
};

export type VerificationRequestWithDetails = VerificationRequest & {
  video: Video & { uploader: User };
  vip: User;
};

export const notifications = pgTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  read: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
