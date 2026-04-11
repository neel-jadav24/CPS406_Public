import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { readApplications } from "@/lib/storage";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const coordinatorPassword = req.headers["x-coordinator-password"];
  const { id } = req.query;

  // Validate coordinator authentication
  if (!coordinatorPassword || typeof coordinatorPassword !== "string") {
    return res.status(401).json({ error: "Missing coordinator credentials" });
  }

  const correctPassword = process.env.COORDINATOR_PASSWORD || "coordinator123";
  if (coordinatorPassword !== correctPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Missing application ID" });
  }

  // Find the application
  const applications = readApplications();
  const application = applications.find((a) => a.id === id);

  if (!application) {
    return res.status(404).json({ error: "Application not found" });
  }

  if (!application.reportPath) {
    return res
      .status(404)
      .json({ error: "No report submitted for this application" });
  }

  // Verify the file exists
  if (!fs.existsSync(application.reportPath)) {
    return res.status(404).json({ error: "Report file not found" });
  }

  try {
    // Read and serve the PDF
    const fileBuffer = fs.readFileSync(application.reportPath);
    const fileName = `${application.name.replace(/\s+/g, "_")}_Report.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", fileBuffer.length);

    return res.status(200).send(fileBuffer);
  } catch {
    return res.status(500).json({ error: "Failed to read report file" });
  }
}
