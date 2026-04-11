import type { NextApiRequest, NextApiResponse } from "next";
import { readApplications, writeApplications } from "@/lib/storage";
import type { FinalStatus, PlacementStatus, ProvisionalStatus } from "@/lib/storage";

const COORDINATOR_PASSWORD = "coordinator123";
const VALID_STATUSES = [
  "Pending",
  "Provisionally Accepted",
  "Provisionally Rejected",
] as const satisfies ProvisionalStatus[];
const VALID_FINAL_STATUSES = [
  "Pending Final Review",
  "Final Accepted",
  "Final Rejected",
] as const satisfies FinalStatus[];
const VALID_PLACEMENT_STATUSES = ["Active", "Rejected From Placement"] as const satisfies PlacementStatus[];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const password = req.headers["x-coordinator-password"];
  if (password !== COORDINATOR_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const {
    status,
    finalStatus,
    placementStatus,
    reportDeadline,
    workTermStart,
    workTermEnd,
    sendReminder,
  } = req.body as {
    status?: string;
    finalStatus?: string;
    placementStatus?: string;
    reportDeadline?: string | null;
    workTermStart?: string | null;
    workTermEnd?: string | null;
    sendReminder?: boolean;
  };

  const hasUpdateField =
    status !== undefined ||
    finalStatus !== undefined ||
    placementStatus !== undefined ||
    reportDeadline !== undefined ||
    workTermStart !== undefined ||
    workTermEnd !== undefined ||
    sendReminder === true;

  if (!hasUpdateField) {
    return res.status(400).json({ error: "No update fields provided." });
  }

  if (status !== undefined && !VALID_STATUSES.includes(status as ProvisionalStatus)) {
    return res.status(400).json({ error: "Invalid provisional status value." });
  }
  if (finalStatus !== undefined && !VALID_FINAL_STATUSES.includes(finalStatus as FinalStatus)) {
    return res.status(400).json({ error: "Invalid final status value." });
  }
  if (placementStatus !== undefined && !VALID_PLACEMENT_STATUSES.includes(placementStatus as PlacementStatus)) {
    return res.status(400).json({ error: "Invalid placement status value." });
  }

  const parseOptionalDate = (value: string | null | undefined): string | null | undefined => {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return parsed.toISOString();
  };

  const parsedReportDeadline = parseOptionalDate(reportDeadline);
  const parsedStart = parseOptionalDate(workTermStart);
  const parsedEnd = parseOptionalDate(workTermEnd);
  if (reportDeadline !== undefined && parsedReportDeadline === undefined) {
    return res.status(400).json({ error: "Invalid report deadline." });
  }
  if (workTermStart !== undefined && parsedStart === undefined) {
    return res.status(400).json({ error: "Invalid work term start date." });
  }
  if (workTermEnd !== undefined && parsedEnd === undefined) {
    return res.status(400).json({ error: "Invalid work term end date." });
  }

  const applications = readApplications();
  const idx = applications.findIndex((a) => a.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Application not found" });
  }

  if (status !== undefined) {
    applications[idx].status = status as ProvisionalStatus;
  }
  if (finalStatus !== undefined) {
    applications[idx].finalStatus = finalStatus as FinalStatus;
  }
  if (placementStatus !== undefined) {
    applications[idx].placementStatus = placementStatus as PlacementStatus;
  }
  if (parsedReportDeadline !== undefined) {
    applications[idx].reportDeadline = parsedReportDeadline;
  }
  if (parsedStart !== undefined) {
    applications[idx].workTermStart = parsedStart;
  }
  if (parsedEnd !== undefined) {
    applications[idx].workTermEnd = parsedEnd;
  }
  if (sendReminder === true) {
    applications[idx].reminderSentAt = new Date().toISOString();
  }

  writeApplications(applications);
  return res.status(200).json({
    ...applications[idx],
    reminderMessage:
      sendReminder === true
        ? `Reminder queued for ${applications[idx].email}`
        : undefined,
  });
}
