export default {
  async init() {
    // Create table if not exists
    await w.m.sqlite.execSQL(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      )`,
      []
    );
  },

  async list() {
    await this.init();
    return await w.m.sqlite.getRS(
      `SELECT id, name FROM users ORDER BY name ASC`,
      []
    );
  },

  async findById(id) {
    await this.init();
    const rows = await w.m.sqlite.getRS(
      `SELECT id, name FROM users WHERE id = ?`,
      [id]
    );
    return rows.length ? rows[0] : null;
  },

  async add(name) {
    await this.init();
    await w.m.sqlite.execSQL(
      `INSERT INTO users (name) VALUES (?)`,
      [name]
    );
    return name;
  },

  async updateById(id, newName) {
    await this.init();
    await w.m.sqlite.execSQL(
      `UPDATE users SET name = ? WHERE id = ?`,
      [newName, id]
    );
    return newName;
  }
};

