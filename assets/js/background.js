// background.js
let pizzas = [];

// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "capture") {
    // 使用chrome.tabs.captureVisibleTab方法捕获当前标签页的可见内容（即截图）
    chrome.tabs
      .captureVisibleTab(null, { format: "png" })
      .then((dataUrl) => {
        sendResponse(dataUrl);
      })
      .catch((err) => {
        sendResponse();
        console.log(err);
      });
    return true; // 返回true以确保在sendResponse异步回调之前不会关闭消息通道
  } else if (request.action === "saveImg") {
    pizzas.push(request.dataUrl);
    sendResponse();
  } else if (request.action === "showResult") {
    const url = chrome.runtime.getURL("result.html");
    // 先改变窗口状态: 最大化窗口状态
    chrome.windows.getCurrent({}, (w) => {
      chrome.windows.update(w.id, { state: "maximized" }, () => {
        // 打开result页面
        chrome.tabs.create({ url });
      });
    });
    sendResponse("done");
  } else if (request.action === "showPizza") {
    // 先改变窗口状态: 最大化窗口状态
    chrome.windows.getCurrent({}, (w) => {
      chrome.windows.update(w.id, { state: "maximized" }, () => {
        const timer = setInterval(() => {
          chrome.runtime.sendMessage({
            action: "resultInfo",
            pizza: pizzas.shift(),
          });
          if (pizzas.length === 0) {
            clearInterval(timer);
            chrome.runtime.sendMessage({ action: "resultDone" });
          }
        }, 100);
      });
    });
    sendResponse("done");
  }
});
