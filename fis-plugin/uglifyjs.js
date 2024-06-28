/*
 * fis
 * http://fis.baidu.com/
 */

"use strict";

var UglifyJS = require("uglify-js");

function uglify(content) {
  return UglifyJS.minify(content, {
    toplevel: true, // Compress and/or mangle variables in top level scope
    compress: true,
    mangle: {
      // // 混淆压缩属性名 -- api 字段 & 跨上下文传递的字段，需要保留
      // properties: {
      //   reserved: ["currentWindow", "base64", "step", "menuH", "width"],
      // },
      // 属性名还是别混淆了...全部保留, 否则坑太多
      properties: false,
    },
  }).code;
}

module.exports = function (content, file) {
  try {
    content = uglify(content);
  } catch (e) {
    console.log("Got Error %s while uglify %s", e.message, file.subpath);
    console.log(e.stack);
  }

  return content;
};
