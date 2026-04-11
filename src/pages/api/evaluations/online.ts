import type { NextApiRequest, NextApiResponse } from 'next';
import { findApplicationBySupervisorCredentials, readApplications, writeApplications } from '@/lib/storage';

function isRating(value: unknown): value is number {
  return typeof value === 'number' && value >= 1 && value <= 5;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supervisorEmail = req.headers['x-supervisor-email'];
  const supervisorPassword = req.headers['x-supervisor-password'];

  if (typeof supervisorEmail !== 'string' || typeof supervisorPassword !== 'string') {
    return res.status(401).json({ error: 'Missing supervisor credentials' });
  }

  const application = findApplicationBySupervisorCredentials(supervisorEmail.toLowerCase(), supervisorPassword);
  if (!application) {
    return res.status(403).json({ error: 'Invalid supervisor credentials.' });
  }

  const {
    behaviour,
    skills,
    knowledge,
    attitude,
    comments,
  } = req.body as {
    behaviour?: number;
    skills?: number;
    knowledge?: number;
    attitude?: number;
    comments?: string;
  };

  if (!isRating(behaviour) || !isRating(skills) || !isRating(knowledge) || !isRating(attitude)) {
    return res.status(400).json({ error: 'Behaviour, skills, knowledge, and attitude must be ratings from 1 to 5.' });
  }

  const applications = readApplications();
  const idx = applications.findIndex((a) => a.id === application.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Application not found.' });
  }

  applications[idx].evaluationMethod = 'Online Form';
  applications[idx].evaluationPdfPath = null;
  applications[idx].evaluationOnline = {
    behaviour,
    skills,
    knowledge,
    attitude,
    comments: typeof comments === 'string' ? comments.trim() : '',
  };
  applications[idx].evaluationSubmittedAt = new Date().toISOString();

  writeApplications(applications);

  return res.status(200).json({
    evaluationSubmittedAt: applications[idx].evaluationSubmittedAt,
    evaluationMethod: applications[idx].evaluationMethod,
  });
}
