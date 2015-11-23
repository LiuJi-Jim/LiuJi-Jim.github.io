title: "JavaScript中的异步梳理（0）"
id: 12
date: 2012-04-23 23:13:52
tags: 
- 编程
---

JavaScript中有大量异步操作，首先可以看看JS中什么东西会产生异步（这里先只考虑浏览器里的情况）：

* Ajax（XMLHttpRequest）
* Image Tag，Script Tag，iframe（原理类似）
* setTimeout/setInterval
* CSS3 Transition/Animation
* postMessage
* Web Workers
* Web Sockets
* and more...

实际上在我自己的理解中，任何“在未来不确定的时间发生”的事情都可以理解为异步，因此各种DOM事件也可以用类似的方式去理解和处理。

异步是JS中的重要话题，Ajax和Node.JS出现以后更是让JS中的异步编程提升到了一个前所未有的高度。

但是对于异步+回调①的模式，当需要对一系列异步操作进行流程控制的时候似乎必然会面临着回调嵌套。因此怎么把异步操作“拉平”，用更好的方法去优化异步编程的体验，同时也写出更健壮的异步代码，是这两年来前端圈子里很火的话题。

我大概总结一下，对异步操作的优化，总的来说有3种流派：

1. 消息驱动——代表：[@朴灵](http://weibo.com/shyvo) 的[EventProxy](https://github.com/JacksonTian)
2. Promise模式——代表：[CommonJS Promises](http://wiki.commonjs.org/wiki/Promises)，[jQuery](http://www.jquery.com)，[Dojo](http://dojotoolkit.org/)
3. 二次编译——代表：[@老赵](http://weibo.com/jeffz) 的[Jscex](https://github.com/JeffreyZhao/jscex)

这个系列将会分别介绍这三种模式，以及我本人根据自身需要对它们进行的取舍。其中1和2会是重点。
<!--more-->

** 目录：**
[JavaScript中的异步梳理（1）——使用消息驱动](/2012/05/28/javascript中的异步梳理（1）-使用消息驱动/ "JavaScript中的异步梳理（1）——使用消息驱动")
[JavaScript中的异步梳理（2）——使用Promises/A](/2012/06/28/javascript中的异步梳理（2）-使用promisesa/ "JavaScript中的异步梳理（2）——使用Promises/A")
[JavaScript中的异步梳理（3）——使用Wind.js](/2012/09/27/javascript中的异步梳理（3）-使用wind-js/ "JavaScript中的异步梳理（3）——使用Wind.js")

①：异步不一定非要回调，比如Wind.js就用了一种非常巧妙的二次编译方式来让代码可以“顺序编写、异步执行”，不再需要无尽的回调。