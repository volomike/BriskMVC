{
	PORT: 80,
	
	SHOW_FULL_ERRORS: true,

	SQLITE: {
		RELATIVE_PATH: 'other/data/mydb.sqlite'
	},
	
	MARIA_DBS: {
		sample: {
			HOST: '127.0.0.1',
			PORT: 3306,
			USER: 'sample',
			PASS: 'yellowTiger#Y4',
			DB: 'sample',
			CONNECTION_LIMIT: 5
		},
		// Example additional database (copy and adjust as needed):
		// other: {
		// 	HOST: '127.0.0.1',
		// 	PORT: 3306,
		// 	USER: 'sample',
		// 	PASS: 'yellowTiger#Y4',
		// 	DB: 'otherdb',
		// 	CONNECTION_LIMIT: 5
		// }
	},	
	
	PG_DBS: {
		sample: {
			HOST: 'localhost',
			PORT: 5433,           // 5433 for Yugabyte, 5432 for vanilla PostgreSQL
			USER: 'sample',
			PASS: 'yellowTiger#Y4',
			DB: 'sample',
			CONNECTION_LIMIT: 5
		}
		// Add more databases when needed, example:
		// other: {
		//   HOST: 'localhost',
		//   PORT: 5433,
		//   USER: 'sample',
		//   PASS: 'yellowTiger#Y4',
		//   DB: 'otherdb',
		//   CONNECTION_LIMIT: 10
		// }
	}
	
}
