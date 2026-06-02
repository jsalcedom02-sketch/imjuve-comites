import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { queryOne, queryAll, execute } from '../database';
import { generateToken, authMiddleware, requireRole, type AuthRequest } from '../middleware/auth';
import { normalizeEstado } from '../utils/estados';

function normalizeAssigned(states: string[]): string[] {
  return (states || []).map(normalizeEstado);
}

const router = Router();

function asyncWrap(fn: (req: any, res: Response) => Promise<void>) {
  return (req: any, res: Response, next: any) => fn(req, res).catch(next);
}

router.post('/login', asyncWrap(async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Usuario y contraseña requeridos' }); return;
  }

  const user = await queryOne('SELECT * FROM users WHERE username = $username', { $username: username });

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Usuario o contraseña incorrectos' }); return;
  }

  const assignedStates = normalizeAssigned(JSON.parse(user.assigned_states || '[]'));
  const role = user.role === 'admin' ? 'administrador' : user.role;
  const token = generateToken(user.id, user.username, role, assignedStates);
  res.json({
    token,
    user: { id: user.id, username: user.username, fullName: user.full_name || '', role, assignedStates },
  });
}));

router.get('/me', authMiddleware, asyncWrap(async (req: AuthRequest, res: Response) => {
  const user = await queryOne('SELECT id, username, role, assigned_states, full_name, created_at FROM users WHERE id = $id', { $id: req.userId });
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' }); return;
  }
  const assignedStates = normalizeAssigned(JSON.parse(user.assigned_states || '[]'));
  const fullName = user.full_name || '';
  const role = user.role === 'admin' ? 'administrador' : user.role;
  res.json({ user: { id: user.id, username: user.username, fullName, role, assignedStates, created_at: user.created_at } });
}));

router.post('/register', authMiddleware, requireRole('administrador'), asyncWrap(async (req: AuthRequest, res: Response) => {
  const { username, password, role = 'promotor', assignedStates: rawStates = [], fullName = '' } = req.body;
  const assignedStates = normalizeAssigned(rawStates);
  if (!username || !password) {
    res.status(400).json({ error: 'Usuario y contraseña requeridos' }); return;
  }

  if (!['administrador', 'territorial', 'coordinador', 'promotor'].includes(role)) {
    res.status(400).json({ error: 'Rol inválido' }); return;
  }

  if ((role === 'coordinador' || role === 'promotor') && assignedStates && assignedStates.length > 1) {
    res.status(400).json({ error: `${role === 'coordinador' ? 'Coordinador' : 'Promotor'} solo puede tener 1 estado asignado` }); return;
  }

  const existing = await queryOne('SELECT id FROM users WHERE username = $u', { $u: username });
  if (existing) {
    res.status(409).json({ error: 'El usuario ya existe' }); return;
  }

  const id = uuid();
  const hash = bcrypt.hashSync(password, 10);
  await execute(
    'INSERT INTO users (id, username, password_hash, role, assigned_states, full_name) VALUES ($id, $u, $p, $r, $s, $fn)',
    { $id: id, $u: username, $p: hash, $r: role, $s: JSON.stringify(assignedStates), $fn: fullName },
  );

  res.status(201).json({ message: 'Usuario creado', user: { id, username, fullName, role, assignedStates } });
}));

// ── Admin: user management ──────────────────────────────────

router.get('/', authMiddleware, requireRole('administrador'), asyncWrap(async (_req: AuthRequest, res: Response) => {
  const rows = await queryAll('SELECT id, username, role, assigned_states, full_name, created_at FROM users ORDER BY created_at DESC');
  const users = rows.map((r: any) => ({
    id: r.id, username: r.username, fullName: r.full_name || '',
    role: r.role, assignedStates: normalizeAssigned(JSON.parse(r.assigned_states || '[]')), createdAt: r.created_at,
  }));
  res.json({ users });
}));

router.put('/:id', authMiddleware, requireRole('administrador'), asyncWrap(async (req: AuthRequest, res: Response) => {
  const existing = await queryOne('SELECT id, role, assigned_states FROM users WHERE id = $id', { $id: req.params.id });
  if (!existing) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }

  const { username, password, role, assignedStates: rawStates, fullName } = req.body;
  const assignedStates = rawStates !== undefined ? normalizeAssigned(rawStates) : undefined;

  if (role && !['administrador', 'territorial', 'coordinador', 'promotor'].includes(role)) {
    res.status(400).json({ error: 'Rol inválido' }); return;
  }

  if (assignedStates !== undefined) {
    const effectiveRole = role || existing.role;
    if ((effectiveRole === 'coordinador' || effectiveRole === 'promotor') && assignedStates.length > 1) {
      res.status(400).json({ error: `${effectiveRole === 'coordinador' ? 'Coordinador' : 'Promotor'} solo puede tener 1 estado asignado` }); return;
    }
  }

  let sql = 'UPDATE users SET ';
  const params: Record<string, any> = { $id: req.params.id };
  const sets: string[] = [];

  if (username !== undefined) { sets.push('username = $username'); params.$username = username; }
  if (fullName !== undefined) { sets.push('full_name = $fn'); params.$fn = fullName; }
  if (role !== undefined) { sets.push('role = $role'); params.$role = role; }
  if (assignedStates !== undefined) { sets.push('assigned_states = $states'); params.$states = JSON.stringify(assignedStates); }
  if (password !== undefined) {
    sets.push('password_hash = $hash');
    params.$hash = bcrypt.hashSync(password, 10);
  }

  if (sets.length === 0) { res.status(400).json({ error: 'Sin datos para actualizar' }); return; }

  await execute(sql + sets.join(', ') + ' WHERE id = $id', params);
  res.json({ message: 'Usuario actualizado' });
}));

router.delete('/:id', authMiddleware, requireRole('administrador'), asyncWrap(async (req: AuthRequest, res: Response) => {
  const existing = await queryOne('SELECT id FROM users WHERE id = $id', { $id: req.params.id });
  if (!existing) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }

  await execute('DELETE FROM users WHERE id = $id', { $id: req.params.id });
  res.json({ message: 'Usuario eliminado' });
}));

// ── Import / Export ────────────────────────────────────────

router.get('/template', authMiddleware, requireRole('administrador'), (_req: AuthRequest, res: Response) => {
  const header = 'username,password,role,full_name,assigned_states';
  const csv = [
    header,
    'ADMIN_M,0000,administrador,María López,[]',
    'TERRI_E,0000,territorial,Eduardo Cruz,\"[\\\"JALISCO\\\",\\\"NAYARIT\\\"]"',
    'COORD_N,0000,coordinador,Nancy Ríos,\"[\\\"NUEVO LEON\\\"]"',
    'PROMO_X,0000,promotor,Ximena Paz,\"[\\\"VERACRUZ\\\"]"',
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=plantilla_usuarios.csv');
  res.send(csv);
});

router.post('/import', authMiddleware, requireRole('administrador'), asyncWrap(async (req: AuthRequest, res: Response) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ error: 'Enviar un arreglo rows con los usuarios' }); return;
  }

  const results: { username: string; success: boolean; error?: string }[] = [];

  for (const row of rows) {
    try {
      const { username, password = '0000', role = 'promotor', fullName = '', assignedStates: rawStates = [] } = row;
      const assignedStates = normalizeAssigned(rawStates);
      if (!username) { results.push({ username: '(sin usuario)', success: false, error: 'username requerido' }); continue; }

      const existing = await queryOne('SELECT id FROM users WHERE username = $u', { $u: username });
      if (existing) { results.push({ username, success: false, error: 'Ya existe' }); continue; }

      const id = uuid();
      const hash = bcrypt.hashSync(password, 10);
      await execute(
        'INSERT INTO users (id, username, password_hash, role, assigned_states, full_name) VALUES ($id, $u, $p, $r, $s, $fn)',
        { $id: id, $u: username, $p: hash, $r: role, $s: JSON.stringify(assignedStates), $fn: fullName },
      );
      results.push({ username, success: true });
    } catch (e: any) {
      results.push({ username: row.username, success: false, error: e.message });
    }
  }

  res.json({ message: `Importados ${results.filter(r => r.success).length} de ${results.length}`, results });
}));

export default router;
