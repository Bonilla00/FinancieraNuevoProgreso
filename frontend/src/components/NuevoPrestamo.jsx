import React,{useMemo,useState} from 'react'; import {apiPost,money} from '../utils/api.js'
const init={cliente:'',identificacion:'',telefono:'',barrio:'',direccion:'',fecha_prestamo:new Date().toISOString().slice(0,10),frecuencia:'Semanal',cuotas:10,monto:0,tasa:10,observaciones:'',abono_inicial:0,gasto_admin:0}
export default function NuevoPrestamo({onDone}){ const [f,setF]=useState(init); const interes=useMemo(()=>Math.round(f.monto*(f.tasa/100)),[f.monto,f.tasa]); const total=useMemo(()=>f.monto+interes+Number(f.gasto_admin||0)-Number(f.abono_inicial||0),[f.monto,interes,f.gasto_admin,f.abono_inicial]); const valor_cuota=useMemo(()=>f.cuotas?Math.round(total/f.cuotas):0,[total,f.cuotas]); const set=(k,v)=>setF({...f,[k]:v});
const submit=async(e)=>{e.preventDefault(); const r=await apiPost('/prestamos',f); alert('Creado: '+r.codigo); onDone&&onDone();}
return (<form className="grid cols-2 card" onSubmit={submit}>
<div><label className="label">Nombre completo</label><input className="input" value={f.cliente} onChange={e=>set('cliente',e.target.value)} required/>
<label className="label">Identificación</label><input className="input" value={f.identificacion} onChange={e=>set('identificacion',e.target.value)}/>
<label className="label">Teléfono</label><input className="input" value={f.telefono} onChange={e=>set('telefono',e.target.value)}/>
<label className="label">Barrio</label><input className="input" value={f.barrio} onChange={e=>set('barrio',e.target.value)}/>
<label className="label">Dirección</label><input className="input" value={f.direccion} onChange={e=>set('direccion',e.target.value)}/>
<label className="label">Observaciones</label><input className="input" value={f.observaciones} onChange={e=>set('observaciones',e.target.value)}/></div>
<div><label className="label">Fecha del préstamo</label><input type="date" className="input" value={f.fecha_prestamo} onChange={e=>set('fecha_prestamo',e.target.value)}/>
<label className="label">Frecuencia</label><select className="input" value={f.frecuencia} onChange={e=>set('frecuencia',e.target.value)}><option>Diario</option><option>Semanal</option><option>Quincenal</option><option>Mensual</option></select>
<label className="label">Número de cuotas</label><input type="number" className="input" value={f.cuotas} onChange={e=>set('cuotas',Number(e.target.value))}/>
<label className="label">Monto</label><input type="number" className="input" value={f.monto} onChange={e=>set('monto',Number(e.target.value))}/>
<label className="label">Tasa de interés (%)</label><input type="number" className="input" value={f.tasa} onChange={e=>set('tasa',Number(e.target.value))}/>
<div className="row"><div style={{flex:1}}><label className="label">Abono inicial</label><input type="number" className="input" value={f.abono_inicial} onChange={e=>set('abono_inicial',Number(e.target.value))}/></div>
<div style={{flex:1}}><label className="label">Gasto admin</label><input type="number" className="input" value={f.gasto_admin} onChange={e=>set('gasto_admin',Number(e.target.value))}/></div></div>
<div className="card" style={{marginTop:10}}><div className="row">
<div className="stat"><div className="label">Interés estimado</div><div className="value">{money(interes)}</div></div>
<div className="stat"><div className="label">Total a pagar</div><div className="value">{money(total)}</div></div>
<div className="stat"><div className="label">Valor por cuota</div><div className="value">{money(valor_cuota)}</div></div></div></div>
<div className="row" style={{justifyContent:'flex-end',marginTop:10}}><button className="btn" type="submit">Guardar préstamo</button></div></div></form>) }