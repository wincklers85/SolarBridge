const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
let demo = true;
let history = [];

const registers = [
  ['PV potenza totale', '30001', 'W x1'], ['PV tensione stringa 1', '30003', 'V x0.1'], ['PV corrente stringa 1', '30004', 'A x0.1'],
  ['Consumo casa', '30020', 'W x1'], ['Potenza rete', '30030', 'W x1'], ['SOC batteria', '30050', '% x1'],
  ['Tensione batteria', '30051', 'V x0.1'], ['Corrente batteria', '30052', 'A x0.1'], ['Codice errore', '30100', 'int']
];

const rules = [
  {name:'Carica auto solo surplus', condition:'PV surplus > 1800 W per 5 minuti', action:'Attiva wallbox/relè'},
  {name:'Boiler acqua calda', condition:'Batteria > 80% e FV > 2500 W', action:'Accendi boiler'},
  {name:'Protezione batteria', condition:'SOC < 25%', action:'Disattiva carichi non essenziali'}
];

function makeData(){
  const hour = new Date().getHours();
  const sunFactor = Math.max(0, Math.sin((hour - 6) / 12 * Math.PI));
  const pv = Math.round((1500 + Math.random()*4200) * sunFactor);
  const load = Math.round(650 + Math.random()*2600);
  const batteryW = Math.round((pv-load) * 0.55);
  const grid = Math.round(load - pv - Math.min(0,batteryW));
  const soc = Math.max(5, Math.min(100, Math.round(58 + sunFactor*32 + (Math.random()*10-5))));
  return {
    timestamp:new Date().toISOString(),
    connection: demo ? 'DEMO_MOCK' : 'LIVE_PLACEHOLDER',
    inverter:{status:'OK', temperature_c:Math.round(32+Math.random()*18), frequency_hz:50, mode:'zero_export'},
    pv:{power_w:pv, voltage_v:Math.round(280+Math.random()*90), current_a:Number((pv/330).toFixed(1)), energy_today_kwh:Number((pv/1000*(hour/24)+Math.random()).toFixed(2))},
    load:{power_w:load, energy_today_kwh:Number((load/1000*(hour/18)+Math.random()).toFixed(2))},
    grid:{power_w:grid, import_today_kwh:Number((Math.max(0,grid)/1000*(hour/24)).toFixed(2)), export_w:0},
    battery:{soc_percent:soc, voltage_v:Number((50+Math.random()*5).toFixed(1)), current_a:Number((batteryW/52).toFixed(1)), power_w:batteryW, energy_today_kwh:Number((Math.abs(batteryW)/1000*2).toFixed(2))},
    alarms: pv < 100 && hour > 9 && hour < 17 ? ['Produzione FV bassa'] : []
  }
}

function fmtW(v){ return `${v>=0?'':'-'}${Math.abs(v).toLocaleString('it-IT')} W`; }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }

function update(){
  const d = makeData();
  history.unshift(d); history = history.slice(0,30);
  $('#pvPower').textContent = fmtW(d.pv.power_w); $('#pvVoltage').textContent = `PV ${d.pv.voltage_v} V • ${d.pv.current_a} A`;
  $('#loadPower').textContent = fmtW(d.load.power_w); $('#gridPower').textContent = fmtW(d.grid.power_w);
  $('#batterySoc').textContent = `${d.battery.soc_percent}%`; $('#batteryFlow').textContent = d.battery.power_w>=0 ? `Carica ${fmtW(d.battery.power_w)}` : `Scarica ${fmtW(d.battery.power_w)}`;
  $('#flowPv').textContent=fmtW(d.pv.power_w); $('#flowLoad').textContent=fmtW(d.load.power_w); $('#flowBat').textContent=`${d.battery.soc_percent}%`; $('#flowGrid').textContent=fmtW(d.grid.power_w); $('#flowInv').textContent=d.inverter.status;
  $('#kwhProduced').textContent=d.pv.energy_today_kwh; $('#kwhConsumed').textContent=d.load.energy_today_kwh; $('#kwhGridIn').textContent=d.grid.import_today_kwh; $('#kwhBattery').textContent=d.battery.energy_today_kwh;
  $('#batSoc2').textContent=`${d.battery.soc_percent}%`; $('#batVolt').textContent=`${d.battery.voltage_v} V`; $('#batAmp').textContent=`${d.battery.current_a} A`;
  $('#liveJson').textContent=JSON.stringify(d,null,2); $('#apiExample').textContent=JSON.stringify(d,null,2);
  renderLiveGrid(d); renderHistory(); drawChart(); renderEvents(d);
}

function renderLiveGrid(d){
  const items = [
    ['Stato inverter', d.inverter.status], ['Temperatura', `${d.inverter.temperature_c} °C`], ['Frequenza', `${d.inverter.frequency_hz} Hz`],
    ['PV Power', fmtW(d.pv.power_w)], ['Load Power', fmtW(d.load.power_w)], ['Grid Power', fmtW(d.grid.power_w)],
    ['Battery Power', fmtW(d.battery.power_w)], ['SOC', `${d.battery.soc_percent}%`], ['Connessione', d.connection]
  ];
  $('#liveGrid').innerHTML = items.map(i=>`<div class="card metric"><span>${i[0]}</span><b>${i[1]}</b></div>`).join('');
}
function renderHistory(){
  $('#historyTable tbody').innerHTML = history.map(d=>`<tr><td>${new Date(d.timestamp).toLocaleTimeString('it-IT')}</td><td>${d.pv.power_w}</td><td>${d.load.power_w}</td><td>${d.grid.power_w}</td><td>${d.battery.soc_percent}%</td><td>${d.inverter.status}</td></tr>`).join('');
}
function renderEvents(d){
  const events = [
    {t:new Date().toLocaleTimeString('it-IT'), m:'Lettura inverter completata', c:'info'},
    ...(d.alarms.map(a=>({t:new Date().toLocaleTimeString('it-IT'),m:a,c:'warn'})))
  ];
  $('#eventLog').innerHTML = events.map(e=>`<div class="event"><b>${e.t}</b><br><span>${e.m}</span></div>`).join('');
}
function renderRegisters(){ $('#registerTable').innerHTML = registers.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join(''); }
function renderRules(){ $('#rulesList').innerHTML = rules.map(r=>`<div class="rule"><div><b>${r.name}</b><br><small>${r.condition}</small></div><span>${r.action}</span></div>`).join(''); }
function drawChart(){
  const c = $('#powerChart'); if(!c) return; const ctx=c.getContext('2d'); const w=c.width=c.clientWidth*devicePixelRatio; const h=c.height=170*devicePixelRatio; ctx.clearRect(0,0,w,h);
  const data = [...history].reverse(); const max = Math.max(1,...data.map(d=>Math.max(d.pv.power_w,d.load.power_w)));
  function line(key){ ctx.beginPath(); data.forEach((d,i)=>{ const x=i/(Math.max(1,data.length-1))*w; const y=h-(d[key.split('.')[0]][key.split('.')[1]]/max*h*.85)-h*.08; i?ctx.lineTo(x,y):ctx.moveTo(x,y);}); ctx.lineWidth=3*devicePixelRatio; ctx.stroke(); }
  ctx.globalAlpha=.9; line('pv.power_w'); ctx.globalAlpha=.55; line('load.power_w');
}
function setPage(id){ $$('.page').forEach(p=>p.classList.toggle('active',p.id===id)); $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===id)); const titles={dashboard:['Dashboard energia','Monitoraggio produzione, consumi, batteria e rete'],live:['Live dati','JSON e metriche istantanee'],history:['Storico','Report locale esportabile'],inverter:['Inverter','Profilo e compatibilità'],modbus:['Modbus / RS485','Registri e comunicazione seriale'],battery:['Batteria','Regole e stato accumulo'],loads:['Carichi smart','Automazioni su surplus solare'],alerts:['Allarmi','Log e notifiche'],settings:['Impostazioni','Rete, tema, OTA'],api:['API & MQTT','Integrazione ESP32, backend e Home Assistant']}; $('#pageTitle').textContent=titles[id][0]; $('#pageSubtitle').textContent=titles[id][1]; $('#sidebar').classList.remove('open'); }

$$('.nav-item').forEach(b=>b.onclick=()=>setPage(b.dataset.page));
$('#menuBtn').onclick=()=>$('#sidebar').classList.toggle('open');
$('#refreshBtn').onclick=()=>{update();toast('Dati aggiornati')};
$('#toggleDemo').onclick=()=>{demo=!demo; $('#toggleDemo').textContent=demo?'Demo ON':'Live placeholder'; $('#connectionLabel').textContent=demo?'Demo online':'Live placeholder'; toast(demo?'Modalità demo attiva':'Pronto per API reale')};
$('#copyJson').onclick=()=>navigator.clipboard.writeText($('#liveJson').textContent).then(()=>toast('JSON copiato'));
$('#exportCsv').onclick=()=>{ const rows=['timestamp,pv_w,load_w,grid_w,battery_soc,status',...history.map(d=>`${d.timestamp},${d.pv.power_w},${d.load.power_w},${d.grid.power_w},${d.battery.soc_percent},${d.inverter.status}`)]; const blob=new Blob([rows.join('\n')],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='solarbridge-history.csv'; a.click(); };
$('#addRule').onclick=()=>{rules.push({name:'Nuova regola demo',condition:'Condizione personalizzabile',action:'Azione relè/MQTT'});renderRules();toast('Regola demo aggiunta')};
$$('.save-settings').forEach(b=>b.onclick=()=>toast('Impostazioni salvate in demo'));
$('#themeSelect').onchange=(e)=>{document.body.className=e.target.value==='dark'?'':e.target.value};
renderRegisters(); renderRules(); update(); setInterval(update,3000);
