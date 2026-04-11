import type { NextApiRequest, NextApiResponse } from "next";
import { readApplications, writeApplications } from "@/lib/storage";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { studentEmail, supervisorName, supervisorEmail, password } =
    req.body as {
      studentEmail?: string;
      supervisorName?: string;
      supervisorEmail?: string;
      password?: string;
    };

  if (!studentEmail || !supervisorName || !supervisorEmail || !password) {
    return res
      .status(400)
      .json({
        error:
          "Student email, supervisor name, email, and password are required.",
      });
  }
  if (String(password).length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters." });
  }

  const normalizedSupervisorEmail = String(supervisorEmail).toLowerCase();
  const normalizedStudentEmail = String(studentEmail).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedSupervisorEmail)) {
    return res.status(400).json({ error: "Invalid supervisor email address." });
  }
  if (!emailRegex.test(normalizedStudentEmail)) {
    return res.status(400).json({ error: "Invalid student email address." });
  }

  const applications = readApplications();
  const duplicate = applications.find(
    (a) => a.supervisor?.email === normalizedSupervisorEmail,
  );
  if (duplicate) {
    return res
      .status(409)
      .json({ error: "Supervisor account already exists for this email." });
  }

  const idx = applications.findIndex(
    (a) => a.email.toLowerCase() === normalizedStudentEmail,
  );
  if (idx === -1) {
    return res
      .status(404)
      .json({ error: "No student found with that email address." });
  }

  const app = applications[idx];
  if (app.status !== "Provisionally Accepted") {
    return res
      .status(403)
      .json({
        error:
          "Supervisor account can only be created for provisionally accepted students.",
      });
  }

  applications[idx].supervisor = {
    name: String(supervisorName).trim(),
    email: normalizedSupervisorEmail,
    password: String(password),
    createdAt: new Date().toISOString(),
  };

  writeApplications(applications);
  return res.status(201).json({
    ok: true,
    studentName: app.name,
    studentEmail: app.email,
    supervisorName: applications[idx].supervisor?.name,
    supervisorEmail: applications[idx].supervisor?.email,
  });
}
