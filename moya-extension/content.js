// 크롬 익스텐션에서 보낸 메시지를 받아서 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "ADD_TEXT" && request.text) {
    // 페이지에 텍스트 추가 이벤트 전달
    window.postMessage({
      type: "MOYA_ADD_TEXT",
      text: request.text
    }, "*");

    sendResponse({ success: true });
  }
  return true;
});
