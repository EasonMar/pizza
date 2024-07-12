# pizza

A tool to cut a long web page into short images as you wish, especially applied on web-based PPT.

### Conf

```json
{
    "matches": ["*://*/*"],
    {
      "matches": ["*://*/*"],
      "js": ["libs/jquery.slim.min.js", "assets/js/content.js"] // 被依赖的包要放在数组前面
    },{
       "matches": ["*://*/*"],
       "css": ["assets/styles/reset.css"]
    }

    // 原配置
    {
      "matches": ["*://developer.huawei.com/*"],
      "js": ["libs/jquery.slim.min.js", "assets/js/content.js"]
    },{
      "matches": ["*://developer.huawei.com/config/commonResource/pdfjsToCommon/pdf/web/viewer.html"],
      "css": ["assets/styles/reset.css"]
    }
}
```

### Q&A

1. 为什么 `chrome.runtime.onMessage.addListener` 不执行 `sendResponse`，就会报`A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received`的错误
   - 在 Chrome 浏览器扩展程序开发中，`chrome.runtime.onMessage.addListener`用于接收从其他部分（如内容脚本、选项页面等）发送过来的消息。当使用`addListener`来添加消息监听器时，可以选择通过返回 `true` 表示异步地处理消息，然后在处理完成后再通过调用 `sendResponse` 来发送回复。但是，如果 `sendResponse` 没有被执行，而消息通道已经关闭，就会导致报错`A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received`。
   - 这种错误通常发生在以下情况下：
     ```
     1. **消息处理时间过长：** 如果在处理消息时花费了很长时间，可能会导致消息通道在回复之前被关闭，从而无法正常发送回复。
     2. **未正确调用 sendResponse：** 确保在异步处理完成后调用 sendResponse 来发送回复。如果忘记在处理程序中调用 sendResponse，就会导致通道被关闭而报错。
     3. **意外的程序流程：** 可能由于程序逻辑错误或异步操作导致消息通道提前关闭，这也会触发此错误。
     ```
   - 解决此问题的方法包括：
     ```
     - 确保在处理完消息后调用 sendResponse 发送正确的回复。
     - 确保消息处理逻辑能够在消息通道关闭之前完成。
     - 检查程序逻辑，避免出现意外的通道关闭情况。
     ```
   - 通过调试代码并确保正确地处理消息以及按时发送回复，你应该能够避免这种错误的发生。
2. 错误消息 `Unchecked runtime.lastError: This request exceeds the MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND quota.`
   - 意味着你的代码在某个时间段内超过了浏览器 API 调用的频率限制，具体是关于捕获可见标签页的调用。
   - 如果你是在开发 Chrome 浏览器的扩展程序，这可能是因为你的扩展在短时间内频繁地尝试捕获当前可见的标签页，超出了浏览器对该操作的限制。
   - 为了解决这个问题，你可以尝试减少捕获可见标签页的调用频率，例如增加调用之间的间隔时间，优化你的代码逻辑以减少不必要的调用，或者重新审视你的扩展的设计以避免这种频繁调用的情况发生。
3. `chrome.runtime.sendMessage`和`chrome.runtime.onMessage.addListener`中的`sendResponse`发送的单个数据的大小有限制,无法发送较大的数据量
   - 报错：`Uncaught TypeError: Error in invocation of runtime.sendMessage(optional string extensionId, any message, optional object options, optional function callback): Message length exceeded maximum allowed length`.
   - 如果需要分多次发送出去, 一定要安排一个异步队列, 按顺序异步发送, 前一个发送完成才能发送下一个, 尽量避免并发造成的竞争, 不然会引发问题...
4. `Uncaught (in promise) Error: Could not establish connection. Receiving end does not exist.` --- popup.html
   - 表示扩展程序试图建立与内容脚本的通信通道，但内容脚本并不存在或未准备好接收消息。
   - 所以在 popup 初始化时，如果有 `runtime.sendMessage` 操作...需要做一个错误处理...捕捉一下错误

## Todo list

- ~~每个参考线可单独调整，更加灵活的切图配置~~
- ~~hwcutter，截图的 PPT 结果应该先放到一个展示页，用户可以选择性下载，也可以全部打包下载~~
- ~~可添加、删除参考线~~
- ~~不均匀调整模式（可随时切换）：完成“后向等距”的分割逻辑 --- 当前参考线之后按间距平移，之前的保持不动~~
- ~~结果图片可以删除~~
- ~~隐藏页面中原有的 fixed 的元素~~
- ~~参考线拖拽交互优化~~
- ~~base 参考线非首次放置，在其他模式下拖拽，也要遵循模式规则~~
- ~~将各种功能按钮放到父级容器里统一处理...~~
- ~~进入作业状态之前，不应该更改页面的任何东西（样式啥的都不改）\toggle 能选择进入-退出作业状态~~
- 增加垂直参考线：水平截图区域可选择（目前最多支持 2 条垂直参考线）
- 显示处理进度
- 集成图片编辑功能
- 代码优化：统一编码风格、设计优化
- 多个网页一起切的功能、翻页功能...
