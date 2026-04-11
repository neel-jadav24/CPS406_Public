import fs from "fs";
import path from "path";

export type ProvisionalStatus =
  | "Pending"
  | "Provisionally Accepted"
  | "Provisionally Rejected";
export type FinalStatus =
  | "Pending Final Review"
  | "Final Accepted"
  | "Final Rejected";
export type PlacementStatus = "Active" | "Rejected From Placement";
export type EvaluationMethod = "None" | "PDF" | "Online Form";

export interface SupervisorAccount {
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface EvaluationOnlineForm {
  behaviour: number | null;
  skills: number | null;
  knowledge: number | null;
  attitude: number | null;
  comments: string;
}

export interface Application {
  id: string;
  name: string;
  studentId: string;
  email: string;
  password: string; // Student password for login
  status: ProvisionalStatus;
  finalStatus: FinalStatus;
  placementStatus: PlacementStatus;
  createdAt: string;
  workTermStart: string | null;
  workTermEnd: string | null;
  reportDeadline: string | null;
  reportPath: string | null;
  reportSubmittedAt: string | null;
  supervisor: SupervisorAccount | null;
  evaluationMethod: EvaluationMethod;
  evaluationPdfPath: string | null;
  evaluationOnline: EvaluationOnlineForm | null;
  evaluationSubmittedAt: string | null;
  reminderSentAt: string | null;
}

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "applications.json");

const PROVISIONAL_STATUSES: ProvisionalStatus[] = [
  "Pending",
  "Provisionally Accepted",
  "Provisionally Rejected",
];
const FINAL_STATUSES: FinalStatus[] = [
  "Pending Final Review",
  "Final Accepted",
  "Final Rejected",
];
const PLACEMENT_STATUSES: PlacementStatus[] = [
  "Active",
  "Rejected From Placement",
];
const EVALUATION_METHODS: EvaluationMethod[] = ["None", "PDF", "Online Form"];

function ensureDataDir(): void {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function safeDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function getDefaultReportDeadline(createdAt: string): string {
  const created = new Date(createdAt);
  created.setDate(created.getDate() + 120);
  return created.toISOString();
}

function normalizeOnlineForm(value: unknown): EvaluationOnlineForm | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<EvaluationOnlineForm>;
  return {
    behaviour: typeof v.behaviour === "number" ? v.behaviour : null,
    skills: typeof v.skills === "number" ? v.skills : null,
    knowledge: typeof v.knowledge === "number" ? v.knowledge : null,
    attitude: typeof v.attitude === "number" ? v.attitude : null,
    comments: typeof v.comments === "string" ? v.comments : "",
  };
}

function normalizeSupervisor(value: unknown): SupervisorAccount | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<SupervisorAccount>;
  if (!v.name || !v.email || !v.password) return null;
  return {
    name: String(v.name),
    email: String(v.email).toLowerCase(),
    password: String(v.password),
    createdAt: safeDate(v.createdAt) ?? new Date().toISOString(),
  };
}

function normalizeApplication(value: unknown): Application {
  const raw = (
    value && typeof value === "object" ? value : {}
  ) as Partial<Application>;
  const createdAt = safeDate(raw.createdAt) ?? new Date().toISOString();
  const status = PROVISIONAL_STATUSES.includes(raw.status as ProvisionalStatus)
    ? (raw.status as ProvisionalStatus)
    : "Pending";
  const finalStatus = FINAL_STATUSES.includes(raw.finalStatus as FinalStatus)
    ? (raw.finalStatus as FinalStatus)
    : "Pending Final Review";
  const placementStatus = PLACEMENT_STATUSES.includes(
    raw.placementStatus as PlacementStatus,
  )
    ? (raw.placementStatus as PlacementStatus)
    : "Active";
  const evaluationMethod = EVALUATION_METHODS.includes(
    raw.evaluationMethod as EvaluationMethod,
  )
    ? (raw.evaluationMethod as EvaluationMethod)
    : "None";

  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    studentId: String(raw.studentId ?? ""),
    email: String(raw.email ?? "").toLowerCase(),
    password: String(raw.password ?? ""),
    status,
    finalStatus,
    placementStatus,
    createdAt,
    workTermStart: safeDate(raw.workTermStart),
    workTermEnd: safeDate(raw.workTermEnd),
    reportDeadline:
      safeDate(raw.reportDeadline) ?? getDefaultReportDeadline(createdAt),
    reportPath: typeof raw.reportPath === "string" ? raw.reportPath : null,
    reportSubmittedAt: safeDate(raw.reportSubmittedAt),
    supervisor: normalizeSupervisor(raw.supervisor),
    evaluationMethod,
    evaluationPdfPath:
      typeof raw.evaluationPdfPath === "string" ? raw.evaluationPdfPath : null,
    evaluationOnline: normalizeOnlineForm(raw.evaluationOnline),
    evaluationSubmittedAt: safeDate(raw.evaluationSubmittedAt),
    reminderSentAt: safeDate(raw.reminderSentAt),
  };
}

export function readApplications(): Application[] {
  ensureDataDir();
  if (!fs.existsSync(dataFile)) {
    return [];
  }
  const raw = fs.readFileSync(dataFile, "utf-8");
  try {
    const parsed = JSON.parse(raw) as unknown[];
    return parsed.map(normalizeApplication);
  } catch (error) {
    console.error(`Failed to parse data file at ${dataFile}:`, error);
    throw new Error("Failed to read application data");
  }
}

export function writeApplications(applications: Application[]): void {
  ensureDataDir();
  const normalized = applications.map(normalizeApplication);
  fs.writeFileSync(dataFile, JSON.stringify(normalized, null, 2), "utf-8");
}

export function findApplicationById(id: string): Application | undefined {
  return readApplications().find((a) => a.id === id);
}

export function findApplicationByCredentials(
  studentId: string,
  email: string,
): Application | undefined {
  return readApplications().find(
    (a) =>
      a.studentId === studentId &&
      a.email.toLowerCase() === email.toLowerCase(),
  );
}

export function findApplicationBySupervisorCredentials(
  email: string,
  password: string,
): Application | undefined {
  const normalizedEmail = email.toLowerCase();
  return readApplications().find(
    (a) =>
      a.supervisor?.email === normalizedEmail &&
      a.supervisor.password === password,
  );
}
