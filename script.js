// Protótipo de loteamento - 40 lotes (grid)
// Persistência via localStorage, export/import JSON, busca, pan/zoom, seleção e status

const KEY = 'loteamento-proto-v1';

// elementos
const $ = id => document.getElementById(id);
const $select = $('loteamentoSelect');
const $svgContainer = document.getElementById('svgContainer');
const $total = $('totalLotes'), $qDisp = $('qtdDisp'), $qRes = $('qtdRes'), $qVen = $('qtdVen');
const $pctDisp = $('pctDisp'), $pctRes = $('pctRes'), $pctVen = $('pctVen');

const $noSelection = $('noSelection'), $detailBody = $('detailBody');
const $lotId = $('lotId'), $lotStatusBadge = $('lotStatusBadge');
const $lotEntrada = $('lotEntrada'), $lotParcelas = $('lotParcelas'), $lotValorParcela = $('lotValorParcela'), $lotValorTotal = $('lotValorTotal'), $lotObs = $('lotObs');
const $saveBtn = $('saveBtn'), $search = $('searchInput');
const $exportBtn = $('exportBtn'), $importInput = $('importInput'), $locateBtn = $('locateBtn');

let data = {}; // dados por loteamento
let current = 'Loteamento 1';
let svgDoc = null;
let selectedId = null;
let panZoomInstance = null;

// dados iniciais
const sampleData = {
  "Loteamento 1": buildSample('L', 40),
  "Loteamento 2": buildSample('M', 40)
};

function buildSample(prefix, count){
  const arr = {};
  for(let i=1;i<=count;i++){
    const id = prefix + i;
    // random example values
    const total = Math.floor(20000 + Math.random()*40000);
    const parcelas = [12,24,36,60][Math.floor(Math.random()*4)];
    const entrada = Math.round(total * (0.05 + Math.random()*0.15));
    const valorParc = ((total - entrada)/parcelas);
    arr[id] = { id, status: 'disponivel', entrada, parcelas, valorParcela: Number(valorParc.toFixed(2)), valorTotal: total, obs: '' };
  }
  return arr;
}

// load/save
function loadData(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw){ data = sampleData; saveData(); return; }
    data = JSON.parse(raw);
  }catch(e){
    data = sampleData; saveData();
  }
}
function saveData(){
  localStorage.setItem(KEY, JSON.stringify(data));
}

// init
function init(){
  loadData();
  $select.addEventListener('change', ()=> { current = $select.value; renderAll(); });
  $exportBtn.addEventListener('click', exportar);
  $importInput.addEventListener('change', importar);
  $saveBtn.addEventListener('click', onSave);
  $search.addEventListener('keyup', onSearch);
  $locateBtn.addEventListener('click', ()=> { centerSvg(); });

  loadSvgInline();
}

function loadSvgInline(){
  fetch('assets/sample.svg').then(r=>r.text()).then(txt=>{
    $svgContainer.innerHTML = txt;
    svgDoc = $svgContainer.querySelector('svg');
    // attach events to lots
    const lotNodes = svgDoc.querySelectorAll('[data-id]');
    lotNodes.forEach(node=>{
      node.addEventListener('click', (ev)=> {
        ev.stopPropagation();
        const id = node.getAttribute('data-id');
        selectLotBySvg(id);
      });
    });

    // background click hides detail
    svgDoc.addEventListener('click', ()=> { renderDetail(null); });

    // setup panzoom
    try {
      panZoomInstance = panzoom(svgDoc, { maxZoom: 6, minZoom: 0.5, bounds: true, boundsPadding: 0.1 });
      // allow double click to reset
      svgDoc.addEventListener('dblclick', ()=> { panZoomInstance.reset(); });
    } catch (e) { console.warn('panzoom init failed', e); }

    renderAll();
  });
}

function renderAll(){
  $('plantName').textContent = current;
  $('currentLoteamentoLabel').textContent = current;
  renderSvgStatus();
  renderResumo();
  renderDetail(null);
}

function renderSvgStatus(){
  if(!svgDoc) return;
  const lots = svgDoc.querySelectorAll('[data-id]');
  lots.forEach(el=>{
    const id = el.getAttribute('data-id');
    // adapt prefixes: our data keys might be L1..L40 or M1..M40 depending on loteamento; make mapping
    const mappingId = mapToDataId(id);
    const lote = (data[current] && data[current][mappingId]) ? data[current][mappingId] : null;
    // reset classes
    el.classList.remove('disponivel','reservado','vendido','bloqueado');
    if(lote){
      el.classList.add(lote.status);
    } else {
      el.classList.add('bloqueado');
    }
  });
}

function mapToDataId(svgId){
  // svg has L1..L40; if current is "Loteamento 2" use prefix M
  if(current === 'Loteamento 1') return svgId.replace(/^L/, 'L');
  return svgId.replace(/^L/, 'M'); // sample uses M for loteamento2
}

function renderResumo(){
  const list = Object.values(data[current] || {});
  const total = list.length;
  const disp = list.filter(l=>l.status==='disponivel').length;
  const res = list.filter(l=>l.status==='reservado').length;
  const ven = list.filter(l=>l.status==='vendido').length;

  $total.textContent = total;
  $qDisp.textContent = disp; $pctDisp.textContent = pct(disp,total);
  $qRes.textContent = res; $pctRes.textContent = pct(res,total);
  $qVen.textContent = ven; $pctVen.textContent = pct(ven,total);
}

function pct(q,t){ if(!t) return '0%'; return ((q*100)/t).toFixed(1)+'%'; }

function selectLotBySvg(svgId){
  const mapped = mapToDataId(svgId);
  const lote = data[current] && data[current][mapped];
  if(!lote){ renderDetail(null); return; }
  renderDetail(lote);
  // highlight selected stroke by adding a heavier stroke
  // remove previous highlight
  svgDoc.querySelectorAll('.lot').forEach(el=>el.style.filter='none');
  const el = svgDoc.querySelector('[data-id="'+svgId+'"]');
  if(el) el.style.filter = 'drop-shadow(0 6px 12px rgba(0,0,0,0.6))';
}

function renderDetail(lote){
  if(!lote){
    selectedId = null;
    $noSelection.classList.remove('hidden');
    $detailBody.classList.add('hidden');
    return;
  }
  selectedId = lote.id;
  $noSelection.classList.add('hidden');
  $detailBody.classList.remove('hidden');

  $lotId.textContent = lote.id;
  $lotStatusBadge.textContent = lote.status.toUpperCase();
  $lotStatusBadge.className = 'badge ' + lote.status;
  $lotEntrada.value = lote.entrada;
  $lotParcelas.value = lote.parcelas;
  $lotValorParcela.value = lote.valorParcela;
  $lotValorTotal.value = lote.valorTotal;
  $lotObs.value = lote.obs;
}

function onSave(){
  if(!selectedId) return alert('Selecione um lote antes de salvar.');
  const obj = data[current][selectedId];
  if(!obj) return alert('Lote não encontrado.');
  obj.entrada = Number($lotEntrada.value) || obj.entrada;
  obj.parcelas = Number($lotParcelas.value) || obj.parcelas;
  obj.valorParcela = Number($lotValorParcela.value) || obj.valorParcela;
  obj.valorTotal = Number($lotValorTotal.value) || obj.valorTotal;
  obj.obs = $lotObs.value || '';
  saveData();
  renderSvgStatus();
  renderResumo();
  alert('Alterações salvas.');
}

document.querySelectorAll('.buttons .btn').forEach(b=>{
  b && b.addEventListener('click', (ev)=>{
    if(!selectedId) return alert('Selecione um lote primeiro');
    const status = ev.currentTarget.dataset.status;
    data[current][selectedId].status = status;
    saveData();
    renderSvgStatus();
    renderResumo();
    renderDetail(data[current][selectedId]);
  });
});

function onSearch(e){
  const q = $search.value.trim().toUpperCase();
  if(!q) return;
  // try direct match L12 -> map to data id for current
  // find svg element with corresponding id (svg uses L1..L40)
  const svgId = q.replace(/^M/,'L').replace(/^L/,'L');
  // highlight if exists
  const el = svgDoc && svgDoc.querySelector('[data-id="'+svgId+'"]');
  if(el){
    // center element visually
    try { el.scrollIntoView({behavior:'smooth', block:'center'}); } catch(e){}
    // simulate click
    el.dispatchEvent(new Event('click'));
  } else {
    alert('Lote não encontrado no mapa: ' + q);
  }
}

// export/import
function exportar(){
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'loteamento-data.json'; a.click();
  URL.revokeObjectURL(url);
}
function importar(ev){
  const file = ev.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=> {
    try {
      const parsed = JSON.parse(reader.result);
      data = parsed; saveData(); // reload select options maybe
      alert('Dados importados.');
      renderAll();
    } catch(e){
      alert('Arquivo inválido.');
    } finally { ev.target.value = ''; }
  };
  reader.readAsText(file, 'utf-8');
}

// simple center function for panzoom
function centerSvg(){
  if(!svgDoc || !panZoomInstance) return;
  panZoomInstance.reset();
  panZoomInstance.smoothZoom(0, svgDoc.clientWidth/2, svgDoc.clientHeight/2);
}

// init app
init();
