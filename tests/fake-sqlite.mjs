// expo-sqlite async API on top of node:sqlite
import { DatabaseSync } from 'node:sqlite';
const flat = (p) => (p.length === 1 && Array.isArray(p[0]) ? p[0] : p);
export async function openDatabaseAsync() {
  const d = new DatabaseSync(':memory:');
  return {
    async execAsync(sql) { d.exec(sql); },
    async runAsync(sql, ...p) { const r = d.prepare(sql).run(...flat(p)); return { lastInsertRowId: Number(r.lastInsertRowid), changes: r.changes }; },
    async getAllAsync(sql, ...p) { return d.prepare(sql).all(...flat(p)).map((r) => ({ ...r })); },
    async getFirstAsync(sql, ...p) { const r = d.prepare(sql).get(...flat(p)); return r ? { ...r } : null; },
    async withTransactionAsync(fn) { d.exec('BEGIN'); try { await fn(); d.exec('COMMIT'); } catch (e) { d.exec('ROLLBACK'); throw e; } },
  };
}
