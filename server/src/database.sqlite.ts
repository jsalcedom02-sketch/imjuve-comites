import initSqlJs, { type SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DbAdapter } from './database.types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'imjuve.db');

let db: SqlJsDatabase | null = null;

function getDb(): SqlJsDatabase {
  if (!db) throw new Error('DB not initialized');
  return db;
}

function save() {
  if (!db) return;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

const adapter: DbAdapter = {
  init: async () => {
    const SQL = await initSqlJs();
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

    if (fs.existsSync(DB_PATH)) {
      db = new SQL.Database(fs.readFileSync(DB_PATH));
    } else {
      db = new SQL.Database();
    }
    db.run('PRAGMA foreign_keys = ON');

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'administrador', assigned_states TEXT DEFAULT '[]',
        full_name TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), username TEXT NOT NULL,
        action TEXT NOT NULL, entity TEXT NOT NULL, entity_id TEXT, details TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS folio_counters (estado TEXT PRIMARY KEY, last_number INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS comites (
        id TEXT PRIMARY KEY, folio TEXT UNIQUE NOT NULL, fecha_protesta TEXT NOT NULL,
        ruta_articulacion TEXT NOT NULL, estado TEXT NOT NULL, lugar_intervencion TEXT NOT NULL,
        nombre_comite TEXT NOT NULL, tiktok TEXT DEFAULT '', instagram TEXT DEFAULT '',
        ejes_tematicos TEXT NOT NULL, actividades TEXT NOT NULL, evidencia_fotografica TEXT DEFAULT '',
        observaciones TEXT DEFAULT '', fecha_registro TEXT NOT NULL DEFAULT (datetime('now')),
        user_id TEXT REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS integrantes (
        id TEXT PRIMARY KEY, comite_id TEXT NOT NULL REFERENCES comites(id) ON DELETE CASCADE,
        cargo TEXT NOT NULL, nombre TEXT NOT NULL, sexo TEXT NOT NULL CHECK(sexo IN ('H','M','X')),
        edad INTEGER NOT NULL CHECK(edad >= 12 AND edad <= 29), municipio TEXT NOT NULL,
        telefono TEXT NOT NULL, email TEXT DEFAULT '', poblacion_vulnerable TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS estado_estadisticas (
        estado TEXT PRIMARY KEY, poblacion_joven INTEGER DEFAULT 0, municipios INTEGER DEFAULT 0,
        partido_gobernante TEXT DEFAULT '', matricula_superior INTEGER DEFAULT 0,
        matricula_media_superior INTEGER DEFAULT 0, participacion_jornadas TEXT DEFAULT '',
        meta_comites INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_comites_estado ON comites(estado);
      CREATE INDEX IF NOT EXISTS idx_comites_user ON comites(user_id);
      CREATE INDEX IF NOT EXISTS idx_integrantes_comite ON integrantes(comite_id);
      CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
    `);

    try { db.run("ALTER TABLE users ADD COLUMN full_name TEXT DEFAULT ''"); } catch (_) {}
    try { db.run("UPDATE users SET role = 'administrador' WHERE role = 'admin'"); } catch (_) {}
    try { db.run("ALTER TABLE users ADD COLUMN assigned_states TEXT DEFAULT '[]'"); } catch (_) {}
    try { db.run("ALTER TABLE estado_estadisticas ADD COLUMN meta_comites INTEGER DEFAULT 0"); } catch (_) {}

    save();
    console.log('✅ Conectado a SQLite local:', DB_PATH);
  },

  queryAll: (sql, params) => {
    return new Promise((resolve) => {
      const d = getDb();
      if (params) {
        const stmt = d.prepare(sql);
        stmt.bind(params);
        const rows: Record<string, any>[] = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        resolve(rows);
        return;
      }
      resolve(d.exec(sql).flatMap((r) => r.values.map((v) => {
        const row: Record<string, any> = {};
        r.columns.forEach((col, i) => { row[col] = v[i]; });
        return row;
      })));
    });
  },

  queryOne: async (sql, params) => {
    const rows = await adapter.queryAll(sql, params);
    return rows.length > 0 ? rows[0] : null;
  },

  execute: (sql, params) => {
    return new Promise((resolve) => {
      const d = getDb();
      if (params) {
        const stmt = d.prepare(sql);
        stmt.bind(params);
        stmt.step();
        stmt.free();
      } else {
        d.run(sql);
      }
      save();
      resolve();
    });
  },
};

export default adapter;
