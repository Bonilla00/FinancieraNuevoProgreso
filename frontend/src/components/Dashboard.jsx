import React,{useEffect,useState} from 'react'; import {apiGet,money} from '../utils/api.js'
export default function Dashboard(){ const [d,setD]=useState(null); useEffect(()=>{apiGet('/dashboard').then(setD)},[]); if(!d) return <div className="card">Cargando...</div>;
return (<div className="grid cols-3">
<div className="card stat"><div className="label">Total prestado</div><div className="value">{money(d.totalPrestado)}</div></div>
<div className="card stat"><div className="label">Total a cobrar</div><div className="value">{money(d.totalACobrar)}</div></div>
<div className="card stat"><div className="label">Ganancia total</div><div className="value">{money(d.gananciaTotal)}</div></div>
<div className="card stat"><div className="label">Créditos activos</div><div className="value">{d.activos}</div></div>
<div className="card stat"><div className="label">Créditos en mora</div><div className="value">{d.mora}</div></div>
<div className="card stat"><div className="label">Créditos pagados</div><div className="value">{d.pagados}</div></div>
<div className="card"><strong>Últimos préstamos</strong><table><thead><tr><th>Código</th><th>Cliente</th><th>Monto</th><th>Saldo</th></tr></thead><tbody>{d.ultimosPrestamos.map(x=><tr key={x.id}><td>{x.codigo}</td><td>{x.cliente}</td><td>{money(x.monto)}</td><td>{money(x.saldo)}</td></tr>)}</tbody></table></div>
<div className="card"><strong>Pagos recientes</strong><table><thead><tr><th>ID</th><th>Préstamo</th><th>Cliente</th><th>Valor</th></tr></thead><tbody>{d.ultimosPagos.map(x=><tr key={x.id}><td>{x.id}</td><td>{x.codigo}</td><td>{x.cliente}</td><td>{money(x.valor)}</td></tr>)}</tbody></table></div>
</div>) }