import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for admin authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Tags table
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  color: varchar("color", { length: 7 }).default("#0088cc"),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Channels table
export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  url: varchar("url", { length: 200 }).notNull().unique(),
  description: text("description"),
  subscriberCount: integer("subscriber_count").default(0),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Channel tags junction table
export const channelTags = pgTable("channel_tags", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").references(() => channels.id, { onDelete: "cascade" }).notNull(),
  tagId: integer("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").references(() => channels.id, { onDelete: "cascade" }).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isAnonymous: boolean("is_anonymous").default(true),
  authorName: varchar("author_name", { length: 50 }),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tag suggestions table
export const tagSuggestions = pgTable("tag_suggestions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  suggestedBy: varchar("suggested_by", { length: 50 }),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin users table
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const channelsRelations = relations(channels, ({ many }) => ({
  channelTags: many(channelTags),
  reviews: many(reviews),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  channelTags: many(channelTags),
}));

export const channelTagsRelations = relations(channelTags, ({ one }) => ({
  channel: one(channels, {
    fields: [channelTags.channelId],
    references: [channels.id],
  }),
  tag: one(tags, {
    fields: [channelTags.tagId],
    references: [tags.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  channel: one(channels, {
    fields: [reviews.channelId],
    references: [channels.id],
  }),
}));

// Insert schemas
export const insertTagSchema = createInsertSchema(tags).omit({ id: true, createdAt: true });
export const insertChannelSchema = createInsertSchema(channels).omit({ id: true, createdAt: true });
export const insertChannelTagSchema = createInsertSchema(channelTags).omit({ id: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertTagSuggestionSchema = createInsertSchema(tagSuggestions).omit({ id: true, createdAt: true });
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({ id: true, createdAt: true });

// Types
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type Channel = typeof channels.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type ChannelTag = typeof channelTags.$inferSelect;
export type InsertChannelTag = z.infer<typeof insertChannelTagSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type TagSuggestion = typeof tagSuggestions.$inferSelect;
export type InsertTagSuggestion = z.infer<typeof insertTagSuggestionSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

// Extended types with relations
export type ChannelWithTags = Channel & {
  tags: Tag[];
  reviewCount: number;
  averageRating: number;
};

export type ReviewWithChannel = {
  id: number;
  channelId: number;
  rating: number;
  comment: string;
  authorName: string | null;
  isAnonymous: boolean;
  isApproved: boolean;
  createdAt: Date;
  channel: Channel;
};
