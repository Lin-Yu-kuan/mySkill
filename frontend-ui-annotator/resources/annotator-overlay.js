/**
 * Antigravity Universal Sticky Notes & Theme Extractor (v3.0)
 * 全能自由便條紙與整頁設計風格萃取腳本：
 * - 任意位置貼便條紙（支援元素錨點、空白間隙、自選階層麵包屑）
 * - 自由敘述任意想法（不限修改、插入新組件、靈感借鏡、刪除）
 * - 智慧環境雙軌辨識（本地專案直指檔案/路由 vs 外站自動帶入網址與品牌語境）
 * - 🌐 一鍵萃取全頁設計系統（配色盤、字體階層、圓角陰影、頁面骨架）
 * - 精緻圖釘懸停展開、就地編輯、刪除
 * - 零外部依賴、純原生 JS、相容 CSP
 */
(function () {
  if (window.__AGY_STICKY_LOADED__) {
    const toggle = document.getElementById('agy-toggle-btn');
    if (toggle) toggle.click();
    return;
  }
  window.__AGY_STICKY_LOADED__ = true;

  let isAnnotating = false;
  let notes = [];
  let currentTarget = null;
  let ancestorsList = [];

  // 1. 建立 UI 根容器
  const fixedRoot = document.createElement('div');
  fixedRoot.id = 'agy-fixed-root';
  fixedRoot.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999999;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
  document.body.appendChild(fixedRoot);

  const scrollRoot = document.createElement('div');
  scrollRoot.id = 'agy-scroll-root';
  scrollRoot.style.cssText = 'position:absolute;top:0;left:0;width:100%;min-height:100%;pointer-events:none;z-index:9999990;';
  document.body.appendChild(scrollRoot);

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
    white-space: nowrap;
  `;
  fixedRoot.appendChild(toast);

  let toastTimer = null;
  function showToast(msg, bg = '#059669') {
    clearTimeout(toastTimer);
    toast.innerText = msg;
    toast.style.background = bg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(4px)';
    toastTimer = setTimeout(() => {
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
  toolbar.innerHTML = `
    <button id="agy-toggle-btn" style="
      background: #f59e0b;
      color: #0f172a;
      border: none;
      padding: 7px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 10px rgba(245,158,11,0.4);
      outline: none;
      transition: all 0.2s;
    ">
      <span>📌</span> <span id="agy-btn-text">貼便條紙模式</span>
    </button>
    <button id="agy-theme-btn" title="一秒掃描整頁配色、字體、圓角與佈局骨架" style="
      background: rgba(255,255,255,0.1);
      color: #f8fafc;
      border: 1px solid rgba(255,255,255,0.2);
      padding: 7px 13px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      outline: none;
      transition: background 0.2s;
    ">
      <span>🌐</span> 萃取整頁風格
    </button>
    <button id="agy-copy-btn" style="
      background: rgba(255,255,255,0.1);
      color: #f8fafc;
      border: 1px solid rgba(255,255,255,0.2);
      padding: 7px 13px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      outline: none;
      transition: background 0.2s;
    ">
      <span>📋</span> 複製便條紙 (<span id="agy-count">0</span>)
    </button>
    <button id="agy-exit-btn" title="完全離開並關閉工具" style="
      background: rgba(255,255,255,0.08);
      color: #94a3b8;
      border: 1px solid rgba(255,255,255,0.12);
      width: 28px;
      height: 28px;
      border-radius: 50%;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 2px;
      outline: none;
      transition: all 0.15s ease;
    ">✕</button>
  `;
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
    if (notes.length > 0) {
      if (!confirm(`目前畫面上還有 ${notes.length} 張便條紙尚未複製，確定要完全關閉嗎？`)) {
        return;
      }
    }
    closeDialog();
    fixedRoot.remove();
    scrollRoot.remove();
    document.body.style.cursor = '';
    window.__AGY_STICKY_LOADED__ = false;
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
      document.body.style.cursor = '';
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
  }, true);

  window.addEventListener('scroll', () => {
    if (!isAnnotating) return;
    if (currentTarget) updateHoverBox(currentTarget);
  }, { passive: true });

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
  }, true);

  function closeDialog() {
    const existing = document.getElementById('agy-active-dialog');
    if (existing) existing.remove();
  }

  // 6. 便條紙輸入卡片
  function openStickyDialog(target, pageX, pageY, clientX, clientY, editNoteId = null) {
    closeDialog();
    currentTarget = target;
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

    const breadcrumbsHtml = ancestorsList.map((node, index) => {
      const isSelected = node === currentTarget;
      const tag = node.tagName.toLowerCase();
      const rawClass = getSafeClassName(node);
      const firstClass = rawClass ? '.' + rawClass.split(/\s+/)[0] : '';
      const label = `${tag}${firstClass}`;
      return `
        <button class="agy-crumb-btn" data-index="${index}" style="
          background: ${isSelected ? '#f59e0b' : '#1e293b'};
          color: ${isSelected ? '#0f172a' : '#94a3b8'};
          border: 1px solid ${isSelected ? '#f59e0b' : '#334155'};
          font-weight: ${isSelected ? '700' : '500'};
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 11px;
          cursor: pointer;
          max-width: 90px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          outline: none;
        ">${label}</button>
      `;
    }).reverse().join('<span style="color:#64748b;font-size:10px;">➔</span>');

    const initialText = editNoteId ? (notes.find(n => n.id === editNoteId)?.text || '') : '';

    dialog.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:12px;font-weight:700;color:#f59e0b;display:flex;align-items:center;gap:4px;">
          📌 ${editNoteId ? '編輯便條紙 #' + editNoteId : '貼上新便條紙'}
        </span>
        <span style="font-size:11px;color:#94a3b8;">自由填寫任何想法</span>
      </div>
      <div style="font-size:11px;color:#cbd5e1;margin-bottom:8px;background:#1e293b;padding:5px 8px;border-radius:6px;word-break:break-all;">
        位置錨點：<span id="agy-selected-tag" style="color:#fbbf24;font-family:monospace;font-weight:600;">${getReadableSelector(currentTarget)}</span>
      </div>
      ${ancestorsList.length > 1 ? `
        <div style="font-size:10px;color:#94a3b8;margin-bottom:4px;">切換外層容器：</div>
        <div id="agy-crumbs" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:10px;">
          ${breadcrumbsHtml}
        </div>
      ` : ''}
      <textarea id="agy-note-input" placeholder="隨心所欲敘述任何內容，例如：&#10;• 這裡想插入一排用戶評價星級&#10;• 這個按鈕改深紫漸層並加大圓角&#10;• 這整塊空白處太寬，縮小間距" style="
        width: 100%;
        box-sizing: border-box;
        height: 84px;
        background: #020617;
        color: white;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 8px 10px;
        font-size: 13px;
        line-height: 1.45;
        resize: none;
        outline: none;
      ">${initialText}</textarea>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px;">
        <button id="agy-cancel-btn" style="background:transparent;color:#94a3b8;border:none;font-size:12px;cursor:pointer;padding:5px 10px;">取消</button>
        <button id="agy-save-btn" style="background:#f59e0b;color:#0f172a;border:none;border-radius:6px;font-size:12px;font-weight:700;padding:6px 15px;cursor:pointer;">
          ${editNoteId ? '更新便條紙' : '📌 釘上便條紙'}
        </button>
      </div>
    `;

    fixedRoot.appendChild(dialog);

    const textarea = dialog.querySelector('#agy-note-input');
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
        updateNote(editNoteId, text);
      } else {
        createStickyPin(currentTarget, getReadableSelector(currentTarget), text, pageX, pageY);
      }
      closeDialog();
    });
  }

  // 7. 釘在網頁上的精美便條紙圖釘（展開態與編輯/刪除）
  function createStickyPin(target, selector, text, pageX, pageY) {
    const id = notes.length + 1;
    const pin = document.createElement('div');
    pin.className = 'agy-sticky-pin';
    pin.style.cssText = `
      position: absolute;
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
    previewCard.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;border-bottom:1px solid #334155;padding-bottom:4px;">
        <span style="font-weight:700;color:#fbbf24;">📌 便條紙 #${id}</span>
        <div style="display:flex;gap:6px;">
          <button class="agy-card-edit-btn" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;font-size:11px;">✏️ 編輯</button>
          <button class="agy-card-del-btn" style="background:transparent;border:none;color:#ef4444;cursor:pointer;font-size:11px;">🗑️ 刪除</button>
        </div>
      </div>
      <div style="font-size:10px;color:#94a3b8;margin-bottom:4px;word-break:break-all;">位置：${selector}</div>
      <div class="agy-card-text" style="white-space:pre-wrap;color:#e2e8f0;">${text}</div>
    `;
    pin.appendChild(previewCard);

    let hideTimer = null;
    pin.addEventListener('mouseenter', () => {
      clearTimeout(hideTimer);
      previewCard.style.display = 'block';
    });
    pin.addEventListener('mouseleave', () => {
      hideTimer = setTimeout(() => {
        previewCard.style.display = 'none';
      }, 250);
    });

    previewCard.querySelector('.agy-card-edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openStickyDialog(target, pageX, pageY, pageX - window.scrollX, pageY - window.scrollY, id);
    });

    previewCard.querySelector('.agy-card-del-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteNote(id);
    });

    const item = { id, target, selector, text, pageX, pageY, pinEl: pin, previewCard };
    notes.push(item);
    countSpan.innerText = notes.length;

    scrollRoot.appendChild(pin);
    showToast(`✅ 已釘上便條紙 #${id}`, '#f59e0b');
  }

  function updateNote(id, newText) {
    const item = notes.find(n => n.id === id);
    if (!item) return;
    item.text = newText;
    const cardText = item.previewCard.querySelector('.agy-card-text');
    if (cardText) cardText.innerText = newText;
    showToast(`✅ 已更新便條紙 #${id}`, '#f59e0b');
  }

  function deleteNote(id) {
    const item = notes.find(n => n.id === id);
    if (!item) return;
    item.pinEl.remove();
    notes = notes.filter(n => n.id !== id);
    countSpan.innerText = notes.length;
    showToast(`🗑️ 已刪除便條紙 #${id}`);
  }

  // 8. 複製便條紙清單 (雙軌格式)
  copyBtn.addEventListener('click', () => {
    if (notes.length === 0) {
      showToast('目前尚無便條紙，請先在畫面上點擊釘上想法！', '#d97706');
      return;
    }

    const env = getEnvironmentContext();
    let text = `${env.header}\n\n`;

    notes.forEach((item, index) => {
      text += `📌 **便條紙 #${index + 1}**（位置錨點：\`${item.selector}\`）\n`;
      text += `> 「${item.text.replace(/\n/g, '\n> ')}」\n\n`;
    });

    if (env.isLocal) {
      text += `請依據上述便條紙內容與位置錨點，配合我當前的對話指令（如：/plan 規劃、修改實作、架構評估等）進行處理。`;
    } else {
      text += `請參考此網站之視覺質感與上述便條紙期望，配合我當前的對話指令進行處理。`;
    }

    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 已複製便條紙清單！請在 Antigravity 對話框 Ctrl+V 發送');
    }).catch(() => {
      prompt('請手動複製以下便條紙清單：', text);
    });
  });

  // 9. 🌐 一鍵萃取全頁設計風格 (Theme Extractor Algorithm)
  themeBtn.addEventListener('click', () => {
    showToast('🔍 正在掃描全頁 Design Tokens...', '#3b82f6');
    setTimeout(extractFullPageTheme, 100);
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

    navigator.clipboard.writeText(themeMarkdown).then(() => {
      showToast('✨ 已成功萃取全頁設計系統！已複製至剪貼簿', '#059669');
    }).catch(() => {
      prompt('請手動複製以下全頁設計風格：', themeMarkdown);
    });
  }

  // 10. 動畫樣式
  const style = document.createElement('style');
  style.innerText = `
    @keyframes agy-pop {
      0% { transform: scale(0.3); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
})();
