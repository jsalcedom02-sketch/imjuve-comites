import { Router, Response } from 'express';
import { queryAll, queryOne, execute } from '../database';
import { authMiddleware, requireRole, type AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('administrador'));

router.get('/', (req: AuthRequest, res: Response) => {
  const { limit = '200', offset = '0', action, entity, username } = req.query as Record<string, string>;

  let sql = 'SELECT * FROM audit_log WHERE 1=1';
  const params: Record<string, any> = {};

  if (action) { sql += ' AND action = $action'; params.$action = action; }
  if (entity) { sql += ' AND entity = $entity'; params.$entity = entity; }
  if (username) { sql += ' AND username LIKE $username'; params.$username = `%${username}%`; }

  sql += ' ORDER BY created_at DESC LIMIT $limit OFFSET $offset';
  params.$limit = parseInt(limit) || 200;
  params.$offset = parseInt(offset) || 0;

  const rows = queryAll(sql, params);
  const total = queryOne('SELECT COUNT(*) as count FROM audit_log')?.count || 0;

  res.json({
    logs: rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      username: r.username,
      action: r.action,
      entity: r.entity,
      entityId: r.entity_id,
      details: r.details,
      createdAt: r.created_at,
    })),
    total,
  });
});

router.get('/export', (_req: AuthRequest, res: Response) => {
  const rows = queryAll('SELECT * FROM audit_log ORDER BY created_at DESC');

  const header = 'ID,Usuario,Acción,Entidad,ID Entidad,Detalles,Fecha';
  const csvRows = rows.map((r: any) =>
    `"${r.id}","${r.username}","${r.action}","${r.entity}","${r.entity_id}","${(r.details || '').replace(/"/g, '""')}","${r.created_at}"`
  );

  const csv = [header, ...csvRows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=audit_log.csv');
  res.send(csv);
});

export default router;
