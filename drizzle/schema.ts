import {
  pgTable,
  varchar,
  text,
  boolean,
  integer,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";

export const doctors = pgTable("doctors", {
  id: varchar("id", { length: 50 }).primaryKey(),
  registrationId: varchar("registration_id", { length: 20 }),
  name: varchar("name", { length: 255 }).notNull(),
  mobile: varchar("mobile", { length: 20 }),
  email: varchar("email", { length: 255 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  mciNumber: varchar("mci_number", { length: 50 }),
  certificateName: varchar("certificate_name", { length: 255 }),
  institution: varchar("institution", { length: 255 }),
  address: text("address"),
  qualification: varchar("qualification", { length: 255 }),
  designation: varchar("designation", { length: 255 }),
  publications: text("publications"),
  profilePhotoUrl: text("profile_photo_url"),
  cvUrl: text("cv_url"),
  hasPhoto: boolean("has_photo").default(false),
  hasCv: boolean("has_cv").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cvContent = pgTable("cv_content", {
  id: serial("id").primaryKey(),
  doctorId: varchar("doctor_id", { length: 50 }).references(() => doctors.id),
  rawText: text("raw_text"),
  education: text("education"),
  experience: text("experience"),
  publications: text("publications"),
  awards: text("awards"),
  otherContent: text("other_content"),
  sourceFile: varchar("source_file", { length: 255 }),
  extractedAt: timestamp("extracted_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 50 }).primaryKey(),
  doctorId: varchar("doctor_id", { length: 50 }).references(() => doctors.id),
  title: varchar("title", { length: 500 }),
  sessionType: varchar("session_type", { length: 50 }),
  sessionDate: varchar("session_date", { length: 50 }),
  sessionTime: varchar("session_time", { length: 50 }),
  venue: varchar("venue", { length: 100 }),
  outline: text("outline"),
  dayNumber: integer("day_number"),
  sessionOrder: integer("session_order"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const programSessions = pgTable("program_sessions", {
  id: serial("id").primaryKey(),
  dayNumber: integer("day_number").notNull(),
  timeSlot: varchar("time_slot", { length: 50 }),
  hall: varchar("hall", { length: 100 }),
  title: text("title"),
  speakers: text("speakers"),
  sessionType: varchar("session_type", { length: 50 }),
  moderator: varchar("moderator", { length: 255 }),
  chairperson: varchar("chairperson", { length: 255 }),
  sortOrder: integer("sort_order"),
});

export const rooms = pgTable("rooms", {
  code: varchar("code", { length: 10 }).primaryKey(),
  currentView: varchar("current_view", { length: 20 }).default("idle"),
  currentDoctorId: varchar("current_doctor_id", { length: 50 }),
  currentDay: integer("current_day"),
  currentSessionId: varchar("current_session_id", { length: 50 }),
  connectedDisplays: integer("connected_displays").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  lastActivity: timestamp("last_activity").defaultNow(),
});
