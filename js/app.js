// ═══════════════════════════════════════════
// USIPEL APP.JS — UX/UI Overhaul v3
// ═══════════════════════════════════════════

// ── SVG Icons for dynamic content ──
const ICON = {
    pencil: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>',
    pkg: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/></svg>',
    cal: '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>',
    editTd: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>',
};

// ── Theme ──
function toggleTheme() {
    const h = document.getElementById('htmlRoot');
    const isDark = h.classList.contains('dark-theme');
    h.classList.toggle('dark-theme', !isDark);
    h.classList.toggle('light-theme', isDark);
    const logoSrc = isDark ? "assets/logo_usipel_light_mode.png" : "assets/logo_usipel_dark_mode.png";
    document.getElementById('logoImg').src = logoSrc;
    document.getElementById('homeLogoImg').src = logoSrc;
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
}
function initTheme() { if (localStorage.getItem('theme') === 'light') toggleTheme(); }

// ── Navigation (Home vs App) ──
function openAppModule(moduleName) {
    if (moduleName === 'pedidos') {
        document.getElementById('viewHome').classList.remove('active');
        document.getElementById('appContent').style.display = 'flex';
        // Give a tiny delay for layout to settle before rendering icons if needed
        setTimeout(() => lucide.createIcons(), 50);
    }
}

function goHome() {
    document.getElementById('appContent').style.display = 'none';
    document.getElementById('viewHome').classList.add('active');
}

// ── View Toggle (Quadros/Tabela) ──
function switchView(v) {
    document.getElementById('btnKanban').classList.toggle('active', v==='kanban');
    document.getElementById('btnTable').classList.toggle('active', v==='table');
    document.getElementById('viewKanban').classList.toggle('active', v==='kanban');
    document.getElementById('viewTable').classList.toggle('active', v==='table');
}

// ── Sync UI Removed for Web App ──
function flashExcelBtn() {
    const btn = document.querySelector('[onclick="exportarCSV()"]');
    if (btn) {
        btn.classList.add('flash-success');
        setTimeout(() => btn.classList.remove('flash-success'), 1500);
    }
}

// ── Toast ──
function showToast(msg, type="success") {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerText = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3200);
}

// ── Data ──
let allPedidos = [];
let activeClientFilter = null;

async function loadPedidos(search="", statusFilter="Todos") {
    const showArchived = document.getElementById('toggleArchived')?.checked ? 1 : 0;
    
    let query = supabase.from('pedidos').select(`
        *,
        clientes:cliente_id (nome, telefone)
    `);
    
    if (!showArchived) {
        query = query.eq('arquivado', 0);
    }

    const { data: serverPedidos, error } = await query;
    
    if (error) {
        console.error("Erro ao carregar pedidos:", error);
        showToast("Erro de conexão", "error");
        return;
    }

    // Processamento e mapeamento
    allPedidos = serverPedidos.map(p => ({
        ...p,
        cliente_nome: p.clientes ? p.clientes.nome : 'Desconhecido',
        cliente_telefone: p.clientes ? p.clientes.telefone : ''
    }));

    // Filtros Locais
    if (search.trim()) {
        const s = search.toLowerCase();
        allPedidos = allPedidos.filter(p => 
            String(p.id).includes(s) || 
            (p.cliente_nome && p.cliente_nome.toLowerCase().includes(s)) ||
            (p.descricao_caixa && p.descricao_caixa.toLowerCase().includes(s))
        );
    }

    if (activeClientFilter) {
        allPedidos = allPedidos.filter(p => p.cliente_nome === activeClientFilter);
    }
    
    renderKanban(allPedidos);
    renderTable(allPedidos);
    updateTimestamps();
}
function filterPedidos() {
    activeClientFilter = null; // Reset client filter on manual search
    loadPedidos(document.getElementById("searchInput").value);
}

function filterByClient(nome) {
    activeClientFilter = nome;
    document.getElementById('searchInput').value = '';
    loadPedidos();
    showToast(`Filtrado: ${nome} (clique Pesquisar para limpar)`);
}

function stampNow() {
    const n = new Date();
    return n.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}) + ' ' + n.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
}
function updateTimestamps() { document.getElementById('excelTimestamp').innerText = stampNow(); }
function updateCloudTimestamp() { document.getElementById('cloudTimestamp').innerText = stampNow(); }

// ═══════════════════════════
// KANBAN DRAG & DROP
// ═══════════════════════════
let draggedCardId = null;
const STATUS_KEYS = ['novo_pedido', 'em_producao', 'pronto', 'saiu_entrega', 'entregue'];

function setupDragDrop() {
    STATUS_KEYS.forEach(status => {
        const content = document.getElementById(`col_${status}`);
        const column = document.getElementById(`colWrap_${status}`);

        const onOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; column.classList.add('drag-over');
            if (!content.querySelector('.drop-placeholder')) { const ph = document.createElement('div'); ph.className = 'drop-placeholder'; content.appendChild(ph); }
        };
        const onLeave = (e) => { if (!column.contains(e.relatedTarget)) { column.classList.remove('drag-over'); const ph = content.querySelector('.drop-placeholder'); if (ph) ph.remove(); } };
        const onDrop = async (e) => {
            e.preventDefault(); column.classList.remove('drag-over');
            const ph = content.querySelector('.drop-placeholder'); if (ph) ph.remove();
            if (draggedCardId !== null) {
                const numericId = parseInt(draggedCardId, 10);
                
                const { error } = await supabase.from('pedidos').update({ status: status }).eq('id', numericId);
                
                if (!error) {
                    showToast("Pedido movido com sucesso!");
                    draggedCardId = null; 
                    await loadPedidos(document.getElementById("searchInput").value);
                } else {
                    showToast("Erro ao mover", "error");
                }
            }
        };
        content.addEventListener('dragover', onOver);
        content.addEventListener('dragleave', onLeave);
        content.addEventListener('drop', onDrop);
        column.addEventListener('dragover', onOver);
        column.addEventListener('dragleave', onLeave);
        column.addEventListener('drop', onDrop);
    });
}

function renderKanban(pedidos) {
    const cols = {}, counts = {};
    STATUS_KEYS.forEach(k => { cols[k] = document.getElementById(`col_${k}`); cols[k].innerHTML = ""; counts[k] = 0; });

    [...pedidos].sort((a,b) => b.id - a.id).forEach(p => {
        if (!cols[p.status]) return;
        counts[p.status]++;
        let med = (p.medida_comprimento && p.medida_largura && p.medida_altura) ?
            `${p.medida_comprimento}×${p.medida_largura}×${p.medida_altura}cm` : '';

        const card = document.createElement("div");
        card.className = "card"; card.draggable = true; card.id = `card_${p.id}`;
        card.addEventListener('dragstart', (e) => { draggedCardId = p.id; card.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', p.id); });
        card.addEventListener('dragend', () => { card.classList.remove('dragging'); draggedCardId = null; document.querySelectorAll('.column').forEach(c => c.classList.remove('drag-over')); document.querySelectorAll('.drop-placeholder').forEach(ph => ph.remove()); });

        card.innerHTML = `
            <div class="card-header">
                <span class="card-id">UP-${String(p.id).padStart(5,'0')}</span>
                <div class="card-actions">
                    ${p.is_recorrente ? '<span title="Pedido Recorrente" style="color:var(--brand);margin-right:4px;cursor:help;">🔁</span>' : ''}
                    ${(p.status === 'pronto' || p.status === 'saiu_entrega') && p.cliente_telefone ? `<button class="card-edit-btn" title="Avisar via WhatsApp" onclick="event.stopPropagation(); avisarCliente(${p.id}, '${p.cliente_telefone}', '${String(p.id).padStart(5,'0')}')"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></button>` : ''}
                    <button class="card-edit-btn" title="Editar pedido">${ICON.pencil}</button>
                </div>
            </div>
            <div class="card-client">${p.cliente_nome}</div>
            ${p.descricao_caixa ? `<div class="card-desc">${p.descricao_caixa}</div>` : ''}
            <div class="card-badges">
                ${med ? `<span class="badge">${ICON.pkg} ${med}</span>` : ''}
                ${p.tipo_material ? `<span class="badge">${p.tipo_material}</span>` : ''}
                ${p.quantidade ? `<span class="badge">×${p.quantidade}</span>` : ''}
            </div>
            ${p.prazo_entrega ? `<div class="card-footer">${ICON.cal} ${p.prazo_entrega}</div>` : ''}
        `;
        card.querySelector('.card-edit-btn').addEventListener('click', (e) => { e.stopPropagation(); editOrder(p.id); });
        card.addEventListener('dblclick', () => editOrder(p.id));
        cols[p.status].appendChild(card);
    });
    STATUS_KEYS.forEach(k => document.getElementById(`count_${k}`).innerText = counts[k]);
}

// ═══════════════════════════
// TABLE
// ═══════════════════════════
let sortCol = -1, sortAsc = true;
function sortTable(idx) {
    sortCol = (sortCol === idx) ? (sortAsc = !sortAsc, idx) : (sortAsc = true, idx);
    allPedidos.sort((a,b) => {
        let va, vb;
        if (idx===0) { va=a.id; vb=b.id; }
        else if (idx===1) { va=(a.cliente_nome||'').toLowerCase(); vb=(b.cliente_nome||'').toLowerCase(); }
        else if (idx===5) { const o={"novo_pedido":0,"em_producao":1,"pronto":2,"saiu_entrega":3,"entregue":4}; va=o[a.status]??9; vb=o[b.status]??9; }
        else if (idx===6) { va=a.prazo_entrega||''; vb=b.prazo_entrega||''; }
        return va<vb?(sortAsc?-1:1):va>vb?(sortAsc?1:-1):0;
    });
    renderTable(allPedidos);
}

const STATUS_MAP = {
    "novo_pedido": { text: "Novo", cls: "status-novo" },
    "em_producao": { text: "Em Produção", cls: "status-em-producao" },
    "pronto": { text: "Pronto", cls: "status-pronto" },
    "saiu_entrega": { text: "Saiu p/ Entrega", cls: "status-saiu" },
    "entregue": { text: "Entregue", cls: "status-entregue" }
};

function renderTable(pedidos) {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";
    pedidos.forEach(p => {
        const tr = document.createElement("tr");
        const s = STATUS_MAP[p.status] || { text: p.status, cls: "" };
        let med = (p.medida_comprimento && p.medida_largura && p.medida_altura) ?
            `${p.medida_comprimento}×${p.medida_largura}×${p.medida_altura}` : '—';

        tr.innerHTML = `
            <td class="td-id">UP-${String(p.id).padStart(5,'0')} ${p.is_recorrente ? '<span title="Pedido Recorrente">🔁</span>' : ''}</td>
            <td class="td-client">${p.cliente_nome}</td>
            <td>${p.descricao_caixa||'—'}</td>
            <td class="td-right">${med}</td>
            <td>${p.tipo_material||'—'}</td>
            <td class="status-cell"><span class="status-indicator ${s.cls}">${s.text}</span></td>
            <td class="td-right">${p.prazo_entrega||'—'}</td>
            <td class="td-edit"><button class="btn btn-ghost">${ICON.editTd}</button></td>
        `;
        tr.querySelector('.status-cell').addEventListener('click', (e) => { e.stopPropagation(); openStatusPopover(e, p.id); });
        tr.querySelector('.td-edit .btn').addEventListener('click', (e) => { e.stopPropagation(); editOrder(p.id); });
        tr.querySelector('.td-client').addEventListener('click', () => filterByClient(p.cliente_nome));
        tr.querySelector('.td-client').style.cursor = 'pointer';
        tr.querySelector('.td-client').title = 'Clique para filtrar';
        tr.addEventListener('dblclick', () => editOrder(p.id));
        tbody.appendChild(tr);
    });
}

// ── Status Popover ──
let activePopoverId = null;
function openStatusPopover(ev, id) {
    const pop = document.getElementById('statusPopover');
    activePopoverId = id;
    const r = ev.currentTarget.getBoundingClientRect();
    pop.style.top = (r.bottom + 4) + 'px';
    pop.style.left = r.left + 'px';
    pop.classList.add('visible');
}
function closeStatusPopover() { document.getElementById('statusPopover').classList.remove('visible'); activePopoverId = null; }
function setupStatusPopover() {
    document.querySelectorAll('.sp-option').forEach(opt => {
        opt.addEventListener('click', async () => {
            if (activePopoverId !== null) {
                const { error } = await supabase.from('pedidos').update({ status: opt.dataset.val }).eq('id', activePopoverId);
                if (!error) {
                    closeStatusPopover();
                    await loadPedidos(document.getElementById("searchInput").value);
                    showToast("Status atualizado!");
                } else {
                    showToast("Erro ao atualizar", "error");
                }
            }
        });
    });
    // Use capture phase listener to ensure it fires even if children stop propagation
    document.addEventListener('click', (e) => {
        const pop = document.getElementById('statusPopover');
        if (pop && pop.classList.contains('visible')) {
            if (!pop.contains(e.target) && !e.target.closest('.status-cell')) {
                closeStatusPopover();
            }
        }
    }, true);
}

// ═══════════════════════════
// FILE UPLOAD (Arte Final)
// ═══════════════════════════
let uploadedFile = null;

function setupUploadZone() {
    const zone = document.getElementById('uploadZone');
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-active'); });
    zone.addEventListener('dragleave', () => { zone.classList.remove('drag-active'); });
    zone.addEventListener('drop', (e) => {
        e.preventDefault(); zone.classList.remove('drag-active');
        if (e.dataTransfer.files.length) processFile(e.dataTransfer.files[0]);
    });
}

function handleFileUpload(e) { if (e.target.files.length) processFile(e.target.files[0]); }

function processFile(file) {
    uploadedFile = file;
    const placeholder = document.getElementById('uploadPlaceholder');
    const preview = document.getElementById('uploadPreview');
    const thumb = document.getElementById('uploadThumb');
    const fname = document.getElementById('uploadFilename');

    fname.innerText = file.name;
    // If image, show thumbnail. Otherwise show generic icon
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => { thumb.src = e.target.result; };
        reader.readAsDataURL(file);
    } else {
        // Non-image file icon
        thumb.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%23888" stroke-width="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>');
    }
    placeholder.style.display = 'none';
    preview.style.display = 'flex';
    lucide.createIcons({ nodes: preview.querySelectorAll('[data-lucide]') });
}

function removeUpload() {
    uploadedFile = null;
    document.getElementById('arteFinalInput').value = '';
    document.getElementById('uploadPlaceholder').style.display = 'flex';
    document.getElementById('uploadPreview').style.display = 'none';
}

// ═══════════════════════════
// MODAL
// ═══════════════════════════
function toggleCustomInput(selId, inpId) {
    const s = document.getElementById(selId);
    const i = document.getElementById(inpId);
    if (s.value === "Outro") { i.style.display = "block"; i.focus(); }
    else { i.style.display = "none"; i.value = ""; }
}

function openOrderModal() {
    ['pedido_id','cliente_nome','cliente_telefone','descricao_caixa','comp','larg','alt','qtd','prazo','obs','material'].forEach(
        id => document.getElementById(id).value = ''
    );
    document.getElementById('descricao_caixa_select').value = '';
    document.getElementById('material_select').value = '';
    document.getElementById('descricao_caixa').style.display = 'none';
    document.getElementById('material').style.display = 'none';
    removeUpload();
    document.getElementById('modalTitle').innerText = "Novo Pedido de Embalagem";
    document.getElementById('statusGroup').style.display = 'none';
    document.getElementById('btnDeleteOrder').style.display = 'none'; // OCULTA EXCLUIR
    document.getElementById('is_recorrente').checked = false;
    document.getElementById('freq_container').style.display = 'none';
    document.getElementById('frequencia_select').value = 'Mensal';
    document.getElementById('orderModal').classList.add('show');
    lucide.createIcons();
}

function parseDateBR(d) { if (!d||d.indexOf('/')===-1) return ''; const p=d.split('/'); return p.length===3?`${p[2]}-${p[1]}-${p[0]}`:''; }
function formatDateBR(d) { return [String(d.getDate()).padStart(2,'0'), String(d.getMonth()+1).padStart(2,'0'), d.getFullYear()].join('/'); }

async function editOrder(id) {
    const { data: p, error } = await supabase.from('pedidos').select('*, clientes(nome, telefone)').eq('id', id).single();
    if (error || !p) return;
    
    p.cliente_nome = p.clientes ? p.clientes.nome : '';
    p.cliente_telefone = p.clientes ? p.clientes.telefone : '';

    document.getElementById('pedido_id').value = p.id;
    document.getElementById('cliente_nome').value = p.cliente_nome || '';
    document.getElementById('cliente_telefone').value = p.cliente_telefone || '';
    document.getElementById('comp').value = p.medida_comprimento || '';
    document.getElementById('larg').value = p.medida_largura || '';
    document.getElementById('alt').value = p.medida_altura || '';
    document.getElementById('qtd').value = p.quantidade || '';
    document.getElementById('obs').value = p.observacoes || '';
    document.getElementById('status_dropdown').value = p.status;
    document.getElementById('prazo').value = parseDateBR(p.prazo_entrega);

    // Handle logo/arte - if has logomarca, show as "existing"
    removeUpload();
    if (p.tem_logomarca) {
        document.getElementById('uploadPlaceholder').style.display = 'none';
        document.getElementById('uploadPreview').style.display = 'flex';
        document.getElementById('uploadThumb').src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%2322C55E" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>');
        document.getElementById('uploadFilename').innerText = 'Arte final incluída';
    }

    const bSel = document.getElementById('descricao_caixa_select');
    const bOpts = Array.from(bSel.options).map(o => o.value);
    if (bOpts.includes(p.descricao_caixa) && p.descricao_caixa !== 'Outro') {
        bSel.value = p.descricao_caixa;
        document.getElementById('descricao_caixa').style.display = 'none';
    } else {
        bSel.value = 'Outro';
        document.getElementById('descricao_caixa').style.display = 'block';
        document.getElementById('descricao_caixa').value = p.descricao_caixa || '';
    }
    const mSel = document.getElementById('material_select');
    const mOpts = Array.from(mSel.options).map(o => o.value);
    if (mOpts.includes(p.tipo_material) && p.tipo_material !== 'Outro') {
        mSel.value = p.tipo_material;
        document.getElementById('material').style.display = 'none';
    } else {
        mSel.value = 'Outro';
        document.getElementById('material').style.display = 'block';
        document.getElementById('material').value = p.tipo_material || '';
    }

    document.getElementById('is_recorrente').checked = p.is_recorrente === 1;
    document.getElementById('frequencia_select').value = p.frequencia || 'Mensal';
    document.getElementById('freq_container').style.display = p.is_recorrente === 1 ? 'block' : 'none';

    document.getElementById('modalTitle').innerText = `Editar Pedido UP-${String(p.id).padStart(5,'0')}`;
    document.getElementById('statusGroup').style.display = 'flex';
    document.getElementById('btnDeleteOrder').style.display = 'flex'; // MOSTRA EXCLUIR
    document.getElementById('orderModal').classList.add('show');
    lucide.createIcons();
}

function closeOrderModal() { document.getElementById('orderModal').classList.remove('show'); }

async function deleteOrder() {
    const pid = document.getElementById('pedido_id').value;
    if (!pid) return;
    if (confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE o pedido UP-${String(pid).padStart(5,'0')}?\nEsta ação não pode ser desfeita.`)) {
        const { error } = await supabase.from('pedidos').delete().eq('id', pid);
        if (!error) {
            closeOrderModal();
            await loadPedidos(document.getElementById("searchInput").value);
            showToast("Pedido apagado com sucesso!", "success");
        } else {
            showToast("Falha ao apagar pedido. Tente novamente.", "error");
        }
    }
}

async function saveOrder() {
    const btn = document.getElementById('btnSave');
    const label = document.getElementById('saveLabel');
    const spinner = document.getElementById('saveSpinner');

    const bSel = document.getElementById('descricao_caixa_select').value;
    const desc = bSel === 'Outro' ? document.getElementById('descricao_caixa').value : bSel;
    const mSel = document.getElementById('material_select').value;
    const mat = mSel === 'Outro' ? document.getElementById('material').value : mSel;
    const raw = document.getElementById('prazo').value;
    let prazo = '';
    if (raw) { const d = new Date(raw+'T12:00:00'); prazo = formatDateBR(d); }

    const hasLogo = uploadedFile !== null || document.getElementById('uploadPreview').style.display === 'flex';
    const is_rec = document.getElementById('is_recorrente').checked ? 1 : 0;
    const freq = document.getElementById('frequencia_select').value;

    const cNome = document.getElementById('cliente_nome').value.trim();
    if (!cNome || !desc || !document.getElementById('qtd').value) {
        showToast("Preencha: Cliente, Tipo de Caixa e Quantidade", "error");
        return;
    }

    // Loading state
    btn.disabled = true;
    label.innerText = 'Salvando...';
    spinner.style.display = 'inline-block';

    try {
        // Find or create Cliente
        let clienteId = null;
        let { data: clients, error: cErr } = await supabase.from('clientes').select('id, nome, telefone').ilike('nome', cNome).limit(1);
        
        if (clients && clients.length > 0) {
            clienteId = clients[0].id;
            // UPDATE phone if empty
            if (document.getElementById('cliente_telefone').value) {
                await supabase.from('clientes').update({telefone: document.getElementById('cliente_telefone').value}).eq('id', clienteId);
            }
        } else {
            // Create
            let { data: newC, error: iErr } = await supabase.from('clientes').insert({
                nome: cNome,
                telefone: document.getElementById('cliente_telefone').value
            }).select();
            if (newC && newC.length > 0) clienteId = newC[0].id;
            if (iErr) throw iErr;
        }

        const pData = {
            cliente_id: clienteId,
            descricao_caixa: desc, 
            medida_comprimento: document.getElementById('comp').value,
            medida_largura: document.getElementById('larg').value, 
            medida_altura: document.getElementById('alt').value,
            quantidade: document.getElementById('qtd').value, 
            tipo_material: mat,
            tem_logomarca: hasLogo, 
            prazo_entrega: prazo,
            status: document.getElementById('status_dropdown').value,
            observacoes: document.getElementById('obs').value,
            is_recorrente: is_rec, 
            frequencia: freq
        };
        
        const existingId = document.getElementById('pedido_id').value;
        let pErr = null;
        if (existingId) {
            const { error } = await supabase.from('pedidos').update(pData).eq('id', existingId);
            pErr = error;
        } else {
            const { error } = await supabase.from('pedidos').insert([pData]);
            pErr = error;
        }

        if (!pErr) {
            closeOrderModal();
            await loadPedidos();
            showToast("Pedido salvo com sucesso!");
        } else {
            showToast("Erro ao salvar: " + pErr.message, "error");
        }
    } catch (e) {
        showToast("Erro inesperado: " + e.message, "error");
    } finally {
        btn.disabled = false;
        label.innerText = 'Salvar Pedido';
        spinner.style.display = 'none';
    }
}

// ── TopBar Actions ──
async function exportarCSV() {
    if (allPedidos.length === 0) return;
    
    // Simple CSV Export since we don't have python to write Excel 
    const hdrs = ["ID","Cliente","Caixa","Medidas","Qtd","Material","Logo","Prazo","Status","Obs"];
    const rows = allPedidos.map(p => [
        p.id, `"${p.cliente_nome||''}"`, `"${p.descricao_caixa||''}"`,
        `${p.medida_comprimento}x${p.medida_largura}x${p.medida_altura}`,
        p.quantidade, `"${p.tipo_material||''}"`, p.tem_logomarca ? "Sim" : "Nao",
        p.prazo_entrega, p.status, `"${p.observacoes||''}"`
    ]);
    
    let csv = hdrs.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Pedidos_Usipel_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}

// ═══════════════════════════
// WHATSAPP & ARCHIVE
// ═══════════════════════════
function avisarCliente(pedidoId, telefone, pedidoCode) {
    const tel = telefone.replace(/\D/g, '');
    const msg = encodeURIComponent(`Olá! Informamos que seu pedido UP-${pedidoCode} da *USIPEL Embalagens* está pronto. Qualquer dúvida, estamos à disposição!`);
    window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank');
}

async function arquivarPedido(id) {
    if (!confirm(`Arquivar pedido UP-${String(id).padStart(5,'0')}? Ele ficará oculto por padrão.`)) return;
    const { error } = await supabase.from('pedidos').update({arquivado: 1}).eq('id', id);
    if (!error) {
        await loadPedidos(document.getElementById("searchInput").value);
        showToast("Pedido arquivado!", "success");
    } else {
        showToast("Falha ao arquivar", "error");
    }
}

// ═══════════════════════════
// INIT
// ═══════════════════════════
window.onload = () => {
    initTheme();
    setupDragDrop();
    setupStatusPopover();
    setupUploadZone();
    loadPedidos();
    lucide.createIcons();
};
