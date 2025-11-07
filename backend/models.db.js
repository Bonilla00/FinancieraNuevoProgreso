import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

export let db = null;
export let dbPathGlobal = null;

function run(db, sql, params=[]) {
  return new Promise((resolve, reject)=> {
    db.run(sql, params, function(err){
      if (err) reject(err); else resolve(this);
    });
  });
}
function get(db, sql, params=[]) {
  return new Promise((resolve, reject)=> {
    db.get(sql, params, function(err,row){
      if (err) reject(err); else resolve(row);
    });
  });
}
function all(db, sql, params=[]) {
  return new Promise((resolve, reject)=> {
    db.all(sql, params, function(err,rows){
      if (err) reject(err); else resolve(rows);
    });
  });
}

export async function initDB(dbPath) {
  dbPathGlobal = dbPath;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const firstTime = !fs.existsSync(dbPath);
  sqlite3.verbose();
  db = new sqlite3.Database(dbPath);

  await run(db, `CREATE TABLE IF NOT EXISTS prestamos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE,
      cliente TEXT NOT NULL,
      identificacion TEXT,
      telefono TEXT,
      barrio TEXT,
      direccion TEXT,
      fecha_prestamo TEXT,
      frecuencia TEXT,
      cuotas INTEGER,
      monto REAL,
      tasa REAL,
      interes_estimado REAL,
      total_pagar REAL,
      valor_cuota REAL,
      vencimiento TEXT,
      saldo REAL,
      estado TEXT DEFAULT 'Activo',
      observaciones TEXT
  )`);

  await run(db, `CREATE TABLE IF NOT EXISTS pagos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prestamo_id INTEGER NOT NULL,
      fecha_pago TEXT,
      valor REAL NOT NULL,
      cuota INTEGER,
      metodo TEXT,
      notas TEXT,
      FOREIGN KEY(prestamo_id) REFERENCES prestamos(id)
  )`);

  await run(db, `CREATE TABLE IF NOT EXISTS backup_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ruta TEXT,
      fecha TEXT
  )`);

  if (firstTime) {
    await run(db, `INSERT INTO prestamos 
      (codigo, cliente, identificacion, telefono, barrio, direccion, fecha_prestamo, frecuencia, cuotas, monto, tasa, interes_estimado, total_pagar, valor_cuota, vencimiento, saldo, estado, observaciones)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ['NP-0001','Cliente Demo','123456','3000000000','Centro','Calle 1 #2-3','2025-11-01','Semanal',10,500000,10,50000,550000,55000,'2026-01-10',550000,'Activo','Ejemplo']
    );
  }

  return { run: (sql,p)=>run(db,sql,p), get:(sql,p)=>get(db,sql,p), all:(sql,p)=>all(db,sql,p) };
}

export const q = { run, get, all };
