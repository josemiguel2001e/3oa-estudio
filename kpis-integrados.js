(() => {
'use strict';
const cfg={url:'https://yoivymszliwslitfzzci.supabase.co',key:'sb_publishable_o_TdfnhvVUJnNFiyQUpEmQ_Qs8XkXJl'};
const css=document.createElement('style');
css.textContent='#oa-layer{font:14px/1.5 Arial,sans-serif;background:#f5f5f0;color:#202b24;min-height:100vh}#oa-layer *{box-sizing:border-box}#oa-layer .wrap{max-width:1450px;margin:auto;padding:27px clamp(18px,4vw,60px)}#oa-layer .head{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #d8ded6;padding-bottom:18px;gap:15px}#oa-layer .brand{font-size:34px;font-weight:900;letter-spacing:-.09em}#oa-layer .tiny{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:#77857b}#oa-layer .title{font-weight:400;font-size:clamp(40px,5vw,72px);letter-spacing:-.075em;line-height:1.04;margin:34px 0 10px}#oa-layer button{background:white;border:1px solid #b8c5ba;padding:11px 16px;cursor:pointer;color:#203e2f}#oa-layer .chosen,#oa-layer .login button{background:#233f32;color:#fff}#oa-layer .tabs{display:flex;gap:9px;flex-wrap:wrap;margin:22px 0}#oa-layer .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}#oa-layer .stat,#oa-layer .panel{background:white;border:1px solid #e1e6df;padding:23px}#oa-layer .stat strong{display:block;font-size:34px;font-weight:400;letter-spacing:-.05em;margin:12px 0}#oa-layer .stat small,#oa-layer .muted{color:#79877e}#oa-layer h2{font-weight:500;letter-spacing:-.05em;font-size:25px}#oa-layer .columns{display:grid;grid-template-columns:1.3fr 1fr;gap:11px;margin:22px 0}#oa-layer .bar{display:flex;height:14px;background:#e8ece7;overflow:hidden}#oa-layer .legend{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;margin-top:15px}#oa-layer table{width:100%;border-collapse:collapse;font-size:12px}#oa-layer th,#oa-layer td{text-align:left;vertical-align:top;padding:12px 8px;border-bottom:1px solid #e5eae3}#oa-layer th{font-size:10px;color:#718075;text-transform:uppercase}#oa-layer .login{max-width:450px;background:white;padding:32px;margin:9vh auto;border:1px solid #dce2db}#oa-layer label{display:block;font-size:12px;margin-top:17px}#oa-layer input{width:100%;padding:13px;border:1px solid #bcc9c0;margin-top:6px}#oa-layer .login button{width:100%;margin-top:20px}#oa-layer .error{color:#a54b35}#oa-old[hidden]{display:none!important}body.oa-locked #oa-old{display:none!important}@media(max-width:850px){#oa-layer .grid{grid-template-columns:repeat(2,1fr)}#oa-layer .columns{grid-template-columns:1fr}}';
document.head.appendChild(css);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mins=n=>{n=Math.max(0,Math.round(n));return Math.floor(n/60)+' h '+String(n%60).padStart(2,'0')+' min'};
const names={ready:'Por iniciar',running:'En proceso',paused:'Pausada',submitted:'En revisión',changes:'Observaciones',rejected:'Rechazada',approved:'Aprobada'};
const colors={ready:'#acb9b0',running:'#47775d',paused:'#d7aa68',submitted:'#7895a5',changes:'#b88261',rejected:'#a9514b',approved:'#234b39'};
let db,user,profile,all,tab='indicators';
const get=id=>document.getElementById(id);
function install(){
 document.body.classList.add('oa-locked');
 const old=document.createElement('div');old.id='oa-old';while(document.body.firstChild)old.appendChild(document.body.firstChild);document.body.appendChild(old);old.hidden=true;
 const app=document.createElement('div');app.id='oa-layer';app.innerHTML='<div class="wrap"><header class="head"><div><div class="brand">3.OA</div><div class="tiny">ARQUITECTURA / INTELIGENCIA OPERATIVA</div></div><div id="oa-user"></div></header><div id="oa-screen"></div></div>';document.body.prepend(app);start();
}
function login(msg){
 get('oa-old').hidden=true;get('oa-user').textContent='ACCESO PRIVADO';
 get('oa-screen').innerHTML='<div class="login"><div class="tiny">3.OA · UN SOLO ACCESO</div><h1 class="title">El estudio,<br>en perspectiva.</h1><p class="muted">Ingresa con tu correo y contraseña de operaciones.</p><form id="oa-form"><label>Correo<input type="email" name="email" autocomplete="username" required></label><label>Contraseña<input type="password" name="password" autocomplete="current-password" required></label><button>Ingresar</button><p class="error" id="oa-error">'+safe(msg||'')+'</p></form></div>';
 get('oa-form').onsubmit=async e=>{e.preventDefault();const btn=e.target.querySelector('button');btn.disabled=true;try{const fd=new FormData(e.target);const r=await db.auth.signInWithPassword({email:fd.get('email'),password:fd.get('password')});if(r.error)throw r.error;await loadUser()}catch(err){get('oa-error').textContent='No fue posible acceder. Revisa correo y contraseña.'}finally{btn.disabled=false}};
}
async function start(){
 try{
 if(!window.supabase)await new Promise((resolve,reject)=>{const x=document.createElement('script');x.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.10/dist/umd/supabase.min.js';x.onload=resolve;x.onerror=reject;document.head.appendChild(x)});
 db=window.supabase.createClient(cfg.url,cfg.key);
 await loadUser();
 }catch(e){console.error(e);get('oa-screen').textContent='No se pudo conectar a Supabase. Verifica la conexión y vuelve a cargar.'}
}
async function query(name){const r=await db.from(name).select('*');if(r.error)throw r.error;return r.data||[]}
async function loadUser(){
 const r=await db.auth.getUser();user=r.data?.user;if(!user){login();return}
 const p=await db.from('profiles').select('id,full_name,role').eq('id',user.id).single();if(p.error||!p.data){login('Cuenta sin perfil de equipo');return}
 profile=p.data;get('oa-user').innerHTML=safe(profile.full_name)+' <button id="oa-out">Cerrar sesión</button>';get('oa-out').onclick=async()=>{get('oa-old').hidden=true;await db.auth.signOut();user=null;profile=null;login()};
 await refresh();
}
async function refresh(){
 try{
 const [tasks,work,profiles]=await Promise.all([query('tasks'),query('work_sessions'),query('profiles')]);
 const dir=profile.role==='director';all={tasks:dir?tasks:tasks.filter(t=>t.assignee_id===user.id),work:dir?work:work.filter(w=>w.user_id===user.id),profiles};
 render();
 }catch(e){console.error(e);get('oa-screen').innerHTML='<p class="error">No se cargaron los datos: '+safe(e.message)+'</p>'}
}
function duration(s){return Math.max(0,(Date.parse(s.end_at||new Date().toISOString())-Date.parse(s.start_at))/60000)}
function table(tasks){
 if(!tasks.length)return '<p class="muted">No hay actividades registradas.</p>';
 return '<div style="overflow-x:auto"><table><thead><tr><th>Actividad / Proyecto</th><th>Estado</th><th>Responsable</th><th>Tiempo real</th><th>Estimación</th></tr></thead><tbody>'+tasks.map(t=>{
 const work=all.work.filter(s=>s.task_id===t.id),minutes=work.reduce((a,s)=>a+duration(s),0),name=all.profiles.find(p=>p.id===t.assignee_id)?.full_name||'Sin asignar';
 return '<tr><td><strong>'+safe(t.title)+'</strong><div class="muted">'+safe(t.project_name)+'</div></td><td>'+safe(names[t.status]||t.status)+'</td><td>'+safe(name)+'</td><td>'+mins(minutes)+'</td><td>'+(t.estimate_minutes?mins(t.estimate_minutes):'Sin estimar')+'</td></tr>';
 }).join('')+'</tbody></table></div>';
}
function render(){
 const tasks=all.tasks,work=all.work.filter(w=>tasks.some(t=>t.id===w.task_id));const time=work.reduce((a,s)=>a+duration(s),0),rework=work.filter(w=>w.kind==='rework').reduce((a,s)=>a+duration(s),0),done=tasks.filter(t=>t.status==='approved').length;
 const ready=tasks.filter(t=>t.status==='ready').length,review=tasks.filter(t=>t.status==='submitted').length,issues=tasks.filter(t=>['changes','rejected'].includes(t.status)).length;
 const stats=[['Actividades',tasks.length,'Registradas'],['Aprobadas',done,tasks.length?(100*done/tasks.length).toFixed(0)+' % del total':'Sin registros'],['En revisión',review,'Pendientes de dirección'],['Tiempo real',mins(time),'Cronómetros de producción'],['Reproceso',mins(rework),time?(100*rework/time).toFixed(1)+' % del tiempo':'Sin sesiones'],['Por iniciar',ready,'Actividades disponibles'],['En proceso',tasks.filter(t=>t.status==='running').length,'En ejecución'],['Previsto',mins(tasks.reduce((a,t)=>a+(t.estimate_minutes||0),0)),'Con estimaciones registradas']];
 const legend=Object.entries(names).map(([k,n])=>{let count=tasks.filter(t=>t.status===k).length;return '<span><span style="display:inline-block;width:9px;height:9px;background:'+colors[k]+'"></span> '+n+' '+count+'</span>'}).join('');
 const bars=Object.keys(names).map(k=>{let n=tasks.filter(t=>t.status===k).length;return n?'<span style="flex:'+n+';background:'+colors[k]+'" title="'+safe(names[k])+'"></span>':''}).join('');
 const director=profile.role==='director';
 get('oa-screen').innerHTML='<h1 class="title">'+(director?'Radiografía del estudio.':'Tu rendimiento.')+'</h1><p class="muted">Indicadores operativos reales y cronograma 3.OA en una sola plataforma.</p><nav class="tabs"><button data-tab="indicators">Indicadores</button><button data-tab="tasks">Actividades</button>'+(director?'<button data-tab="legacy">Cronograma editorial</button>':'')+'<button id="oa-update">Actualizar</button></nav><div id="oa-stats"><div class="grid">'+stats.map(s=>'<div class="stat"><div class="tiny">'+safe(s[0])+'</div><strong>'+safe(s[1])+'</strong><small>'+safe(s[2])+'</small></div>').join('')+'</div><div class="columns"><section class="panel"><h2>Estado del trabajo</h2><div class="bar">'+bars+'</div><div class="legend">'+legend+'</div></section><section class="panel"><h2>Observaciones</h2><p><strong>'+issues+'</strong> actividades requieren corrección o revisión.</p><p><strong>'+tasks.filter(t=>!t.estimate_minutes).length+'</strong> actividades sin estimación.</p><p class="muted">Las alertas por vencimiento y la liberación programada se habilitarán al enlazar las fechas y dependencias del cronograma histórico; no se inventan atrasos.</p></section></div><section class="panel"><h2>Últimos movimientos</h2>'+table(tasks.slice().sort((a,b)=>Date.parse(b.updated_at)-Date.parse(a.updated_at)).slice(0,8))+'</section></div><div class="panel" id="oa-tasks" hidden><h2>Actividades y tiempos</h2>'+table(tasks)+'</div>';
 get('oa-update').onclick=refresh;document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));setTab(tab);
}
function setTab(next){
 if(next==='legacy'&&profile.role!=='director')return;
 tab=next;get('oa-stats').hidden=next!=='indicators';get('oa-tasks').hidden=next!=='tasks';
 get('oa-old').hidden=next!=='legacy';get('oa-screen').style.display=next==='legacy'?'none':'block';
 document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('chosen',b.dataset.tab===next));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();