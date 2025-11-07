import React,{useEffect,useState} from 'react'; import {apiGet,apiPost,money} from '../utils/api.js'
export default function PrestamosList({onGoNuevo}){ const [rows,setRows]=useState([]); const load=()=>apiGet('/prestamos').then(d=>setRows(d.rows)); useEffect(load,[]);
const eliminar=async(id)=>{ if(!confirm('¿Eliminar préstamo y sus pagos?')) return; await fetch('http://localhost:4000/api/prestamos/'+id,{method:'DELETE'}); load(); }
return (<div className="card"><div className="row" style={{justifyContent:'space-between'}}><h3>Créditos</h3><button className="btn" onClick={onGoNuevo}>+ Nuevo</button></div>
<table><thead><tr><th>Código</th><th>Cliente</th><th>Monto</th><th>Tasa</th><th>Cuotas</th><th>Vencimiento</th><th>Saldo</th><th>Estado</th><th>Acciones</th></tr></thead>
<tbody>{rows.map(r=>(<tr key={r.id}><td>{r.codigo}</td><td>{r.cliente}</td><td>{money(r.monto)}</td><td>{r.tasa}%</td><td>{r.cuotas}</td><td>{r.vencimiento}</td><td>{money(r.saldo)}</td><td>{r.estado}</td>
<td className="row"><a className="btn secondary" href={`http://localhost:4000/api/prestamos/${r.id}/recibo`} target="_blank">Ver</a>
<button className="btn secondary" onClick={async()=>{const valor=Number(prompt('Valor del abono:')); if(!valor) return; await apiPost('/prestamos/'+r.id+'/abono',{valor}); load();}}>Abonar</button>
<button className="btn secondary" onClick={()=>eliminar(r.id)}>Eliminar</button></td></tr>))}</tbody></table></div>) }