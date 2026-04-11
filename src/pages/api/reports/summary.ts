import type { NextApiRequest, NextApiResponse } from 'next';
import { readApplications } from '@/lib/storage';

const COORDINATOR_PASSWORD = 'coordinator123';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const password = req.headers['x-coordinator-password'];
  if (password !== COORDINATOR_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const applications = readApplications();
  const now = new Date();

  const overdueReports = applications.filter(
    (a) =>
      a.status === 'Provisionally Accepted' &&
      !a.reportSubmittedAt &&
      !!a.reportDeadline &&
      new Date(a.reportDeadline) < now
  );

  const acceptedForReporting = applications.filter(
    (a) =>
      a.status === 'Provisionally Accepted' &&
      a.placementStatus !== 'Rejected From Placement' &&
      a.finalStatus !== 'Final Rejected'
  );

  const summary = {
    totals: {
      applications: applications.length,
      pending: applications.filter((a) => a.status === 'Pending').length,
      provisionallyAccepted: applications.filter((a) => a.status === 'Provisionally Accepted').length,
      provisionallyRejected: applications.filter((a) => a.status === 'Provisionally Rejected').length,
      finalAccepted: applications.filter((a) => a.finalStatus === 'Final Accepted').length,
      finalRejected: applications.filter((a) => a.finalStatus === 'Final Rejected').length,
      placementRejected: applications.filter((a) => a.placementStatus === 'Rejected From Placement').length,
      reportsSubmitted: applications.filter((a) => !!a.reportSubmittedAt).length,
      reportsMissing: acceptedForReporting.filter((a) => !a.reportSubmittedAt).length,
      evaluationsSubmitted: applications.filter((a) => !!a.evaluationSubmittedAt).length,
      evaluationsMissing: acceptedForReporting.filter((a) => !a.evaluationSubmittedAt).length,
      overdueReports: overdueReports.length,
    },
    overdueStudents: overdueReports.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      studentId: a.studentId,
      reportDeadline: a.reportDeadline,
      reminderSentAt: a.reminderSentAt,
    })),
  };

  return res.status(200).json(summary);
}
