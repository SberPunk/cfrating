import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChannelSchema, insertReviewSchema, insertTagSuggestionSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPg from "connect-pg-simple";

const pgStore = connectPg(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    store: new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false, // We handle table creation in schema
    }),
    secret: process.env.SESSION_SECRET || "your-secret-key-here",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Admin authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!(req.session as any).adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Channel routes
  app.get("/api/channels", async (req, res) => {
    try {
      const { search, tags } = req.query;
      const tagIds = tags ? (tags as string).split(",").map(Number) : undefined;
      const channels = await storage.getChannels(search as string, tagIds);
      res.json(channels);
    } catch (error) {
      console.error("Error fetching channels:", error);
      res.status(500).json({ message: "Failed to fetch channels" });
    }
  });

  app.get("/api/channels/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const channel = await storage.getChannelById(id);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      res.json(channel);
    } catch (error) {
      console.error("Error fetching channel:", error);
      res.status(500).json({ message: "Failed to fetch channel" });
    }
  });

  app.post("/api/channels", async (req, res) => {
    try {
      const channelData = insertChannelSchema.parse(req.body);
      const channel = await storage.createChannel(channelData);
      
      // Add tags if provided
      if (req.body.tagIds && req.body.tagIds.length > 0) {
        await storage.addChannelTags(channel.id, req.body.tagIds);
      }
      
      res.status(201).json(channel);
    } catch (error) {
      console.error("Error creating channel:", error);
      res.status(500).json({ message: "Failed to create channel" });
    }
  });

  app.patch("/api/channels/:id/approval", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isApproved } = req.body;
      await storage.updateChannelApproval(id, isApproved);
      res.json({ message: "Channel approval updated" });
    } catch (error) {
      console.error("Error updating channel approval:", error);
      res.status(500).json({ message: "Failed to update channel approval" });
    }
  });

  // Tag routes
  app.get("/api/tags", async (req, res) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  app.post("/api/tag-suggestions", async (req, res) => {
    try {
      const suggestionData = insertTagSuggestionSchema.parse(req.body);
      const suggestion = await storage.createTagSuggestion(suggestionData);
      res.status(201).json(suggestion);
    } catch (error) {
      console.error("Error creating tag suggestion:", error);
      res.status(500).json({ message: "Failed to create tag suggestion" });
    }
  });

  // Review routes
  app.get("/api/channels/:id/reviews", async (req, res) => {
    try {
      const channelId = parseInt(req.params.id);
      const reviews = await storage.getChannelReviews(channelId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/channels/:id/reviews", async (req, res) => {
    try {
      const channelId = parseInt(req.params.id);
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        channelId,
      });
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.patch("/api/reviews/:id/approval", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isApproved } = req.body;
      await storage.updateReviewApproval(id, isApproved);
      res.json({ message: "Review approval updated" });
    } catch (error) {
      console.error("Error updating review approval:", error);
      res.status(500).json({ message: "Failed to update review approval" });
    }
  });

  // Admin routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const admin = await storage.getAdminByUsername(username);
      
      if (!admin || !await bcrypt.compare(password, admin.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      (req.session as any).adminId = admin.id;
      res.json({ message: "Login successful" });
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/admin/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Admin check route
  app.get("/api/admin/check", async (req, res) => {
    res.json({ isAdmin: !!(req.session as any).adminId });
  });

  // Admin routes for moderation
  app.get("/api/admin/channels", requireAuth, async (req, res) => {
    try {
      const channels = await storage.getAllChannels();
      res.json(channels);
    } catch (error) {
      console.error("Error fetching channels for admin:", error);
      res.status(500).json({ message: "Failed to fetch channels" });
    }
  });

  app.get("/api/admin/reviews", requireAuth, async (req, res) => {
    try {
      const reviews = await storage.getAllReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews for admin:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get("/api/admin/tag-suggestions", requireAuth, async (req, res) => {
    try {
      const suggestions = await storage.getTagSuggestions();
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching tag suggestions:", error);
      res.status(500).json({ message: "Failed to fetch tag suggestions" });
    }
  });

  app.post("/api/admin/approve-tag", requireAuth, async (req, res) => {
    try {
      const { suggestionId, name, color } = req.body;
      const tag = await storage.createTag({ name, color, isApproved: true });
      await storage.updateTagSuggestionApproval(suggestionId, true);
      res.json(tag);
    } catch (error) {
      console.error("Error approving tag:", error);
      res.status(500).json({ message: "Failed to approve tag" });
    }
  });

  app.post("/api/admin/tags", requireAuth, async (req, res) => {
    try {
      const { name, color } = req.body;
      const tag = await storage.createTag({ name, color, isApproved: true });
      res.status(201).json(tag);
    } catch (error) {
      console.error("Error creating tag:", error);
      res.status(500).json({ message: "Failed to create tag" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
