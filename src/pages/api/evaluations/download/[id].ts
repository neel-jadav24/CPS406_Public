import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import { readApplications } from "@/lib/storage";

const COORDINATOR_PASSWORD = "coordinator123";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const password = req.headers["x-coordinator-password"];
  if (password !== COORDINATOR_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Missing application ID" });
  }

  const application = readApplications().find((a) => a.id === id);
  if (!application) {
    return res.status(404).json({ error: "Application not found" });
  }

  if (!application.evaluationPdfPath) {
    return res
      .status(404)
      .json({ error: "No PDF evaluation submitted for this application" });
  }

  if (!fs.existsSync(application.evaluationPdfPath)) {
    return res.status(404).json({ error: "Evaluation file not found" });
  }

  try {
    const fileBuffer = fs.readFileSync(application.evaluationPdfPath);
    const fileName = `${application.name.replace(/\s+/g, "_")}_Evaluation.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-Length", fileBuffer.length);

    return res.status(200).send(fileBuffer);
  } catch {
    return res.status(500).json({ error: "Failed to read evaluation file" });
  }
}
