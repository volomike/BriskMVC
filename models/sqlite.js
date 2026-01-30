import path from 'path';
import fs from 'fs';

// Bun has built-in SQLite:
import { Database } from 'bun:sqlite';

// A tiny promise queue to serialize DB operations.
// This prevents "database is locked" errors when 5 users hit it at once.
let queue = Promise.resolve();

// Singleton DB instance
let db = null;

function getDb(config) {
  if (!config?.SQLITE?.RELATIVE_PATH) {
    throw new Error('SQLite config missing: config.SQLITE.RELATIVE_PATH');
  }

  if (db) return db;

  const dbPath = path.resolve(
    path.join(process.cwd(), config.SQLITE.RELATIVE_PATH)
  );

  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(dbPath, { create: true });
  return db;
}

// Wrap a function so it runs in the queue
function enqueue(fn) {
  queue = queue.then(fn).catch(err => {
    console.error('SQLite queue error:', err);
    throw err;
  });
  return queue;
}

export default {
  async getRS(sSQL, asParams = []) {
    const config = globalThis.w?.config;
    if (!config) throw new Error('w.config not available in sqlite model');

    const database = getDb(config);

    return enqueue(() => {
      const stmt = database.prepare(sSQL);
      const rows = stmt.all(...asParams);
      return rows;
    });
  },

  async execSQL(sSQL, asParams = []) {
    const config = globalThis.w?.config;
    if (!config) throw new Error('w.config not available in sqlite model');

    const database = getDb(config);

    return enqueue(() => {
      const stmt = database.prepare(sSQL);
      const result = stmt.run(...asParams);
      return result;
    });
  }
};

