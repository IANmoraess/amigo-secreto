import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(__dirname, '../../migrations');
const MIGRATIONS_SQL = readdirSync(MIGRATIONS_DIR)
  .filter((file) => file.endsWith('.sql'))
  .sort()
  .map((file) => readFileSync(resolve(MIGRATIONS_DIR, file), 'utf8'));

class D1PreparedStatementAdapter {
  constructor(sqliteDb, sql, params = []) {
    this.sqliteDb = sqliteDb;
    this.sql = sql;
    this.params = params;
  }

  bind(...params) {
    return new D1PreparedStatementAdapter(this.sqliteDb, this.sql, params);
  }

  async run() {
    const stmt = this.sqliteDb.prepare(this.sql);
    const info = stmt.run(...this.params);
    return {
      success: true,
      meta: {
        changes: Number(info.changes ?? 0),
        last_row_id: Number(info.lastInsertRowid ?? 0),
      },
    };
  }

  async first() {
    const stmt = this.sqliteDb.prepare(this.sql);
    const row = stmt.get(...this.params);
    return row ?? null;
  }

  async all() {
    const stmt = this.sqliteDb.prepare(this.sql);
    const results = stmt.all(...this.params);
    return {
      success: true,
      results,
    };
  }
}

/**
 * Cria um banco SQLite em memória compatível com a API do Cloudflare D1
 * (incluindo `batch()` transacional e todas as migrations `.sql`).
 */
export function createTestD1Database() {
  const sqliteDb = new DatabaseSync(':memory:');
  sqliteDb.exec('PRAGMA foreign_keys = ON;');
  for (const sql of MIGRATIONS_SQL) {
    sqliteDb.exec(sql);
  }

  return {
    raw: sqliteDb,
    prepare(sql) {
      return new D1PreparedStatementAdapter(sqliteDb, sql);
    },
    async batch(statements) {
      sqliteDb.exec('BEGIN IMMEDIATE;');
      try {
        const results = [];
        for (const statement of statements) {
          results.push(await statement.run());
        }
        sqliteDb.exec('COMMIT;');
        return results;
      } catch (error) {
        sqliteDb.exec('ROLLBACK;');
        throw error;
      }
    },
  };
}
