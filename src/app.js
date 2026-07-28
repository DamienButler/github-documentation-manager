/* GitHub Documentation Manager — dependency-free, data persisted in localStorage. */
(function () {
  'use strict';

  const STORAGE_KEY = 'gh-doc-manager.v1';
  const NEW_VALUE = '__new__';

  /** Tauri globals — undefined when the page is opened in a plain browser. */
  const TAURI = window.__TAURI__;
  const isDesktop = !!TAURI;
  const invoke = isDesktop ? TAURI.core.invoke : null;
  const dialog = isDesktop ? TAURI.dialog : null;
  const opener = isDesktop ? TAURI.opener : null;

  /** @typedef {{id:string,title:string,url:string,category:string,subcategory:string,tags:string[],notes:string,created:string}} Doc */

  /** @type {{docs: Doc[], categories: Record<string,string[]>}} */
  let state = loadLocal();
  let selectedId = null;

  // ---------- Persistence ----------
  function loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { console.warn('Could not read stored data', e); }
    return seed();
  }

  /** In the desktop app the JSON file on disk is the source of truth. */
  async function loadFromDisk() {
    if (!isDesktop) return;
    try {
      const data = await invoke('load_library');
      if (data && Array.isArray(data.docs)) {
        state = data;
      } else {
        await invoke('save_library', { data: state }); // first run: seed the file
      }
    } catch (e) {
      console.error('Could not load library file', e);
    }
    fillCategorySelect();
    renderTree();
    renderDetail();
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (isDesktop) invoke('save_library', { data: state }).catch((e) => console.error('Save failed', e));
  }

  function seed() {
    return {
      categories: {
        'GitHub Actions': ['Workflow syntax', 'Reusable workflows'],
        'REST API': ['Repositories', 'Pull requests'],
        Git: ['Basics']
      },
      docs: [
        mkDoc('Workflow syntax for GitHub Actions', 'https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions', 'GitHub Actions', 'Workflow syntax', ['yaml', 'ci'], 'Full reference for on/jobs/steps keys.'),
        mkDoc('Reusing workflows', 'https://docs.github.com/actions/using-workflows/reusing-workflows', 'GitHub Actions', 'Reusable workflows', ['dry'], ''),
        mkDoc('REST API — Repositories', 'https://docs.github.com/rest/repos/repos', 'REST API', 'Repositories', ['api'], ''),
        mkDoc('Git cheat sheet', 'https://training.github.com/downloads/github-git-cheat-sheet/', 'Git', 'Basics', ['cheatsheet'], '')
      ]
    };
  }

  function mkDoc(title, url, category, subcategory, tags, notes) {
    return { id: uid(), title, url, category, subcategory, tags: tags || [], notes: notes || '', created: new Date().toISOString() };
  }

  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

  // ---------- DOM refs ----------
  const $ = (sel) => document.querySelector(sel);
  const tree = $('#tree');
  const detail = $('#detail');
  const search = $('#search');
  const addForm = $('#add-form');
  const catSelect = $('#category-select');
  const subSelect = $('#subcategory-select');
  const newCatWrap = $('#new-category-wrap');
  const newSubWrap = $('#new-subcategory-wrap');
  const newCat = $('#new-category');
  const newSub = $('#new-subcategory');
  const formMsg = $('#form-msg');

  // ---------- Tabs ----------
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.tab-panel').forEach((p) =>
        p.classList.toggle('active', p.dataset.panel === tab.dataset.tab));
    });
  });

  // ---------- Tree ----------
  function matches(doc, q) {
    if (!q) return true;
    const hay = [doc.title, doc.url, doc.category, doc.subcategory, doc.notes, doc.tags.join(' ')]
      .join(' ').toLowerCase();
    return q.split(/\s+/).filter(Boolean).every((term) => hay.includes(term));
  }

  /**
   * Nodes the user has explicitly collapsed, keyed by "cat" or "cat/sub".
   * Everything is expanded by default; we only remember the exceptions, so new
   * categories and sub categories always appear open.
   */
  const collapsed = new Set(JSON.parse(localStorage.getItem('gh-doc-manager.collapsed') || '[]'));

  function rememberCollapsed() {
    localStorage.setItem('gh-doc-manager.collapsed', JSON.stringify([...collapsed]));
  }

  function isOpen(key, searching) {
    // While searching, always reveal every match.
    return searching ? true : !collapsed.has(key);
  }

  function renderTree() {
    const q = search.value.trim().toLowerCase();
    const searching = q.length > 0;
    const visible = state.docs.filter((d) => matches(d, q));
    tree.innerHTML = '';

    const categories = Object.keys(state.categories).sort((a, b) => a.localeCompare(b));
    let rendered = 0;

    categories.forEach((cat) => {
      const catDocs = visible.filter((d) => d.category === cat);
      const subs = [...new Set([...(state.categories[cat] || []), ...catDocs.map((d) => d.subcategory)])]
        .sort((a, b) => a.localeCompare(b));
      if (searching && catDocs.length === 0) return;

      const catEl = document.createElement('details');
      catEl.className = 'cat';
      catEl.open = isOpen(cat, searching);
      catEl.innerHTML = `<summary><span class="chevron">▶</span><span>${esc(cat)}</span><span class="count">${catDocs.length}</span></summary>`;
      catEl.addEventListener('toggle', () => {
        if (search.value.trim()) return; // don't record state driven by a search
        catEl.open ? collapsed.delete(cat) : collapsed.add(cat);
        rememberCollapsed();
      });

      subs.forEach((sub) => {
        const docs = catDocs.filter((d) => d.subcategory === sub);
        if (searching && docs.length === 0) return;

        const key = cat + '/' + sub;
        const subEl = document.createElement('details');
        subEl.className = 'sub';
        subEl.open = isOpen(key, searching);
        subEl.innerHTML = `<summary><span class="chevron">▶</span><span>${esc(sub)}</span><span class="count">${docs.length}</span></summary>`;
        subEl.addEventListener('toggle', () => {
          if (search.value.trim()) return;
          subEl.open ? collapsed.delete(key) : collapsed.add(key);
          rememberCollapsed();
        });

        docs.forEach((doc) => {
          rendered++;
          const row = document.createElement('div');
          row.className = 'doc-row' + (doc.id === selectedId ? ' selected' : '');
          row.innerHTML = `<span class="doc-title" title="${esc(doc.title)}">${esc(doc.title)}</span>
                           <button class="copy-link" title="Copy URL">Copy URL</button>`;
          row.addEventListener('click', () => selectDoc(doc.id));
          row.querySelector('.copy-link').addEventListener('click', (e) => {
            e.stopPropagation();
            copy(doc.url);
          });
          subEl.appendChild(row);
        });

        catEl.appendChild(subEl);
      });

      tree.appendChild(catEl);
    });

    if (rendered === 0) {
      tree.innerHTML = `<p class="tree-empty">${searching ? 'No documents match your search.' : 'No documents yet — add one from the “Add link” tab.'}</p>`;
    }
  }

  // Toggle every category / sub category at once.
  $('#collapse-all').addEventListener('click', () => {
    const anyOpen = [...tree.querySelectorAll('details')].some((d) => d.open);
    collapsed.clear();
    if (anyOpen) {
      Object.entries(state.categories).forEach(([cat, subs]) => {
        collapsed.add(cat);
        subs.forEach((sub) => collapsed.add(cat + '/' + sub));
      });
    }
    rememberCollapsed();
    renderTree();
  });

  search.addEventListener('input', renderTree);

  // ---------- Detail pane ----------
  function selectDoc(id) {
    selectedId = id;
    renderTree();
    renderDetail();
  }

  function renderDetail() {
    const doc = state.docs.find((d) => d.id === selectedId);
    if (!doc) {
      hideViewer();
      detail.innerHTML = `<div class="empty-state"><h2>No document selected</h2>
        <p>Pick a document in the left pane to see its details, URL and notes.</p></div>`;
      return;
    }

    detail.innerHTML = `
      <article class="detail">
        <div class="detail-info">
          <div class="detail-head">
            <div>
              <h2>${esc(doc.title)}</h2>
              <div class="breadcrumb">${esc(doc.category)} › ${esc(doc.subcategory)}</div>
            </div>
            <div class="detail-actions">
              <button class="ghost small" id="open-btn">Open in browser</button>
              <button class="ghost small" id="edit-notes-btn">Edit notes</button>
              <button class="danger small" id="delete-btn">Delete</button>
            </div>
          </div>

          <div class="url-box">
            <span class="url-label">URL</span>
            <a href="${esc(doc.url)}" target="_blank" rel="noopener noreferrer">${esc(doc.url)}</a>
            <button class="ghost small" id="detail-copy">Copy</button>
          </div>

          ${doc.tags.length ? `<div class="tags">${doc.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}

          <div class="notes" id="notes-view">${doc.notes ? esc(doc.notes) : '<span style="color:var(--muted)">No notes yet — click “Edit notes”.</span>'}</div>
        </div>

        <div class="viewer-wrap">
          <div class="viewer-bar">
            <button class="ghost small" id="vw-reload" title="Reload">⟳</button>
            <span class="vw-status">${esc(doc.url)}</span>
            <button class="ghost small" id="vw-external" title="Open in browser">↗</button>
          </div>
          <div class="viewer-slot" id="viewer-slot">
            ${isDesktop ? '' : `<iframe class="preview" src="${esc(doc.url)}" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups"></iframe>
             <p class="hint-text">Sites that send <code>X-Frame-Options</code> (github.com included) stay blank in a browser. Run the desktop app for inline rendering.</p>`}
          </div>
        </div>
      </article>`;

    $('#vw-reload').addEventListener('click', () => {
      if (isDesktop) invoke('viewer_reload').catch(console.error);
      else renderDetail();
    });
    $('#vw-external').addEventListener('click', () => openUrl(doc.url));
    $('#detail-copy').addEventListener('click', () => copy(doc.url));
    $('#open-btn').addEventListener('click', () => openUrl(doc.url));
    $('#delete-btn').addEventListener('click', async () => {
      const ok = isDesktop
        ? await dialog.ask(doc.title, { title: 'Delete this document?', kind: 'warning', okLabel: 'Delete', cancelLabel: 'Cancel' })
        : confirm(`Delete “${doc.title}”?`);
      if (!ok) return;
      state.docs = state.docs.filter((d) => d.id !== doc.id);
      selectedId = null;
      save(); renderTree(); renderDetail(); toast('Document deleted');
    });
    $('#edit-notes-btn').addEventListener('click', () => {
      const view = $('#notes-view');
      const ta = document.createElement('textarea');
      ta.rows = 6; ta.value = doc.notes;
      view.replaceWith(ta);
      ta.focus();
      const commit = () => {
        doc.notes = ta.value.trim();
        save(); renderDetail(); toast('Notes saved');
      };
      ta.addEventListener('blur', commit, { once: true });
    });

    if (isDesktop) showViewer(doc.url);
  }

  // ---------- Add form ----------
  function fillCategorySelect() {
    const cats = Object.keys(state.categories).sort((a, b) => a.localeCompare(b));
    catSelect.innerHTML =
      '<option value="" disabled selected>Select a category…</option>' +
      cats.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('') +
      `<option value="${NEW_VALUE}">＋ New category…</option>`;
    fillSubSelect();
  }

  function fillSubSelect() {
    const cat = catSelect.value;
    const isNewCat = cat === NEW_VALUE || !cat;
    const subs = (!isNewCat && state.categories[cat]) ? [...state.categories[cat]].sort((a, b) => a.localeCompare(b)) : [];
    subSelect.innerHTML =
      '<option value="" disabled selected>Select a sub category…</option>' +
      subs.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('') +
      `<option value="${NEW_VALUE}">＋ New sub category…</option>`;
    if (isNewCat) {
      subSelect.value = NEW_VALUE;
      newSubWrap.hidden = false;
    }
  }

  catSelect.addEventListener('change', () => {
    const isNew = catSelect.value === NEW_VALUE;
    newCatWrap.hidden = !isNew;
    if (isNew) newCat.focus();
    fillSubSelect();
    newSubWrap.hidden = subSelect.value !== NEW_VALUE;
  });

  subSelect.addEventListener('change', () => {
    newSubWrap.hidden = subSelect.value !== NEW_VALUE;
    if (!newSubWrap.hidden) newSub.focus();
  });

  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#doc-title').value.trim();
    let url = $('#doc-url').value.trim();
    const category = catSelect.value === NEW_VALUE ? newCat.value.trim() : catSelect.value;
    const subcategory = subSelect.value === NEW_VALUE ? newSub.value.trim() : subSelect.value;

    if (!category) return showMsg('Please enter a category name.', true);
    if (!subcategory) return showMsg('Please enter a sub category name.', true);
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    if (!state.categories[category]) state.categories[category] = [];
    if (!state.categories[category].includes(subcategory)) state.categories[category].push(subcategory);

    const tags = $('#doc-tags').value.split(',').map((t) => t.trim()).filter(Boolean);
    const doc = mkDoc(title, url, category, subcategory, tags, $('#doc-notes').value.trim());
    state.docs.push(doc);
    save();

    resetForm();
    fillCategorySelect();
    renderTree();
    selectDoc(doc.id);
    showMsg('Saved to ' + category + ' › ' + subcategory);
    toast('Link added');
  });

  $('#reset-form').addEventListener('click', () => { resetForm(); fillCategorySelect(); });

  function resetForm() {
    addForm.reset();
    newCatWrap.hidden = true;
    newSubWrap.hidden = true;
    newCat.value = '';
    newSub.value = '';
  }

  function showMsg(text, isError) {
    formMsg.textContent = text;
    formMsg.classList.toggle('error', !!isError);
    setTimeout(() => { if (formMsg.textContent === text) formMsg.textContent = ''; }, 4000);
  }

  // ---------- Native viewer (desktop only) ----------
  // The document is rendered by a real WKWebView that the Rust side positions
  // on top of `#viewer-slot`, so sites that refuse to be framed still display.
  let viewerUrl = null;

  function slotBounds() {
    const slot = $('#viewer-slot');
    if (!slot) return null;
    const r = slot.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return null;
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  }

  function showViewer(url) {
    const bounds = slotBounds();
    if (!bounds) return;
    viewerUrl = url;
    invoke('viewer_show', { url, bounds }).catch((e) => {
      console.error('viewer_show failed', e);
      const status = document.querySelector('.vw-status');
      if (status) status.textContent = 'Could not display: ' + e;
    });
  }

  function hideViewer() {
    if (!isDesktop || !viewerUrl) return;
    viewerUrl = null;
    invoke('viewer_hide').catch(console.error);
  }

  function syncViewerBounds() {
    if (!isDesktop || !viewerUrl) return;
    const bounds = slotBounds();
    if (bounds) invoke('viewer_set_bounds', { bounds }).catch(console.error);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(syncViewerBounds, 60);
  });

  function openUrl(url) {
    if (isDesktop) opener.openUrl(url).catch(console.error);
    else window.open(url, '_blank', 'noopener');
  }

  // ---------- Import / export ----------
  $('#reveal-btn').addEventListener('click', async () => {
    if (!isDesktop) {
      toast('Browser mode — data lives in this browser’s localStorage');
      return;
    }
    try {
      const path = await invoke('library_location');
      await dialog.message(path, { title: 'Your library is stored here' });
    } catch (e) {
      console.error(e);
    }
  });

  $('#export-btn').addEventListener('click', exportLibrary);
  $('#import-btn').addEventListener('click', () => {
    if (isDesktop) importFromDialog();
    else $('#import-file').click();
  });

  async function exportLibrary() {
    if (isDesktop) {
      try {
        const path = await dialog.save({
          title: 'Export library',
          defaultPath: `github-docs-${new Date().toISOString().slice(0, 10)}.json`,
          filters: [{ name: 'JSON', extensions: ['json'] }]
        });
        if (!path) return;
        await invoke('write_json_file', { path, data: state });
        toast('Exported to ' + path.split('/').pop());
      } catch (e) {
        dialog.message(String(e), { title: 'Export failed', kind: 'error' });
      }
      return;
    }
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `github-docs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importFromDialog() {
    try {
      const path = await dialog.open({
        title: 'Import library',
        multiple: false,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      if (!path) return;
      const data = await invoke('read_json_file', { path });
      const merge = await dialog.ask(
        'Merge the imported links into your current library? Choosing “Replace” discards your current one.',
        { title: 'Import library', okLabel: 'Merge', cancelLabel: 'Replace' }
      );
      applyImport(data, merge);
    } catch (err) {
      dialog.message(String(err && err.message ? err.message : err), { title: 'Import failed', kind: 'error' });
    }
  }

  function applyImport(data, merge) {
    if (!Array.isArray(data.docs) || typeof data.categories !== 'object') throw new Error('Unexpected format');
    if (merge) {
      const known = new Set(state.docs.map((d) => d.url));
      data.docs.filter((d) => !known.has(d.url)).forEach((d) => state.docs.push({ ...d, id: d.id || uid() }));
      Object.entries(data.categories).forEach(([c, subs]) => {
        state.categories[c] = [...new Set([...(state.categories[c] || []), ...subs])];
      });
    } else {
      state = data;
      selectedId = null;
    }
    save(); fillCategorySelect(); renderTree(); renderDetail(); toast('Library imported');
  }

  $('#import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      applyImport(data, confirm('OK = merge with current library, Cancel = replace it.'));
    } catch (err) {
      alert('Import failed: ' + err.message);
    } finally {
      e.target.value = '';
    }
  });

  // ---------- Helpers ----------
  function esc(str) {
    return String(str).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    }
    toast('URL copied');
  }

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 1800);
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    const mod = e.metaKey || e.ctrlKey;

    if (mod && e.key === 'f') { e.preventDefault(); focusSearch(); return; }
    if (mod && e.key === 'n') { e.preventDefault(); focusAddTab(); return; }
    if (mod && e.key === 's') { e.preventDefault(); exportLibrary(); return; }
    if (mod && e.key === 'o') { e.preventDefault(); isDesktop ? importFromDialog() : $('#import-file').click(); return; }
    if (e.key === '/' && !typing) { e.preventDefault(); focusSearch(); }
  });

  // External links always go to the system browser.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="http"]');
    if (!a) return;
    e.preventDefault();
    openUrl(a.href);
  });

  function focusSearch() {
    document.querySelector('.tab[data-tab="browse"]').click();
    search.focus();
    search.select();
  }

  function focusAddTab() {
    document.querySelector('.tab[data-tab="add"]').click();
    $('#doc-title').focus();
  }

  // ---------- Init ----------
  fillCategorySelect();
  renderTree();

  if (isDesktop) {
    document.body.classList.add('desktop');
    loadFromDisk();
  }
})();
