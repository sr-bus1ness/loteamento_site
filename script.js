// ===== CONFIGURAÇÃO GLOBAL =====
const CONFIG = {
    proximityThreshold: 25, // metros para auto-abrir lote
    autoSaveInterval: 5000, // auto-save a cada 5 segundos
    defaultCoordinates: [-23.5505, -46.6333], // São Paulo como padrão
};

// ===== DADOS DOS LOTEAMENTOS =====
const LOTEAMENTOS_DATA = {
    loteamento1: {
        nome: "Loteamento 1",
        lotes: {
            A1: { id: "A1", status: "disponivel", entrada: 5000, parcelas: 120, valorParcela: 450.00, valorTotal: 59000, observacao: "" },
            A2: { id: "A2", status: "reservado", entrada: 4500, parcelas: 100, valorParcela: 380.00, valorTotal: 42500, observacao: "Cliente interessado" },
            A3: { id: "A3", status: "vendido", entrada: 6000, parcelas: 150, valorParcela: 520.00, valorTotal: 84000, observacao: "Vendido em 15/01/2024" },
            A4: { id: "A4", status: "disponivel", entrada: 4000, parcelas: 80, valorParcela: 350.00, valorTotal: 32000, observacao: "" },
            A5: { id: "A5", status: "bloqueado", entrada: 0, parcelas: 0, valorParcela: 0, valorTotal: 0, observacao: "Área de preservação" },
            A6: { id: "A6", status: "disponivel", entrada: 5500, parcelas: 140, valorParcela: 480.00, valorTotal: 72700, observacao: "" },
            A7: { id: "A7", status: "reservado", entrada: 1000, parcelas: 200, valorParcela: 137.50, valorTotal: 28500, observacao: "Proposta em análise" },
            A8: { id: "A8", status: "disponivel", entrada: 7000, parcelas: 180, valorParcela: 650.00, valorTotal: 124000, observacao: "" },
            A9: { id: "A9", status: "vendido", entrada: 3500, parcelas: 90, valorParcela: 290.00, valorTotal: 29600, observacao: "Quitado" },
            A10: { id: "A10", status: "disponivel", entrada: 4800, parcelas: 110, valorParcela: 420.00, valorTotal: 51000, observacao: "" },
            A11: { id: "A11", status: "reservado", entrada: 6500, parcelas: 160, valorParcela: 580.00, valorTotal: 99300, observacao: "Documentação pendente" },
            A12: { id: "A12", status: "disponivel", entrada: 5200, parcelas: 130, valorParcela: 460.00, valorTotal: 65000, observacao: "" }
        }
    },
    loteamento2: {
        nome: "Loteamento 2",
        lotes: {
            B1: { id: "B1", status: "disponivel", entrada: 8000, parcelas: 200, valorParcela: 750.00, valorTotal: 158000, observacao: "" },
            B2: { id: "B2", status: "vendido", entrada: 7500, parcelas: 180, valorParcela: 680.00, valorTotal: 129900, observacao: "Financiado" },
            B3: { id: "B3", status: "reservado", entrada: 9000, parcelas: 240, valorParcela: 820.00, valorTotal: 205800, observacao: "Aguardando aprovação" },
            B4: { id: "B4", status: "disponivel", entrada: 6000, parcelas: 150, valorParcela: 550.00, valorTotal: 88500, observacao: "" },
            B5: { id: "B5", status: "bloqueado", entrada: 0, parcelas: 0, valorParcela: 0, valorTotal: 0, observacao: "Área institucional" },
            B6: { id: "B6", status: "disponivel", entrada: 7200, parcelas: 170, valorParcela: 620.00, valorTotal: 112600, observacao: "" },
            B7: { id: "B7", status: "vendido", entrada: 8500, parcelas: 190, valorParcela: 720.00, valorTotal: 145300, observacao: "Contrato assinado" },
            B8: { id: "B8", status: "disponivel", entrada: 6800, parcelas: 160, valorParcela: 590.00, valorTotal: 101200, observacao: "" },
            B9: { id: "B9", status: "reservado", entrada: 9500, parcelas: 220, valorParcela: 850.00, valorTotal: 196500, observacao: "Proposta aceita" },
            B10: { id: "B10", status: "disponivel", entrada: 7800, parcelas: 180, valorParcela: 670.00, valorTotal: 128400, observacao: "" }
        }
    }
};

// ===== VARIÁVEIS GLOBAIS =====
let currentLoteamento = 'loteamento1';
let selectedLote = null;
let panZoomInstance = null;
let userLocation = null;
let autoSaveTimer = null;

// ===== FIREBASE CONFIGURATION (PLACEHOLDER) =====
// FIREBASE CONFIG HERE - Descomente e configure para usar Firebase
/*
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Inicializar Firebase
// import { initializeApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore';
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

async function loadFromFirebase() {
    // Implementar carregamento do Firestore
    // const docRef = doc(db, 'loteamentos', currentLoteamento);
    // const docSnap = await getDoc(docRef);
    // if (docSnap.exists()) {
    //     return docSnap.data();
    // }
    return null;
}

async function saveToFirebase(data) {
    // Implementar salvamento no Firestore
    // const docRef = doc(db, 'loteamentos', currentLoteamento);
    // await setDoc(docRef, data);
}
*/

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    init();
});

function init() {
    console.log('Inicializando aplicação...');
    
    // Carregar dados salvos ou usar dados padrão
    loadData();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Carregar SVG e configurar interatividade
    loadSVG();
    
    // Atualizar interface
    updateStats();
    updateLoteamentoSelect();
    
    // Configurar auto-save
    setupAutoSave();
    
    console.log('Aplicação inicializada com sucesso!');
}

function setupEventListeners() {
    // Seletor de loteamento
    document.getElementById('loteamentoSelect').addEventListener('change', function(e) {
        currentLoteamento = e.target.value;
        updateStats();
        renderGridFromSVG();
        closeLotePanel();
    });
    
    // Botão localizar
    document.getElementById('localizarBtn').addEventListener('click', requestLocation);
    
    // Busca
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Painel de lote
    document.getElementById('closePanelBtn').addEventListener('click', closeLotePanel);
    document.getElementById('salvarBtn').addEventListener('click', saveLoteData);
    
    // Botões de status
    document.querySelectorAll('.btn-status').forEach(btn => {
        btn.addEventListener('click', function() {
            setStatusButton(this.dataset.status);
        });
    });
    
    // Campos de entrada e parcela para calcular total
    document.getElementById('entradaInput').addEventListener('input', calculateTotal);
    document.getElementById('parcelasInput').addEventListener('input', calculateTotal);
    document.getElementById('valorParcelaInput').addEventListener('input', calculateTotal);
    
    // Export/Import
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importInput').click();
    });
    document.getElementById('importInput').addEventListener('change', importData);
    
    // Fechar painel ao clicar fora
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.lote-panel') && !e.target.closest('.lote')) {
            closeLotePanel();
        }
    });
}

// ===== CARREGAMENTO E RENDERIZAÇÃO DO SVG =====
function loadSVG() {
    // Carregar o SVG sample.svg
    fetch('assets/sample.svg')
        .then(response => response.text())
        .then(svgContent => {
            document.getElementById('svgWrapper').innerHTML = svgContent;
            setupSVGInteractivity();
            renderGridFromSVG();
        })
        .catch(error => {
            console.error('Erro ao carregar SVG:', error);
            // Fallback: criar SVG básico se não conseguir carregar
            createFallbackSVG();
        });
}

function createFallbackSVG() {
    const svgContent = `
        <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
            <rect id="A1" x="50" y="50" width="100" height="80" class="lote" />
            <rect id="A2" x="170" y="50" width="100" height="80" class="lote" />
            <rect id="A3" x="290" y="50" width="100" height="80" class="lote" />
            <rect id="A4" x="410" y="50" width="100" height="80" class="lote" />
            <rect id="A5" x="50" y="150" width="100" height="80" class="lote" />
            <rect id="A6" x="170" y="150" width="100" height="80" class="lote" />
            <rect id="A7" x="290" y="150" width="100" height="80" class="lote" />
            <rect id="A8" x="410" y="150" width="100" height="80" class="lote" />
            <rect id="A9" x="50" y="250" width="100" height="80" class="lote" />
            <rect id="A10" x="170" y="250" width="100" height="80" class="lote" />
            <rect id="A11" x="290" y="250" width="100" height="80" class="lote" />
            <rect id="A12" x="410" y="250" width="100" height="80" class="lote" />
            
            <!-- Labels dos lotes -->
            <text x="100" y="95" text-anchor="middle" font-family="Arial" font-size="12" fill="#000">A1</text>
            <text x="220" y="95" text-anchor="middle" font-family="Arial" font-size="12" fill="#000">A2</text>
            <text x="340" y="95" text-anchor="middle" font-family="Arial" font-size="12" fill="#000">A3</text>
            <text x="460" y="95" text-anchor="middle" font-family="Arial" font-size="12" fill="#000">A4</text>
            <text x="100" y="195" text-anchor="middle" font-family="Arial" font-size="12" fill="#000">A5</text>
            <text x="220" y="195" text-anchor="middle" font-family="Arial" font-size="12" fill="#000">A6</text>
            <text x="340" y="195" text-anchor="middle" font-family="Arial" font-size="12" fill="#000">A7</text>
            <text x="460" y="195" text-anchor="middle" font-family="Arial" font-size="12" fill="#000">A8</text>
            <text x="100" y="295" text-anchor="middle" font-family="Arial" font-size="12" fill="#000">A9</text>
            <text x="220" y="295" text-anchor="middle" font-family="Arial" font-size="12" fill="#000">A10</text>
            <text x="340" y="295" text-anchor="middle" font-family="Arial" font-size="12" fill="#000">A11</text>
            <text x="460" y="295" text-anchor="middle" font-family="Arial" font-size="12" fill="#000">A12</text>
        </svg>
    `;
    
    document.getElementById('svgWrapper').innerHTML = svgContent;
    setupSVGInteractivity();
    renderGridFromSVG();
}

function setupSVGInteractivity() {
    const svg = document.querySelector('#svgWrapper svg');
    if (!svg) return;
    
    // Configurar pan e zoom
    panZoomInstance = svgPanZoom(svg, {
        zoomEnabled: true,
        controlIconsEnabled: false,
        fit: true,
        center: true,
        minZoom: 0.5,
        maxZoom: 10,
        zoomScaleSensitivity: 0.2,
        dblClickZoomEnabled: true,
        mouseWheelZoomEnabled: true,
        preventMouseEventsDefault: true,
        eventsListenerElement: svg,
        beforeZoom: function() {},
        onZoom: function() {},
        beforePan: function() {},
        onPan: function() {}
    });
    
    // Configurar cliques nos lotes
    setupLoteClickHandlers();
}

function setupLoteClickHandlers() {
    // IMPORTANTE: Aqui é onde você vincula os IDs do SVG aos dados dos lotes
    // Os elementos SVG devem ter IDs que correspondam aos IDs dos lotes nos dados
    // Exemplo: <rect id="A1" ...> corresponde ao lote com id "A1" nos dados
    
    const loteElements = document.querySelectorAll('.lote, [id^="A"], [id^="B"]');
    
    loteElements.forEach(element => {
        element.addEventListener('click', function(e) {
            e.stopPropagation();
            const loteId = this.id;
            selecionarLote(loteId);
        });
        
        // Adicionar classe lote se não tiver
        if (!element.classList.contains('lote')) {
            element.classList.add('lote');
        }
    });
}

function renderGridFromSVG() {
    // Atualizar cores dos lotes baseado no status atual
    const lotes = LOTEAMENTOS_DATA[currentLoteamento].lotes;
    
    Object.keys(lotes).forEach(loteId => {
        const element = document.getElementById(loteId);
        if (element) {
            const lote = lotes[loteId];
            
            // Remover classes de status anteriores
            element.classList.remove('disponivel', 'reservado', 'vendido', 'bloqueado', 'selected');
            
            // Adicionar classe do status atual
            element.classList.add(lote.status);
            
            // Se é o lote selecionado, adicionar classe selected
            if (selectedLote === loteId) {
                element.classList.add('selected');
            }
        }
    });
}

// ===== SELEÇÃO E MANIPULAÇÃO DE LOTES =====
function selecionarLote(loteId) {
    const lotes = LOTEAMENTOS_DATA[currentLoteamento].lotes;
    
    if (!lotes[loteId]) {
        console.warn(`Lote ${loteId} não encontrado no loteamento ${currentLoteamento}`);
        return;
    }
    
    // Se clicou no mesmo lote, fechar painel
    if (selectedLote === loteId) {
        closeLotePanel();
        return;
    }
    
    selectedLote = loteId;
    const lote = lotes[loteId];
    
    // Atualizar visual do SVG
    renderGridFromSVG();
    
    // Abrir painel com dados do lote
    openLotePanel(lote);
    
    console.log(`Lote selecionado: ${loteId}`, lote);
}

function openLotePanel(lote) {
    const panel = document.getElementById('lotePanel');
    
    // Preencher dados do lote
    document.getElementById('loteTitle').textContent = `Lote ${lote.id}`;
    document.getElementById('entradaInput').value = lote.entrada;
    document.getElementById('parcelasInput').value = lote.parcelas;
    document.getElementById('valorParcelaInput').value = lote.valorParcela;
    document.getElementById('observacaoInput').value = lote.observacao;
    
    // Atualizar valor total
    calculateTotal();
    
    // Marcar botão de status ativo
    setStatusButton(lote.status);
    
    // Mostrar painel
    panel.classList.remove('hidden');
}

function closeLotePanel() {
    selectedLote = null;
    document.getElementById('lotePanel').classList.add('hidden');
    renderGridFromSVG(); // Remover seleção visual
}

function setStatusButton(status) {
    // Remover classe active de todos os botões
    document.querySelectorAll('.btn-status').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Adicionar classe active ao botão selecionado
    document.querySelector(`[data-status="${status}"]`).classList.add('active');
}

function setStatus(loteId, status) {
    if (!LOTEAMENTOS_DATA[currentLoteamento].lotes[loteId]) return;
    
    LOTEAMENTOS_DATA[currentLoteamento].lotes[loteId].status = status;
    renderGridFromSVG();
    updateStats();
    saveData();
}

function calculateTotal() {
    const entrada = parseFloat(document.getElementById('entradaInput').value) || 0;
    const parcelas = parseInt(document.getElementById('parcelasInput').value) || 0;
    const valorParcela = parseFloat(document.getElementById('valorParcelaInput').value) || 0;
    
    const total = entrada + (parcelas * valorParcela);
    document.getElementById('valorTotalDisplay').textContent = formatCurrency(total);
}

function saveLoteData() {
    if (!selectedLote) return;
    
    const lote = LOTEAMENTOS_DATA[currentLoteamento].lotes[selectedLote];
    const activeStatusBtn = document.querySelector('.btn-status.active');
    
    // Atualizar dados do lote
    lote.entrada = parseFloat(document.getElementById('entradaInput').value) || 0;
    lote.parcelas = parseInt(document.getElementById('parcelasInput').value) || 0;
    lote.valorParcela = parseFloat(document.getElementById('valorParcelaInput').value) || 0;
    lote.valorTotal = lote.entrada + (lote.parcelas * lote.valorParcela);
    lote.observacao = document.getElementById('observacaoInput').value;
    
    if (activeStatusBtn) {
        lote.status = activeStatusBtn.dataset.status;
    }
    
    // Atualizar interface
    renderGridFromSVG();
    updateStats();
    saveData();
    
    // Feedback visual
    const btn = document.getElementById('salvarBtn');
    const originalText = btn.textContent;
    btn.textContent = '✅ Salvo!';
    btn.style.background = '#059669';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 2000);
    
    console.log(`Lote ${selectedLote} salvo com sucesso!`);
}

// ===== ESTATÍSTICAS =====
function updateStats() {
    const lotes = LOTEAMENTOS_DATA[currentLoteamento].lotes;
    const total = Object.keys(lotes).length;
    
    const stats = {
        disponivel: 0,
        reservado: 0,
        vendido: 0,
        bloqueado: 0
    };
    
    Object.values(lotes).forEach(lote => {
        stats[lote.status]++;
    });
    
    // Atualizar interface
    Object.keys(stats).forEach(status => {
        const count = stats[status];
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        document.getElementById(`stat${status.charAt(0).toUpperCase() + status.slice(1)}`).textContent = 
            `${count} (${percentage}%)`;
    });
}

function updateLoteamentoSelect() {
    const select = document.getElementById('loteamentoSelect');
    select.value = currentLoteamento;
}

// ===== BUSCA =====
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim().toUpperCase();
    if (!searchTerm) return;
    
    searchAndHighlight(searchTerm);
}

function searchAndHighlight(loteId) {
    const lotes = LOTEAMENTOS_DATA[currentLoteamento].lotes;
    
    if (lotes[loteId]) {
        selecionarLote(loteId);
        
        // Centralizar no lote encontrado
        const element = document.getElementById(loteId);
        if (element && panZoomInstance) {
            const bbox = element.getBBox();
            const centerX = bbox.x + bbox.width / 2;
            const centerY = bbox.y + bbox.height / 2;
            
            panZoomInstance.center();
            panZoomInstance.zoom(2);
        }
        
        // Limpar campo de busca
        document.getElementById('searchInput').value = '';
        
        console.log(`Lote ${loteId} encontrado e selecionado`);
    } else {
        alert(`Lote "${loteId}" não encontrado no ${LOTEAMENTOS_DATA[currentLoteamento].nome}`);
    }
}

// ===== GEOLOCALIZAÇÃO =====
function requestLocation() {
    if (!navigator.geolocation) {
        alert('Geolocalização não é suportada neste navegador');
        return;
    }
    
    const btn = document.getElementById('localizarBtn');
    btn.textContent = '📍 Localizando...';
    btn.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            userLocation = [position.coords.longitude, position.coords.latitude];
            console.log('Localização obtida:', userLocation);
            
            // Verificar proximidade com lotes
            autoOpenWhenNear();
            
            btn.textContent = '📍 Localizado!';
            setTimeout(() => {
                btn.textContent = '📍 Localizar';
                btn.disabled = false;
            }, 3000);
        },
        function(error) {
            console.error('Erro ao obter localização:', error);
            alert('Não foi possível obter sua localização. Verifique as permissões do navegador.');
            
            btn.textContent = '📍 Erro';
            setTimeout(() => {
                btn.textContent = '📍 Localizar';
                btn.disabled = false;
            }, 3000);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

function autoOpenWhenNear() {
    if (!userLocation || typeof turf === 'undefined') {
        console.warn('Localização do usuário ou biblioteca Turf não disponível');
        return;
    }
    
    const userPoint = turf.point(userLocation);
    const lotes = LOTEAMENTOS_DATA[currentLoteamento].lotes;
    
    // Para demonstração, vamos usar coordenadas fictícias próximas ao usuário
    // Em um projeto real, você teria as coordenadas reais de cada lote
    Object.keys(lotes).forEach((loteId, index) => {
        // Simular coordenadas próximas ao usuário (para demonstração)
        const loteCoords = [
            userLocation[0] + (Math.random() - 0.5) * 0.001, // longitude
            userLocation[1] + (Math.random() - 0.5) * 0.001  // latitude
        ];
        
        const lotePoint = turf.point(loteCoords);
        const distance = turf.distance(userPoint, lotePoint, { units: 'meters' });
        
        console.log(`Distância até lote ${loteId}: ${distance.toFixed(2)}m`);
        
        if (distance < CONFIG.proximityThreshold) {
            console.log(`Lote ${loteId} está próximo! Auto-abrindo...`);
            selecionarLote(loteId);
            return; // Abrir apenas o primeiro lote próximo
        }
    });
}

// ===== PERSISTÊNCIA DE DADOS =====
function saveData() {
    try {
        localStorage.setItem('loteamentos_data', JSON.stringify(LOTEAMENTOS_DATA));
        localStorage.setItem('current_loteamento', currentLoteamento);
        console.log('Dados salvos no localStorage');
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
    }
}

function loadData() {
    try {
        const savedData = localStorage.getItem('loteamentos_data');
        const savedLoteamento = localStorage.getItem('current_loteamento');
        
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            // Mesclar dados salvos com dados padrão (preservar novos lotes)
            Object.keys(LOTEAMENTOS_DATA).forEach(loteamentoId => {
                if (parsedData[loteamentoId]) {
                    Object.keys(LOTEAMENTOS_DATA[loteamentoId].lotes).forEach(loteId => {
                        if (parsedData[loteamentoId].lotes[loteId]) {
                            LOTEAMENTOS_DATA[loteamentoId].lotes[loteId] = parsedData[loteamentoId].lotes[loteId];
                        }
                    });
                }
            });
            console.log('Dados carregados do localStorage');
        }
        
        if (savedLoteamento && LOTEAMENTOS_DATA[savedLoteamento]) {
            currentLoteamento = savedLoteamento;
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

function setupAutoSave() {
    // Auto-save periódico
    autoSaveTimer = setInterval(saveData, CONFIG.autoSaveInterval);
    
    // Salvar antes de sair da página
    window.addEventListener('beforeunload', saveData);
}

// ===== EXPORT/IMPORT =====
function exportData() {
    const dataToExport = {
        loteamentos: LOTEAMENTOS_DATA,
        currentLoteamento: currentLoteamento,
        exportDate: new Date().toISOString(),
        version: "1.0"
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'loteamento-data.json';
    link.click();
    
    console.log('Dados exportados com sucesso');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (importedData.loteamentos) {
                // Confirmar importação
                if (confirm('Isso substituirá todos os dados atuais. Deseja continuar?')) {
                    Object.assign(LOTEAMENTOS_DATA, importedData.loteamentos);
                    
                    if (importedData.currentLoteamento) {
                        currentLoteamento = importedData.currentLoteamento;
                    }
                    
                    // Atualizar interface
                    updateStats();
                    updateLoteamentoSelect();
                    renderGridFromSVG();
                    closeLotePanel();
                    saveData();
                    
                    alert('Dados importados com sucesso!');
                    console.log('Dados importados:', importedData);
                }
            } else {
                alert('Arquivo inválido. Verifique se é um arquivo de exportação válido.');
            }
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            alert('Erro ao ler o arquivo. Verifique se é um arquivo JSON válido.');
        }
    };
    
    reader.readAsText(file);
    
    // Limpar input
    event.target.value = '';
}

// ===== UTILITÁRIOS =====
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

// ===== FUNÇÕES PRINCIPAIS EXPOSTAS GLOBALMENTE =====
window.loteamentosApp = {
    init,
    renderGridFromSVG,
    selecionarLote,
    setStatus,
    saveData,
    loadData,
    exportar: exportData,
    importar: importData,
    searchAndHighlight,
    autoOpenWhenNear,
    formatCurrency
};

console.log('Script carregado. Funções disponíveis em window.loteamentosApp');
