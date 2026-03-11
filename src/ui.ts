export function renderHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LLM Prices</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0f1117;
    --surface: #1a1d27;
    --surface2: #242733;
    --border: #2e3140;
    --text: #e4e4e7;
    --text-muted: #8b8d98;
    --accent: #6366f1;
    --accent-hover: #818cf8;
    --green: #22c55e;
    --red: #ef4444;
    --yellow: #eab308;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.5;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;
  }

  header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  header h1 span { color: var(--accent); }

  .meta {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .controls {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }

  input, select {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.15s;
  }

  input:focus, select:focus {
    border-color: var(--accent);
  }

  input::placeholder { color: var(--text-muted); }

  .search-input { flex: 1; min-width: 200px; }

  select { min-width: 140px; cursor: pointer; }

  .pill-bar {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .pill {
    padding: 4px 10px;
    border-radius: 99px;
    font-size: 0.75rem;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s;
    user-select: none;
  }

  .pill:hover { border-color: var(--accent); color: var(--text); }
  .pill.active { background: var(--accent); border-color: var(--accent); color: white; }

  .stats {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .stats strong { color: var(--text); }

  .table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--surface);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.82rem;
    white-space: nowrap;
  }

  th, td {
    padding: 10px 14px;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }

  th {
    background: var(--surface2);
    color: var(--text-muted);
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    cursor: pointer;
    user-select: none;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  th:hover { color: var(--text); }
  th .sort-arrow { margin-left: 4px; opacity: 0.5; }
  th.sorted .sort-arrow { opacity: 1; color: var(--accent); }

  tr:hover td { background: var(--surface2); }
  tr:last-child td { border-bottom: none; }

  td.model-name {
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
  }

  .cost { font-variant-numeric: tabular-nums; }

  .cost-input { color: var(--green); }
  .cost-output { color: var(--yellow); }

  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
    background: var(--surface2);
    color: var(--text-muted);
    margin-right: 2px;
  }

  .badge.vision { background: #1e3a5f; color: #60a5fa; }
  .badge.tools { background: #1a3330; color: #34d399; }
  .badge.reasoning { background: #3b1f4a; color: #c084fc; }
  .badge.caching { background: #3d2f0d; color: #fbbf24; }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
  }

  .pagination button {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 6px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.82rem;
    transition: all 0.15s;
  }

  .pagination button:hover:not(:disabled) {
    border-color: var(--accent);
  }

  .pagination button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .api-link {
    display: inline-block;
    margin-top: 20px;
    padding: 8px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--accent);
    text-decoration: none;
    font-size: 0.82rem;
    transition: border-color 0.15s;
  }

  .api-link:hover { border-color: var(--accent); }

  .loading {
    text-align: center;
    padding: 60px;
    color: var(--text-muted);
  }

  .footer {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    font-size: 0.75rem;
    color: var(--text-muted);
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }

  .footer a { color: var(--accent); text-decoration: none; }
  .footer a:hover { text-decoration: underline; }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1><span>⚡</span> LLM Prices</h1>
    <div class="meta" id="meta">Loading...</div>
  </header>

  <div class="controls">
    <input type="text" class="search-input" id="search" placeholder="Search models (e.g. gpt-4, claude, gemini)..." />
    <select id="provider"><option value="">All Providers</option></select>
    <select id="mode"><option value="">All Modes</option></select>
  </div>

  <div class="pill-bar" id="capabilities"></div>

  <div class="stats" id="stats"></div>

  <div class="table-wrap">
    <table>
      <thead id="thead"></thead>
      <tbody id="tbody"></tbody>
    </table>
  </div>

  <div class="pagination" id="pagination"></div>

  <div class="footer">
    <span>Data from <a href="https://github.com/BerriAI/litellm" target="_blank">litellm</a> · Refreshed every 6 hours</span>
    <span>
      <a href="/openapi.json" target="_blank">OpenAPI Spec</a> ·
      <a href="/api/models" target="_blank">API</a>
    </span>
  </div>
</div>

<script>
const API = '/api';
const PAGE_SIZE = 50;
let allModels = [];
let filteredModels = [];
let currentPage = 0;
let sortCol = 'input_cost_per_token';
let sortDir = 'asc';
let activeCapabilities = new Set();

const COLUMNS = [
  { key: 'key', label: 'Model', cls: 'model-name' },
  { key: 'litellm_provider', label: 'Provider' },
  { key: 'mode', label: 'Mode' },
  { key: 'input_cost_per_token', label: 'Input $/1M', cls: 'cost cost-input', format: costPerMillion },
  { key: 'output_cost_per_token', label: 'Output $/1M', cls: 'cost cost-output', format: costPerMillion },
  { key: 'max_input_tokens', label: 'Context', format: formatTokens },
  { key: 'max_output_tokens', label: 'Max Output', format: formatTokens },
  { key: '_capabilities', label: 'Capabilities', sortable: false },
];

const CAPABILITIES = [
  { key: 'supports_function_calling', label: 'Tools', cls: 'tools' },
  { key: 'supports_vision', label: 'Vision', cls: 'vision' },
  { key: 'supports_reasoning', label: 'Reasoning', cls: 'reasoning' },
  { key: 'supports_prompt_caching', label: 'Caching', cls: 'caching' },
];

function costPerMillion(v) {
  if (v == null || v === undefined) return '—';
  const m = v * 1_000_000;
  if (m < 0.01) return '$' + m.toFixed(4);
  if (m < 1) return '$' + m.toFixed(3);
  return '$' + m.toFixed(2);
}

function formatTokens(v) {
  if (!v) return '—';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
  return v.toString();
}

async function init() {
  const [modelsResp, providersResp, modesResp, metaResp] = await Promise.all([
    fetch(API + '/models?limit=10000').then(r => r.json()),
    fetch(API + '/providers').then(r => r.json()),
    fetch(API + '/modes').then(r => r.json()),
    fetch(API + '/meta').then(r => r.json()),
  ]);

  allModels = modelsResp.data || [];

  // Populate providers
  const provSelect = document.getElementById('provider');
  for (const p of providersResp.providers || []) {
    const opt = document.createElement('option');
    opt.value = p; opt.textContent = p;
    provSelect.appendChild(opt);
  }

  // Populate modes
  const modeSelect = document.getElementById('mode');
  for (const m of modesResp.modes || []) {
    const opt = document.createElement('option');
    opt.value = m; opt.textContent = m;
    modeSelect.appendChild(opt);
  }

  // Meta
  if (metaResp.updated_at) {
    document.getElementById('meta').textContent =
      'Updated: ' + new Date(metaResp.updated_at).toLocaleString();
  }

  // Capability pills
  const pillBar = document.getElementById('capabilities');
  for (const cap of CAPABILITIES) {
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = cap.label;
    pill.dataset.key = cap.key;
    pill.addEventListener('click', () => {
      pill.classList.toggle('active');
      if (activeCapabilities.has(cap.key)) activeCapabilities.delete(cap.key);
      else activeCapabilities.add(cap.key);
      applyFilters();
    });
    pillBar.appendChild(pill);
  }

  renderHeader();
  applyFilters();

  document.getElementById('search').addEventListener('input', debounce(applyFilters, 200));
  document.getElementById('provider').addEventListener('change', applyFilters);
  document.getElementById('mode').addEventListener('change', applyFilters);
}

function applyFilters() {
  const q = document.getElementById('search').value.toLowerCase();
  const provider = document.getElementById('provider').value;
  const mode = document.getElementById('mode').value;

  filteredModels = allModels.filter(m => {
    if (q && !m.key.toLowerCase().includes(q) && !(m.litellm_provider || '').toLowerCase().includes(q)) return false;
    if (provider && m.litellm_provider !== provider) return false;
    if (mode && m.mode !== mode) return false;
    for (const cap of activeCapabilities) {
      if (!m[cap]) return false;
    }
    return true;
  });

  // Sort
  filteredModels.sort((a, b) => {
    const va = a[sortCol];
    const vb = b[sortCol];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  currentPage = 0;
  renderStats();
  renderBody();
  renderPagination();
}

function renderHeader() {
  const thead = document.getElementById('thead');
  const tr = document.createElement('tr');
  for (const col of COLUMNS) {
    const th = document.createElement('th');
    th.textContent = col.label;
    if (col.sortable !== false) {
      const arrow = document.createElement('span');
      arrow.className = 'sort-arrow';
      arrow.textContent = sortCol === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕';
      th.appendChild(arrow);
      if (sortCol === col.key) th.classList.add('sorted');
      th.addEventListener('click', () => {
        if (sortCol === col.key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortCol = col.key; sortDir = 'asc'; }
        renderHeader();
        applyFilters();
      });
    }
    tr.appendChild(th);
  }
  thead.innerHTML = '';
  thead.appendChild(tr);
}

function renderStats() {
  document.getElementById('stats').innerHTML =
    '<span>Showing <strong>' + filteredModels.length + '</strong> of <strong>' + allModels.length + '</strong> models</span>';
}

function renderBody() {
  const tbody = document.getElementById('tbody');
  const start = currentPage * PAGE_SIZE;
  const page = filteredModels.slice(start, start + PAGE_SIZE);

  tbody.innerHTML = '';
  if (page.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = COLUMNS.length;
    td.style.textAlign = 'center';
    td.style.padding = '40px';
    td.style.color = 'var(--text-muted)';
    td.textContent = 'No models match your filters';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  for (const model of page) {
    const tr = document.createElement('tr');
    for (const col of COLUMNS) {
      const td = document.createElement('td');
      if (col.cls) td.className = col.cls;

      if (col.key === '_capabilities') {
        let html = '';
        for (const cap of CAPABILITIES) {
          if (model[cap.key]) html += '<span class="badge ' + cap.cls + '">' + cap.label + '</span>';
        }
        td.innerHTML = html;
      } else if (col.format) {
        td.textContent = col.format(model[col.key]);
      } else {
        td.textContent = model[col.key] ?? '—';
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

function renderPagination() {
  const totalPages = Math.ceil(filteredModels.length / PAGE_SIZE);
  const el = document.getElementById('pagination');
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  el.innerHTML = '';
  const prev = document.createElement('button');
  prev.textContent = '← Prev';
  prev.disabled = currentPage === 0;
  prev.addEventListener('click', () => { currentPage--; renderBody(); renderPagination(); });

  const info = document.createElement('span');
  info.style.color = 'var(--text-muted)';
  info.style.fontSize = '0.82rem';
  info.textContent = 'Page ' + (currentPage + 1) + ' of ' + totalPages;

  const next = document.createElement('button');
  next.textContent = 'Next →';
  next.disabled = currentPage >= totalPages - 1;
  next.addEventListener('click', () => { currentPage++; renderBody(); renderPagination(); });

  el.appendChild(prev);
  el.appendChild(info);
  el.appendChild(next);
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

init();
</script>
</body>
</html>`;
}
