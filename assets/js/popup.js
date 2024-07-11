const stepValue = document.getElementById("stepV");
const speedValue = document.getElementById("speed");

function setValue(step, speed) {
  stepValue.value = step;
  if (speed) {
    speedValue.value = speed;
  }
}

// popup已出现就 显示工具栏
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  // 传给tab
  chrome.tabs.sendMessage(tabs[0].id, { action: "tools" });
});

document.addEventListener("DOMContentLoaded", function () {
  chrome.tabs.query(
    { active: true, currentWindow: true },
    async function (tabs) {
      try {
        // 传给tab -- 获取step 和 speed
        const [step, speed] = await chrome.tabs.sendMessage(tabs[0].id, {
          action: "init",
        });
        setValue(step || 0, speed);
      } catch (error) {
        console.log(error);
      }
    }
  );

  // 微调参考线
  stepValue.addEventListener("change", function (e) {
    const step = e.target.value;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "modify", step });
    });
  });

  // 调整切图速度
  speedValue.addEventListener("change", function (e) {
    const speed = e.target.value;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "setspeed", speed });
    });
  });

  // 参考线
  document.getElementById("ruler").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // 传给tab
      chrome.tabs.sendMessage(tabs[0].id, { action: "ruler" });
    });
  });

  // 提取PPT
  document.getElementById("PPT").addEventListener("click", function () {
    const step = +stepValue.value;
    if (!step) return alert("请先放置参考线！");
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "getPPTs",
        step,
      });
    });
  });

  // 显示、隐藏导航工具栏
  document.querySelector(".logo").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // 传给tab
      chrome.tabs.sendMessage(tabs[0].id, { action: "shiftState" });
    });
  });

  chrome.runtime.onMessage.addListener(function (request) {
    if (request.action === "ruler") {
      setValue(request.step);
    }
  });
});
