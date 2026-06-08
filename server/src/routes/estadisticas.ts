import { Router, Response } from 'express';
import { queryAll, queryOne, execute } from '../database';
import { authMiddleware, assignedStatesFilter, type AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

function asyncWrap(fn: (req: AuthRequest, res: Response) => Promise<void>) {
  return (req: AuthRequest, res: Response, next: any) => fn(req, res).catch(next);
}

function canEditEstadisticas(role: string) { return ['administrador', 'territorial'].includes(role); }

// GET /api/estadisticas — all estado metadata
router.get('/', asyncWrap(async (req: AuthRequest, res: Response) => {
  const filter = req.role === 'administrador' || req.role === 'territorial'
    ? { clause: '1=1', params: {} }
    : assignedStatesFilter(req);
  const rows = await queryAll(`SELECT * FROM estado_estadisticas WHERE ${filter.clause}`, filter.params);
  const stats = rows.map((r: any) => ({
    estado: r.estado,
    poblacionJoven: r.poblacion_joven,
    municipios: r.municipios,
    partidoGobernante: r.partido_gobernante,
    matriculaSuperior: r.matricula_superior,
    matriculaMediaSuperior: r.matricula_media_superior,
    participacionJornadas: r.participacion_jornadas,
    metaComites: r.meta_comites,
  }));
  res.json({ estadoEstadisticas: stats });
}));

// GET /api/estadisticas/resumen — per-state summary with computed counts
router.get('/resumen', asyncWrap(async (req: AuthRequest, res: Response) => {
  const filter = req.role === 'administrador' || req.role === 'territorial'
    ? { clause: '1=1', params: {} }
    : assignedStatesFilter(req);

  // Prefix estado with e. to disambiguate in joined query
  const clause = filter.clause === '1=1' ? '1=1' : filter.clause.replace(/estado/g, 'e.estado');

  const rows = await queryAll(`
    SELECT
      e.estado,
      e.poblacion_joven,
      e.meta_comites,
      COALESCE(c.comites, 0) AS comites_actuales,
      COALESCE(i.integrantes, 0) AS integrantes_actuales
    FROM estado_estadisticas e
    LEFT JOIN (
      SELECT estado, COUNT(*) AS comites FROM comites GROUP BY estado
    ) c ON c.estado = e.estado
    LEFT JOIN (
      SELECT c2.estado, COUNT(*) AS integrantes
      FROM integrantes i2
      JOIN comites c2 ON c2.id = i2.comite_id
      GROUP BY c2.estado
    ) i ON i.estado = e.estado
    WHERE ${clause}
    ORDER BY e.estado
  `, filter.params);

  const resumen = rows.map((r: any) => ({
    estado: r.estado,
    poblacionJoven: r.poblacion_joven,
    metaComites: r.meta_comites,
    comitesActuales: Number(r.comites_actuales),
    integrantesActuales: Number(r.integrantes_actuales),
  }));

  res.json({ resumen });
}));

router.put('/:estado', asyncWrap(async (req: AuthRequest, res: Response) => {
  const { estado } = req.params as { estado: string };
  const estadoKey = estado.toUpperCase();

  if (!canEditEstadisticas(req.role!)) {
    res.status(403).json({ error: 'No tienes permiso para editar estadísticas' }); return;
  }

  if (req.role !== 'administrador') {
    const allowed = req.assignedStates || [];
    if (!allowed.includes(estadoKey)) {
      res.status(403).json({ error: 'No tienes permiso para editar este estado' }); return;
    }
  }

  const data = req.body;

  await execute(`
    INSERT INTO estado_estadisticas (estado, poblacion_joven, municipios, partido_gobernante, matricula_superior, matricula_media_superior, participacion_jornadas, meta_comites)
    VALUES ($estado, $pj, $mun, $pg, $ms, $mms, $pjorn, $meta)
    ON CONFLICT(estado) DO UPDATE SET
      poblacion_joven = $pj, municipios = $mun, partido_gobernante = $pg,
      matricula_superior = $ms, matricula_media_superior = $mms, participacion_jornadas = $pjorn,
      meta_comites = $meta
  `, {
    $estado: estadoKey,
    $pj: data.poblacionJoven ?? 0,
    $mun: data.municipios ?? 0,
    $pg: data.partidoGobernante ?? '',
    $ms: data.matriculaSuperior ?? 0,
    $mms: data.matriculaMediaSuperior ?? 0,
    $pjorn: data.participacionJornadas ?? '',
    $meta: data.metaComites ?? 0,
  });

  res.json({ message: 'Guardado' });
}));

router.delete('/:estado', asyncWrap(async (req: AuthRequest, res: Response) => {
  if (req.role !== 'administrador') {
    res.status(403).json({ error: 'Solo administradores pueden eliminar estadísticas' }); return;
  }
  const { estado } = req.params as { estado: string };
  await execute('DELETE FROM estado_estadisticas WHERE estado = $est', { $est: estado.toUpperCase() });
  res.json({ message: 'Eliminado' });
}));

export default router;
