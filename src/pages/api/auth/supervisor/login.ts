import type { NextApiRequest, NextApiResponse } from 'next';
import { findApplicationBySupervisorCredentials } from '@/lib/storage';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const application = findApplicationBySupervisorCredentials(String(email).toLowerCase(), String(password));
  if (!application || !application.supervisor) {
    return res.status(401).json({ error: 'Invalid supervisor credentials.' });
  }

  return res.status(200).json({
    studentId: application.studentId,
    studentName: application.name,
    supervisorName: application.supervisor.name,
    supervisorEmail: application.supervisor.email,
    evaluationSubmittedAt: application.evaluationSubmittedAt,
    evaluationMethod: application.evaluationMethod,
  });
}
