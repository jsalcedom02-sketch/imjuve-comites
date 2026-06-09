import { v4 as uuid } from 'uuid';

type Row = Record<string, any>;

// ── Decide adapter based on DATABASE_URL ──
const USE_PG = !!process.env.DATABASE_URL;

let adapter: typeof pgAdapter | typeof sqliteAdapter;

async function getAdapter() {
  if (adapter) return adapter;
  if (USE_PG) {
    const mod = await import('./database.pg');
    adapter = mod.default;
  } else {
    const mod = await import('./database.sqlite');
    adapter = mod.default;
  }
  await adapter.init();
  return adapter;
}

// ── Exports ──
export async function initDb(): Promise<void> {
  await getAdapter();
}

export async function queryAll(sql: string, params?: Record<string, any>): Promise<Row[]> {
  return (await getAdapter()).queryAll(sql, params);
}

export async function queryOne(sql: string, params?: Record<string, any>): Promise<Row | null> {
  return (await getAdapter()).queryOne(sql, params);
}

export async function execute(sql: string, params?: Record<string, any>): Promise<void> {
  return (await getAdapter()).execute(sql, params);
}

export async function logAudit(userId: string, username: string, action: string, entity: string, entityId?: string, details?: string) {
  await execute(
    'INSERT INTO audit_log (id, user_id, username, action, entity, entity_id, details) VALUES ($id, $uid, $u, $a, $e, $eid, $d)',
    { $id: uuid(), $uid: userId, $u: username, $a: action, $e: entity, $eid: entityId || '', $d: details || '' },
  );
}
