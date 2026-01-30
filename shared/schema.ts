import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // E.g. "Math 101 - 10 AM"
  status: text("status").notNull().default("active"), // 'active', 'completed'
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(), // Foreign key to sessions
  studentName: text("student_name").notNull(), // Auto-generated "Student 1" or manually edited
  confidence: text("confidence").notNull(), // e.g. "0.98"
  snapshot: text("snapshot").notNull(), // Base64 image data uri
  timestamp: timestamp("timestamp").defaultNow(),
  verified: boolean("verified").default(true), // Default true for auto-detected
  faceDescriptor: jsonb("face_descriptor"), // Store descriptor to re-identify within session (optional usage)
});

// === SCHEMAS ===

export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true, startTime: true, endTime: true });
export const insertAttendanceSchema = createInsertSchema(attendanceRecords).omit({ id: true, timestamp: true });

// === EXPLICIT TYPES ===

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type CreateSessionRequest = InsertSession;
export type CreateAttendanceRequest = InsertAttendance;
export type UpdateAttendanceRequest = Partial<InsertAttendance>;
