async function launch(tab) {
  if (!tab?.id) return;
  try {
    if (!tab.url || !/^(https?|file):/.test(tab.url)) {
      throw new Error('這是 Chrome 內建或受限制的頁面。請切換到一般網站後，再點擴充功能。');
    }
    if (tab.url.startsWith('file:') && !await chrome.extension.isAllowedFileSchemeAccess()) {
      throw new Error('請在擴充功能詳細資料開啟「允許存取檔案網址」，再標註本機 HTML。');
    }
    const [existing] = await chrome.scripting.executeScript({
      target: { tabId: tab.id }, world: 'ISOLATED',
      func: () => !!document.getElementById('agy-main-toolbar')
    });
    if (!existing?.result) {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, world: 'ISOLATED', files: ['annotator-overlay.js'] });
    }
    const [check] = await chrome.scripting.executeScript({
      target: { tabId: tab.id }, world: 'ISOLATED',
      func: () => !!document.getElementById('agy-main-toolbar')
    });
    if (!check?.result) throw new Error('工具列未成功建立，請重新整理頁面後重試。');
    await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#059669' });
    await chrome.action.setBadgeText({ tabId: tab.id, text: '✓' });
  } catch (error) {
    await chrome.action.setBadgeText({ tabId: tab.id, text: '!' }).catch(() => {});
    await chrome.tabs.create({ url: chrome.runtime.getURL('status.html') + '#' + encodeURIComponent(error?.message || String(error)) });
  }
}
chrome.action.onClicked.addListener(launch);
