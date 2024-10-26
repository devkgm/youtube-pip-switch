chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	// URL이 변경되었는지 확인
	if (changeInfo.url) {
		// 컨텐츠 스크립트에 메시지 보내기
		chrome.tabs
			.sendMessage(tabId, {
				message: "url_updated",
				url: changeInfo.url,
			})
			.catch((error) => {
				console.log("메세지 전송 실패:", error);
			});
	}
});
