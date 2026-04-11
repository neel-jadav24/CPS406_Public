import type { NextApiRequest, NextApiResponse } from 'next';

const COORDINATOR_PASSWORD = 'coordinator123';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { password } = req.body as { password?: string };
  if (password === COORDINATOR_PASSWORD) {
    return res.status(200).json({ ok: true });
  }
  return res.status(401).json({ error: 'Invalid password' });
}
