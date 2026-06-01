declare module 'sql.js' {
  interface SqlJsDatabase {
    run(sql: string, params?: Record<string, any>): SqlJsDatabase;
    exec(sql: string): Array<{ columns: string[]; values: any[][] }>;
    prepare(sql: string): SqlJsStatement;
    export(): Uint8Array;
  }

  interface SqlJsStatement {
    bind(params?: Record<string, any>): boolean;
    step(): boolean;
    getAsObject(): Record<string, any>;
    free(): boolean;
  }

  interface SqlJsStatic {
    new (data?: ArrayLike<number> | Buffer): SqlJsDatabase;
    Database: new (data?: ArrayLike<number> | Buffer) => SqlJsDatabase;
  }

  export type Database = SqlJsDatabase;
  export type Statement = SqlJsStatement;

  export default function initSqlJs(config?: any): Promise<SqlJsStatic>;
}
