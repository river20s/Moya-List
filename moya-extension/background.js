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

    // 현재 페이지의 URL 가져오기
    const pageUrl = encodeURIComponent(tab.url);

    // 로컬 주소 + 쿼리 파라미터(?text=...&url=...)
    const targetUrl = `http://localhost:5174/?text=${text}&url=${pageUrl}`;

    // 기존 탭 찾기
    chrome.tabs.query({ url: "http://localhost:5174/*" }, (tabs) => {
      if (tabs.length > 0) {
        // MoyaList 탭이 이미 열려있으면 해당 탭으로 전환하고 URL 업데이트
        chrome.tabs.update(tabs[0].id, {
          active: true,
          url: targetUrl
        });
        // 해당 탭이 있는 윈도우로 포커스
        chrome.windows.update(tabs[0].windowId, { focused: true });
      } else {
        // MoyaList 탭이 없으면 새 탭 열기
        chrome.tabs.create({ url: targetUrl });
      }
    });
  }
});