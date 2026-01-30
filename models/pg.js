// models/pg.js
import pkg from 'pg';
const { Pool } = pkg;

const pools = {};

async function ensureDatabaseExists(pgConfig) {
  // Connect to the default 'postgres' database for bootstrap
  const bootstrap = new Pool({
    host: pgConfig.HOST,
    port: pgConfig.PORT,
    user: pgConfig.USER,
    password: pgConfig.PASS,
    database: 'postgres',
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });

  try {
    // Check if the target database exists
    const check = await bootstrap.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [pgConfig.DB]
    );

    if (check.rowCount === 0) {
      // Create the database (note: PostgreSQL requires double quotes for case-sensitive names)
      await bootstrap.query(`CREATE DATABASE "${pgConfig.DB}"`);
      console.log(`Created PostgreSQL database: ${pgConfig.DB}`);
    }
  } finally {
    await bootstrap.end();
  }
}

async function getPool(config, dbKey) {
  if (!config?.PG_DBS?.[dbKey]) {
    throw new Error(`PostgreSQL config missing for key: ${dbKey}`);
  }

  if (pools[dbKey]) return pools[dbKey];

  const pgConfig = config.PG_DBS[dbKey];

  // Ensure the database exists before creating the pool
  await ensureDatabaseExists(pgConfig);

  pools[dbKey] = new Pool({
    host: pgConfig.HOST,
    port: pgConfig.PORT,
    user: pgConfig.USER,
    password: pgConfig.PASS,
    database: pgConfig.DB,
    max: pgConfig.CONNECTION_LIMIT || 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });

  return pools[dbKey];
}

export default {
  async getRS(dbKey, sSQL, asParams = []) {
    const config = globalThis.w?.config;
    if (!config) throw new Error('w.config not available in pg model');

    const pool = await getPool(config, dbKey);
    const result = await pool.query(sSQL, asParams);
    return result.rows;
  },
  async execSQL(dbKey, sSQL, asParams = []) {
    const config = globalThis.w?.config;
    if (!config) throw new Error('w.config not available in pg model');

    const pool = await getPool(config, dbKey);
    const result = await pool.query(sSQL, asParams);
    return result;
  }
};

