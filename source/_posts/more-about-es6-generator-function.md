title: ES6 generator函数与co再一瞥
date: 2015-01-18 18:31:35
tags:
- 编程
---
离上文[《ES6 generator函数与co一瞥》](/2014/11/28/a-brief-look-at-es6-generator-function/)已经过去了两个月，真是惭愧，赶紧补完。

本文将会介绍ES6中的`generator/yield`的异常处理，以及分析并实现一个简单的、只支持Promise的[co](https://github.com/tj/co)，嗯我们这里山寨的叫做`cool`。

<!-- more -->

## 异常处理
这里我们分两种情况来看，一种是在`generator function`当中发生的异常，一种是在迭代中发生的异常。

### 在generator function中发生的异常
```
function* boring() {
  yield 'one';
  throw 'oops';
  yield 'two';
}
var gen = boring();
var iter = gen.next();
while (!iter.done) {
  console.log(iter.value, iter.done);
  try {
    iter = gen.next();
  } catch (ex) {
    console.log('exception happend while iterating:', ex);
    break;
  }
}
```
上面的代码只会输出
```
one false
exception happend while iterating: oops
```
因为在继续第二个`next()`的时候，发生了异常，这个异常导致迭代终止了。

### 在迭代中发生的异常
通过`gen.throw()`可以把异常抛到`generator function`里面去，它会作为“整个`yield`表达式的异常”，然后迭代将会继续。
```
function* boring() {
  try {
    yield 'one';
  } catch (ex) {
    console.log('exception caught inside:', ex);
  }
  yield 'two';
}
var gen = boring();
var iter = gen.next();
while (!iter.done) {
  console.log(iter.value, iter.done);
  if (iter.value === 'one') {
    iter = gen.throw('shut up'); // 强行异常，无情无义无理取闹
  } else {
    iter = gen.next();
  }
}
```
将会输出
```
one false
exception caught inside: shut up
two false
```

当然，如果`generator function`内部没有捕获这个异常，最终它还是会被抛到外界来，回到上文的情况1。

### 用于将异步的错误处理同步化
结合上面两个特性，我们可以将`yield`表达式当中的异步操作中的错误处理进行“同步化”，我们知道异步操作最恶心的地方就是错误处理，例如thunk风格的错误处理
```
fs.readFile(path, function(err, data) {
  if (!err) {
    // 正常
  } else {
    // 异常
  }
});
```
或者Promise风格的错误处理
```
$.getJSON(url).then(function(data) {
  // 正常
}, function(err) {
  // 异常
});
```
很容易把程序逻辑扯得支离破碎。而同步的错误处理就容易得多，可以直接用JS的结构化异常处理`try/catch/finally`。
于是我们可以扩展上一篇文章当中的`async`函数（本文将改名叫`cool`），让它对于`yield`表达式中的异步操作也可以进行错误处理，并且将错误通过`gen.throw`抛回`generator function`内，从而内部就可以使用`try/catch`来处理异常了。

## 动手实现一个co
为了简化代码，我们先去掉对`yield`一个thunk的支持，只留下对于`Promise`和`generator`的支持，并且最终也把这组“同步化”之后的异步操作返回为一个Promise。

### 核心
回顾一下前作当中的`async`函数，它已经做到了
* `yield`一个thunk函数
* `yield`一个普通值
* 完成迭代

这次我们先把thunk函数换成Promise的风格，然后还差的是
* 通过`gen.throw()`将Promise的错误抛到`generator function`内
* 让`cool`返回一个Promise
* 对于`generator function`没能处理的异常，将其转化成Promise风格的错误处理
```
function cool(gen){
  return new Promise(function(resolve, reject) {
    var iter = gen();
    function onResolve(data) {
      try {
        var it = iter.next(data); // 进行一步迭代
        step(it);
      } catch (ex) {
        reject(ex); // 捕获到generator function内的异常，终止迭代
      }
    }
    function onReject(err) {
      try {
        var it = iter.throw(err);
        // 将yield表达式中的异步操作的错误抛进generator function，并继续迭代
        step(it);
      } catch (ex) {
        reject(ex); // generator function没有妥善处理异常，终止迭代
      }
    }
    function step(it) {
      if (it.done) {
        // 迭代已完成
        resolve(it.value);
        return;
      }
      var value = it.value;
      if (typeof value.then === 'function') {
        // 收到的是一个Promise
        value.then(onResolve, onReject);
      } else {
        // 收到的是一个值
        onResolve(value);
      }
    }

    onResolve(); // 开始迭代
  });
}
```
上面的代码和co@4.0的核心代码几乎如出一辙，当然少了很多各种异步API格式的兼容，但是实际上`generator/yield`真的就是这么简单，很难写出什么花样来。

现在我们的`cool`函数已经可以支持`try/catch`和`yield Promise`的用法了

### 试试看
先写一个名为`sleepRandom`的辅助函数
```
function sleepRandom() {
  return new Promise(function(resolve) {
    var ms = Math.floor(Math.random() * 500);
    setTimeout(resolve.bind(this, ms), ms); // Promise的返回值就是sleep的毫秒数
  });
}
```

#### 顺序执行
```
var boringJob = cool(function*() {
  console.log(yield 'yield sync value');
  for (var i=0; i<5; ++i) {
    var ms = yield sleepRandom();
    console.log(i, ms);
  }
  return 'success';
});
boringJob.then(function(data) {
  console.log('finished:', data);
}, function(err) {
  console.log('failed:', err);
});
```
输出
```
yield sync value
0 47
1 343
2 40
3 339
4 423
finished: success
```
这个例子中，`sleepRandom`本来是一个异步的操作，但是被我们的“语法糖”搞成同步的了，JS也能sleep了，你满足了吧……

#### 未处理异常
```
function bad() {
  return new Promise(function(resolve, reject) {
    setTimeout(reject.bind(this, 'breaking bad'), 200);
  });
}
var weakJob = cool(function*() {
  console.log(yield 'yield sync value');
  console.log(yield bad()); // bad()被reject后，其错误将会作为`yield bad()`语句的异常抛出
  console.log(yield sleepRandom());
  return 'success';
});
weakJob.then(function(data) {
  console.log('finished:', data);
}, function(err) {
  console.log('failed:', err);
});
```
输出
```
yield sync value
failed: breaking bad
```
因为`yield bad()`的异常没被处理，它就被抛出来了，一来造成迭代终止，二来造成了`weakJob`被`reject`。

#### 用try/catch/fanally处理异步任务的异常
```
var robustJob = cool(function*() {
  console.log(yield 'yield sync value');
  try {
    console.log(yield bad());
  } catch (ex) {
    console.log('caught exception:', ex); // 异常被处理了，不会造成迭代终止
  }
  console.log(yield sleepRandom());
  return 'success';
});
robustJob.then(function(data) {
  console.log('finished:', data);
}, function(err) {
  console.log('failed:', err);
});
```
输出
```
yield sync value
caught exception: breaking bad
487
finished: success
```
这个例子中，虽然`bad`是一个异步操作，但是因为我们的`cool`函数把`Promise`的错误处理格式转换成了`try/catch`，所以可以用编写同步代码的方式来处理异常了，编程体验好多了。

### 补充
然后我们再实现一个`yield`另一个`generator`的兼容，这个就很简单了。

首先对`cool`的传入参数进行一下重构，使其可以兼容`generator`和`generator function`两种输入
```
function cool(gen){
  return new Promise(function(resolve, reject) {
    var iter = typeof gen === 'function' ? gen() : gen;
    function onResolve(data) {
...
```
然后对`yield`内容是`generator`的情况也做一下兼容
```
...
if (typeof value.then === 'function') {
  // 收到的是一个Promise
  value.then(onResolve, onReject);
} else if (typeof value.next === 'function' && typeof value.throw === 'function') {
  // 收到的是一个Generator，将其用cool包装为一个Promise然后继续
  cool(value).then(onResolve, onReject);
} else {
  // 收到的是一个值
  onResolve(value);
}
...
```
于是构建了一个还算凑合够用的“同步编程、异步执行”的体系
```
function* boring() {
  for (var i=0; i<5; ++i) {
    var ms = yield sleepRandom();
    console.log('boring', ms);
  }
  return 'boring end';
}
var boringJob = cool(function*(){
  var boringResult = yield boring(); // 一个generator function里可以yield另一个generator
  console.log('boring result:', boringResult);
  return 'success';
});
boringJob.then(function(data) {
  console.log('finished:', data);
}, function(err) {
  console.log('failed:', err);
});
```
上面的例子可以看做我们把来自系统或其他库的基于callback也好，Promise也好，反正是异步操作，先封装成`Promise`，然后在我们的应用程序代码里，使用`cool`，或者`co`来实现“同步代码”，当然事实上这些代码执行的时候都还是异步的，我们只是实现了一个同步的语义。

## 问题
### 并行任务
JS是单线程的，因此但就JS本身而言很难说真正的“并行任务”，但是runtime是多线程的，因此我们可以充分利用这一点，比如同时开多个Ajax请求，同时开多个`fs.readFile`等等。

这本身不是难事，难的是当遇到类似“当a, b, c三个请求都完成时，渲染界面”这种需要控制异步流程的地方，使用`async.js`这类的工具可以帮助我们做这种操作，使用`Promise.all`也可以实现这样的语义。事到如今，JS社区对于用`async.js`、`then.js`还是`Promise`，甚至是ES6的Promise还是重新实现的Promise，还讨论的喋喋不休，乐此不疲，足见异步语义对于程序员的负担是很大的。

在co中，`yield`一个数组的时候，它会把这个数组中的每一项都当做`Promise`，然后用`Promise.all`来让他们并发地执行。而如果`yield`的是一个Plain Object，它会遍历这个对象所有key，将其进行“Promise化”。听起来比较复杂，不过其实也就一二十行代码的事情，有兴趣的同学自己去看看co的代码就OK了。

这样的话在使用co的时候，如果`yield`一个数组或者一个Plain Object，它会对数组或者对象里的各项并发地执行，当它们全部都完成的时候一次性完成`yield`，依然可以用同步的语义实现并发，例如
```
var results = yield [$.ajax(url1), $.ajax(url2), $.ajax(url3)];
// 全部完成后，yield才会完成，返回值是三个ajax的结果所组成的数组
```

### 调用栈
前阵子有爆料co在某些情况下会出现Maximum call stack size exceeded的情况（[例子](https://gist.github.com/zensh/797feb9ae72eac901021)），其实非常符合预期并且好理解，这是因为用同步语义写的循环`yield`代码将会被变换成函数调用，一不小心就会造成非常长的Call Stack。解决的办法也比较容易，那就是**不要yield同步函数**。

在我们这个例子里没这个问题，因为我们用的是ES6的Promise，它是严格异步的。而co支持yield一个thunk，thunk虽然是callback语义，但是没有任何担保它是异步的，也就是说thunk有“同步callback”和“异步callback”之分，这就是I神所谓[“Release Zalgo”](http://blog.izs.me/post/59142742143/designing-apis-for-asynchrony)的问题，有兴趣可以继续探讨下。

### 支持程度
JS最让人恶心的地方就是有了新特性你不知道敢不敢用，因为不知道`generator/yield`支持程度怎么样。
* 在node.js >= 0.11的版本中通过`--harmony`或`--harmony-generator`参数可以开启支持。
* 在io.js >= 1.0中已经相当于默认开启了这个支持。
* 在Chrome较高版本中通过`chrome:flags`中的“启用实验性 JavaScript”可以开启支持。
* 通过[regenerator](https://github.com/facebook/regenerator)可以将`generator/yield`代码编译成ES5代码，用的时候需要一个大约500行源码的runtime。