export type Row = Record<string, any>;

export interface DbAdapter {
  init: () => Promise<void>;
  queryAll: (sql: string, params?: Record<string, any>) => Promise<Row[]> | Row[];
  queryOne: (sql: string, params?: Record<string, any>) => Promise<Row | null> | (Row | null);
  execute: (sql: string, params?: Record<string, any>) => Promise<void> | void;
}
