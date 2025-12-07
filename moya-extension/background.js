chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-moya",
    title: "MoyaList에 등록: \"%s\"",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-to-moya" && info.selectionText) {
    // 선택한 텍스트를 인코딩 (특수문자 깨짐 방지)
    const text = encodeURIComponent(info.selectionText);
    
    // 로컬 주소 + 쿼리 파라미터(?text=...)
    const targetUrl = `http://localhost:5173/?text=${text}`;
    
    // 새 탭 열기
    chrome.tabs.create({ url: targetUrl });
  }
});