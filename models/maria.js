import mysql from 'mysql2/promise';

const pools = {};

async function ensureDatabaseExists(mariaConfig) {
    const bootstrap = await mysql.createConnection({
        host: mariaConfig.HOST,
        port: mariaConfig.PORT,
        user: mariaConfig.USER,
        password: mariaConfig.PASS
    });

    try {
        await bootstrap.query(`USE \`${mariaConfig.DB}\``);  // will throw if DB missing
    } catch (err) {
        if (err.code === 'ER_BAD_DB_ERROR') {
            throw new Error(`Database '${mariaConfig.DB}' does not exist. Please create it manually.`);
        }
        throw err;
    } finally {
        await bootstrap.end();
    }
}

async function getPool(config, dbKey) {
	if (!config?.MARIA_DBS?.[dbKey]) {
		throw new Error(`MariaDB config missing for key: ${dbKey}`);
	}

	if (pools[dbKey]) return pools[dbKey];

	const mariaConfig = config.MARIA_DBS[dbKey];
	await ensureDatabaseExists(mariaConfig);

	pools[dbKey] = mysql.createPool({
		host: mariaConfig.HOST,
		port: mariaConfig.PORT,
		user: mariaConfig.USER,
		password: mariaConfig.PASS,
		database: mariaConfig.DB,
		waitForConnections: true,
		connectionLimit: mariaConfig.CONNECTION_LIMIT || 5,
		queueLimit: 0
	});

	return pools[dbKey];
}

export default {
	async getRS(dbKey, sSQL, asParams = []) {
		const config = globalThis.w?.config;
		if (!config) throw new Error('w.config not available in maria model');

		const pool = await getPool(config, dbKey);
		const [rows] = await pool.execute(sSQL, asParams);
		return rows;
	},

	async execSQL(dbKey, sSQL, asParams = []) {
		const config = globalThis.w?.config;
		if (!config) throw new Error('w.config not available in maria model');

		const pool = await getPool(config, dbKey);
		const [result] = await pool.execute(sSQL, asParams);
		return result;
	}
};

