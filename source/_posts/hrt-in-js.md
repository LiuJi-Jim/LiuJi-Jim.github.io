title: "JavaScript中的高精度计时"
layout: post
date: 2014-3-16 19:23:12
tags: 
- 编程
---

HRT(High Resolution Timing, 高精度计时)在一些场合有很大的作用，比如游戏开发中，需要精确的计算两帧之间的时间差。

在JS中常常用`(new Date()).getTime()`来获取毫秒级的时间戳，虽然是毫秒级，但事实上它的真实精度只能达到大概16ms的级别。例如
```
while (true){
  console.log((new Date()).getTime()); // 这样死循环浏览器会跪的，责任自负
}
```
会发现它事实上大概16ms才跳一次，也许是17ms、又或者15ms吧，反正实际精度是有限的——什么？你跟我说是1ms？我告诉你那是因为新的系统或者浏览器使用了更高精度——但这不影响这篇文章的内容……

这对于日常应用来说完全够用了，但是对于游戏这样的场合，高精度计时就有它不可取代的意义了。

<!-- more -->

### 故事从这里开始

上面的获得毫秒级时间戳的方式之所以精度有限，是因为它的实现方式，以及它“绝对时间”的定义。
以Windows为例，这一类时间戳所使用的系统调用，比如`GetSystemTime()`[MSDN](http://msdn.microsoft.com/en-us/library/windows/desktop/ms724390.aspx)、`GetTickCount()`[MSDN](http://msdn.microsoft.com/en-us/library/windows/desktop/ms724408.aspx)，其函数的取值并不是实时的，而是通过硬件的**时钟中断**被动刷新的，这里的刷新间隔“正好”就是上面那个16ms。以`GetSystemTime()`为例，它返回的是`SYSTEMTIME`结构体，**这用来进行时间日期处理的，因为时间日期处理通常根本不需要也不应该用那么高的精度（甚至很多时候只需要秒级别的精度）**，所以`(new Date()).getTime()`通过它们实现的确是可以胜任的。

### 现在我们明白了，靠这个时间戳是不能实现高精度计时的。

在Windows上，常常有两种高精度计时的方式：
第一种是`timeGetTime()`[MSDN](http://msdn.microsoft.com/en-us/library/ms713418.aspx)，它能返回系统启动到现在所经过的毫秒数，精度是1ms，因为它是32位的，所以大概49.71天会溢出清零。
第二种`QueryPerformanceCounter()`配合`QueryPerformanceFrequency()`[MSDN](http://msdn.microsoft.com/en-us/library/windows/desktop/ms644904.aspx)实现，能够实现微秒级别的计时精度，对于大多数场合而言都够了。
当然还有更先进的方法，是通过CPU中的硬件计数器，和CPU每个时钟周期的时间，计算出更精确的时间（通常是纳秒级别的），对精度要求极高的场合这是最精确的选择了。

通常在使用固定位数的情况下，精度越高意味着计时的范围越小，这就不罗嗦了。

### 回到JavaScript中来

上面那些乱七八糟系统调用其实更咱们都没什么太大关系，我们能干什么完全看运行环境乐意给什么。
在**webkit**中提供了`performance.now()`[参考文献](http://updates.html5rocks.com/2012/08/When-milliseconds-are-not-enough-performance-now)来获取一个毫秒级的浮点数时间戳，我没查到资料它的有效精度是多少，不过既然给了个浮点数那就这么用着吧，我们就当它是微秒级的了！
在**node.js**中，有`process.hrtime()`[DOC](http://nodejs.org/api/process.html#process_process_hrtime)，返回的是一个数组`[seconds, nanoseconds]`，看起来它具有纳秒级别的精度？且信了吧。

### 综合一下，我写了下面的代码
```
exports.time = (function(){
  if (typeof window !== 'undefined'){
    // 浏览器
    if (typeof window.performance !== 'undefined' && typeof performance.now !== 'undefined'){
      // support hrt
      return function(){
        return performance.now();
      };
    }else{
      // oh no..
      return function(){
        return (new Date()).getTime();
      };
    }
  }else{
    // node.js
    return function(){
      var diff = process.hrtime();
      return (diff[0] * 1e9 + diff[1]) / 1e6; // nano second -> ms
    };
  }
})();
```

有了上面的代码[(gist)](https://gist.github.com/LiuJi-Jim/9596920)，我们就能写一个秒表神马的，在做性能测试的时候就用得上了。

最后还是要唠叨一句，**HRT是用来计算时间差的，不是用来计算现实中时间（挂钟时间）的**。

下一篇文章中，将会对JS中的时间精度进行进一步的讨论，对象自然就是`setTimeout/setInterval`了！

### 参考文献

1. http://www.cppblog.com/sunraiing9/archive/2006/12/14/16415.html
2. http://blog.csdn.net/hax/article/details/1449403
3. http://blog.csdn.net/aimingoo/article/details/1451556
