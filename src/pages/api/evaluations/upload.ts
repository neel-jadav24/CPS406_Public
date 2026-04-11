import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { findApplicationBySupervisorCredentials, readApplications, writeApplications } from '@/lib/storage';

export const config = {
  api: {
    bodyParser: false,
  },
};

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

  const uploadDir = path.join(process.cwd(), 'uploads', 'evaluations');
  fs.mkdirSync(uploadDir, { recursive: true });

  const form = formidable({ uploadDir, keepExtensions: true });

  form.parse(req, (err, _fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'File upload failed' });
    }

    const evaluationField = files.evaluation;
    const uploadedFile = Array.isArray(evaluationField) ? evaluationField[0] : evaluationField;

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No evaluation file uploaded' });
    }

    if (uploadedFile.mimetype !== 'application/pdf') {
      fs.unlinkSync(uploadedFile.filepath);
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    const fd = fs.openSync(uploadedFile.filepath, 'r');
    let magic: Buffer;
    try {
      magic = Buffer.alloc(5);
      fs.readSync(fd, magic, 0, 5, 0);
    } finally {
      fs.closeSync(fd);
    }

    if (magic.toString('ascii') !== '%PDF-') {
      fs.unlinkSync(uploadedFile.filepath);
      return res.status(400).json({ error: 'Uploaded file is not a valid PDF' });
    }

    const applications = readApplications();
    const idx = applications.findIndex((a) => a.id === application.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    applications[idx].evaluationMethod = 'PDF';
    applications[idx].evaluationPdfPath = uploadedFile.filepath;
    applications[idx].evaluationOnline = null;
    applications[idx].evaluationSubmittedAt = new Date().toISOString();

    writeApplications(applications);

    return res.status(200).json({
      evaluationSubmittedAt: applications[idx].evaluationSubmittedAt,
      evaluationMethod: applications[idx].evaluationMethod,
    });
  });
}
