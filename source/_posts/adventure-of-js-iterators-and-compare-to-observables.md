title: "继续探索JS中的Iterator，兼谈与Observable的对比"
date: 2017-3-31 15:55:55
tags: 
- 编程
---

# 前言

JavaScript 2015中引入了Generator Function（相关内容可以参考前作[ES6 generator函数与co一瞥](/2014/11/28/a-brief-look-at-es6-generator-function/)与[ES6 generator函数与co再一瞥](/2015/01/18/more-about-es6-generator-function/)），并且在加入了`Symbol.iterator`之后，使得构造拥有自定义迭代器的集合变得相当容易（可以参考前作[在JavaScript中实现LINQ——一次“失败”的尝试](/2017/02/04/a-failed-attemption-to-js-linq/)）。

前几天在群里[@徐叔](http://weibo.com/sharpmaster)提出了这样一个问题：

```
function* listen(element) {
  element.addEventListener('click', function(e) {
    // 这里怎么把e通过外面的listen给yield出去？
  })
}
```

音锤思婷……

我理解，叔叔写`listen`的目的是为了把事件源抽象成一个“可以被遍历的集合”。

<!-- more -->

# JavaScript里的迭代器模式

要理解JS里的迭代器模式，首先必须从`GeneratorFunction`和`Symbol.iterator`说起。

JS的迭代器模式和C#有些许不同（原谅我经常用C#力的接口来做例子，其实只是因为我觉得它这些接口设计得比较工整良好，而且强类型语言也挺适合做例子），C#中使用两个接口`IEnumerable<T>`和`IEnumerator<T>`来实现迭代器模式，分别定义为

```
public interface IEnumerable<T> {
  IEnumerator<T> GetEnumerator()
}

public interface IEnumerator<T> {
  T Current { get; }
  bool MoveNext()
  // 省略其他无关紧要的
}
```

实现了`IEnumerable<T>`的类型可以享受到`foreach`语法糖，`foreach`展开后就是通过对`IEnumerator<T>`不断地`MoveNext()`来完成迭代过程，这很好理解。

JS的迭代器模式围绕`Symbol.iterator`，任何对象只要实现了`Symbol.iterator`就可以享受`for-of`语法糖。

在迭代过程方面，C#只用`IEnumerator<T>`一个接口同时实现了迭代和取值两个操作，但JS里用了两个接口，这里举个例子

```
var array = [1, 2, 3, 4, 5]
var iter = array[Symbol.iterator]()
for (var it = iter.next(); !it.done; it = iter.next()) {
  console.log(it)
}
```

可以看到调用`Symbol.iterator`所得到的`iter`对象只是负责`next()`工作，而其不断`next`所得到的`it`对象则负责`value`和`done`工作。

也就是说，在不借助`yield`的情况下，要实现`Symbol.iterator`只需要构造一个满足上述接口的对象就OK了，举个例子

```
var fakeArray = {
  _values: [1, 2, 3, 4, 5],
  [Symbol.iterator]() {
    var _values = this._values
    var _index = 0
    var iter = {
      next() {
        var it = {
          value: _values[_index],
          done: _index >= _values.length
        }
        if (!it.done) {
          _index++
        }
        return it
      }
    }
    return iter
  }
}

for (var n of fakeArray) {
  console.log(n)
}
```

然后我们尝试一下，能不能用`yield *`语法来实现它和`Generator`的无缝衔接：

```
function* gen() {
  yield '1-1'
  yield '1-2'
  yield* fakeArray
  yield '1-3'
}

for (var t of gen()) {
  console.log(t)
}
```

耶，成功了，解糖后手工遍历呢？

```
var iter = gen()
for (var it = iter.next(); !it.done; it = iter.next()) {
  console.log(it)
}
```

![](/uploads/public/perfect.jpg)

# 用迭代器模式实现事件源是否可行

先说结论，我认为是：仅从上面所讨论的范围来看，__不可行__。

使用迭代器模式，无外乎是为了能工用`for-of`语法（或者解糖以后自己不断`next()`）来遍历集合。我们知道迭代器模式是一种典型的“Pull”模型，迭代过程是不断从集合里把东西拉出来，直到什么都拉不出来了（怎么听起来这么膈应）。

事件源是一个异步的东西，只有当事件发生的时候才会有货，但我们并不知道事件什么时候发生，因此当被“拉”的时候，不知道该把什么东西交给迭代器。

这时候有同学要问了，之前我们不是用co通过`yield`来处理异步的东西吗，这不是证明`yield/generator`是可以处理异步问题的吗？

其实只要看过我之前文章或者对co有了解的同学肯定就会知道，co是对`yield/generator`的“误用”，我之所以加引号是因为在Unity的C#里甚至官方就直接用`yield`和`IEnumerator<T>`来实现了官方的协程API（我就不吐槽了您赶紧把C#版本升级了用`async/await`吧），据我了解Python也有这么干的。这说明这个“误用”是一个有据可循的东西。

在co这样的语境下，`yield/generator`已经完全不是为了构造自定义集合以及配合`for-of`语法糖实现迭代器模式而用的，所以我们费了老鼻子劲实现的`Symbol.iterator`到底还有没有卵用？

我要说，如果跳出上面所讨论的范围来看呢，还是有点儿卵用的。

# “黑化”之后的产物

我们先设定一个“目标语法”

```
function* eventListeningByCoroutine() {
  var eventSource = someMagicFunction()

  while (true) {
    var e = yield eventSource.take()
    document.querySelector('#logger').innerHTML = e.pageX + ', ' + e.pageY
  }
}
```

看到没，用一个`while (true)`，死命地从`eventSource`里拉东西出来，由于这个拉的过程是不确定（异步）的，我们只好加了`yield`。

所以现在模型建立了，我们剩下两个问题，一个是`someMagicFunction`如何实现，一个是`startCoroutine`如何实现。

如果看过我之前写的[ES6 generator函数与co再一瞥](/2015/01/18/more-about-es6-generator-function/)，嗯，也可以起一个新名字，叫做《手把手教你实现一个山寨的co），那么应该很快就能写出上面的`startCoroutine`函数。

```
function startCoroutine(generatorFunction) {
  var iter = generatorFunction()

  function step(data) {
    var it = iter.next(data)
    if (it.done) {
      return
    }
    var callback = it.value
    callback(function(val) {
      step(val)
    })
  }

  step()
}
```

具体过程就不展开分析了，呃，我的意思是大概这样↓

![怎样画马](/uploads/public/how-to-draw-a-horse.jpg)

然后更关键的是`someMagicFunction`怎么实现

```
function someMagicFunction() {
  var taker
  var iter = {
    take: function() {
      return function(callback) {
        taker = function(e) {
          callback(e)
        }
      }
    }
  }

  function put(e) {
    if (!taker) {
      return // dropped
    }
    var _taker = taker
    taker = null // cleaning up
    _taker(e)
  }

  document.querySelector('#main').addEventListener('click', function(e) {
    put(e)
  })

  return iter
}
```

完整演示在这里[runjs/yzbro1a1](http://runjs.cn/code/yzbro1a1)。

嗯，其实我就是劣质地抄了一个[js-csp](https://github.com/ubolonton/js-csp)，它是一个__CSP(Communicating sequential processes)__的实现，相当于Clojure里的`core.async`和Go里的`chan`。这里的例子也基本就是[js-csp的其中一个例子](https://github.com/ubolonton/js-csp/blob/master/examples/web/mouse-events.html)的简化版而已。

在CSP中，事件源被抽象为一个`channel`（或者像erlang里好像叫mailbox之类的，很形象），发生事件的时候往里面`put`，监听事件这个事情体现为源源不断地（while-true）从里面`take`——注意，这个`take`是一个“阻塞”操作，体现为它必须冠以`yield`。

# 与`Observable`（RxJS）对比

从上面可以看到，只靠迭代器模式是不能用来抽象异步事件源的（至少吧，以我当前的理解能力，是不能的）。

本质上是因为迭代器模式使用的是“Pull”模型，什么时候发生迭代完全是由迭代者本身什么时候去“拉”数据决定的；而观察者模式是“Push”模型，什么时候发生迭代是由数据源本身决定的，这也使得它非常适合“事件流”、“消息推送”这类的持续、异步数据的迭代，也就是所谓的“Reactive Programming”。

那为什么最后的DEMO就用更类似“Pull”的方式实现了呢？因为`startCoroutine`和`someMagicFunction`这两者之间实现了消息传递，`startCoroutine`接管了`yield`和迭代中“什么时候该`next()`”的过程，`someMagicFunction`向反过来向它发送“你可以继续拉了”的消息（注意：上面的例子中实现为回调函数），这俩一推一拉，好不默契（？？？

值得注意的一点是不论CSP还是Observable都会存在一个“什么时候push”的问题，在RxJS和js-csp中，体现为它们有一个Scheduler的存在，在RxJS中它决定`subscribe`什么时候被发射，在js-csp中它决定`taker`什么时候被满足。RxJS内置的Scheduler就有诸如`Rx.Scheduler.immediate`, `Rx.Scheduler.currentThread`, `Rx.Scheduler.default`等好几种，并且对于不同的Observable它根据策略会默认选择不同的Scheduler。

当然最后实现了一个劣质的CSP的DEMO，也算填了一个我两年前学习Go以及第一次看到js-csp的时候就开的坑——是啊，在我脑海里开了坑，但没敢告诉你们，免得你们又吐槽我挖坑不填（逃
