import { getServerSession } from 'next-auth';
import { authOptions } from '../pages/api/auth/[...nextauth]';

export async function requireAuth(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    res.status(401).json({ error: 'Non autorisé' });
    return null;
  }
  return session;
}
