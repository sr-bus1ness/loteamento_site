// ====== CONFIG INICIAL: DOIS LOTEAMENTOS ======
const LOT_KEY = 'loteamento-data-v1';

function gerarLotes(qtd, basePreco = 80000, parcelasPadrao = 60){
  // cria lotes com preco/parcelas padrão (edite à vontade depois)
  const arr = [];
  for(let i=1;i<=qtd;i++){
    const preco = basePreco + (i%6)*2500; // variação simples por lote
    arr.push({ id: i, preco, parcelas: parcelasPadrao, status: 'disponivel' });
  }
  // alguns exemplos pré-marcados
  if(arr[2]) arr[2].status = 'reservado';
  if(arr[5]) arr[5].status = 'vendido';
  return arr;
}

const defaultData = {
  "Loteamento 1": gerarLotes(30, 90000, 72),
  "Loteamento 2": gerarLotes(24, 75000, 60)
};

// ====== PERSISTÊNCIA (LOCALSTORAGE) ======
function loadData(){
  try{
    const raw = localStorage.getItem(LOT_KEY);
    if(!raw) return JSON.parse(JSON.stringify(defaultData));
    const parsed = JSON.parse(raw);
    // garante que existam os dois loteamentos
    return { ...JSON.parse(JSON.stringify(defaultData)), ...parsed };
  }catch(e){
    console.warn('Falha ao carregar dados, resetando...', e);
    return JSON.parse(JSON.stringify(defaultData));
  }
}
function saveData(){
  localStorage.setItem(LOT_KEY, JSON.stringify(data));
}

// ====== ESTADO GLOBAL ======
let data = loadData();
let atual = Object.keys(data)[0]; // loteamento atual
let selecionado = null; // {id, ...}

// ====== ELEMENTOS ======
const sel = id => document.getElementById(id);
const $select = sel('loteamentoSelect');
const $grid = sel('grid');
const $plantTitle = sel('plantTitle');

const $total = sel('totalLotes');
const $qDisp = sel('qtdDisp');
const $qRes = sel('qtdRes');
const $qVen = sel('qtdVen');
const $pDisp = sel('pctDisp');
const $pRes = sel('pctRes');
const $pVen = sel('pctVen');

const $detailCard = sel('detailCard');
const $noSelection = sel('noSelection');
const $detailBody = sel('detailBody');
const $lotId = sel('lotId');
const $lotStatusBadge = sel('lotStatusBadge');
const $lotPreco = sel('lotPreco');
const $lotParcelas = sel('lotParcelas');
const $saveBtn = sel('saveBtn');

const $exportBtn = sel('exportBtn');
const $importInput = sel('importInput');

// ====== INÍCIO ======
init();

function init(){
  // preencher select com os dois loteamentos
  Object.keys(data).forEach(nome=>{
    const opt = document.createElement('option');
    opt.value = nome; opt.textContent = nome;
    $select.appendChild(opt);
  });
  $select.value = atual;
  $select.addEventListener('change', ()=>{
    atual = $select.value;
    selecionado = null;
    renderTudo();
  });

  // botões de status
  document.querySelectorAll('.buttons .btn').forEach(btn=>{
    const s = btn.dataset.status;
    if(!s) return;
    btn.addEventListener('click', ()=>{
      if(!selecionado) return;
      setStatus(s);
    });
  });

  // salvar alterações de preço/parcelas
  $saveBtn.addEventListener('click', ()=>{
    if(!selecionado) return;
    const lotes = data[atual];
    const idx = lotes.findIndex(l => l.id === selecionado.id);
    if(idx >= 0){
      const p = parseFloat($lotPreco.value || 0);
      const par = parseInt($lotParcelas.value || 1, 10);
      lotes[idx].preco = isFinite(p) ? p : lotes[idx].preco;
      lotes[idx].parcelas = isFinite(par) ? par : lotes[idx].parcelas;
      saveData();
      renderTudo(); // atualiza grid e resumo
      selecionarLote(lotes[idx]); // reabre detalhe atualizado
    }
  });

  // exportar / importar
  $exportBtn.addEventListener('click', exportar);
  sel('importInput').addEventListener('change', importar);

  renderTudo();
}

function renderTudo(){
  $plantTitle.textContent = `Planta — ${atual}`;
  renderGrid();
  renderResumo();
  renderDetail(null);
}

function renderGrid(){
  $grid.innerHTML = '';
  const lotes = data[atual];
  lotes.forEach(lote=>{
    const d = document.createElement('div');
    d.className = `lot ${lote.status}`;
    d.innerHTML = `
      <div>
        <strong>Lote ${lote.id}</strong>
        <small>R$ ${formatMoney(lote.preco)} • ${lote.parcelas}x</small>
      </div>`;
    d.addEventListener('click', ()=> selecionarLote(lote));
    $grid.appendChild(d);
  });
}

function renderResumo(){
  const lotes = data[atual];
  const total = lotes.length;
  const disp = lotes.filter(l=>l.status==='disponivel').length;
  const res = lotes.filter(l=>l.status==='reservado').length;
  const ven = lotes.filter(l=>l.status==='vendido').length;

  $total.textContent = total;
  $qDisp.textContent = disp; $pDisp.textContent = pct(disp,total);
  $qRes.textContent = res;  $pRes.textContent = pct(res,total);
  $qVen.textContent = ven;  $pVen.textContent = pct(ven,total);
}

function renderDetail(lote){
  if(!lote){
    selecionado = null;
    $noSelection.classList.remove('hidden');
    $detailBody.classList.add('hidden');
    return;
  }
  selecionado = { ...lote };
  $noSelection.classList.add('hidden');
  $detailBody.classList.remove('hidden');

  $lotId.textContent = `#${lote.id}`;
  $lotPreco.value = lote.preco;
  $lotParcelas.value = lote.parcelas;
  setBadge(lote.status);
}

function setBadge(status){
  $lotStatusBadge.textContent = status.toUpperCase();
  $lotStatusBadge.className = `badge ${status}`;
}

function selecionarLote(lote){
  renderDetail(lote);
}

function setStatus(status){
  if(!selecionado) return;
  const lotes = data[atual];
  const idx = lotes.findIndex(l => l.id === selecionado.id);
  if(idx >= 0){
    lotes[idx].status = status;
    saveData();
    renderGrid();
    renderResumo();
    setBadge(status);
  }
}

// ====== EXPORTAR / IMPORTAR ======
function exportar(){
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'loteamento-dados.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importar(ev){
  const file = ev.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=> {
    try{
      const imported = JSON.parse(reader.result);
      // valida minimamente
      if(typeof imported !== 'object') throw new Error('JSON inválido');
      data = imported;
      saveData();
      // reseta UI
      $select.innerHTML = '';
      Object.keys(data).forEach(nome=>{
        const opt = document.createElement('option');
        opt.value = nome; opt.textContent = nome;
        $select.appendChild(opt);
      });
      atual = Object.keys(data)[0] || 'Loteamento 1';
      $select.value = atual;
      renderTudo();
      alert('Dados importados com sucesso!');
    }catch(e){
      alert('Arquivo inválido.');
    }finally{
      ev.target.value = '';
    }
  };
  reader.readAsText(file, 'utf-8');
}

// ====== UTIL ======
function pct(q, t){
  if(!t) return '0%';
  return ((q*100)/t).toFixed(1) + '%';
}
function formatMoney(n){
  // exibe com duas casas e vírgula (pt-BR)
  return (Number(n)||0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
}
