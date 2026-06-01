import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from '../database';

const JWT_SECRET = process.env.JWT_SECRET || 'imjuve-comites-secret-2026';

export interface AuthRequest extends Request {
  userId?: string;
  username?: string;
  role?: string;
  assignedStates?: string[];
}

function normalizeRole(role: string): string {
  return role === 'admin' ? 'administrador' : role;
}

export function generateToken(userId: string, username: string, role: string, assignedStates: string[] = []): string {
  return jwt.sign({ userId, username, role: normalizeRole(role), assignedStates }, JWT_SECRET, { expiresIn: '24h' });
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string; username: string; role: string; assignedStates: string[];
    };
    req.userId = decoded.userId;
    req.username = decoded.username;
    req.role = normalizeRole(decoded.role);
    req.assignedStates = decoded.assignedStates || [];
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.role || !roles.includes(req.role)) {
      res.status(403).json({ error: 'No tienes permiso para esta acción' });
      return;
    }
    next();
  };
}

/** Returns a SQL WHERE clause and params to filter by the user's assigned states.
 *  Admins see all; territorial/coordinador see only their assigned states;
 *  promotor sees only their own records in their assigned state. */
export function assignedStatesFilter(req: AuthRequest): { clause: string; params: Record<string, any> } {
  if (req.role === 'administrador') {
    return { clause: '1=1', params: {} };
  }
  const states = req.assignedStates || [];
  if (states.length === 0) {
    return { clause: '1=0', params: {} };
  }
  const placeholders = states.map((s, i) => `$state${i}`);
  const params: Record<string, any> = {};
  states.forEach((s, i) => { params[`$state${i}`] = s; });

  let clause = `estado IN (${placeholders.join(',')})`;

  // Promotor only sees their own records
  if (req.role === 'promotor') {
    clause += ' AND user_id = $userId';
    params.$userId = req.userId;
  }

  return { clause, params };
}
