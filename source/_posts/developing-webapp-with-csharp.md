title: 使用C#开发桌面hybrid应用程序
tags:
  - 编程
date: 2015-11-9 23:33:33
---

周末和基友一起开发了一个程序[MP3CutAd](http://www.zhihu.com/question/22913899/answer/71352036)（[github](https://github.com/licstar/MP3CutAd)），用的是C#做容器和“后端”，webkit做UI。

因为后端的算法是用C#写的，就打算不迁移了，用C#做UI吧。但是我特么不会，距离上一次开发WinForm程序已经过去了5、6年；WPF也没有实践经验。所以就想弄个办法，用C#做后端，web做前端，赶个时髦。

<!-- more -->

首先想到的是用[Electron](http://www.zhihu.com/question/22913899/answer/71352036)，这是一个nodejs和chromium的绑定。

为了让nodejs可以调用.NET类库，需要[edge.js](https://github.com/tjanczuk/edge)。不过在我兴冲冲的把两者装好之后，在Electron里面`require('edge')`却报错了。

懒的境界是：懒得调，先看看别的方案。

这次用[CefSharp](https://github.com/cefsharp/CefSharp)做容器，这是CEF（Chromium Embeded Framework）的C#版，在GitHub的Windows客户端里也用了这个项目。它提供了DEMO项目，下载下来用Visual Studio直接就能编译运行了。然后很快也实现了用C#向JS暴露对象，它提供两种，一种是暴露同步接口的，一种是JS返回值自动包装成Promise的异步接口的。我最后使用的是同步返回+callback的土鳖风格。

先这么定了，就用这个方案吧。

主要的缺点有以下几个：

* JS绑定目前实现得比较弱，函数参数只能传简单数据类型，连数组都不行。我弄了半天才发现，暂时用JSON来传参了。
* 不能向JS端暴露类的构造函数，可以取而代之暴露一个工厂，因为反正都只能传递简单类型。但是这样要实现状态就会很麻烦，所以C#端只能尽可能做成无状态的。
* 有时候窗口退出以后，cef的Chroumium进程退不干净，这个一直没排查到到底是哪里漏的，不过多半还是我自己弄得不好吧。

优点呢：

* 因为宿主是C#程序，可以充分利用各种窗体资源，天生系统窗口样式，需要做多窗口也可以。另外，可以肆无忌惮的在C#里开各种线程来跑算法。
* 可以使用WinForm或者WPF实现主程序，这样能够获得Native UI的各种优势，比如性能。同时嵌入一个Chromium则可以当做嵌入浏览器，或者是一个需要远程更新的模块。
* 可以实现同步的JS绑定接口（虽然我没用上）。

既然只能传简单数据类型，那么使用JS绑定和使用HTTP服务有啥优势？反正都得用JSON了。应该说，还是有的，主要就是可以实现同步调用。但用HTTP服务的话，应该更容易mock一些，而且还能脱离宿主，直接在Chrome浏览器里开发，也许可以更提高开发效率。另外一个就是在宿主里起一个HTTP服务其实也挺蛋疼的，而且调用开销估计也会更大吧。

另外还有一个方案是用[nw.js](https://github.com/nwjs/nw.js)也就是之前的node-webkit，配合edge.js。edge.js这个我没跑通，但是从它的介绍来看，要在C#端实现状态好像也没变简单。另一个是它如果暴露dll的话要按一定规则写接口，反正跟用CefSharp一样都是要封一层了……

总之就是两个方向：

1、用webkit/Chromium做宿主进程，绑定nodejs，再绑定.NET。
2、用C#做宿主进程，绑定Chromium。

前者的话，代码主要用JS写，后者的话，JS和C#一半一半吧。

跨平台能力方面，前者应该是更强的，因为edge.js的介绍里已经说了对Mono的支持。而Cef虽然是跨平台的，但是CefSharp目前还没发现他有说支持Mono。好在我对跨平台不感兴趣，而且这个程序当中又依赖了别的更不跨平台的东西了……不过除了CefSharp之外，还有别的项目也是Cef的C#绑定，其中有支持Mono的，我没试。

具体到UI方面，我用的是[Vue](https://github.com/vuejs/vue)，配合官方提供的webpack插件vue-loader和webpack-dev-server可以实现模块热更新，这样我就不需要频繁重启宿主程序了，还是很方便。

在联合调试的时候，C#端可以注意一下不要让算法跑在JS线程里面，这样Chromium那边的UI线程不会卡住。然后在Visual Studio里随便打断点就可以调试JS绑定和算法的C#代码，非常方便。

体积方面，都差不多，CefSharp的发布包大概是40多MB，如果干掉一些诸如音视频、Dev Tools、GL支持这类的，应该还能小一些。Electron也是这个水平，毕竟里面还包含一个nodejs。nw.js还没试，估计也都差不多吧。

结论：跨语言开发还是比较麻烦的，如果想用web做UI的话，建议尽量用nodejs绑定。如果需要用Native代码开发模块那就只能用C++写node包了，其实说到底还是挺坑的。不过用web开发UI的效率的确还是相当高，也许Electron和nw.js这种方案会越来越流行吧。而Cef方案则更倾向于在一个以Native UI为主的程序里面嵌入一个浏览器，或者一个比较需要远程更新的子模块这类的。