// content.js
// 全局引用
let menuH,
  width,
  baseRuler,
  bodyHeight = document.body.clientHeight; // body总高度
let winH = window.innerHeight; // 窗口内容高度

function createBaseRuler() {
  const oldBaseRuler = document.querySelector(".baseRuler");
  if (oldBaseRuler) document.body.removeChild(oldBaseRuler);

  const ruler = document.createElement("div");
  ruler.className = "ruler baseRuler";
  baseRuler = ruler.cloneNode(false);

  // 将标尺添加到页面中
  document.body.appendChild(baseRuler);

  // 监听鼠标移动事件，显示标尺在页面中的位置信息
  // Tips: 使用bind方法，显式地传递参数给处理函数, 这些参数会插入到调用新函数时传入的参数的前面
  const bindMove = move.bind(null, baseRuler);
  document.addEventListener("mousemove", bindMove);

  baseRuler.addEventListener(
    "click",
    () => {
      document.removeEventListener("mousemove", bindMove);

      createAddRuler(baseRuler);
      createConfirm();

      // 移动函数...
      baseRuler.onmousedown = function (e) {
        const posY = e.clientY - baseRuler.offsetTop;
        document.onmousemove = function (e) {
          setRuler(baseRuler, e.clientY - posY);
        };
        baseRuler.onmouseup = function () {
          document.onmousemove = null;
          createAddRuler(baseRuler);
        };
      };
    },
    { once: true } // listener 会在其被调用之后自动移除
  );
}

function createAddRuler(baseRuler, step) {
  step = +(step || baseRuler.getAttribute("Ydex"));

  // 先删除旧的addRuler
  (function deleteOldRuler() {
    const addrulers = Array.from(document.querySelectorAll(".addRuler"));
    addrulers.forEach((adr) => {
      document.body.removeChild(adr);
    });
  })();

  let rulerIndex = 0;
  let rulerStep = 0; // 从baseRuler的位置开始画

  // 当最后一个ruler的位置靠近bodyHeight时, 停止循环
  while (bodyHeight - rulerStep >= 30) {
    const addRuler = baseRuler.cloneNode(false);
    addRuler.setAttribute("index", rulerIndex);
    addRuler.className = "ruler addRuler";
    const newY = +addRuler.getAttribute("Ydex") + rulerStep; // 初始的 Ydex 来自于 baseRuler
    setRuler(addRuler, newY);

    // 移动函数...
    addRuler.onmousedown = function (e) {
      const originY = e.clientY;
      const posY = e.clientY - addRuler.offsetTop;
      document.onmousemove = function (e) {
        setRuler(addRuler, e.clientY - posY);
      };
      addRuler.onmouseup = function (e) {
        document.onmousemove = null;

        // 通过当前ruler的偏移量/当前ruler与baseRuler的间隔，计算出baseRuler的偏移量，即step的偏移量，直接修改step
        const index = +addRuler.getAttribute("index") || 1; // 当前 addRuler 与 baseRuler 的间隔
        const stepDiff = (e.clientY - originY) / index;
        const newStep = +baseRuler.getAttribute("Ydex") + stepDiff;
        setRuler(baseRuler, newStep); // 设置新的step
        createAddRuler(baseRuler); // 重新绘制addRuler
        // -------- Todo ---------
        // 后续应该增加配置：均分模式、非均分模式（涉及到windowSize也要动态调整
      };
    };

    document.body.appendChild(addRuler);
    rulerStep += step;
    rulerIndex++;
  }
}

function setRuler(ruler, y) {
  ruler.style.top = y + "px";
  ruler.setAttribute("Ydex", y);
}

function createNavigator() {
  // 单例模式
  if (document.querySelector(".navigator")) return false;

  const nav = document.createElement("div");
  nav.className = "navigator";
  const navTop = nav.cloneNode(false);
  const nextPage = nav.cloneNode(false);
  const prevPage = nav.cloneNode(false);
  const navBottom = nav.cloneNode(false);
  navTop.style.top = "20px";
  prevPage.style.top = "90px";
  nextPage.style.top = "160px";
  navBottom.style.top = "230px";
  navTop.innerText = "TOP";
  nextPage.innerText = "next";
  prevPage.innerText = "prev";
  navBottom.innerText = "BOT";

  // 添加点击事件
  navTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // 可选的，使滚动平滑进行
    });
  });
  nextPage.addEventListener("click", () => {
    window.scrollTo({
      top: document.documentElement.scrollTop + winH,
      behavior: "smooth",
    });
  });
  prevPage.addEventListener("click", () => {
    window.scrollTo({
      top: document.documentElement.scrollTop - winH,
      behavior: "smooth",
    });
  });
  navBottom.addEventListener("click", () => {
    window.scrollTo({
      top: bodyHeight - winH,
      behavior: "smooth", // 可选的，使滚动平滑进行
    });
  });

  // 添加到页面中
  document.body.appendChild(navTop);
  document.body.appendChild(nextPage);
  document.body.appendChild(prevPage);
  document.body.appendChild(navBottom);

  // 进入编辑态
  document.querySelector("html").className = "cutstate";
}

function toggleActor() {
  // 已经创建了则不需要再创建...
  let nav = document.querySelector(".navigator");
  if (nav) {
    const conf = nav.style.display === "block" ? "none" : "block";
    setDisplay(conf);
  } else {
    createRulerBtn();
    createNavigator();
  }
}

function createConfirm() {
  // 单例模式
  if (document.querySelector(".confirm")) return false;

  const confirm = document.createElement("div");
  confirm.className = "confirm";
  confirm.innerText = "开始截图";
  document.body.appendChild(confirm);
  confirm.addEventListener("click", getPPTs);
}

function createRulerBtn() {
  // 单例模式
  if (document.querySelector(".createRulerBtn")) return false;

  const cruler = document.createElement("div");
  cruler.className = "createRulerBtn";
  cruler.innerText = "放置参考线";
  document.body.appendChild(cruler);
  cruler.addEventListener("click", createBaseRuler);
}

// 开始截图
function getPPTs() {
  menuH = window.outerHeight - window.innerHeight;
  width = window.outerWidth;

  // Windows浏览器边缘有1px的边框
  if (window.navigator.userAgent.indexOf("Windows") !== -1) {
    width -= 1;
  }
  document.documentElement.scrollTop = 0; // 回到最初的地方

  // 触发截图操作:
  // 1.不必要的元素设置不显示 - 2.setWindowSize - 3.scroll - 4.capture - 5.showresult
  const ruler = setDisplay("none");
  const step = +ruler.getAttribute("Ydex");

  // --- 2.setWindowSize
  chrome.runtime.sendMessage(
    { action: "setWindowSize", step, menuH, width },

    // --- 3.capture ppts
    scrollToCaptrue
  );
}

function move(baseRuler, event) {
  // 获取当前页面垂直滚动的像素数
  // window.pageYOffset：大多数现代浏览器支持的属性，返回文档在垂直方向已滚动的像素值。
  // document.documentElement.scrollTop：在一些古老的浏览器中可用，返回文档在垂直方向已滚动的像素值。
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  y = event.clientY + scrollTop;
  x = event.clientX;

  const action = "ruler";
  setRuler(baseRuler, y);

  // 更新弹出页面中的位置信息
  chrome.runtime.sendMessage({ action, step: y });
}

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (
    request.action === "redirect" &&
    /consumer\/cn\/training\/course/.test(location.pathname)
  ) {
    var iframe = document.querySelector("iframe");
    window.open(iframe.src);
  } else if (request.action === "navigator") {
    // 显隐各功能按键
    toggleActor();
  } else if (request.action === "ruler") {
    // 创建标尺元素
    createBaseRuler();
    // 创建导航等工具
    createNavigator();
    createRulerBtn();
    return true;
  } else if (request.action === "getPPTs") {
    getPPTs();
    return true;
  } else if (request.action === "modify") {
    setRuler(baseRuler, request.step); // 变更baseRuler
    createAddRuler(baseRuler, request.step); // 重新生成addRuler
    return true;
  } else if (request.action === "init") {
    const ruler = document.querySelector(".addRuler");
    const step = ruler ? +ruler.getAttribute("Ydex") : 0;
    sendResponse(step);
    return true;
  } else if (request.action === "tools") {
    // 创建导航等工具
    createNavigator();
    createRulerBtn();
    return true;
  }
});

// 设置工具元素的显影
function setDisplay(conf) {
  const mapConf = {
    block: "visible",
    none: "hidden",
  };
  // NodeList 是一个类数组对象，并不直接支持像数组那样的 push 和 map 等方法
  const nav = document.querySelectorAll(".navigator");
  const ruler = document.querySelectorAll(".ruler");
  const confirm = document.querySelector(".confirm");
  const cruler = document.querySelector(".createRulerBtn");
  [...nav, ...ruler, confirm, cruler].forEach((t) => {
    if (t) {
      t.style.display = conf;
      t.style.visibility = mapConf[conf];
    }
  });
  return ruler[0];
}

async function scrollToCaptrue() {
  const addRuler = Array.from(document.querySelectorAll(".addRuler"));
  // 添加一个起始位0...
  const YArr = [
    0,
    ...addRuler.map((r) => {
      return +r.getAttribute("Ydex");
    }),
  ];

  // 先截取一张
  for (let i = 0; i < YArr.length; i++) {
    const y = YArr[i];
    // 设置50的偏移量，如果参考线到达了距页面底部 100 以内的位置，就认为到底了
    if (y >= bodyHeight - 50) break;
    // ---3. scroll
    document.documentElement.scrollTop = y;

    // ---4. capture
    const dataUrl = await chrome.runtime.sendMessage({ action: "capture" });

    // 截图发生错误, 等待再次截图
    // 出现了重复的截图, 当前截图需要再截一次
    if (!dataUrl) {
      await sleep(50);
    }
    if (!dataUrl || dataUrl === "again") {
      i--;
    }

    // 错误消息 "Unchecked runtime.lastError: This request exceeds the MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND quota."
    // 意味着你的代码在某个时间段内超过了浏览器 API 调用的频率限制，具体是关于捕获可见标签页的调用。
    // 如果你是在开发 Chrome 浏览器的扩展程序，这可能是因为你的扩展在短时间内频繁地尝试捕获当前可见的标签页，超出了浏览器对该操作的限制。
    // 为了解决这个问题，你可以尝试减少捕获可见标签页的调用频率，例如增加调用之间的间隔时间，优化你的代码逻辑以减少不必要的调用，或者重新审视你的扩展的设计以避免这种频繁调用的情况发生。
  }

  setDisplay("block"); // 重新进入编辑态...

  // ---5. show result
  chrome.runtime.sendMessage({ action: "showResult" });
}

function sleep(t) {
  return new Promise((res) => {
    setTimeout(res, t);
  });
}

window.addEventListener("resize", function () {
  bodyHeight = document.body.clientHeight; // body总高度
  winH = window.innerHeight; // 窗口内容高度
});
