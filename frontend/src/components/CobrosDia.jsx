import React,{useEffect,useState} from 'react'; import {apiGet,apiPost,money} from '../utils/api.js'
export default function CobrosDia(){ const [fecha,setFecha]=useState(new Date().toISOString().slice(0,10)); const [rows,setRows]=useState([]); const load=()=>apiGet('/cobros?hasta='+fecha).then(d=>setRows(d.rows)); useEffect(load,[fecha]);
const cobrar=async(r)=>{ const valor=r.valor_cuota; await apiPost('/prestamos/'+r.id+'/abono',{valor,metodo:'Efectivo'}); load(); }
const totales=rows.reduce((a,r)=>{a.cuotas+=(r.valor_cuota||0); a.saldo+=(r.saldo||0); return a;},{cuotas:0,saldo:0});
return (<div className="card"><div className="row" style={{justifyContent:'space-between'}}><h3>Cobros del día</h3>
<div className="row"><label className="label">Hasta</label><input className="input" type="date" value={fecha} onChange={e=>setFecha(e.target.value)}/></div></div>
<table><thead><tr><th>Cliente</th><th>Cuota</th><th>Vencimiento</th><th>Días atraso</th><th>Saldo</th><th>Estado</th><th>Acciones</th></tr></thead>
<tbody>{rows.map(r=>(<tr key={r.id}><td>{r.cliente}</td><td>{money(r.valor_cuota)}</td><td>{r.vencimiento}</td><td>{r.dias_atraso}</td><td>{money(r.saldo)}</td><td>{r.estado}</td>
<td className="row"><button className="btn" onClick={()=>cobrar(r)}>Cobrar</button><button className="btn secondary" onClick={()=>alert('Pendiente')}>Pendiente</button></td></tr>))}</tbody></table>
<div className="row" style={{justifyContent:'flex-end',marginTop:10}}><div className="card" style={{minWidth:260}}><div><strong>Total cuotas del día:</strong> {money(totales.cuotas)}</div><div><strong>Saldo pendiente listado:</strong> {money(totales.saldo)}</div></div></div></div>) }