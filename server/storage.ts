import { db } from "./db";
import {
  sessions,
  attendanceRecords,
  type Session,
  type InsertSession,
  type AttendanceRecord,
  type InsertAttendance,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Sessions
  getSessions(): Promise<Session[]>;
  getSession(id: number): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  completeSession(id: number): Promise<Session | undefined>;

  // Attendance
  getAttendanceBySession(sessionId: number): Promise<AttendanceRecord[]>;
  createAttendance(record: InsertAttendance): Promise<AttendanceRecord>;
  updateAttendance(id: number, updates: Partial<InsertAttendance>): Promise<AttendanceRecord | undefined>;
  deleteAttendance(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // === Sessions ===
  async getSessions(): Promise<Session[]> {
    return await db.select().from(sessions).orderBy(desc(sessions.startTime));
  }

  async getSession(id: number): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db.insert(sessions).values(insertSession).returning();
    return session;
  }

  async completeSession(id: number): Promise<Session | undefined> {
    const [session] = await db
      .update(sessions)
      .set({ status: "completed", endTime: new Date() })
      .where(eq(sessions.id, id))
      .returning();
    return session;
  }

  // === Attendance ===
  async getAttendanceBySession(sessionId: number): Promise<AttendanceRecord[]> {
    return await db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.sessionId, sessionId))
      .orderBy(desc(attendanceRecords.timestamp));
  }

  async createAttendance(record: InsertAttendance): Promise<AttendanceRecord> {
    const [attendance] = await db.insert(attendanceRecords).values(record).returning();
    return attendance;
  }

  async updateAttendance(id: number, updates: Partial<InsertAttendance>): Promise<AttendanceRecord | undefined> {
    const [updated] = await db
      .update(attendanceRecords)
      .set(updates)
      .where(eq(attendanceRecords.id, id))
      .returning();
    return updated;
  }

  async deleteAttendance(id: number): Promise<void> {
    await db.delete(attendanceRecords).where(eq(attendanceRecords.id, id));
  }
}

export const storage = new DatabaseStorage();
