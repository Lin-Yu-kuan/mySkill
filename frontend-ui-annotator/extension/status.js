try {
  document.getElementById('reason').textContent = decodeURIComponent(location.hash.slice(1)) || '無法取得啟動結果。';
} catch {
  document.getElementById('reason').textContent = '無法讀取錯誤內容。';
}
