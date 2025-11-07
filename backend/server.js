import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import dayjs from 'dayjs';
import { fileURLToPath } from 'url';
import { initDB, db, q, dbPathGlobal } from './models.db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Load config
const configPath = path.join(__dirname, 'config.json');
let config = { brandName: 'Financiera Nuevo Progreso', theme: 'blue', backupPath: '' };
try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch {}

await initDB(path.join(__dirname, 'db', 'financiera.db'));

app.get('/api/health', (req,res)=> res.json({ ok:true, brand: config.brandName }));

app.get('/api/prestamos', async (req,res)=>{
  const rows = await q.all(db, 'SELECT * FROM prestamos ORDER BY id DESC');
  res.json({ rows });
});

app.get('/api/prestamos/:id', async (req,res)=>{
  const p = await q.get(db, 'SELECT * FROM prestamos WHERE id = ?', [req.params.id]);
  if(!p) return res.status(404).json({ error:'No existe' });
  const pagos = await q.all(db, 'SELECT * FROM pagos WHERE prestamo_id = ? ORDER BY id ASC', [p.id]);
  res.json({ prestamo:p, pagos });
});

app.post('/api/prestamos', async (req,res)=>{
  const b = req.body;
  const last = await q.get(db, "SELECT codigo FROM prestamos ORDER BY id DESC LIMIT 1");
  const next = (!last || !last.codigo) ? 'NP-0001' : `NP-${String(parseInt((last.codigo.split('-')[1]||'0'),10)+1).padStart(4,'0')}`;
  const interes = Math.round(b.monto*(b.tasa/100));
  const total = b.monto + interes + (b.gasto_admin||0) - (b.abono_inicial||0);
  const cuota = Math.round(total / b.cuotas);
  const addDays = (d,n)=>{const x=new Date(d); x.setDate(x.getDate()+n); return x.toISOString().slice(0,10)};
  const addMonths=(d,n)=>{const x=new Date(d); x.setMonth(x.getMonth()+n); return x.toISOString().slice(0,10)};
  let venc = b.fecha_prestamo;
  if(b.frecuencia==='Diario') venc = addDays(b.fecha_prestamo, b.cuotas);
  else if(b.frecuencia==='Semanal') venc = addDays(b.fecha_prestamo, b.cuotas*7);
  else if(b.frecuencia==='Quincenal') venc = addDays(b.fecha_prestamo, b.cuotas*14);
  else venc = addMonths(b.fecha_prestamo, b.cuotas);
  await q.run(db, `INSERT INTO prestamos
    (codigo, cliente, identificacion, telefono, barrio, direccion, fecha_prestamo, frecuencia, cuotas, monto, tasa, interes_estimado, total_pagar, valor_cuota, vencimiento, saldo, estado, observaciones)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [next,b.cliente,b.identificacion,b.telefono,b.barrio,b.direccion,b.fecha_prestamo,b.frecuencia,b.cuotas,b.monto,b.tasa,interes,total,cuota,venc,total,'Activo',b.observaciones||'']
  );
  res.json({ codigo: next, total_pagar: total, valor_cuota: cuota, vencimiento: venc });
});

app.post('/api/prestamos/:id/abono', async (req,res)=>{
  const id = req.params.id;
  const { valor, cuota, metodo, notas, fecha_pago } = req.body;
  const p = await q.get(db, 'SELECT * FROM prestamos WHERE id = ?', [id]);
  if(!p) return res.status(404).json({ error:'No existe' });
  const nuevoSaldo = Math.max(0,(p.saldo||0)-Number(valor));
  const hoy=new Date(); const venc=new Date(p.vencimiento);
  const nuevoEstado = (nuevoSaldo===0)?'Pagado':(hoy>venc?'Mora':'Activo');
  await q.run(db,'INSERT INTO pagos (prestamo_id, fecha_pago, valor, cuota, metodo, notas) VALUES (?,?,?,?,?,?)',
    [id,(fecha_pago||new Date().toISOString().slice(0,10)),valor,cuota||null,metodo||null,notas||null]);
  await q.run(db,'UPDATE prestamos SET saldo=?, estado=? WHERE id=?',[nuevoSaldo,nuevoEstado,id]);
  res.json({ ok:true, saldo:nuevoSaldo, estado:nuevoEstado });
});

app.delete('/api/prestamos/:id', async (req,res)=>{
  const id=req.params.id;
  await q.run(db,'DELETE FROM pagos WHERE prestamo_id=?',[id]);
  await q.run(db,'DELETE FROM prestamos WHERE id=?',[id]);
  res.json({ ok:true });
});

app.get('/api/pagos', async (req,res)=>{
  const rows = await q.all(db, `SELECT pg.*, pr.codigo AS prestamo_codigo, pr.cliente
                                FROM pagos pg JOIN prestamos pr ON pr.id=pg.prestamo_id
                                ORDER BY pg.id DESC`);
  res.json({ rows });
});

app.get('/api/dashboard', async (req,res)=>{
  const totalPrestado = (await q.get(db,"SELECT IFNULL(SUM(monto),0) v FROM prestamos")).v;
  const totalACobrar = (await q.get(db,"SELECT IFNULL(SUM(saldo),0) v FROM prestamos WHERE estado IN ('Activo','Mora')")).v;
  const gananciaTotal = (await q.get(db,"SELECT IFNULL(SUM(interes_estimado),0) v FROM prestamos")).v;
  const activos = (await q.get(db,"SELECT COUNT(*) c FROM prestamos WHERE estado='Activo'")).c;
  const mora = (await q.get(db,"SELECT COUNT(*) c FROM prestamos WHERE estado='Mora'")).c;
  const pagados = (await q.get(db,"SELECT COUNT(*) c FROM prestamos WHERE estado='Pagado'")).c;
  const ultimosPrestamos = await q.all(db,"SELECT * FROM prestamos ORDER BY id DESC LIMIT 5");
  const ultimosPagos = await q.all(db,"SELECT pg.*, pr.codigo, pr.cliente FROM pagos pg JOIN prestamos pr ON pr.id=pg.prestamo_id ORDER BY pg.id DESC LIMIT 5");
  res.json({ totalPrestado, totalACobrar, gananciaTotal, activos, mora, pagados, ultimosPrestamos, ultimosPagos });
});

app.get('/api/cobros', async (req,res)=>{
  const hasta=req.query.hasta;
  const rows = await q.all(db, `SELECT p.id, p.codigo, p.cliente, p.identificacion, p.telefono,
               p.monto, p.valor_cuota, p.vencimiento, p.saldo, p.estado,
               CAST((julianday(?) - julianday(p.vencimiento)) AS INTEGER) AS dias_atraso
        FROM prestamos p
        WHERE date(p.vencimiento) <= date(?)
          AND p.estado IN ('Activo','Mora')
        ORDER BY p.vencimiento ASC`, [hasta,hasta]);
  res.json({ rows });
});

app.get('/api/prestamos/:id/recibo', async (req,res)=>{
  const id = req.params.id;
  const p = await q.get(db, 'SELECT * FROM prestamos WHERE id = ?', [id]);
  if(!p) return res.status(404).send('No existe el préstamo');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Recibo - ${config.brandName}</title>
  <style>body{font-family:Arial,sans-serif;padding:24px}h1{margin:0 0 8px;color:#0E4DA4}table{border-collapse:collapse;width:100%;margin-top:12px}
  td{padding:6px 4px;border-bottom:1px solid #eee}.brand{font-weight:bold}.foot{margin-top:16px;font-size:12px;color:#666}.badge{display:inline-block;padding:2px 6px;border-radius:4px;background:#eaf2ff;color:#0E4DA4;font-size:12px}</style>
  </head><body><div class="brand">${config.brandName}</div><h1>Recibo de Préstamo</h1><span class="badge">${p.codigo}</span>
  <table><tr><td>Cliente</td><td>${p.cliente}</td></tr><tr><td>Identificación</td><td>${p.identificacion||''}</td></tr>
  <tr><td>Monto</td><td>${(p.monto).toLocaleString('es-CO',{style:'currency',currency:'COP'})}</td></tr>
  <tr><td>Tasa</td><td>${p.tasa}%</td></tr><tr><td>Cuotas</td><td>${p.cuotas}</td></tr>
  <tr><td>Valor por cuota</td><td>${(p.valor_cuota).toLocaleString('es-CO',{style:'currency',currency:'COP'})}</td></tr>
  <tr><td>Vencimiento</td><td>${p.vencimiento}</td></tr><tr><td>Saldo</td><td>${(p.saldo).toLocaleString('es-CO',{style:'currency',currency:'COP'})}</td></tr>
  <tr><td>Estado</td><td>${p.estado}</td></tr></table><div class="foot">Emitido: ${new Date().toISOString().replace('T',' ').slice(0,16)}</div><script>window.print()</script></body></html>`;
  res.setHeader('Content-Type','text/html; charset=utf-8'); res.send(html);
});

import { setTimeout as sleep } from 'timers/promises';
import { setInterval } from 'timers';

import { createRequire } from 'module'; // no-op, keep node happy

import * as url from 'url';

// backups 21:00
cron.schedule('0 21 * * *', async ()=>{
  try{
    if(!config.backupPath) return;
    const dateStr = dayjs().format('YYYYMMDD-HHmm');
    if(!fs.existsSync(config.backupPath)) fs.mkdirSync(config.backupPath, { recursive: true });
    const dest = path.join(config.backupPath, `financiera-${dateStr}.db`);
    fs.copyFileSync(dbPathGlobal, dest);
    await q.run(db,'INSERT INTO backup_log (ruta, fecha) VALUES (?,?)',[dest, dayjs().format('YYYY-MM-DD HH:mm:ss')]);
    console.log('[Backup] Copia creada en', dest);
  }catch(e){ console.error('Error en backup:', e.message); }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=>{
  console.log('Backend escuchando en http://localhost:'+PORT);
});
