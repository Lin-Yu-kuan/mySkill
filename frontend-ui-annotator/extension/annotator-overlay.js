/**
 * Antigravity Universal Sticky Notes & Theme Extractor (v3.2.0)
 * 全能自由便條紙與整頁設計風格萃取腳本：
 * - 任意位置貼便條紙（支援元素錨點、空白間隙、自選階層麵包屑）
 * - 自由敘述任意想法（不限修改、插入新組件、靈感借鏡、刪除）
 * - 智慧環境雙軌辨識（本地專案直指檔案/路由 vs 外站自動帶入網址與品牌語境）
 * - 🌐 一鍵萃取全頁設計系統（配色盤、字體階層、圓角陰影、頁面骨架）
 * - 精緻圖釘懸停展開、就地編輯、刪除
 * - 零外部依賴、純原生 JS；執行仍受目標網站 CSP 限制
 */
(function () {
  const cleanup = [];
  function teardown() {
    for (const release of cleanup.reverse()) { try { release(); } catch { /* Continue releasing other resources. */ } }
    cleanup.length = 0;
    window.__AGY_STICKY_LOADED__ = false;
  }
  try {
  if (window.__AGY_STICKY_LOADED__) {
    const toggle = document.getElementById('agy-toggle-btn');
    if (toggle) { toggle.click(); return; }
    // Recover from older versions that marked a partial initialization as loaded.
    document.getElementById('agy-fixed-root')?.remove();
    document.getElementById('agy-scroll-root')?.remove();
    window.__AGY_STICKY_LOADED__ = false;
  }
  if (!document.body) throw new Error('頁面尚未準備好，請載入完成後重試');

  let isAnnotating = false;
  let notes = [];
  let currentTarget = null;
  let ancestorsList = [];
  let nextId = 1;
  let disposed = false;
  let restoring = false;
  let unsaved = false;
  let screenshot = null;
  let route = location.href;
  const originalCursor = document.body.style.cursor;
  const listeners = new AbortController();
  const timers = new Set();
  const objectUrls = new Set();
  cleanup.push(() => { disposed = true; isAnnotating = false; listeners.abort(); });
  cleanup.push(() => timers.forEach(clearTimeout));
  cleanup.push(() => objectUrls.forEach(url => URL.revokeObjectURL(url)));
  cleanup.push(() => { document.body.style.cursor = originalCursor; });
  function later(fn, ms) {
    const timer = setTimeout(() => { timers.delete(timer); if (!disposed) fn(); }, ms);
    timers.add(timer);
    return timer;
  }
  function ui(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    if (tag === 'button') node.type = 'button';
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'style') node.style.cssText = value;
      else node.setAttribute(key, value);
    }
    node.append(...children);
    return node;
  }
  function fingerprint(el) {
    return { tag: el.tagName, id: el.id, text: el === document.body || el === document.documentElement ? '' : (el.textContent || '').trim().slice(0, 120) };
  }
  function makeAnchor(el, x, y) {
    const parts = [];
    let node = el;
    while (node && node !== document.documentElement) {
      if (node.id && document.querySelectorAll('#' + CSS.escape(node.id)).length === 1) {
        parts.unshift('#' + CSS.escape(node.id)); break;
      }
      const siblings = node.parentElement ? Array.from(node.parentElement.children).filter(n => n.tagName === node.tagName) : [node];
      parts.unshift(node.tagName.toLowerCase() + ':nth-of-type(' + (siblings.indexOf(node) + 1) + ')');
      node = node.parentElement;
    }
    const rect = el.getBoundingClientRect();
    return { css: parts.join(' > '), fingerprint: fingerprint(el),
      rx: rect.width ? (x - scrollX - rect.left) / rect.width : 0,
      ry: rect.height ? (y - scrollY - rect.top) / rect.height : 0 };
  }
  function resolveAnchor(anchor) {
    try {
      const matches = document.querySelectorAll(anchor.css);
      if (matches.length !== 1) return null;
      const el = matches[0], expected = anchor.fingerprint, actual = fingerprint(el);
      return actual.tag === expected.tag && actual.id === expected.id && actual.text === expected.text ? el : null;
    } catch { return null; }
  }
  function refreshPins() {
    notes.forEach(item => {
      if (!item.target?.isConnected) item.target = resolveAnchor(item.anchor);
      const rect = item.target?.getBoundingClientRect();
      item.missing = !rect || !rect.width || !rect.height;
      if (!item.missing) {
        item.pageX = rect.left + scrollX + rect.width * item.anchor.rx;
        item.pageY = rect.top + scrollY + rect.height * item.anchor.ry;
      }
      item.pinEl.style.left = (item.pageX - scrollX - 14) + 'px';
      item.pinEl.style.top = (item.pageY - scrollY - 14) + 'px';
      item.pinEl.style.background = item.missing ? '#64748b' : '#f59e0b';
      item.pinEl.title = item.missing ? '目標已失效，請刪除後重新標註' : item.selector;
    });
  }
  function noteData(item) {
    return { id: item.id, text: item.text, selector: item.selector, anchor: item.anchor, pageX: item.pageX, pageY: item.pageY };
  }
  function storageKey() { return 'agy-notes-v1:' + route; }
  function saveDraft() {
    if (restoring) return;
    try {
      if (notes.length) localStorage.setItem(storageKey(), JSON.stringify({ schemaVersion: 1, notes: notes.map(noteData) }));
      else localStorage.removeItem(storageKey());
      unsaved = false;
    } catch { unsaved = true; showToast('草稿保存失敗，請匯出 JSON 備份', '#dc2626'); }
  }
  function validateNotes(data) {
    if (data.schemaVersion !== 1 || !Array.isArray(data.notes) || data.notes.length > 500) throw new Error('不支援的便條紙格式');
    const ids = new Set();
    for (const n of data.notes) {
      if (!Number.isSafeInteger(n.id) || n.id < 1 || ids.has(n.id) || typeof n.text !== 'string' || n.text.length > 50000 ||
          typeof n.selector !== 'string' || typeof n.anchor?.css !== 'string' || typeof n.anchor?.fingerprint?.tag !== 'string' ||
          typeof n.anchor.fingerprint.id !== 'string' || typeof n.anchor.fingerprint.text !== 'string' ||
          ![n.pageX, n.pageY, n.anchor.rx, n.anchor.ry].every(Number.isFinite)) throw new Error('便條紙資料不完整');
      ids.add(n.id);
    }
    return data.notes;
  }
  function loadNotes(data) {
    const entries = validateNotes(data);
    restoring = true;
    try {
      notes.forEach(n => n.pinEl.remove()); notes = []; nextId = 1;
      entries.forEach(n => createStickyPin(resolveAnchor(n.anchor), n.selector, n.text, n.pageX, n.pageY, n));
      countSpan.innerText = notes.length;
      refreshPins();
    } finally { restoring = false; }
  }
  function restoreDraft() {
    try {
      const raw = localStorage.getItem(storageKey());
      if (raw) { loadNotes(JSON.parse(raw)); showToast('已恢復 ' + notes.length + ' 張便條紙'); }
    } catch { showToast('無法恢復草稿；原資料未覆寫', '#d97706'); }
  }
  async function copyText(text, success) {
    try { await navigator.clipboard.writeText(text); if (!disposed) showToast(success); }
    catch { if (!disposed) prompt('請手動複製以下內容：', text); }
  }

  // 1. 建立 UI 根容器
  const fixedRoot = document.createElement('div');
  fixedRoot.id = 'agy-fixed-root';
  fixedRoot.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999999;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
  document.body.appendChild(fixedRoot);
  cleanup.push(() => fixedRoot.remove());

  const scrollRoot = document.createElement('div');
  scrollRoot.id = 'agy-scroll-root';
  scrollRoot.style.cssText = 'position:absolute;top:0;left:0;width:100%;min-height:100%;pointer-events:none;z-index:9999990;';
  document.body.appendChild(scrollRoot);
  cleanup.push(() => scrollRoot.remove());

  // 懸停高亮框
  const hoverBox = document.createElement('div');
  hoverBox.style.cssText = 'position:fixed;pointer-events:none;border:2px dashed #f59e0b;background:rgba(245,158,11,0.12);display:none;z-index:10000000;border-radius:6px;box-sizing:border-box;transition:top 0.04s ease, left 0.04s ease, width 0.04s ease, height 0.04s ease;';
  fixedRoot.appendChild(hoverBox);

  // 吐司通知
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #059669;
    color: white;
    font-size: 13px;
    font-weight: 600;
    padding: 9px 20px;
    border-radius: 9999px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.25s ease, transform 0.25s ease;
    z-index: 10000020;
    white-space: normal;
    max-width: calc(100vw - 32px);
    box-sizing: border-box;
  `;
  fixedRoot.appendChild(toast);

  let toastTimer = null;
  function showToast(msg, bg = '#059669') {
    clearTimeout(toastTimer);
    toast.innerText = msg;
    toast.style.background = bg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(4px)';
    toastTimer = later(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 2800);
  }

  // 2. 懸浮工具列
  const toolbar = document.createElement('div');
  toolbar.id = 'agy-main-toolbar';
  toolbar.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255, 255, 255, 0.16);
    padding: 7px 12px;
    border-radius: 9999px;
    box-shadow: 0 12px 35px rgba(0,0,0,0.55);
    pointer-events: auto;
    z-index: 10000005;
    user-select: none;
    transition: transform 0.2s ease;
  `;
  const toolbarButtonStyle = 'background:rgba(255,255,255,0.1);color:#f8fafc;border:1px solid rgba(255,255,255,0.2);padding:7px 13px;border-radius:9999px;font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:5px';
  toolbar.append(
    ui('button', { id: 'agy-toggle-btn', style: toolbarButtonStyle + ';background:#f59e0b;color:#0f172a;font-weight:700' },
      '📌 ', ui('span', { id: 'agy-btn-text' }, '貼便條紙模式')),
    ui('button', { id: 'agy-theme-btn', title: '掃描目前頁面風格摘要', style: toolbarButtonStyle }, '🌐 萃取整頁風格'),
    ui('button', { id: 'agy-copy-btn', style: toolbarButtonStyle }, '📋 複製便條紙 (', ui('span', { id: 'agy-count' }, '0'), ')'),
    ui('button', { id: 'agy-exit-btn', title: '完全離開並關閉工具', style: toolbarButtonStyle + ';width:28px;height:28px;padding:0;justify-content:center;color:#94a3b8' }, '✕')
  );
  fixedRoot.appendChild(toolbar);

  const toggleBtn = toolbar.querySelector('#agy-toggle-btn');
  const btnText = toolbar.querySelector('#agy-btn-text');
  const themeBtn = toolbar.querySelector('#agy-theme-btn');
  const copyBtn = toolbar.querySelector('#agy-copy-btn');
  const countSpan = toolbar.querySelector('#agy-count');
  const exitBtn = toolbar.querySelector('#agy-exit-btn');

  // 工具列樣式互動
  [themeBtn, copyBtn].forEach(btn => {
    btn.addEventListener('mouseenter', () => btn.style.background = 'rgba(255,255,255,0.18)');
    btn.addEventListener('mouseleave', () => btn.style.background = 'rgba(255,255,255,0.1)');
  });

  exitBtn.addEventListener('mouseenter', () => {
    exitBtn.style.background = '#dc2626';
    exitBtn.style.color = '#ffffff';
    exitBtn.style.borderColor = '#ef4444';
  });
  exitBtn.addEventListener('mouseleave', () => {
    exitBtn.style.background = 'rgba(255,255,255,0.08)';
    exitBtn.style.color = '#94a3b8';
    exitBtn.style.borderColor = 'rgba(255,255,255,0.12)';
  });

  // 完全退出
  exitBtn.addEventListener('click', () => {
    if (unsaved && !confirm('草稿未能保存，請先匯出 JSON。仍要關閉嗎？')) return;
    closeDialog();
    teardown();
  });

  // 切換便條紙模式
  toggleBtn.addEventListener('click', () => {
    isAnnotating = !isAnnotating;
    if (isAnnotating) {
      toggleBtn.style.background = '#dc2626';
      toggleBtn.style.color = '#ffffff';
      toggleBtn.style.boxShadow = '0 2px 10px rgba(220,38,38,0.4)';
      btnText.innerText = '退出貼紙模式';
      document.body.style.cursor = 'crosshair';
      showToast('📌 便條紙模式已開啟：點擊畫面上任何元素或空白處即可貼紙！', '#d97706');
    } else {
      toggleBtn.style.background = '#f59e0b';
      toggleBtn.style.color = '#0f172a';
      toggleBtn.style.boxShadow = '0 2px 10px rgba(245,158,11,0.4)';
      btnText.innerText = '貼便條紙模式';
      document.body.style.cursor = originalCursor;
      hoverBox.style.display = 'none';
      closeDialog();
    }
  });

  // 3. 智慧環境雙軌辨識與絕對路徑解析
  function getLocalAbsolutePath() {
    let p = decodeURIComponent(window.location.pathname);
    // Windows 路徑正規化：去除開頭斜線 (如 /C:/... 轉為 C:/...)
    if (/^\/[a-zA-Z]:/.test(p)) {
      p = p.substring(1);
    }
    return p;
  }

  function getEnvironmentContext() {
    const loc = window.location;
    const isLocalhost = loc.hostname === 'localhost' || loc.hostname === '127.0.0.1';
    const isFile = loc.protocol === 'file:';

    if (isFile) {
      const absPath = getLocalAbsolutePath();
      return {
        isLocal: true,
        type: 'local-file',
        header: `【本地檔案視覺便條紙】\n- **檔案路徑**：\`${absPath}\``
      };
    } else if (isLocalhost) {
      const fullUrl = `${loc.origin}${loc.pathname}${loc.search}${loc.hash}`;
      return {
        isLocal: true,
        type: 'localhost',
        header: `【本地伺服器視覺便條紙】\n- **伺服器路由**：\`${fullUrl}\``
      };
    } else {
      return {
        isLocal: false,
        type: 'public-web',
        header: `【外部網站參考便條紙】\n- **來源網址**：${loc.origin}${loc.pathname}\n- **網頁標題**：${document.title || '外部網頁'}`
      };
    }
  }

  // 4. 取得元素語意標籤與樣式輔助
  function getSafeClassName(el) {
    if (!el) return '';
    if (typeof el.className === 'string') return el.className.trim();
    if (el.className && typeof el.className.baseVal === 'string') return el.className.baseVal.trim();
    return '';
  }

  function getReadableSelector(el) {
    if (!el || el === document.body || el === document.documentElement) return '頁面容器/空白縫隙';
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    let classSnippet = '';
    const rawClass = getSafeClassName(el);
    if (rawClass) {
      const parts = rawClass.split(/\s+/).filter(c => !c.startsWith('agy-') && c.length < 30).slice(0, 2);
      if (parts.length > 0) classSnippet = '.' + parts.join('.');
    }
    const textSnippet = el.innerText && el.innerText.trim() ? ` "${el.innerText.trim().slice(0, 16)}"` : '';
    return `<${tag}${id}${classSnippet}>${textSnippet}`;
  }

  function getAncestors(el) {
    const list = [];
    let cur = el;
    while (cur && cur !== document.body && cur !== document.documentElement && list.length < 5) {
      if (!fixedRoot.contains(cur) && !scrollRoot.contains(cur)) {
        list.push(cur);
      }
      cur = cur.parentElement;
    }
    return list;
  }

  function updateHoverBox(el) {
    if (!el || !isAnnotating || el === document.body || el === document.documentElement) {
      hoverBox.style.display = 'none';
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      hoverBox.style.display = 'none';
      return;
    }
    hoverBox.style.display = 'block';
    hoverBox.style.top = rect.top + 'px';
    hoverBox.style.left = rect.left + 'px';
    hoverBox.style.width = rect.width + 'px';
    hoverBox.style.height = rect.height + 'px';
  }

  document.addEventListener('mousemove', (e) => {
    if (!isAnnotating) return;
    if (fixedRoot.contains(e.target) || scrollRoot.contains(e.target)) return;
    updateHoverBox(e.target);
  }, { capture: true, signal: listeners.signal });

  window.addEventListener('scroll', () => {
    if (isAnnotating && currentTarget) updateHoverBox(currentTarget);
    refreshPins();
  }, { passive: true, capture: true, signal: listeners.signal });

  // 5. 點擊貼便條紙
  document.addEventListener('click', (e) => {
    if (!isAnnotating) return;
    if (fixedRoot.contains(e.target) || scrollRoot.contains(e.target)) return;

    e.preventDefault();
    e.stopPropagation();

    currentTarget = e.target;
    ancestorsList = getAncestors(currentTarget);

    const clickPageX = e.pageX;
    const clickPageY = e.pageY;
    const clickClientX = e.clientX;
    const clickClientY = e.clientY;

    openStickyDialog(currentTarget, clickPageX, clickPageY, clickClientX, clickClientY);
  }, { capture: true, signal: listeners.signal });

  function closeDialog() {
    const existing = document.getElementById('agy-active-dialog');
    if (existing) existing.remove();
  }

  // 6. 便條紙輸入卡片
  function openStickyDialog(target, pageX, pageY, clientX, clientY, editNoteId = null) {
    closeDialog();
    currentTarget = target;
    ancestorsList = getAncestors(target);
    updateHoverBox(currentTarget);

    const dialog = document.createElement('div');
    dialog.id = 'agy-active-dialog';

    let top = clientY + 12;
    let left = clientX + 12;
    if (left + 330 > window.innerWidth) left = window.innerWidth - 340;
    if (top + 280 > window.innerHeight) top = clientY - 280;
    if (top < 10) top = 10;
    if (left < 10) left = 10;

    dialog.style.cssText = `
      position: fixed;
      top: ${top}px;
      left: ${left}px;
      width: 320px;
      max-width: calc(100vw - 20px);
      box-sizing: border-box;
      background: #0f172a;
      color: #f8fafc;
      border: 1px solid #f59e0b;
      border-radius: 12px;
      padding: 14px;
      box-shadow: 0 20px 45px rgba(0,0,0,0.65), 0 0 15px rgba(245,158,11,0.25);
      pointer-events: auto;
      z-index: 10000010;
      font-size: 13px;
    `;

    const initialText = editNoteId ? (notes.find(n => n.id === editNoteId)?.text || '') : '';
    dialog.append(
      ui('div', { style: 'display:flex;justify-content:space-between;margin-bottom:8px' },
        ui('span', { style: 'font-size:12px;font-weight:700;color:#f59e0b' }, '📌 ' + (editNoteId ? '編輯便條紙 #' + editNoteId : '貼上新便條紙')),
        ui('span', { style: 'font-size:11px;color:#94a3b8' }, '自由填寫任何想法')),
      ui('div', { style: 'font-size:11px;color:#cbd5e1;margin-bottom:8px;background:#1e293b;padding:5px 8px;border-radius:6px;word-break:break-all' },
        '位置錨點：', ui('span', { id: 'agy-selected-tag', style: 'color:#fbbf24;font-family:monospace;font-weight:600' }, getReadableSelector(currentTarget)))
    );
    if (ancestorsList.length > 1) {
      const crumbs = ui('div', { id: 'agy-crumbs', style: 'display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:10px' });
      ancestorsList.map((node, index) => {
        const selected = node === currentTarget;
        const rawClass = getSafeClassName(node);
        return ui('button', { class: 'agy-crumb-btn', 'data-index': index,
          style: 'border:1px solid #334155;border-radius:4px;padding:2px 6px;font-size:11px;cursor:pointer;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' +
            (selected ? 'background:#f59e0b;color:#0f172a;font-weight:700' : 'background:#1e293b;color:#94a3b8')
        }, node.tagName.toLowerCase() + (rawClass ? '.' + rawClass.split(/\s+/)[0] : ''));
      }).reverse().forEach((button, index) => {
        if (index) crumbs.append(ui('span', { style: 'color:#64748b;font-size:10px' }, '➔'));
        crumbs.append(button);
      });
      dialog.append(ui('div', { style: 'font-size:10px;color:#94a3b8;margin-bottom:4px' }, '切換外層容器：'), crumbs);
    }
    dialog.append(
      ui('textarea', { id: 'agy-note-input', placeholder: '描述想修改的內容、插入元件或參考風格',
        style: 'width:100%;box-sizing:border-box;height:84px;background:#020617;color:white;border:1px solid #334155;border-radius:8px;padding:8px 10px;font-size:13px;line-height:1.45;resize:none' }),
      ui('div', { style: 'display:flex;justify-content:flex-end;gap:8px;margin-top:10px' },
        ui('button', { id: 'agy-cancel-btn', style: 'background:transparent;color:#94a3b8;border:none;font-size:12px;cursor:pointer;padding:5px 10px' }, '取消'),
        ui('button', { id: 'agy-save-btn', style: 'background:#f59e0b;color:#0f172a;border:none;border-radius:6px;font-size:12px;font-weight:700;padding:6px 15px;cursor:pointer' }, editNoteId ? '更新便條紙' : '📌 釘上便條紙'))
    );

    fixedRoot.appendChild(dialog);

    const textarea = dialog.querySelector('#agy-note-input');
    textarea.value = initialText;
    textarea.focus();

    const crumbBtns = dialog.querySelectorAll('.agy-crumb-btn');
    crumbBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        currentTarget = ancestorsList[idx];
        dialog.querySelector('#agy-selected-tag').innerText = getReadableSelector(currentTarget);
        updateHoverBox(currentTarget);
        crumbBtns.forEach(b => {
          const isThis = b === btn;
          b.style.background = isThis ? '#f59e0b' : '#1e293b';
          b.style.color = isThis ? '#0f172a' : '#94a3b8';
          b.style.borderColor = isThis ? '#f59e0b' : '#334155';
          b.style.fontWeight = isThis ? '700' : '500';
        });
      });
    });

    dialog.querySelector('#agy-cancel-btn').addEventListener('click', closeDialog);
    dialog.querySelector('#agy-save-btn').addEventListener('click', () => {
      const text = textarea.value.trim();
      if (!text) {
        showToast('請輸入便條紙內容', '#d97706');
        return;
      }
      if (editNoteId) {
        updateNote(editNoteId, text, currentTarget, pageX, pageY);
      } else {
        createStickyPin(currentTarget, getReadableSelector(currentTarget), text, pageX, pageY);
      }
      closeDialog();
    });
  }

  // 7. 釘在網頁上的精美便條紙圖釘（展開態與編輯/刪除）
  function createStickyPin(target, selector, text, pageX, pageY, restored = null) {
    const id = restored ? restored.id : nextId++;
    nextId = Math.max(nextId, id + 1);
    const pin = document.createElement('div');
    pin.className = 'agy-sticky-pin';
    pin.style.cssText = `
      position: fixed;
      top: ${pageY - 14}px;
      left: ${pageX - 14}px;
      width: 28px;
      height: 28px;
      background: #f59e0b;
      color: #0f172a;
      border: 2px solid #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      box-shadow: 0 4px 15px rgba(0,0,0,0.45), 0 0 10px rgba(245,158,11,0.4);
      pointer-events: auto;
      cursor: pointer;
      z-index: 10000002;
      animation: agy-pop 0.2s ease-out;
      user-select: none;
    `;
    pin.innerText = id;

    // 懸停浮現小便條卡
    const previewCard = document.createElement('div');
    previewCard.style.cssText = `
      position: absolute;
      top: 34px;
      left: 0;
      width: 240px;
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 12px;
      line-height: 1.4;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      display: none;
      z-index: 10000005;
      pointer-events: auto;
    `;
    previewCard.append(
      ui('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;border-bottom:1px solid #334155;padding-bottom:4px' },
        ui('span', { style: 'font-weight:700;color:#fbbf24' }, '📌 便條紙 #' + id),
        ui('div', { style: 'display:flex;gap:6px' },
          ui('button', { class: 'agy-card-edit-btn', style: 'background:transparent;border:none;color:#94a3b8;cursor:pointer;font-size:11px' }, '✏️ 編輯'),
          ui('button', { class: 'agy-card-del-btn', style: 'background:transparent;border:none;color:#ef4444;cursor:pointer;font-size:11px' }, '🗑️ 刪除'))),
      ui('div', { class: 'agy-card-selector', style: 'font-size:10px;color:#94a3b8;margin-bottom:4px;word-break:break-all' }, '位置：' + selector),
      ui('div', { class: 'agy-card-text', style: 'white-space:pre-wrap;color:#e2e8f0' }, text)
    );
    pin.appendChild(previewCard);

    let hideTimer = null;
    pin.addEventListener('mouseenter', () => {
      clearTimeout(hideTimer);
      previewCard.style.display = 'block';
    });
    pin.addEventListener('mouseleave', () => {
      hideTimer = later(() => {
        previewCard.style.display = 'none';
      }, 250);
    });

    previewCard.querySelector('.agy-card-edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (item.missing) { showToast('目標已失效，請重新標註', '#d97706'); return; }
      openStickyDialog(item.target, item.pageX, item.pageY, item.pageX - window.scrollX, item.pageY - window.scrollY, id);
    });

    previewCard.querySelector('.agy-card-del-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteNote(id);
    });

    const item = { id, target, selector, text, pageX, pageY, anchor: restored?.anchor || makeAnchor(target, pageX, pageY), pinEl: pin, previewCard };
    notes.push(item);
    countSpan.innerText = notes.length;

    scrollRoot.appendChild(pin);
    refreshPins();
    if (!restoring) showToast(`✅ 已釘上便條紙 #${id}`, '#f59e0b');
    saveDraft();
  }

  function updateNote(id, newText, target, pageX, pageY) {
    const item = notes.find(n => n.id === id);
    if (!item) return;
    item.text = newText;
    item.target = target;
    item.selector = getReadableSelector(target);
    item.anchor = makeAnchor(target, pageX, pageY);
    item.previewCard.querySelector('.agy-card-selector').textContent = '位置：' + item.selector;
    const cardText = item.previewCard.querySelector('.agy-card-text');
    if (cardText) cardText.innerText = newText;
    refreshPins();
    showToast(`✅ 已更新便條紙 #${id}`, '#f59e0b');
    saveDraft();
  }

  function deleteNote(id) {
    const item = notes.find(n => n.id === id);
    if (!item) return;
    item.pinEl.remove();
    notes = notes.filter(n => n.id !== id);
    countSpan.innerText = notes.length;
    showToast(`🗑️ 已刪除便條紙 #${id}`);
    saveDraft();
  }

  // 8. 複製便條紙清單 (雙軌格式)
  copyBtn.addEventListener('click', () => {
    if (notes.length === 0) {
      showToast('目前尚無便條紙，請先在畫面上點擊釘上想法！', '#d97706');
      return;
    }

    const env = getEnvironmentContext();
    refreshPins();
    let text = `${env.header}\n- **畫面尺寸**：${innerWidth} × ${innerHeight}（DPR ${devicePixelRatio}）\n- **完整路由**：${location.href}\n- **截圖**：${screenshot ? '已附於 JSON 回饋包' : '未附；可用「附截圖」選取圖片'}\n\n`;

    notes.forEach((item, index) => {
      text += `📌 **便條紙 #${item.id}**（位置錨點：\`${item.selector}\`）\n`;
      text += `- CSS 定位：\`${item.anchor.css}\`\n- 狀態：${item.missing ? '目標已失效，請人工確認' : '已定位'}\n- 樣式摘要：${JSON.stringify(styleSnapshot(item.target))}\n`;
      text += `> 「${item.text.replace(/\n/g, '\n> ')}」\n\n`;
    });

    if (env.isLocal) {
      text += `請依據上述便條紙內容與位置錨點，配合我當前的對話指令（如：/plan 規劃、修改實作、架構評估等）進行處理。`;
    } else {
      text += `請參考此網站之視覺質感與上述便條紙期望，配合我當前的對話指令進行處理。`;
    }

    copyText(text, '📋 已複製 AI 回饋包；附圖請另外匯出 JSON');
  });

  // 9. 🌐 一鍵萃取全頁設計風格 (Theme Extractor Algorithm)
  themeBtn.addEventListener('click', () => {
    showToast('🔍 正在掃描全頁 Design Tokens...', '#3b82f6');
    later(extractFullPageTheme, 100);
  });

  function extractFullPageTheme() {
    const allElements = Array.from(document.querySelectorAll('body *')).filter(el => {
      if (fixedRoot.contains(el) || scrollRoot.contains(el)) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    // A. 色彩統計
    const bgColors = {};
    const textColors = {};
    const accents = {};

    allElements.forEach(el => {
      const style = window.getComputedStyle(el);
      const bg = style.backgroundColor;
      const color = style.color;

      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
        bgColors[bg] = (bgColors[bg] || 0) + 1;
      }
      if (color && color !== 'transparent') {
        textColors[color] = (textColors[color] || 0) + 1;
      }
      // 按鈕或強交互元素的顏色視為 Accent
      if (el.tagName === 'BUTTON' || el.tagName === 'A') {
        if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
          accents[bg] = (accents[bg] || 0) + 2;
        }
      }
    });

    const getTopKeys = (obj, n = 3) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(e => e[0]);
    const topBg = getTopKeys(bgColors, 3);
    const topText = getTopKeys(textColors, 3);
    const topAccent = getTopKeys(accents, 2);

    // B. 字體與階層
    const bodyStyle = window.getComputedStyle(document.body);
    const fontFamily = bodyStyle.fontFamily;
    const headings = Array.from(document.querySelectorAll('h1, h2, h3')).slice(0, 3).map(h => {
      const s = window.getComputedStyle(h);
      return `${h.tagName.toLowerCase()}: ${s.fontSize} (weight: ${s.fontWeight})`;
    });

    // C. 圓角與陰影
    const radii = {};
    allElements.forEach(el => {
      const r = window.getComputedStyle(el).borderRadius;
      if (r && r !== '0px') radii[r] = (radii[r] || 0) + 1;
    });
    const topRadius = getTopKeys(radii, 3);

    // D. 頁面骨架流向
    const sections = Array.from(document.querySelectorAll('header, nav, main, section, article, footer')).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.height > 60 && !fixedRoot.contains(el);
    }).slice(0, 6).map((el, i) => {
      const tag = el.tagName.toLowerCase();
      const text = el.innerText ? el.innerText.trim().slice(0, 20).replace(/\n/g, ' ') : '';
      return `${i + 1}. <${tag}>: "${text}"`;
    });

    const env = getEnvironmentContext();
    const sourceInfo = env.isLocal ? (window.location.protocol === 'file:' ? getLocalAbsolutePath() : window.location.href) : `${window.location.origin}${window.location.pathname} (${document.title || '外部網站'})`;

    const themeMarkdown = `【全頁 UI 設計風格與全站 Tokens 萃取】
- **參考來源**：${sourceInfo}

### 🎨 全站設計系統 (Design Tokens)
1. **配色體系**：
   - 畫布主要背景色：\`${topBg[0] || '透明/預設'}\`
   - 表面卡片/次要背景：\`${topBg[1] || '微透明'}\`
   - 主要文字色：\`${topText[0] || '#ffffff'}\` / 次要文字色：\`${topText[1] || '#94a3b8'}\`
   - 品牌按鈕/強調色 (Accent)：\`${topAccent[0] || topText[0] || '#3b82f6'}\`
2. **字體與排版規範**：
   - 全域字型：\`${fontFamily}\`
   - 標題層次範例：${headings.join('，') || 'h1: 36px, h2: 24px'}
3. **幾何與質感規範**：
   - 主流圓角半徑：\`${topRadius.join(', ') || '8px, 12px'}\`
4. **頁面骨架流向**：
${sections.length > 0 ? sections.map(s => '   - ' + s).join('\n') : '   - Header ➔ Hero Banner ➔ Feature Section ➔ Footer'}

---
🎯 **請參考此全站設計系統與風格**，配合我當前的對話需求進行後續處理。`;

    copyText(themeMarkdown, '✨ 已複製目前頁面的風格摘要');
  }

  // 10. 動畫樣式
  function styleSnapshot(el) {
    if (!el?.isConnected) return null;
    const computed = getComputedStyle(el);
    return Object.fromEntries(['color', 'backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight',
      'padding', 'margin', 'gap', 'borderRadius', 'boxShadow', 'display'].map(key => [key, computed[key]]));
  }
  function feedbackPackage() {
    refreshPins();
    return { schemaVersion: 1, toolVersion: '3.2.0', url: route, title: document.title, createdAt: new Date().toISOString(),
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio, scrollX, scrollY }, screenshot,
      notes: notes.map(item => ({ ...noteData(item), status: item.missing ? 'missing' : 'resolved', styles: styleSnapshot(item.target) })) };
  }
  function addAction(label, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.style.cssText = 'background:#334155;color:white;border:1px solid #64748b;border-radius:8px;padding:7px;cursor:pointer;font-size:12px';
    button.addEventListener('click', action);
    toolbar.insertBefore(button, exitBtn);
    return button;
  }
  toolbar.style.flexWrap = 'wrap';
  toolbar.style.maxWidth = 'calc(100vw - 48px)';
  toolbar.style.boxSizing = 'border-box';
  toolbar.style.borderRadius = '16px';
  addAction('匯出 JSON', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(feedbackPackage(), null, 2)], { type: 'application/json' }));
    objectUrls.add(url);
    const link = document.createElement('a');
    link.href = url; link.download = 'ui-feedback.json'; fixedRoot.appendChild(link); link.click(); link.remove();
    later(() => { URL.revokeObjectURL(url); objectUrls.delete(url); }, 30000);
  });
  const importInput = document.createElement('input');
  importInput.type = 'file'; importInput.accept = '.json,application/json'; importInput.hidden = true;
  fixedRoot.appendChild(importInput);
  importInput.addEventListener('change', async () => {
    const file = importInput.files[0];
    try {
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) throw new Error('JSON 不可超過 10 MB');
      const data = JSON.parse(await file.text());
      if (disposed) return;
      if (data.url !== route) throw new Error('請在回饋包的原始網址匯入');
      validateNotes(data);
      if (notes.length && !confirm('匯入將取代目前便條紙，是否繼續？')) return;
      loadNotes(data);
      screenshot = typeof data.screenshot === 'string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(data.screenshot) ? data.screenshot : null;
      screenshotBtn.textContent = screenshot ? '更換截圖 ✓' : '附截圖';
      showToast('已匯入便條紙'); saveDraft();
    } catch (error) { showToast('匯入失敗：' + error.message, '#dc2626'); }
    finally { importInput.value = ''; }
  });
  addAction('匯入 JSON', () => importInput.click());
  const imageInput = document.createElement('input');
  imageInput.type = 'file'; imageInput.accept = 'image/png,image/jpeg,image/webp'; imageInput.hidden = true;
  fixedRoot.appendChild(imageInput);
  const screenshotBtn = addAction('附截圖', () => imageInput.click());
  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0], capturedRoute = route;
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      showToast('請選擇 5 MB 以下的 PNG、JPEG 或 WebP', '#d97706'); imageInput.value = ''; return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (disposed || route !== capturedRoute) return;
      screenshot = reader.result;
      screenshotBtn.textContent = '更換截圖 ✓';
      showToast('已附截圖，匯出 JSON 即可帶出；截圖不存入草稿');
    };
    reader.onerror = () => { if (!disposed) showToast('讀取截圖失敗', '#dc2626'); };
    reader.readAsDataURL(file); imageInput.value = '';
  });
  addAction('清除草稿', () => {
    if (!confirm('清除本頁所有便條紙與已附截圖？')) return;
    closeDialog(); notes.forEach(n => n.pinEl.remove()); notes = []; screenshot = null;
    screenshotBtn.textContent = '附截圖'; countSpan.innerText = '0'; saveDraft();
  });
  window.addEventListener('resize', refreshPins, { signal: listeners.signal });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeDialog(); if (isAnnotating) toggleBtn.click(); }
  }, { signal: listeners.signal });
  // Also covers layout shifts, SPA replacement and sticky/fixed targets without observing our own DOM writes.
  const trackingTimer = setInterval(() => {
    if (location.href !== route) {
      closeDialog(); currentTarget = null;
      notes.forEach(n => n.pinEl.remove()); notes = []; countSpan.innerText = '0';
      screenshot = null; screenshotBtn.textContent = '附截圖'; route = location.href; restoreDraft();
    }
    refreshPins();
  }, 250);
  cleanup.push(() => clearInterval(trackingTimer));
  restoreDraft();
  const style = document.createElement('style');
  style.innerText = `
    @keyframes agy-pop {
      0% { transform: scale(0.3); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  cleanup.push(() => style.remove());
  window.__AGY_STICKY_LOADED__ = true;
  showToast('📌 標註器 v3.2.0 已啟動');
  } catch (error) {
    teardown();
    console.error('[Frontend UI Annotator] 啟動失敗', error);
    alert('標註器啟動失敗：' + (error?.message || String(error)) + '\n請重新整理頁面後重試。');
  }
})();
