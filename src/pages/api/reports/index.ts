import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { readApplications, writeApplications } from "@/lib/storage";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const studentEmail = req.headers["x-student-email"];

  if (typeof studentEmail !== "string") {
    return res.status(401).json({ error: "Missing student email" });
  }

  const applications = readApplications();
  const application = applications.find(
    (a) => a.email.toLowerCase() === studentEmail.toLowerCase(),
  );

  if (!application || application.status !== "Provisionally Accepted") {
    return res.status(403).json({ error: "Access denied" });
  }
  if (application.finalStatus === "Final Rejected") {
    return res.status(403).json({ error: "Application is finally rejected." });
  }
  if (application.placementStatus === "Rejected From Placement") {
    return res
      .status(403)
      .json({ error: "Student was rejected from co-op placement." });
  }
  if (
    application.reportDeadline &&
    new Date() > new Date(application.reportDeadline)
  ) {
    return res
      .status(403)
      .json({ error: "Report deadline has passed. Contact the coordinator." });
  }

  const uploadDir = path.join(process.cwd(), "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });

  const form = formidable({ uploadDir, keepExtensions: true });

  form.parse(req, (err, _fields, files) => {
    if (err) {
      return res.status(500).json({ error: "File upload failed" });
    }

    const reportField = files.report;
    const uploadedFile = Array.isArray(reportField)
      ? reportField[0]
      : reportField;

    if (!uploadedFile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (uploadedFile.mimetype !== "application/pdf") {
      fs.unlinkSync(uploadedFile.filepath);
      return res.status(400).json({ error: "Only PDF files are allowed" });
    }

    // Verify PDF magic bytes (%PDF-)
    const fd = fs.openSync(uploadedFile.filepath, "r");
    let magic: Buffer;
    try {
      magic = Buffer.alloc(5);
      fs.readSync(fd, magic, 0, 5, 0);
    } finally {
      fs.closeSync(fd);
    }
    if (magic.toString("ascii") !== "%PDF-") {
      fs.unlinkSync(uploadedFile.filepath);
      return res
        .status(400)
        .json({ error: "Uploaded file is not a valid PDF" });
    }

    const applications = readApplications();
    const idx = applications.findIndex((a) => a.id === application.id);
    if (idx !== -1) {
      applications[idx].reportPath = uploadedFile.filepath;
      applications[idx].reportSubmittedAt = new Date().toISOString();
      writeApplications(applications);
      return res.status(200).json({
        reportSubmittedAt: applications[idx].reportSubmittedAt,
        reportDeadline: applications[idx].reportDeadline,
      });
    }

    return res.status(500).json({ error: "Application not found" });
  });
}
