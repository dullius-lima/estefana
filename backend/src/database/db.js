const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://estefana_user:senha_local@database:5432/estefana_db',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function initDatabase() {
  try {
    const client = await pool.connect();
    console.log('Conexão com PostgreSQL estabelecida com sucesso.');
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log('Tabelas verificadas/criadas com sucesso no PostgreSQL.');
    }
    
    client.release();
  } catch (err) {
    console.error('Aviso ao inicializar tabelas do banco:', err.message);
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  initDatabase,
  pool,
};
