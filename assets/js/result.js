let ppts = [];
let displayIndex = 0;
let getDone = false;

const loading = document.querySelector(".loading");
function showLoading(show) {
  loading.style.display = show ? "block" : "none";
}

// 下载
const downloadAll = document.querySelector(".downloadAll");
downloadAll.addEventListener("click", () => {
  if (getDone) downloadZip(ppts);
});
const download = document.querySelector(".download");
download.addEventListener("click", () => {
  const index = ppts.indexOf(imgContainer.src) + 1;
  const name = `${index}.png`;
  clickLink(imgContainer.src, name);
});

// 展示大图
const dialog = document.querySelector(".display");
const imgContainer = document.querySelector("#imgContainer");
const resultPannel = document.querySelector(".result");
const closeBtn = document.querySelector(".close");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");

imgContainer.addEventListener("click", () => {
  dialog.style.display = "none";
});
closeBtn.addEventListener("click", () => {
  dialog.style.display = "none";
});
prevBtn.addEventListener("click", (event) => {
  if (displayIndex > 0) {
    displayIndex--;
    imgContainer.src = ppts[displayIndex];
  }
});
nextBtn.addEventListener("click", (event) => {
  if (displayIndex < ppts.length - 1) {
    displayIndex++;
    imgContainer.src = ppts[displayIndex];
  }
});

chrome.runtime?.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "resultInfo") {
    getDone = false;
    const img = createImg(request.ppt, ppts.length);
    resultPannel.appendChild(img);
    ppts.push(request.ppt);
  } else if (request.action === "resultDone") {
    getDone = true; // 完成PPT的接收
    showLoading(false);
  }
});

function createImg(url, dIndex = 0) {
  const img = document.createElement("img");
  img.setAttribute("src", url);
  img.setAttribute("alt", "result");
  img.setAttribute("dIndex", dIndex);
  img.addEventListener("click", () => displayImg(img));
  const del = document.createElement("div");
  del.className = "del";
  del.innerText = "X";

  const outer = document.createElement("div");
  outer.className = "imageBlock";
  outer.appendChild(img);
  outer.appendChild(del);

  del.addEventListener("click", () => {
    ppts = ppts.filter((p) => p != url);
    outer.remove();
  });
  return outer;
}

function displayImg(img) {
  dialog.style.display = "block";
  imgContainer.src = img.src;
  displayIndex = img.getAttribute("dIndex");
}

function downloadZip(ppts) {
  showLoading(true);
  const zip = new JSZip();
  ppts.forEach((ppt, idx) => {
    if (!ppt) return true;
    zip.file(`${idx + 1}.png`, ppt.split("base64,")[1], {
      base64: true,
    });
  });

  // 生成并下载zip文件
  zip.generateAsync({ type: "blob" }).then((content) => {
    const zipFile = URL.createObjectURL(content);
    showLoading(false);
    clickLink(zipFile, "images.zip");
  });
}

// 点击下载
function clickLink(url, name) {
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
}
