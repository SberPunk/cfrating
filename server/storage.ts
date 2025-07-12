import { 
  channels, 
  tags, 
  channelTags, 
  reviews, 
  tagSuggestions, 
  adminUsers,
  type Channel, 
  type InsertChannel,
  type Tag, 
  type InsertTag,
  type Review, 
  type InsertReview,
  type TagSuggestion, 
  type InsertTagSuggestion,
  type AdminUser, 
  type InsertAdminUser,
  type ChannelWithTags,
  type InsertChannelTag,
  type ReviewWithChannel
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, sql, desc, and, inArray, or } from "drizzle-orm";

export interface IStorage {
  // Channel operations
  getChannels(search?: string, tagIds?: number[]): Promise<ChannelWithTags[]>;
  getChannelById(id: number): Promise<ChannelWithTags | undefined>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  updateChannelApproval(id: number, isApproved: boolean): Promise<void>;
  
  // Tag operations
  getTags(): Promise<Tag[]>;
  getTagById(id: number): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTagApproval(id: number, isApproved: boolean): Promise<void>;
  
  // Channel-Tag operations
  addChannelTags(channelId: number, tagIds: number[]): Promise<void>;
  getChannelTags(channelId: number): Promise<Tag[]>;
  
  // Review operations
  getChannelReviews(channelId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReviewApproval(id: number, isApproved: boolean): Promise<void>;
  
  // Tag suggestion operations
  getTagSuggestions(): Promise<TagSuggestion[]>;
  createTagSuggestion(suggestion: InsertTagSuggestion): Promise<TagSuggestion>;
  updateTagSuggestionApproval(id: number, isApproved: boolean): Promise<void>;
  
  // Admin operations
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  createAdmin(admin: InsertAdminUser): Promise<AdminUser>;
  getAllReviews(): Promise<any[]>;
  getAllChannels(): Promise<ChannelWithTags[]>;
  
  // Statistics
  getStats(): Promise<{
    totalChannels: number;
    pendingChannels: number;
    totalReviews: number;
    activeTags: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getChannels(search?: string, tagIds?: number[]): Promise<ChannelWithTags[]> {
    // Build conditions - always show only approved channels for public search
    let conditions = [eq(channels.isApproved, true)];
    
    // Build the base query
    let query = db
      .select({
        id: channels.id,
        name: channels.name,
        url: channels.url,
        description: channels.description,
        subscriberCount: channels.subscriberCount,
        isApproved: channels.isApproved,
        createdAt: channels.createdAt,
        reviewCount: sql<number>`cast(count(distinct ${reviews.id}) as integer)`,
        averageRating: sql<number>`cast(coalesce(avg(${reviews.rating}), 0) as decimal(3,2))`,
      })
      .from(channels)
      .leftJoin(reviews, and(eq(reviews.channelId, channels.id), eq(reviews.isApproved, true)))
      .leftJoin(channelTags, eq(channelTags.channelId, channels.id));
      
    // Add search conditions
    if (search) {
      // Search in channel names, descriptions, and tag names
      query = query.leftJoin(tags, eq(tags.id, channelTags.tagId));
      
      const searchConditions = [
        ilike(channels.name, `%${search}%`),
        ilike(channels.description, `%${search}%`),
        and(ilike(tags.name, `%${search}%`), eq(tags.isApproved, true))
      ];
      
      conditions.push(or(...searchConditions)!);
    }
    
    if (tagIds && tagIds.length > 0) {
      conditions.push(inArray(channelTags.tagId, tagIds));
    }
    
    query = query.where(and(...conditions));
    
    const channelResults = await query
      .groupBy(channels.id)
      .orderBy(desc(sql<number>`cast(coalesce(avg(${reviews.rating}), 0) as decimal(3,2))`), desc(channels.createdAt));
    
    // Get tags for each channel
    const channelsWithTags = await Promise.all(
      channelResults.map(async (channel) => {
        const channelTagsResult = await db
          .select({ tag: tags })
          .from(channelTags)
          .leftJoin(tags, eq(tags.id, channelTags.tagId))
          .where(eq(channelTags.channelId, channel.id));
        
        return {
          ...channel,
          tags: channelTagsResult.map(ct => ct.tag).filter(Boolean) as Tag[],
        };
      })
    );

    return channelsWithTags;
  }

  async getChannelById(id: number): Promise<ChannelWithTags | undefined> {
    const [channel] = await db
      .select({
        id: channels.id,
        name: channels.name,
        url: channels.url,
        description: channels.description,
        subscriberCount: channels.subscriberCount,
        isApproved: channels.isApproved,
        createdAt: channels.createdAt,
        reviewCount: sql<number>`cast(count(distinct ${reviews.id}) as integer)`,
        averageRating: sql<number>`cast(coalesce(avg(${reviews.rating}), 0) as decimal(3,2))`,
      })
      .from(channels)
      .leftJoin(reviews, and(eq(reviews.channelId, channels.id), eq(reviews.isApproved, true)))
      .where(eq(channels.id, id))
      .groupBy(channels.id);

    if (!channel) return undefined;

    const channelTagsResult = await db
      .select({ tag: tags })
      .from(channelTags)
      .leftJoin(tags, eq(tags.id, channelTags.tagId))
      .where(eq(channelTags.channelId, id));

    return {
      ...channel,
      tags: channelTagsResult.map(ct => ct.tag).filter(Boolean) as Tag[],
    };
  }

  async createChannel(channel: InsertChannel): Promise<Channel> {
    const [newChannel] = await db.insert(channels).values(channel).returning();
    return newChannel;
  }

  async updateChannelApproval(id: number, isApproved: boolean): Promise<void> {
    await db.update(channels).set({ isApproved }).where(eq(channels.id, id));
  }

  async getTags(): Promise<Tag[]> {
    return await db.select().from(tags).where(eq(tags.isApproved, true)).orderBy(tags.name);
  }

  async getTagById(id: number): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.id, id));
    return tag;
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const [newTag] = await db.insert(tags).values(tag).returning();
    return newTag;
  }

  async updateTagApproval(id: number, isApproved: boolean): Promise<void> {
    await db.update(tags).set({ isApproved }).where(eq(tags.id, id));
  }

  async addChannelTags(channelId: number, tagIds: number[]): Promise<void> {
    if (tagIds.length === 0) return;
    
    const channelTagsData = tagIds.map(tagId => ({
      channelId,
      tagId,
    }));
    
    await db.insert(channelTags).values(channelTagsData);
  }

  async getChannelTags(channelId: number): Promise<Tag[]> {
    const result = await db
      .select({ tag: tags })
      .from(channelTags)
      .leftJoin(tags, eq(tags.id, channelTags.tagId))
      .where(eq(channelTags.channelId, channelId));
    
    return result.map(r => r.tag).filter(Boolean) as Tag[];
  }

  async getChannelReviews(channelId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.channelId, channelId), eq(reviews.isApproved, true)))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async updateReviewApproval(id: number, isApproved: boolean): Promise<void> {
    await db.update(reviews).set({ isApproved }).where(eq(reviews.id, id));
  }

  async getTagSuggestions(): Promise<TagSuggestion[]> {
    return await db
      .select()
      .from(tagSuggestions)
      .where(eq(tagSuggestions.isApproved, false))
      .orderBy(desc(tagSuggestions.createdAt));
  }

  async createTagSuggestion(suggestion: InsertTagSuggestion): Promise<TagSuggestion> {
    const [newSuggestion] = await db.insert(tagSuggestions).values(suggestion).returning();
    return newSuggestion;
  }

  async updateTagSuggestionApproval(id: number, isApproved: boolean): Promise<void> {
    await db.update(tagSuggestions).set({ isApproved }).where(eq(tagSuggestions.id, id));
  }

  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return admin;
  }

  async createAdmin(admin: InsertAdminUser): Promise<AdminUser> {
    const [newAdmin] = await db.insert(adminUsers).values(admin).returning();
    return newAdmin;
  }

  async getAllReviews(): Promise<any[]> {
    return await db
      .select({
        id: reviews.id,
        channelId: reviews.channelId,
        rating: reviews.rating,
        comment: reviews.comment,
        authorName: reviews.authorName,
        isAnonymous: reviews.isAnonymous,
        isApproved: reviews.isApproved,
        createdAt: reviews.createdAt,
        channel: {
          id: channels.id,
          name: channels.name,
          url: channels.url,
          description: channels.description,
          subscriberCount: channels.subscriberCount,
          isApproved: channels.isApproved,
          createdAt: channels.createdAt,
        }
      })
      .from(reviews)
      .leftJoin(channels, eq(reviews.channelId, channels.id))
      .orderBy(desc(reviews.createdAt));
  }

  async getAllChannels(): Promise<ChannelWithTags[]> {
    // Get all channels for admin, regardless of approval status
    const channelResults = await db
      .select({
        id: channels.id,
        name: channels.name,
        url: channels.url,
        description: channels.description,
        subscriberCount: channels.subscriberCount,
        isApproved: channels.isApproved,
        createdAt: channels.createdAt,
        reviewCount: sql<number>`cast(count(distinct ${reviews.id}) as integer)`,
        averageRating: sql<number>`cast(coalesce(avg(${reviews.rating}), 0) as decimal(3,2))`,
      })
      .from(channels)
      .leftJoin(reviews, eq(reviews.channelId, channels.id))
      .groupBy(channels.id)
      .orderBy(desc(channels.createdAt));
    
    // Get tags for each channel
    const channelsWithTags = await Promise.all(
      channelResults.map(async (channel) => {
        const channelTagsResult = await db
          .select({ tag: tags })
          .from(channelTags)
          .leftJoin(tags, eq(tags.id, channelTags.tagId))
          .where(eq(channelTags.channelId, channel.id));
        
        return {
          ...channel,
          tags: channelTagsResult.map(ct => ct.tag).filter(Boolean) as Tag[],
        };
      })
    );

    return channelsWithTags;
  }

  async getStats(): Promise<{
    totalChannels: number;
    pendingChannels: number;
    totalReviews: number;
    activeTags: number;
  }> {
    const [totalChannels] = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(channels);
    const [pendingChannels] = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(channels).where(eq(channels.isApproved, false));
    const [totalReviews] = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(reviews);
    const [activeTags] = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(tags).where(eq(tags.isApproved, true));

    return {
      totalChannels: totalChannels.count,
      pendingChannels: pendingChannels.count,
      totalReviews: totalReviews.count,
      activeTags: activeTags.count,
    };
  }
}

export const storage = new DatabaseStorage();
