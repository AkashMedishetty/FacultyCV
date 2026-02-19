export interface Doctor {
  id: string;
  registrationId: string | null;
  name: string;
  mobile: string | null;
  email: string | null;
  whatsapp: string | null;
  mciNumber: string | null;
  certificateName: string | null;
  institution: string | null;
  address: string | null;
  qualification: string | null;
  designation: string | null;
  publications: string | null;
  profilePhotoUrl: string | null;
  cvUrl: string | null;
  hasPhoto: boolean;
  hasCv: boolean;
  sessions: Session[];
  cvContent: CVContent | null;
}

export interface CVContent {
  id: number;
  doctorId: string;
  rawText: string;
  education: string | null;
  experience: string | null;
  publications: string | null;
  awards: string | null;
  otherContent: string | null;
  sourceFile: string;
  extractedAt: string;
}

export interface Session {
  id: string;
  doctorId: string;
  title: string;
  sessionType: string;
  sessionDate: string;
  sessionTime: string;
  venue: string;
  outline: string | null;
  dayNumber: number;
  sessionOrder: number;
}

export interface ProgramDay {
  day: number;
  date: string;
  title: string;
  sessions: ProgramSession[];
}

export interface ProgramSession {
  id: number;
  dayNumber: number;
  timeSlot: string;
  hall: string;
  title: string;
  speakers: string[];
  sessionType: string;
  moderator: string | null;
  chairperson: string | null;
  sortOrder: number;
}

export interface RoomState {
  currentView: "doctor" | "program" | "session" | "idle";
  currentDoctorId: string | null;
  currentDay: number | null;
  currentSessionId: string | null;
  lastUpdated: string;
}

export type DisplayCommand =
  | { type: "display-doctor"; doctorId: string }
  | { type: "display-program"; day: number }
  | { type: "display-session"; sessionId: string }
  | { type: "display-idle" };
