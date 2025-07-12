import type { Express } from "express";
import { createServer, type Server } from "http";
import { insertChannelSchema, insertReviewSchema, insertTagSuggestionSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

// Пароль админа — можно положить в env
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "$2b$10$Q9hF6T.abc123xyz..."; // bcrypt-хеш пароля

export async function registerRoutes(app: Express): Promise<Server> {

  // Простой middleware для проверки пароля из заголовка Authorization
  const requireAuth = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Предполагаем что в заголовке просто пароль, например:
    // Authorization: <пароль>
    const password = authHeader;

    // Проверяем пароль
    const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!isValid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    next();
  };

  // Логин просто проверяет пароль и отвечает OK или ошибкой
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ message: "Password required" });
      }

      const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ message: "Login successful" });
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Пример защищённого маршрута — требует заголовок Authorization с паролем
  app.get("/api/admin/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Все остальные защищённые маршруты тоже добавь requireAuth

  // ... остальной код роутов без изменений

  const httpServer = createServer(app);
  return httpServer;
}
