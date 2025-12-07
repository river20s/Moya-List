chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-moya",
    title: "MoyaList에 등록: \"%s\"",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-to-moya" && info.selectionText) {
    const text = info.selectionText;

    // 기존에 열려있는 MoyaList 탭 찾기
    const tabs = await chrome.tabs.query({ url: "http://localhost:5173/*" });

    if (tabs.length > 0) {
      // 이미 열려있는 탭이 있으면 그 탭으로 포커스 이동
      await chrome.tabs.update(tabs[0].id, { active: true });

      // 탭에 메시지 전송하여 텍스트 추가
      try {
        await chrome.tabs.sendMessage(tabs[0].id, {
          type: "ADD_TEXT",
          text: text
        });
      } catch (error) {
        console.error("Failed to send message:", error);
        // 메시지 전송 실패 시 URL 파라미터 방식으로 폴백
        const encodedText = encodeURIComponent(text);
        await chrome.tabs.update(tabs[0].id, {
          url: `http://localhost:5173/?text=${encodedText}`
        });
      }
    } else {
      // 열려있는 탭이 없으면 새 탭 열기
      const encodedText = encodeURIComponent(text);
      chrome.tabs.create({ url: `http://localhost:5173/?text=${encodedText}` });
    }
  }
});