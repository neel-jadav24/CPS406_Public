import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { readApplications, writeApplications } from "@/lib/storage";
import type { Application } from "@/lib/storage";

const COORDINATOR_PASSWORD = "coordinator123";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const password = req.headers["x-coordinator-password"];
    if (password !== COORDINATOR_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const applications = readApplications();
    return res.status(200).json(applications);
  }

  if (req.method === "POST") {
    const { name, studentId, email, password } =
      req.body as Partial<Application>;
    if (!name || !studentId || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, student ID, email, and password are required." });
    }
    if (!String(studentId).trim()) {
      return res.status(400).json({ error: "Student ID is required." });
    }
    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters." });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = String(email).toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: "Invalid email address." });
    }
    const applications = readApplications();
    const exists = applications.some(
      (a) => a.studentId === String(studentId) && a.email === normalizedEmail,
    );
    if (exists) {
      return res
        .status(409)
        .json({
          error: "Application already exists for this student and email.",
        });
    }

    const createdAt = new Date().toISOString();
    const deadline = new Date(createdAt);
    deadline.setDate(deadline.getDate() + 120);

    const newApp: Application = {
      id: uuidv4(),
      name: String(name),
      studentId: String(studentId),
      email: normalizedEmail,
      password: String(password),
      status: "Pending",
      finalStatus: "Pending Final Review",
      placementStatus: "Active",
      createdAt,
      workTermStart: null,
      workTermEnd: null,
      reportDeadline: deadline.toISOString(),
      reportPath: null,
      reportSubmittedAt: null,
      supervisor: null,
      evaluationMethod: "None",
      evaluationPdfPath: null,
      evaluationOnline: null,
      evaluationSubmittedAt: null,
      reminderSentAt: null,
    };
    applications.push(newApp);
    writeApplications(applications);
    return res.status(201).json(newApp);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
