// content.js
// 全局引用
let baseRuler; // 参考线基线
let captureSpeed = 400; // 截屏间隔，默认400ms
let bodyHeight = document.body.clientHeight; // body总高度
let winH = window.innerHeight; // 窗口内容高度
let winW = window.innerWidth; // 窗口内容宽度
let ratio = 1; // 截图尺寸与视窗尺寸的转换比例 image.width / winW;
let winHS = winH; // 转换比例后的窗口内容高度
let winWS = winW; // 转换比例后窗口内容宽度
let adMode = "evenly"; // evenly: 均匀模式、afterward: 后向调整模式、freely: 自由调整模式
let originFixedEles = []; // 页面中原有的fixed元素

function query(query) {
  return document.querySelector(query);
}

function queryAll(query) {
  return document.querySelectorAll(query);
}

function create(tag) {
  return document.createElement(tag);
}

function documentBind(action, fn) {
  document.addEventListener(action, fn);
}

function documentUnbind(action, fn) {
  document.removeEventListener(action, fn);
}

function appendBody(ele) {
  document.body.appendChild(ele);
}

function createBaseRuler() {
  const oldBaseRuler = query(".baseRuler");
  if (oldBaseRuler) oldBaseRuler.remove();

  // 创建基准参考线
  const $baseRuler = $(`
    <div class="PizzaRuler baseRuler">
      <div class="rulerBtn"><span class="drag">drag</span></div>
    </div>
  `);

  // 将参考线添加到页面中
  $("body").append($baseRuler);

  const baseRuler = query(".baseRuler");
  const $dragBtn = $baseRuler.find(".drag");

  // 监听鼠标移动事件，显示参考线在页面中的位置信息
  // Tips: 使用bind方法，显式地传递参数给处理函数, 这些参数会插入到调用新函数时传入的参数的前面
  const bindMove = move.bind(null, baseRuler);
  documentBind("mousemove", bindMove);

  // 将click事件绑定在baseRuler本身，解决点击页面中的“放置参考线”按钮导致卡死的问题...
  $baseRuler.one("click", () => {
    documentUnbind("mousemove", bindMove);
    createAddRuler(baseRuler);
    createConfirm();

    // 移动函数...
    $dragBtn.on("mousedown", (ed) => {
      const posY = ed.clientY - baseRuler.offsetTop;
      document.onmousemove = function (em) {
        setRuler(baseRuler, em.clientY - posY);
      };

      // 给document添加一次性的 mouseUp 函数, 优化拖拽交互体验...
      document.addEventListener(
        "mouseup",
        () => {
          document.onmousemove = null;
          // 自由模式下, 不用处理 addRuler
          if (adMode !== "freely") {
            createAddRuler(baseRuler);
          }
        },
        { once: true }
      );
    });
  });
}

function createAddRuler(baseRuler, step) {
  step = +(step || baseRuler.getAttribute("Ydex"));

  // 先删除旧的addRuler
  $(".addRuler").remove();

  let rulerIndex = 0;
  let rulerStep = step;

  // 当最后一个ruler的位置靠近bodyHeight时, 停止循环
  while (bodyHeight - rulerStep >= 30) {
    const addRuler = baseRuler.cloneNode(true);
    addRuler.setAttribute("index", rulerIndex);
    addRuler.className = "PizzaRuler addRuler";

    // 添加delbtn
    const $delBtn = $(`<span class="del">del</span>`);
    const $addBtn = $(`<span class="add">add</span>`);
    const $addRuler = $(addRuler);
    $addRuler.find(".rulerBtn").prepend($addBtn, $delBtn);

    const newY = +addRuler.getAttribute("Ydex") + rulerStep; // 初始的 Ydex 来自于 baseRuler
    setRuler(addRuler, newY);

    // -------- Todo ---------
    // windowReSize也要动态调整参考线位置...

    // drag event

    const $dragBtn = $addRuler.find(".drag");
    $dragBtn.on("mousedown", (ed) => {
      const $Ruler = $(ed.target).parents(".addRuler");
      const originY = ed.clientY;
      const posY = ed.clientY - $Ruler.offset().top;
      document.onmousemove = function (em) {
        setRuler($Ruler.get(0), em.clientY - posY);
      };

      // 给document添加一次性的 mouseUp 函数, 优化拖拽交互体验...
      document.addEventListener(
        "mouseup",
        (eu) => {
          document.onmousemove = null;

          // 均匀模式下
          if (adMode === "evenly") {
            // 通过当前ruler的偏移量/当前ruler与baseRuler的间隔，计算出baseRuler的偏移量，即step的偏移量，直接修改step
            const index = +$Ruler.attr("index") || 1; // 当前 addRuler 与 baseRuler 的间隔
            const stepDiff = (eu.clientY - originY) / index;
            const newStep = +baseRuler.getAttribute("Ydex") + stepDiff;
            setRuler(baseRuler, newStep); // 设置新的step
            createAddRuler(baseRuler); // 重新绘制addRuler
          } else if (adMode === "afterward") {
            // 必须基于当前按钮的父级参考线元素进行操作
            const $addRuler = $(eu.target).parents(".PizzaRuler");
            // 按照给定的step, 对平移当前参考线后续的所有参考线...
            const BY = +$addRuler.attr("Ydex");

            // ==== 微调其后的所有ruler ====
            (function () {
              // 找出所有的跟随者
              const fellows = Array.from(
                document.querySelectorAll(".addRuler")
              ).filter((a) => {
                const AY = +a.getAttribute("Ydex");
                return AY > BY;
              });

              // 微调 --- 从被调整的ruler中，继续按照设定的 step 来调整 top 值
              fellows.reduce((a, c) => {
                const n = a + step;
                setRuler(c, n);
                return n;
              }, BY);
            })();
          }
        },
        { once: true }
      );
    });

    // del event
    $delBtn.on("click", (e) => {
      // 必须基于当前按钮的父级参考线元素进行操作
      const $Ruler = $(e.target).parents(".addRuler");
      $Ruler.remove();
    });

    // add event
    $addBtn.on("click", (e) => {
      // 必须基于当前按钮的父级参考线元素进行操作
      const $Ruler = $(e.target).parents(".addRuler");
      const $addEle = $Ruler.clone(true, true);
      $addEle.attr("index", +$addEle.attr("index") + 1); // 指数加一
      setRuler($addEle.get(0), +$Ruler.attr("Ydex") + 50);
      $Ruler.after($addEle);
    });

    appendBody(addRuler);
    rulerStep += step;
    rulerIndex++;
  }
}

function setRuler(ruler, y) {
  y = y.toFixed(2);
  ruler.style.top = y + "px";
  ruler.setAttribute("Ydex", y);
}

function createNavigator() {
  // 单例模式
  if (query(".PizzaNav")) return false;

  const $navigator = $(`
    <div class="PizzaNav">
      <div class="top">TOP</div>
      <div class="prev">prev</div>
      <div class="next">next</div>
      <div class="bottom">BOTT</div>
    </div>`);

  // 添加点击事件
  $navigator.find(".top").on("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // 可选的，使滚动平滑进行
    });
  });
  $navigator.find(".prev").on("click", () => {
    window.scrollTo({
      top: document.documentElement.scrollTop - winH,
      behavior: "smooth",
    });
  });
  $navigator.find(".next").on("click", () => {
    window.scrollTo({
      top: document.documentElement.scrollTop + winH,
      behavior: "smooth",
    });
  });
  $navigator.find(".bottom").on("click", () => {
    window.scrollTo({ top: bodyHeight - winH, behavior: "smooth" });
  });

  // 添加到页面中
  $("body").append($navigator);

  // // 进入编辑态
  $("html").addClass("PizzaSpace");

  // 增加一些留白 方便最后滚动到底
  // const htmldom = query("html");
  // htmldom.style.paddingBottom = `${winH}px`;
}

function shiftState() {
  const nav = query(".PizzaNav");
  const conf = /hideFixed/.test(nav.className) ? "show" : "hide";
  hideTool(conf);
  $("html").toggleClass("PizzaSpace");
}

function createConfirm() {
  // 单例模式
  if (query(".confirm")) return false;
  const $confirm = $(`<div class="confirm">开始截图</div>`);
  $(".PizzaUtils").prepend($confirm);
  $confirm.on("click", getPPTs);
}

// 创建 截图模式select、放置参考线button
function createUtils() {
  // 单例模式
  if (query(".PizzaUtils")) return false;

  const $pizzaTool = $(`
    <div class="PizzaUtils">
      <div class="modeSelect">
        <label for="mode-select"
          >截图模式
          <select name="mode" id="mode-select">
            <option value="evenly">均匀模式</option>
            <option value="freely">自由模式</option>
            <option value="afterward">后向模式</option>
          </select>
        </label>
      </div>
      <div class="createRuler">水平参考线</div>
      <div class="createVRuler">垂直参考线</div>
    </div>
  `);

  $("body").append($pizzaTool);
  $pizzaTool.find(".createRuler").on("click", createBaseRuler);
  $pizzaTool.find(".createVRuler").on("click", () => {});
  $pizzaTool.find("#mode-select").on("change", function () {
    adMode = $(this).val();
  });
}

// 工具初始化
function utilsInit() {
  createUtils();
  createNavigator();
}

// 开始截图
async function getPPTs() {
  document.documentElement.scrollTop = 0; // 回到最初的地方

  // 触发截图操作:
  // 1.不必要的元素设置不显示 - 2.scroll & captrue - 3.pain PPT - 4.showresult
  hideTool("hide");
  setFixedElement("hide");

  // 2.scroll & captrue
  const screenshots = await scrollToCaptrue();

  // 如果截图报错了...则不进行后续动作
  if (screenshots === false) return false;

  // 3. redirect to result.html and loading
  await chrome.runtime.sendMessage({ action: "showResult" });

  // 3.paint PPT
  await paintPPT(screenshots);

  // 4.show result
  await chrome.runtime.sendMessage({ action: "showPPT" });
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
  if (request.action === "shiftState") {
    // 切换页面显示状态
    shiftState();
  } else if (request.action === "ruler") {
    // 创建参考线元素
    createBaseRuler();

    // 如果此时不在作业状态, 则需要重新开启作业状态
    if (!query(".PizzaSpace")) {
      shiftState();
    }
    return true;
  } else if (request.action === "getPPTs") {
    getPPTs();
    return true;
  } else if (request.action === "modify") {
    setRuler(baseRuler, request.step); // 变更baseRuler
    createAddRuler(baseRuler, request.step); // 重新生成addRuler
    return true;
  } else if (request.action === "setspeed") {
    captureSpeed = +request.speed;
  } else if (request.action === "init") {
    const ruler = query(".addRuler");
    const step = ruler ? +ruler.getAttribute("Ydex") : 0;
    sendResponse([step, captureSpeed]);
    return true;
  } else if (request.action === "tools") {
    // 创建工具
    utilsInit();
    return true;
  }
});

// 设置工具元素的显示隐藏
function hideTool(conf) {
  // NodeList 是一个类数组对象，并不直接支持像数组那样的 push 和 map 等方法
  const ruler = queryAll(".PizzaRuler");
  const nav = query(".PizzaNav");
  const utils = query(".PizzaUtils");
  [...ruler, nav, utils].forEach((t) => {
    t && hideFn($(t), conf);
  });
}

async function scrollToCaptrue() {
  const screenshots = [];
  let prevUrl = "";
  let scrollTop = 0;
  // 当滚动高度 + 当前窗口 < bodyHeight 时，继续滚
  // 注意此时 scrollTop = document.documentElement.scrollTop + winH
  while (scrollTop < bodyHeight) {
    // 1.scroll
    document.documentElement.scrollTop = scrollTop;

    await sleep(captureSpeed); // 滚动之后等一会，再截图...减少相邻两张截图相同的问题...

    // 2.capture
    const dataUrl = await chrome.runtime.sendMessage({ action: "capture" });

    // 截图发生错误, 停止
    if (!dataUrl) {
      alert("翻页速度太快, 请调慢一点再试...");
      return false;
    }

    // 错误消息 "Unchecked runtime.lastError: This request exceeds the MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND quota."
    // 意味着你的代码在某个时间段内超过了浏览器 API 调用的频率限制，具体是关于捕获可见标签页的调用。
    // 如果你是在开发 Chrome 浏览器的扩展程序，这可能是因为你的扩展在短时间内频繁地尝试捕获当前可见的标签页，超出了浏览器对该操作的限制。
    // 为了解决这个问题，你可以尝试减少捕获可见标签页的调用频率，例如增加调用之间的间隔时间，优化你的代码逻辑以减少不必要的调用，或者重新审视你的扩展的设计以避免这种频繁调用的情况发生。
    // await sleep(captureSpeed);

    // 3. 如果图片是正常的话 - 保存图片，页面滚动到下一个位置...
    if (prevUrl !== dataUrl) {
      screenshots.push(dataUrl);
      prevUrl = dataUrl;
      scrollTop += winH;
    }
  }

  window.scrollTo({ top: 0, behavior: "smooth" });

  hideTool("show"); // 重新进入编辑态...
  setFixedElement("show");

  return screenshots;
}

// 绘制ppt
async function paintPPT(screenshots) {
  // 设置图片原始宽度与浏览器窗口宽度比例参数
  await setRatio(screenshots[0]);

  // 获取参考线数据 --- 转化为imageSize
  const addRuler = Array.from(queryAll(".PizzaRuler"));
  const YArr = addRuler.map((r) => {
    return imageSize(+r.getAttribute("Ydex")).toFixed(2);
  });

  let prevYdex = 0; // 参考线指针：上一个参考线的位置 --- imageSize
  let remain = 0; // 截图指针：上批次没绘制的部分 --- imageSize
  let curImg; // 图片容器

  for (const Ydex of YArr) {
    const canH = Ydex - prevYdex; // 图片高度 --- imageSize

    // 计算需要几张截图才能塞满此ppt --- 向上取整...可获取需要的图片
    const batchCount = Math.ceil((canH - remain) / winHS);
    const urls = screenshots.splice(0, batchCount); // 将图片截取出来, 并改变screenshots数组
    const [canv, ctx] = createCanvas(canH); // 创建canvas

    let handled = 0; // canvas绘图指针：已绘制部分

    // 处理上批次没绘制的部分 --- 有可能截图是canvas的好几倍 --- 这里remain可能大于 canH
    if (remain > canH) {
      const sy = curImg.height - remain;
      const sh = canH;
      // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
      ctx.drawImage(curImg, 0, sy - 1, winWS, sh, 0, 0, winWS, sh); // sy - 1 微调截图指针起始位置, 优化绘图偏移问题
      remain -= sh;
      // handled += sh; // 当前canvas已经画完, 没有必要处理canvas指针了...
    } else if (remain > 0) {
      const sy = curImg.height - remain;
      // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
      ctx.drawImage(curImg, 0, sy - 1, winWS, remain, 0, 0, winWS, remain); // sy - 1 微调截图指针起始位置, 优化绘图偏移问题
      handled += remain - 1; // 更新本批次已处理部分 —— "-1" 解决两图之间拼接绘制出现的白线问题....
      remain = 0; // 重置remain
    }

    // 开始本批次的绘制
    for (url of urls) {
      curImg = await createImage(url);

      // canvas还能容得下当前图片
      if (curImg.height <= canH - handled) {
        // drawImage(image, dx, dy, dWidth, dHeight);
        ctx.drawImage(curImg, 0, handled, winWS, curImg.height);
        handled += curImg.height;
      } else {
        // canvas已绘制满, 图片还有部分未绘制
        const paintH = canH - handled;
        // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        ctx.drawImage(curImg, 0, 0, winWS, paintH, 0, handled, winWS, paintH);
        remain = curImg.height - paintH;
      }
    }

    // 生成图片, 发送到background保存...
    const dataUrl = canv.toDataURL("image/png");
    await chrome.runtime.sendMessage({ action: "saveImg", dataUrl });

    prevYdex = Ydex;
  }
}

// 计算 图片/视窗 的尺寸比例
async function setRatio(dataUrl) {
  const image = await createImage(dataUrl);
  ratio = (image.width / winW).toFixed(2);
  winHS = winH * ratio;
  winWS = winW * ratio;
}

// 根据dataUrl生成image
function createImage(dataUrl) {
  return new Promise((res) => {
    // 由于图片未放置到dom中, 所以image.width和image.height都是图片的原始尺寸, 通常会比浏览器视窗大
    const image = new Image();
    image.src = dataUrl;
    image.onload = function () {
      res(image);
    };
  });
}

// 将浏览器尺寸更换为图片尺寸口径...
function imageSize(winpx) {
  return winpx * ratio;
}

// 生成canvas
function createCanvas(canH) {
  const canvas = create("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = winWS;
  canvas.height = canH;
  return [canvas, ctx];
}

function sleep(t) {
  return new Promise((res) => {
    setTimeout(res, t);
  });
}

// 获取页面中原有的fixed元素
+(function getFixedElement() {
  // 选择所有具有 position: fixed 样式的元素
  originFixedEles = $("*").filter(function () {
    return $(this).css("position") === "fixed";
  });
})();

// 显示隐藏 页面中原有的fixed元素
function setFixedElement(conf) {
  originFixedEles.map(function () {
    hideFn($(this), conf);
  });
}

// 隐藏函数
function hideFn($obj, conf) {
  const method = conf === "hide" ? "addClass" : "removeClass";
  $obj[method]("hideFixed");
}
