import { Router, Response } from 'express';
import { queryAll, queryOne, execute } from '../database';
import { authMiddleware, assignedStatesFilter, type AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

function asyncWrap(fn: (req: AuthRequest, res: Response) => Promise<void>) {
  return (req: AuthRequest, res: Response, next: any) => fn(req, res).catch(next);
}

function canEditEstadisticas(role: string) { return ['administrador', 'territorial'].includes(role); }

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
  }));
  res.json({ estadoEstadisticas: stats });
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
    INSERT INTO estado_estadisticas (estado, poblacion_joven, municipios, partido_gobernante, matricula_superior, matricula_media_superior, participacion_jornadas)
    VALUES ($estado, $pj, $mun, $pg, $ms, $mms, $pjorn)
    ON CONFLICT(estado) DO UPDATE SET
      poblacion_joven = $pj, municipios = $mun, partido_gobernante = $pg,
      matricula_superior = $ms, matricula_media_superior = $mms, participacion_jornadas = $pjorn
  `, {
    $estado: estadoKey,
    $pj: data.poblacionJoven ?? 0,
    $mun: data.municipios ?? 0,
    $pg: data.partidoGobernante ?? '',
    $ms: data.matriculaSuperior ?? 0,
    $mms: data.matriculaMediaSuperior ?? 0,
    $pjorn: data.participacionJornadas ?? '',
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
