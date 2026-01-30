import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

async function seedDatabase() {
  const sessions = await storage.getSessions();
  if (sessions.length === 0) {
    const today = new Date();
    await storage.createSession({
      name: "Computer Science 101",
      status: "active",
      // startTime is defaultNow
    });
    console.log("Seeded database with initial session");
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed on startup
  seedDatabase();

  // === Sessions ===
  app.get(api.sessions.list.path, async (req, res) => {
    const sessions = await storage.getSessions();
    res.json(sessions);
  });

  app.get(api.sessions.get.path, async (req, res) => {
    const session = await storage.getSession(Number(req.params.id));
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json(session);
  });

  app.post(api.sessions.create.path, async (req, res) => {
    try {
      const input = api.sessions.create.input.parse(req.body);
      const session = await storage.createSession(input);
      res.status(201).json(session);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post(api.sessions.complete.path, async (req, res) => {
    const session = await storage.completeSession(Number(req.params.id));
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json(session);
  });

  // === Attendance ===
  app.get(api.attendance.list.path, async (req, res) => {
    const records = await storage.getAttendanceBySession(Number(req.params.sessionId));
    res.json(records);
  });

  app.post(api.attendance.create.path, async (req, res) => {
    try {
      const input = api.attendance.create.input.parse(req.body);
      const record = await storage.createAttendance(input);
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.attendance.update.path, async (req, res) => {
    try {
      const input = api.attendance.update.input.parse(req.body);
      const updated = await storage.updateAttendance(Number(req.params.id), input);
      if (!updated) {
        return res.status(404).json({ message: 'Attendance record not found' });
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.attendance.delete.path, async (req, res) => {
    await storage.deleteAttendance(Number(req.params.id));
    res.status(204).send();
  });

  return httpServer;
}
