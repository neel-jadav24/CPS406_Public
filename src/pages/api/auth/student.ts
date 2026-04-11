import type { NextApiRequest, NextApiResponse } from "next";
import { readApplications } from "@/lib/storage";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const applications = readApplications();
  const application = applications.find(
    (a) =>
      a.email.toLowerCase() === email.toLowerCase() && a.password === password,
  );

  if (!application) {
    return res.status(401).json({ error: "Invalid email or password." });
  }
  if (application.status !== "Provisionally Accepted") {
    return res
      .status(403)
      .json({
        error:
          "Your application status is not yet finalized. Please check back later.",
      });
  }
  if (application.finalStatus !== "Final Accepted") {
    return res
      .status(403)
      .json({
        error:
          "Your application has not been finally accepted. You can log in once your final decision is made.",
      });
  }
  if (application.placementStatus === "Rejected From Placement") {
    return res
      .status(403)
      .json({ error: "You have been rejected from the co-op placement." });
  }
  return res.status(200).json({
    studentId: application.studentId,
    email: application.email,
    name: application.name,
    status: application.status,
    finalStatus: application.finalStatus,
    reportSubmittedAt: application.reportSubmittedAt,
    reportDeadline: application.reportDeadline,
    evaluationSubmittedAt: application.evaluationSubmittedAt,
  });
}
