import pkg from 'pg';
const { Pool } = pkg;
import { v4 as uuid } from 'uuid';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/imjuve',
});

export async function initDb(): Promise<void> {
  const { rows } = await pool.query('SELECT NOW()');
  console.log('✅ Conectado a PostgreSQL:', rows[0].now);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'administrador',
      assigned_states TEXT DEFAULT '[]',
      full_name TEXT DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      details TEXT DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS folio_counters (
      estado TEXT PRIMARY KEY,
      last_number INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS comites (
      id TEXT PRIMARY KEY,
      folio TEXT UNIQUE NOT NULL,
      fecha_protesta TEXT NOT NULL,
      ruta_articulacion TEXT NOT NULL,
      estado TEXT NOT NULL,
      lugar_intervencion TEXT NOT NULL,
      nombre_comite TEXT NOT NULL,
      tiktok TEXT DEFAULT '',
      instagram TEXT DEFAULT '',
      ejes_tematicos TEXT NOT NULL,
      actividades TEXT NOT NULL,
      evidencia_fotografica TEXT DEFAULT '',
      observaciones TEXT DEFAULT '',
      fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
      user_id TEXT REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS integrantes (
      id TEXT PRIMARY KEY,
      comite_id TEXT NOT NULL REFERENCES comites(id) ON DELETE CASCADE,
      cargo TEXT NOT NULL,
      nombre TEXT NOT NULL,
      sexo TEXT NOT NULL CHECK(sexo IN ('H','M','X')),
      edad INTEGER NOT NULL CHECK(edad >= 12 AND edad <= 29),
      municipio TEXT NOT NULL,
      telefono TEXT NOT NULL,
      email TEXT DEFAULT '',
      poblacion_vulnerable TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS estado_estadisticas (
      estado TEXT PRIMARY KEY,
      poblacion_joven INTEGER DEFAULT 0,
      municipios INTEGER DEFAULT 0,
      partido_gobernante TEXT DEFAULT '',
      matricula_superior INTEGER DEFAULT 0,
      matricula_media_superior INTEGER DEFAULT 0,
      participacion_jornadas TEXT DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_comites_estado ON comites(estado);
    CREATE INDEX IF NOT EXISTS idx_comites_user ON comites(user_id);
    CREATE INDEX IF NOT EXISTS idx_integrantes_comite ON integrantes(comite_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
  `);

  await pool.query("UPDATE users SET role = 'administrador' WHERE role = 'admin'");
}

export function getPool(): typeof pool {
  return pool;
}

type Row = Record<string, any>;

function prepare(sql: string, params?: Record<string, any>): { text: string; values: any[] } {
  if (!params) return { text: sql, values: [] };
  const keys = Object.keys(params);
  const values = keys.map(k => params[k]);
  const text = sql.replace(/\$(\w+)/g, (_match, name) => {
    const idx = keys.indexOf(`$${name}`);
    if (idx === -1) return `$${name}`;
    return `$${idx + 1}`;
  });
  return { text, values };
}

export async function queryAll(sql: string, params?: Record<string, any>): Promise<Row[]> {
  const { text, values } = prepare(sql, params);
  const result = await pool.query(text, values);
  return result.rows;
}

export async function queryOne(sql: string, params?: Record<string, any>): Promise<Row | null> {
  const rows = await queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function execute(sql: string, params?: Record<string, any>): Promise<void> {
  const { text, values } = prepare(sql, params);
  await pool.query(text, values);
}

export async function logAudit(userId: string, username: string, action: string, entity: string, entityId?: string, details?: string) {
  await execute(
    'INSERT INTO audit_log (id, user_id, username, action, entity, entity_id, details) VALUES ($id, $uid, $u, $a, $e, $eid, $d)',
    { $id: uuid(), $uid: userId, $u: username, $a: action, $e: entity, $eid: entityId || '', $d: details || '' },
  );
}

export async function closePool(): Promise<void> {
  await pool.end();
}
