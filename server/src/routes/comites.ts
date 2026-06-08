import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { queryAll, queryOne, execute, logAudit } from '../database';
import { authMiddleware, assignedStatesFilter, requireRole, type AuthRequest } from '../middleware/auth';
import { generateFolio } from './folio';
import { normalizeEstado } from '../utils/estados';

const router = Router();
router.use(authMiddleware);

function asyncWrap(fn: (req: AuthRequest, res: Response) => Promise<void>) {
  return (req: AuthRequest, res: Response, next: any) => fn(req, res).catch(next);
}

// Helpers
function canRegisterAnyState(role: string) { return role === 'administrador' || role === 'territorial'; }
function canEdit(role: string) { return ['administrador', 'territorial', 'coordinador'].includes(role); }
function canDelete(role: string) { return ['administrador', 'territorial'].includes(role); }
function isInAssignedState(role: string, assignedStates: string[], estado: string) {
  if (role === 'administrador') return true;
  return (assignedStates || []).includes(estado);
}

function rowToRecord(row: any, integrantes: any[]): any {
  return {
    id: row.id,
    folio: row.folio,
    fechaProtesta: row.fecha_protesta,
    rutaArticulacion: row.ruta_articulacion,
    estado: normalizeEstado(row.estado),
    lugarIntervencion: row.lugar_intervencion,
    nombreComite: row.nombre_comite,
    tiktok: row.tiktok || '',
    instagram: row.instagram || '',
    ejesTematicos: row.ejes_tematicos,
    actividades: row.actividades,
    evidenciaFotografica: row.evidencia_fotografica || '',
    observaciones: row.observaciones || '',
    fechaRegistro: row.fecha_registro,
    modoIntegrantes: 'manual',
    integrantes: integrantes.map((i: any) => ({
      id: i.id,
      cargo: i.cargo,
      nombre: i.nombre,
      sexo: i.sexo,
      edad: i.edad,
      municipio: i.municipio,
      telefono: i.telefono,
      email: i.email || '',
      poblacionVulnerable: i.poblacion_vulnerable ? i.poblacion_vulnerable.split(';').filter(Boolean) : [],
    })),
  };
}

router.get('/', asyncWrap(async (req: AuthRequest, res: Response) => {
  const filter = assignedStatesFilter(req);
  const rows = await queryAll(`SELECT * FROM comites WHERE ${filter.clause} ORDER BY fecha_registro DESC`, filter.params);

  const records = [];
  for (const row of rows) {
    const integrantes = await queryAll('SELECT * FROM integrantes WHERE comite_id = $id', { $id: row.id });
    records.push(rowToRecord(row, integrantes));
  }

  res.json({ records });
}));

router.get('/:id', asyncWrap(async (req: AuthRequest, res: Response) => {
  const row = await queryOne('SELECT * FROM comites WHERE id = $id', { $id: req.params.id });
  if (!row) { res.status(404).json({ error: 'No encontrado' }); return; }

  if (!isInAssignedState(req.role!, req.assignedStates || [], row.estado)) {
    res.status(403).json({ error: 'No tienes permiso para ver este registro' });
    return;
  }

  if (req.role === 'promotor' && row.user_id !== req.userId) {
    res.status(403).json({ error: 'No tienes permiso para ver este registro' });
    return;
  }

  const integrantes = await queryAll('SELECT * FROM integrantes WHERE comite_id = $id', { $id: row.id });
  res.json({ record: rowToRecord(row, integrantes) });
}));

router.post('/', asyncWrap(async (req: AuthRequest, res: Response) => {
  const {
    fechaProtesta, rutaArticulacion, estado, lugarIntervencion,
    nombreComite, tiktok, instagram, integrantes, ejesTematicos,
    actividades, evidenciaFotografica, observaciones,
  } = req.body;

  if (!fechaProtesta || !rutaArticulacion || !estado || !lugarIntervencion || !nombreComite) {
    res.status(400).json({ error: 'Campos requeridos faltantes' }); return;
  }

  if (!integrantes || integrantes.length < 5) {
    res.status(400).json({ error: 'Mínimo 5 integrantes' }); return;
  }

  const estadoKey = normalizeEstado(estado);

  if (!canRegisterAnyState(req.role!)) {
    const allowed = req.assignedStates || [];
    if (!allowed.includes(estadoKey)) {
      res.status(403).json({ error: 'No tienes permiso para registrar en este estado' }); return;
    }
  }

  const id = uuid();

  const counter = await queryOne('SELECT last_number FROM folio_counters WHERE estado = $est', { $est: estadoKey });
  const nextNum = counter ? counter.last_number + 1 : 1;

  await execute(
    'INSERT INTO folio_counters (estado, last_number) VALUES ($est, $num) ON CONFLICT (estado) DO UPDATE SET last_number = $num',
    { $est: estadoKey, $num: nextNum },
  );

  const folio = generateFolio(estado, lugarIntervencion, rutaArticulacion, nextNum);
  const fechaRegistro = new Date().toISOString();

  await execute(`
    INSERT INTO comites (id, folio, fecha_protesta, ruta_articulacion, estado, lugar_intervencion,
      nombre_comite, tiktok, instagram, ejes_tematicos, actividades, evidencia_fotografica,
      observaciones, fecha_registro, user_id)
    VALUES ($id, $folio, $fp, $ruta, $est, $lugar, $nombre, $tik, $ig, $ejes, $act, $foto, $obs, $freg, $uid)
  `, {
    $id: id, $folio: folio, $fp: fechaProtesta, $ruta: rutaArticulacion, $est: estadoKey,
    $lugar: lugarIntervencion.toUpperCase(), $nombre: nombreComite.toUpperCase(),
    $tik: tiktok || '', $ig: instagram || '', $ejes: ejesTematicos.toUpperCase(),
    $act: actividades.toUpperCase(), $foto: evidenciaFotografica || '',
    $obs: (observaciones || '').toUpperCase(), $freg: fechaRegistro, $uid: req.userId,
  });

  const cargos = ['COORDINACIÓN', 'SECRETARÍA', 'VOCERÍA'];
  for (let i = 0; i < integrantes.length; i++) {
    const int = integrantes[i];
    const cargo = cargos[i] || 'INTEGRANTE';
    const pv = (int.poblacionVulnerable || []).join(';');
    await execute(`
      INSERT INTO integrantes (id, comite_id, cargo, nombre, sexo, edad, municipio, telefono, email, poblacion_vulnerable)
      VALUES ($id, $comite, $cargo, $nombre, $sexo, $edad, $mun, $tel, $email, $pv)
    `, {
      $id: uuid(), $comite: id, $cargo: cargo, $nombre: int.nombre.toUpperCase(),
      $sexo: int.sexo, $edad: int.edad, $mun: int.municipio.toUpperCase(),
      $tel: int.telefono, $email: int.email || '', $pv: pv,
    });
  }

  const saved = await queryOne('SELECT * FROM comites WHERE id = $id', { $id: id })!;
  const savedInts = await queryAll('SELECT * FROM integrantes WHERE comite_id = $id', { $id: id });

  await logAudit(req.userId!, req.username!, 'crear', 'comite', id, `Folio: ${folio}, Estado: ${estadoKey}`);

  res.status(201).json({ record: rowToRecord(saved, savedInts) });
}));

router.put('/:id', asyncWrap(async (req: AuthRequest, res: Response) => {
  const existing = await queryOne('SELECT * FROM comites WHERE id = $id', { $id: req.params.id });
  if (!existing) { res.status(404).json({ error: 'No encontrado' }); return; }

  if (!canEdit(req.role!)) {
    res.status(403).json({ error: 'No tienes permiso para editar actas' }); return;
  }

  if (!isInAssignedState(req.role!, req.assignedStates || [], existing.estado)) {
    res.status(403).json({ error: 'No tienes permiso para editar este registro' }); return;
  }

  const { integrantes, evidenciaFotografica } = req.body;

  if (req.role === 'coordinador' && integrantes) {
    const oldCount = (await queryOne('SELECT COUNT(*) as cnt FROM integrantes WHERE comite_id = $id', { $id: req.params.id }))?.cnt || 0;
    if (integrantes.length < oldCount) {
      res.status(403).json({ error: 'No tienes permiso para eliminar integrantes' }); return;
    }
  }

  if (integrantes) {
    await execute('DELETE FROM integrantes WHERE comite_id = $id', { $id: req.params.id });
    const cargos = ['COORDINACIÓN', 'SECRETARÍA', 'VOCERÍA'];
    for (let i = 0; i < integrantes.length; i++) {
      const int = integrantes[i];
      const cargo = cargos[i] || 'INTEGRANTE';
      const pv = (int.poblacionVulnerable || []).join(';');
      await execute(`
        INSERT INTO integrantes (id, comite_id, cargo, nombre, sexo, edad, municipio, telefono, email, poblacion_vulnerable)
        VALUES ($id, $comite, $cargo, $nombre, $sexo, $edad, $mun, $tel, $email, $pv)
      `, {
        $id: uuid(), $comite: req.params.id, $cargo: cargo, $nombre: int.nombre.toUpperCase(),
        $sexo: int.sexo, $edad: int.edad, $mun: int.municipio.toUpperCase(),
        $tel: int.telefono, $email: int.email || '', $pv: pv,
      });
    }
  }

  if (evidenciaFotografica !== undefined) {
    await execute('UPDATE comites SET evidencia_fotografica = $foto WHERE id = $id', {
      $foto: evidenciaFotografica, $id: req.params.id,
    });
  }

  const updated = await queryOne('SELECT * FROM comites WHERE id = $id', { $id: req.params.id })!;
  const updatedInts = await queryAll('SELECT * FROM integrantes WHERE comite_id = $id', { $id: req.params.id });

  await logAudit(req.userId!, req.username!, 'editar', 'comite', req.params.id as string, `Folio: ${updated.folio}`);

  res.json({ record: rowToRecord(updated, updatedInts) });
}));

router.delete('/all', authMiddleware, requireRole('administrador'), asyncWrap(async (req: AuthRequest, res: Response) => {
  const rows = await queryAll('SELECT COUNT(*) as total FROM comites');
  const count = rows[0]?.total || 0;

  await execute('DELETE FROM integrantes');
  await execute('DELETE FROM comites');
  await execute('DELETE FROM folio_counters');

  await logAudit(req.userId!, req.username!, 'eliminar_todo', 'comite', '', `${count} comités eliminados`);

  res.json({ message: `Todos los comités eliminados (${count})` });
}));

router.delete('/:id', asyncWrap(async (req: AuthRequest, res: Response) => {
  const existing = await queryOne('SELECT * FROM comites WHERE id = $id', { $id: req.params.id });
  if (!existing) { res.status(404).json({ error: 'No encontrado' }); return; }

  if (!canDelete(req.role!)) {
    res.status(403).json({ error: 'No tienes permiso para eliminar actas' }); return;
  }

  if (!isInAssignedState(req.role!, req.assignedStates || [], existing.estado)) {
    res.status(403).json({ error: 'No tienes permiso para eliminar este registro' }); return;
  }

  await execute('DELETE FROM comites WHERE id = $id', { $id: req.params.id });

  await logAudit(req.userId!, req.username!, 'eliminar', 'comite', req.params.id as string, `Folio: ${existing.folio}`);

  res.json({ message: 'Eliminado', folio: existing.folio });
}));

export default router;
