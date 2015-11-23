title: "JavaScript中定时器的精度"
layout: post
date: 2014-4-26 23:23:12
tags: 
- 编程
---

之前写了[一篇文章](/2014/03/16/hrt-in-js/)介绍JS中的高精度计时，那么，与高精度相对的，低精度又是什么呢？或者说我们常接触到的精度是在什么水平？

这篇文章主要探讨一下JS里常用的定时器，看看它们能达到什么精度。由于结论我也不知道，所以基本上这篇文章算边做实验边写的吧，有问题希望各位看官能帮忙指出。文中的实验覆盖范围很小，而且方法也极度不严谨，大家先且一看吧，也许有时间我会再重新做实验。

<!-- more -->

## 正传

### setTimeout

曾几何时，有前辈教诲我们，JS里`setTimeout`是不精确的，因为它所做的事情只是把任务添加到事件队列当中。如果在这个任务执行之前有别的任务执行的比较慢（比如死循环、大规模DOM操作、fs.同步IO等），那么后面的任务就会被推迟执行了。

与此同时，`setTimeout(func, 0)`是我们常见的一种奇怪的技巧，它可以让任务推迟执行，而又不推迟很多。说直观一点，通过这种技巧可以模拟一个低优先级的任务，比如我们在操作DOM的同时又希望`window.scrollTo(0, 0)`，也许我们就会把后者放在`setTimeout 0`当中。在没有研究清楚event loop前，这也许是心理安慰，但因地制宜地用这个技巧常常会发生一些老中医般的意想不到的神奇效果。

我们先看看在没有任何其他繁忙任务时，`setTimeout 0`能达到多少精度。

```
var start = hrt();
setTimeout(function(){
  var now = hrt();
  console.log(now - start);
}, 0);
```

配合使用上回的高精度计时函数使用，在OSX Chrome34中，我这大概是9~10ms，而在node.js里则可以达到1.2~2.6ms的样子。然后我们慢慢增大延迟值，试着探索一下setTimeout有多少精度吧。
粗略实验下，发现在Chrome中，setTimeout的时间下限基本上就是9~10ms，当延迟在10多20这个水平时候，也能达到，但波动相当大。延迟到30以上，基本上实际时间比设置值只会多到1~2ms的样子；而在node中，即使设置很小的延迟，也能达到，但实际时间也会比设置值多个1~2ms。

模拟一下setTimeout被推迟的情况
```
var start = hrt();
for (var i=0; i<1e8; ++i) ;
setTimeout(function(){
  var now = hrt();
  console.log(now - start);
}, 0);
```
明显就看到时间变长多了，所以必须谨记`setTimeout`并不靠谱。

### setInterval

这是用来做周期触发的回调用的，首先我们也丧心病狂的试试`setInterval 0`吧。

```
var start = hrt(), last = start;
var id = setInterval(function(){
  var now = hrt();
  console.log(now - last);
  last = now;

  if (now - start > 2000) clearInterval(id);
}, 0);
```

在Chrome里平均稳定在4.6ms左右一次，当时间设置到6ms以上时，基本上能达到，但实际触发时间比设置要大1ms左右。node这边依然要好一些，几乎能达到任何设置的时间，但也会有大概1ms的延迟。毫无疑问`setInterval`也是会被负荷重的任务推迟，就不演示了。

### setImmediate

这是node.js才有的函数，我这里它大概有不到1ms的延迟。在朴灵的《深入浅出node.js》一书中对这个函数有比较详尽的解释，这里我就不赘述了。

不得不说的是——setImmediate也会被同步的代码阻塞——yes, this is JavaScript。

### 小结

到这里，常用的setXXX系列手工产生异步的办法都看了一遍。不得不承认node与浏览器在这些核心函数上优化都是相当到位的。但是其他浏览器，包括windows上，尤其是某些老旧的IE，我对它们表示不乐观，还好我现在的工作很少和这些东西打交道，改天有时间我应该会再用手机做一次测试，以求更贴近我的工作环境。

## 番外篇

### requestAnimationFrame

这个东西，我觉得基本上把它当做一个`setTimeout 0`来看待就行了，现在比较推崇用它来做动画，我们也看看它的精度吧。

```
var start = hrt(), last = start;
function loop(){
  var now = hrt();
  console.log(now - last);
  last = now;

  if (now - start < 2000) requestAnimationFrame(loop);
}
loop();
```
我本来满心期望它有很稳定的触发间隔，但我失望了，从15ms多到17ms都有，不是很稳定。但据说它给浏览器带来的符合是更小的，所以会有更好的性能？这个15~17ms很有讲究，因为这刚好就是60FPS，似乎我还真没见过什么浏览器是超过60FPS的。

### setZeroTimeout

这是一个很有趣的黑科技([github](https://github.com/shahyar/setZeroTimeout-js))，它通过`postMessage`来为浏览器模拟`setImmediate`，（在可能的时候）避免使用`setTimeout 0`，试了一下，用它的确是能做到0~1ms的触发时间，简直厉害……

值得一提的是，我们有时候会用`setTimeout`嵌套来达到与`setInterval`类似的效果，嵌套使用`setTimeout 0`还可以（我刚试了下，反复`setTimeout 0`能达到和`setInterval 0`一样的4~5ms精度），嵌套`setZeroTimeout`因为触发太频繁，不出一秒浏览器就直接卡死了……