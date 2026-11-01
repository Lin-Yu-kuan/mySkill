/**
 * Antigravity Frontend Annotator Overlay (v2.1)
 * 輕量級視覺標註腳本：零外部依賴、相容 CSP、精準 DOM 階層麵包屑、視窗滾動對齊、支援一鍵徹底關閉 (✕)
 */
(function () {
  if (window.__AGY_ANNOTATOR_LOADED__) {
    // 若已載入，直接切換標註狀態
    const toggle = document.getElementById('agy-toggle-btn');
    if (toggle) toggle.click();
    return;
  }
  window.__AGY_ANNOTATOR_LOADED__ = true;

  let isAnnotating = false;
  let annotations = [];
  let currentTarget = null;
  let ancestorsList = [];

  // 1. 建立 UI 根容器
  // 固定視窗層（工具列、高亮框、吐司、留言彈窗）
  const fixedRoot = document.createElement('div');
  fixedRoot.id = 'agy-fixed-root';
  fixedRoot.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999999;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
  document.body.appendChild(fixedRoot);

  // 頁面滾動層（圖釘跟隨頁面內容滾動）
  const scrollRoot = document.createElement('div');
  scrollRoot.id = 'agy-scroll-root';
  scrollRoot.style.cssText = 'position:absolute;top:0;left:0;width:100%;min-height:100%;pointer-events:none;z-index:9999990;';
  document.body.appendChild(scrollRoot);

  // 懸停高亮框
  const hoverBox = document.createElement('div');
  hoverBox.style.cssText = 'position:fixed;pointer-events:none;border:2px dashed #2563eb;background:rgba(37,99,235,0.12);display:none;z-index:10000000;border-radius:4px;box-sizing:border-box;transition:top 0.04s ease, left 0.04s ease, width 0.04s ease, height 0.04s ease;';
  fixedRoot.appendChild(hoverBox);

  // 懸浮工具列
  const toolbar = document.createElement('div');
  toolbar.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(15, 23, 42, 0.94);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    padding: 7px 12px;
    border-radius: 9999px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    pointer-events: auto;
    z-index: 10000005;
    user-select: none;
    transition: transform 0.2s ease;
  `;
  toolbar.innerHTML = `
    <button id="agy-toggle-btn" style="
      background: #2563eb;
      color: white;
      border: none;
      padding: 7px 15px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(37,99,235,0.4);
      outline: none;
    ">
      <span>🎯</span> <span id="agy-btn-text">開啟標註模式</span>
    </button>
    <button id="agy-copy-btn" style="
      background: rgba(255,255,255,0.12);
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
    ">
      <span>📋</span> 複製需求 (<span id="agy-count">0</span>)
    </button>
    <button id="agy-exit-btn" title="完全關閉並離開標註工具" style="
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
    box-shadow: 0 4px 20px rgba(0,0,0,0.35);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.25s ease, transform 0.25s ease;
    z-index: 10000020;
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
    }, 2400);
  }

  const toggleBtn = toolbar.querySelector('#agy-toggle-btn');
  const btnText = toolbar.querySelector('#agy-btn-text');
  const copyBtn = toolbar.querySelector('#agy-copy-btn');
  const countSpan = toolbar.querySelector('#agy-count');
  const exitBtn = toolbar.querySelector('#agy-exit-btn');

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

  // 完全退出與關閉
  exitBtn.addEventListener('click', () => {
    if (annotations.length > 0) {
      if (!confirm(`目前畫面上還有 ${annotations.length} 個標註尚未複製，確定要完全關閉標註工具嗎？`)) {
        return;
      }
    }
    // 清除狀態與 DOM
    closeDialog();
    fixedRoot.remove();
    scrollRoot.remove();
    document.body.style.cursor = '';
    window.__AGY_ANNOTATOR_LOADED__ = false;
  });

  // 切換模式
  toggleBtn.addEventListener('click', () => {
    isAnnotating = !isAnnotating;
    if (isAnnotating) {
      toggleBtn.style.background = '#dc2626';
      toggleBtn.style.boxShadow = '0 2px 8px rgba(220,38,38,0.4)';
      btnText.innerText = '退出標註模式';
      document.body.style.cursor = 'crosshair';
      showToast('🎯 標註模式已開啟：點選畫面上任何元件即可留言');
    } else {
      toggleBtn.style.background = '#2563eb';
      toggleBtn.style.boxShadow = '0 2px 8px rgba(37,99,235,0.4)';
      btnText.innerText = '開啟標註模式';
      document.body.style.cursor = '';
      hoverBox.style.display = 'none';
      closeDialog();
    }
  });

  // 更新懸停高亮框
  function updateHoverBox(el) {
    if (!el || !isAnnotating) {
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

  // 滑鼠移動事件
  document.addEventListener('mousemove', (e) => {
    if (!isAnnotating) return;
    if (fixedRoot.contains(e.target) || scrollRoot.contains(e.target)) {
      return;
    }
    const target = e.target;
    if (target === document.body || target === document.documentElement) {
      hoverBox.style.display = 'none';
      return;
    }
    updateHoverBox(target);
  }, true);

  // 頁面滾動時若有目前選取元素，更新高亮框
  window.addEventListener('scroll', () => {
    if (!isAnnotating) return;
    if (currentTarget) updateHoverBox(currentTarget);
  }, { passive: true });

  // 取得安全的 className（支援 SVG / 一般元素）
  function getSafeClassName(el) {
    if (!el) return '';
    if (typeof el.className === 'string') {
      return el.className.trim();
    }
    if (el.className && typeof el.className.baseVal === 'string') {
      return el.className.baseVal.trim();
    }
    return '';
  }

  // 產生語意化簡潔選擇器標籤
  function getReadableSelector(el) {
    if (!el) return '';
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    let classSnippet = '';
    const rawClass = getSafeClassName(el);
    if (rawClass) {
      const parts = rawClass.split(/\s+/).filter(c => !c.startsWith('agy-') && c.length < 30).slice(0, 2);
      if (parts.length > 0) classSnippet = '.' + parts.join('.');
    }
    const textSnippet = el.innerText && el.innerText.trim() ? ` "${el.innerText.trim().slice(0, 14)}"` : '';
    return `<${tag}${id}${classSnippet}>${textSnippet}`;
  }

  // 取得父層階層鏈（Ancestors）供麵包屑切換
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

  // 點擊新增標註
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

    openCommentDialog(currentTarget, clickPageX, clickPageY, clickClientX, clickClientY);
  }, true);

  function closeDialog() {
    const existing = document.getElementById('agy-active-dialog');
    if (existing) existing.remove();
  }

  // 彈出留言視窗（含階層麵包屑選取）
  function openCommentDialog(target, pageX, pageY, clientX, clientY) {
    closeDialog();
    currentTarget = target;
    updateHoverBox(currentTarget);

    const dialog = document.createElement('div');
    dialog.id = 'agy-active-dialog';

    // 視窗定位計算（防止超出螢幕）
    let top = clientY + 12;
    let left = clientX + 12;
    if (left + 320 > window.innerWidth) left = window.innerWidth - 330;
    if (top + 260 > window.innerHeight) top = clientY - 260;
    if (top < 10) top = 10;
    if (left < 10) left = 10;

    dialog.style.cssText = `
      position: fixed;
      top: ${top}px;
      left: ${left}px;
      width: 310px;
      background: #0f172a;
      color: #f8fafc;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 14px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
      pointer-events: auto;
      z-index: 10000010;
      font-size: 13px;
    `;

    // 產生麵包屑按鈕 HTML
    const breadcrumbsHtml = ancestorsList.map((node, index) => {
      const isSelected = node === currentTarget;
      const tag = node.tagName.toLowerCase();
      const rawClass = getSafeClassName(node);
      const firstClass = rawClass ? '.' + rawClass.split(/\s+/)[0] : '';
      const label = `${tag}${firstClass}`;
      return `
        <button class="agy-crumb-btn" data-index="${index}" style="
          background: ${isSelected ? '#2563eb' : '#1e293b'};
          color: ${isSelected ? 'white' : '#94a3b8'};
          border: 1px solid ${isSelected ? '#3b82f6' : '#334155'};
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

    dialog.innerHTML = `
      <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:6px;">
        🎯 目標層級選取 (點擊可切換外層容器)：
      </div>
      <div id="agy-crumbs" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:10px;">
        ${breadcrumbsHtml}
      </div>
      <div style="font-size:11px;color:#cbd5e1;margin-bottom:8px;background:#1e293b;padding:5px 8px;border-radius:6px;word-break:break-all;">
        已選定：<span id="agy-selected-tag" style="color:#60a5fa;font-family:monospace;font-weight:600;">${getReadableSelector(currentTarget)}</span>
      </div>
      <textarea id="agy-note-input" placeholder="請填寫此處的修改意見（例如：按鈕顏色改深藍、加大邊框圓角...）" style="
        width: 100%;
        box-sizing: border-box;
        height: 75px;
        background: #020617;
        color: white;
        border: 1px solid #334155;
        border-radius: 6px;
        padding: 8px 10px;
        font-size: 13px;
        line-height: 1.4;
        resize: none;
        outline: none;
      "></textarea>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px;">
        <button id="agy-cancel-btn" style="background:transparent;color:#94a3b8;border:none;font-size:12px;cursor:pointer;padding:5px 10px;">取消</button>
        <button id="agy-save-btn" style="background:#2563eb;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;padding:6px 14px;cursor:pointer;">儲存標註</button>
      </div>
    `;

    fixedRoot.appendChild(dialog);

    const textarea = dialog.querySelector('#agy-note-input');
    textarea.focus();

    // 點擊麵包屑切換目標
    const crumbBtns = dialog.querySelectorAll('.agy-crumb-btn');
    crumbBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        currentTarget = ancestorsList[idx];
        dialog.querySelector('#agy-selected-tag').innerText = getReadableSelector(currentTarget);
        updateHoverBox(currentTarget);

        crumbBtns.forEach(b => {
          const isThis = b === btn;
          b.style.background = isThis ? '#2563eb' : '#1e293b';
          b.style.color = isThis ? 'white' : '#94a3b8';
          b.style.borderColor = isThis ? '#3b82f6' : '#334155';
        });
      });
    });

    dialog.querySelector('#agy-cancel-btn').addEventListener('click', closeDialog);
    dialog.querySelector('#agy-save-btn').addEventListener('click', () => {
      const note = textarea.value.trim();
      if (!note) {
        showToast('請輸入修改需求', '#d97706');
        return;
      }
      createPin(currentTarget, getReadableSelector(currentTarget), note, pageX, pageY);
      closeDialog();
    });
  }

  // 建立標記圓點（置於 scrollRoot 中，隨頁面平滑滾動）
  function createPin(target, selector, note, pageX, pageY) {
    const id = annotations.length + 1;
    const pin = document.createElement('div');
    pin.style.cssText = `
      position: absolute;
      top: ${pageY - 14}px;
      left: ${pageX - 14}px;
      width: 28px;
      height: 28px;
      background: #dc2626;
      color: white;
      border: 2px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      pointer-events: auto;
      cursor: pointer;
      z-index: 10000002;
      animation: agy-pop 0.2s ease-out;
    `;
    pin.innerText = id;
    pin.title = `[標註 #${id}] ${note} (點擊可查看或刪除)`;

    const item = { id, target, selector, note, pageX, pageY, pinEl: pin };
    annotations.push(item);
    countSpan.innerText = annotations.length;

    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`標註 #${id}：\n「${note}」\n\n是否刪除此標註？`)) {
        pin.remove();
        annotations = annotations.filter(a => a.id !== id);
        countSpan.innerText = annotations.length;
      }
    });

    scrollRoot.appendChild(pin);
    showToast(`✅ 已新增標註 #${id}`);
  }

  // 複製格式化 Markdown 指令
  copyBtn.addEventListener('click', () => {
    if (annotations.length === 0) {
      showToast('目前尚無標註，請先在畫面上點擊留下筆記！', '#d97706');
      return;
    }

    let text = `請根據以下畫面上的視覺標註進行修改：\n\n`;
    annotations.forEach((item, index) => {
      text += `- **[標註 #${index + 1}]** 目標元素：\`${item.selector}\`\n  - **修改要求**：${item.note}\n`;
    });
    text += `\n請保持其餘版面設計規範一致，直接更新程式碼。`;

    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 已複製修改需求！請在 Antigravity 對話框 Ctrl+V 發送');
    }).catch(() => {
      prompt('請手動複製以下修改需求：', text);
    });
  });

  // 動畫樣式
  const style = document.createElement('style');
  style.innerText = `
    @keyframes agy-pop {
      0% { transform: scale(0.4); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
})();
