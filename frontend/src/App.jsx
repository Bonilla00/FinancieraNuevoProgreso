import React,{useState} from 'react'
import Dashboard from './components/Dashboard.jsx'
import PrestamosList from './components/PrestamosList.jsx'
import NuevoPrestamo from './components/NuevoPrestamo.jsx'
import Pagos from './components/Pagos.jsx'
import CobrosDia from './components/CobrosDia.jsx'
const TABS=[{id:'dashboard',label:'Dashboard'},{id:'prestamos',label:'Créditos'},{id:'nuevo',label:'Nuevo Préstamo'},{id:'pagos',label:'Pagos'},{id:'cobros',label:'Cobros del Día'}]
export default function App(){ const [tab,setTab]=useState('dashboard'); return (<>
<nav className="nav"><div className="inner"><div className="logo"><img src="/logo.png" onError={e=>e.target.style.display='none'}/><span>Financiera Nuevo Progreso</span></div>
<div className="tabs" style={{display:'flex',gap:8}}>{TABS.map(t=>(<a key={t.id} href="#" className={tab===t.id?'active':''} onClick={e=>{e.preventDefault();setTab(t.id)}}>{t.label}</a>))}</div></div></nav>
<div className="container">{tab==='dashboard'&&<Dashboard/>}{tab==='prestamos'&&<PrestamosList onGoNuevo={()=>setTab('nuevo')}/>} {tab==='nuevo'&&<NuevoPrestamo onDone={()=>setTab('prestamos')}/>} {tab==='pagos'&&<Pagos/>} {tab==='cobros'&&<CobrosDia/>}</div>
</>) }