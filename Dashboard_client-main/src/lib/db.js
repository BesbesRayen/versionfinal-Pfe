import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3307', 10),
  user: process.env.DB_USER || 'creaditn',
  password: process.env.DB_PASSWORD || 'creaditnpass',
  database: process.env.DB_NAME || 'creaditn',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
