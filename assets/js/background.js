// background.js
let ppts = [];
let prevURL = "";
// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "capture") {
    // 使用chrome.tabs.captureVisibleTab方法捕获当前标签页的可见内容（即截图）
    chrome.tabs
      .captureVisibleTab(null, { format: "png" })
      .then((dataUrl) => {
        if (dataUrl !== prevURL) {
          sendResponse(dataUrl);
          ppts.push(dataUrl);
          prevURL = dataUrl;
        } else {
          sendResponse("again");
        }
      })
      .catch((err) => {
        sendResponse();
        console.log(err);
      });
    return true; // 返回true以确保在sendResponse异步回调之前不会关闭消息通道
  } else if (request.action === "setWindowSize") {
    // 变更窗口大小
    setWindows(request, sendResponse);
    return true;
  } else if (request.action === "showResult") {
    const url = chrome.runtime.getURL("result.html");
    // 先改变窗口状态: 最大化窗口状态
    chrome.windows.getCurrent({}, (w) => {
      chrome.windows.update(w.id, { state: "maximized" }, () => {
        // 下发到新开的页面里
        chrome.tabs.create({ url }, () => {
          const timer = setInterval(() => {
            chrome.runtime.sendMessage({
              action: "resultInfo",
              ppt: ppts.shift(),
            });
            if (ppts.length === 0) {
              clearInterval(timer);
              chrome.runtime.sendMessage({ action: "resultDone" });
            }
          }, 100);
        });
      });
    });
    sendResponse("done");
  }
});

function setWindows({ step, menuH, width }, cb) {
  // 变更窗口大小
  chrome.windows.getCurrent({}, async (w) => {
    // 切换窗口 - 标题栏高122 - 这块需要动态计算出
    // Edge正常，Chrome有问题: 设置的height对不上...
    if (w.state !== "normal") {
      await chrome.windows.update(
        w.id,
        // Tip: 在窗口最大化的时候无效...所以窗口的state要设置为 normal
        { state: "normal" }
      );
    }

    await chrome.windows.update(w.id, {
      width,
      height: Math.round(step + menuH),
    });

    cb && cb("set window done");
  });
}
