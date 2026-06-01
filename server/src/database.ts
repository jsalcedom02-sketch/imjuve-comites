import initSqlJs, { type SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'imjuve.db');

let db: SqlJsDatabase | null = null;

export async function initDb(): Promise<SqlJsDatabase> {
  if (db) return db;

  const SQL = await initSqlJs();
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  initSchema();
  migrateDb();
  // Migration: add assigned_states column if missing (existing databases)
  try { db.run("ALTER TABLE users ADD COLUMN assigned_states TEXT DEFAULT '[]'"); } catch (_) { /* column already exists */ }
  saveDb();
  return db;
}

export function getDb(): SqlJsDatabase {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

export function saveDb(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function initSchema() {
  if (!db) return;
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'administrador',
      assigned_states TEXT DEFAULT '[]',
      full_name TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      details TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
      fecha_registro TEXT NOT NULL DEFAULT (datetime('now')),
      user_id TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
}

function migrateDb() {
  if (!db) return;
  try { db.run("ALTER TABLE users ADD COLUMN full_name TEXT DEFAULT ''"); } catch (_) {}
  try { db.run("UPDATE users SET role = 'administrador' WHERE role = 'admin'"); } catch (_) {}
}

// ── Helper wrappers ──────────────────────────────────────

type Row = Record<string, any>;

export function logAudit(userId: string, username: string, action: string, entity: string, entityId?: string, details?: string) {
  execute(
    'INSERT INTO audit_log (id, user_id, username, action, entity, entity_id, details) VALUES ($id, $uid, $u, $a, $e, $eid, $d)',
    { $id: uuid(), $uid: userId, $u: username, $a: action, $e: entity, $eid: entityId || '', $d: details || '' },
  );
}

export function queryAll(sql: string, params?: Record<string, any>): Row[] {
  const d = getDb();
  const stmt = d.prepare(sql);
  if (params) stmt.bind(params);
  const rows: Row[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function queryOne(sql: string, params?: Record<string, any>): Row | null {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function execute(sql: string, params?: Record<string, any>): void {
  const d = getDb();
  if (params) {
    const stmt = d.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
  } else {
    d.run(sql);
  }
  saveDb();
}
