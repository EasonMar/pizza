const fisUglifyJS = require("./fis-plugin/uglifyjs");
/**
 * 通用配置
 */

// 预编译 sass 文件
fis.match("*.scss", {
  rExt: ".css",
  parser: fis.plugin("node-sass", {}),
});

// css前缀
fis.match("*.{css,scss}", {
  preprocessor: fis.plugin("autoprefixer", {
    browsers: ["Android >= 2.1", "iOS >= 4", "ie >= 8", "firefox >= 15"],
    cascade: true,
  }),
});

// 生产环境配置
fis
  .media("prod")
  .match("*.js", {
    // 压缩js
    optimizer: fisUglifyJS,
  })
  .match("*.{css, scss}", {
    // 压缩css
    optimizer: fis.plugin("clean-css"),
  })
  .match("*.html", {
    // 压缩 Html
    optimizer: fis.plugin("dfy-html-minifier", {
      removeComments: true, //去掉注释
      collapseWhitespace: true, // 折叠空白
      conservativeCollapse: true,
      removeAttributeQuotes: true, // 删除属性引号
      minifyJS: true, //压缩html内的js代码
      minifyCSS: true, //压缩html内的css代码
    }),
  })
  .match("demo/*", {
    // demo 不需要 发布到 dist
    release: false,
  });

// 第三方依赖库 - 不进行 optimise 和 useHash
fis.match("libs/*.js", { optimizer: null });

// fis3自定义插件不需要发布
fis.match("fis-plugin/*", {
  release: false,
});

// 这个供临时用的css不用发布
fis.match("assets/styles/reset.css", {
  release: false,
});

// 配置不需要参与构建的文件
fis.set("project.ignore", [
  ".git/**",
  ".gitignore",
  ".prettierrc",
  ".editorconfig",
  ".gitlab-ci.yml",

  "fis-conf.js",
  "README.md",
  "package-lock.json",
  "package.json",

  "node_modules/**",
  "dist/**",
  "localServe/**",
]);
