title: "ES6 generator函数与co一瞥"
layout: post
date: 2014-11-28 19:23:12
tags: 
- 编程
---

最近开始学（其实就是玩）ES6里的`generator/yield`，以及传说中的[co](https://github.com/tj/co)。

<!-- more -->

首先，我不会Python，所以这是第一次接触`generator/yield`这种非阻塞编程方式。其次，我虽然知道也很喜欢C#中的`async/await`，虽然了解一点coroutine/goroutine，但是都没用这两种方式写过正经代码，所以应该说不会受它们影响太多。

话不多说先来看一看`generator`函数。

JS里的`generator`函数是一种特殊类型的函数，通过
```
function* gen(){
  // ...
}
```
来声明一个`generator`函数，它和普通函数不一样，虽然在`generator`函数里也可以`return`，但是实际上`generator`函数的返回值是一个**迭代器**，所以`generator`函数是一个**生成迭代器**的函数，相信这就是`generator function`名字的由来吧。
这里举一个最简单的例子
```
function* simpleGen(){
  return 'hehe';
}
var iter = simpleGen();
```
`iter`就是一个**迭代器**，我们可以通过next()所返回的“迭代指针”来迭代，比如：
```
var it = iter.next();
console.log(it.value); // 'hehe'
console.log(it.done);  // true
```
好嘛，因为上面的`simpleGen`里面直接`return`了，所以所谓迭代其实只是看了个最终结果。
那么问题来了，怎么才能让它被迭代起来呢！！
这时候就要配合`yield`使用了，`yield`的意思就是“让步”，在它跟C#里面的`yield return`差不多。外部调用一次调用`next`，内部进行一步迭代。每一次`yield`就是所谓的一步，这时迭代器将会暂停工作，并保留所有现场。而代码执行的机会会被让给外部，直到再次`next`，迭代将会继续。
```
function* gen2(){
  yield 1;
  yield 2;
  return 'hehe';
}
var iter = gen2();
iter.next(); // { value: 1, done: false }
iter.next(); // { value: 2, done: false }
iter.next(); // { value: 'hehe', done: true }
```
这个迭代器的概念很像STL里的迭代器，有木有？但是，这时候你会说这特么手工`next`也能叫迭代？好的，ES6提供了`for of`语法
```
for (var it of gen2()){
  console.log(it);
}
```
上面的代码会输出1和2，但是不会输出'hehe'，我不知道是设计如此还是暂时没实现……而且资料上显示的是`for (let xx of xxx)`才对啊导演。
算了不管了，继续。`yield`字面意思就是“让步”，可以把执代码执行“让”给`yield`表达式来执行，而不是像写异步回调那样接着往下执行。呵呵呵呵，真是好人啊。`yield *`后接一个迭代器就可以把执行的机会让给这个迭代器，比如
```
function* gen1(){
  yield '1-1';
  yield '1-2';
}
function* gen2(){
  yield '2-1';
  yield* gen1();
  yield '2-2';
}

for (var it of gen2()){
  console.log(it);
}
```
执行结果就是
```
2-1
1-1
1-2
2-2
```

那么问题来了，不是说这货能用来控制流程，简化异步代码的编写吗？

> 答案就是`next`可以接收一个参数，它会作为这一次迭代的`yield`表达式在`generator function`当中的返回值。

> 因为直到迭代器被再次调用`next`为止，`generator function`都是处于“让步”状态，所以这段时时间内其实可以做任何操作，**不论是同步的还是异步的**。

> 所以如果我们发现`yield`表达式的返回值是一个异步操作，比如`thunk`、`Promise`、`迭代器`、`generator function`，那就意味着**这个操作还没有真正执行完**！

> 那么问题就简单了，**`yield`不知道它是异步的，但是我们知道啊**，甚至我们可以“万物皆异步”，我们可以让**异步操作结束后再调用`next`**，从而实现~~化腐朽为神奇~~变异步为同步。

```
function randomDelay(){
  var time = Math.random() * 500;
  return function(callback){
    setTimeout(callback.bind(this, time), time);
  };
}
function* genSlowly(){
  for (var i=0; i<10; ++i){
    console.log(i);
    console.log(yield randomDelay());
  }
}
async(genSlowly);
```
通过上面的代码我们希望实现打印一个数，调用一个异步操作`randomDelay()`，它的作用是随机延迟一段时间（你可以把它YY成一个ajax请求），然后通过回调函数的方式返回这个延迟毫秒数，在外层的`genSlowly()`函数能够拿到这个返回值，并且打印。
于是大概是这么个意思……
```
function async(gen){
  var iter = gen();
  function nextStep(it){
    if (it.done) return; // 迭代已完成
    if (typeof it.value === 'function'){
      // 收到的是一个thunk函数，需要等它完成的时候再继续迭代
      it.value(function(ret){
        nextStep(iter.next(ret)); // 把thunk的回调参数传入next，作为yield表达式的返回值
      });
    }else{
      // 收到的是一个值，进行下一步迭代
      nextStep(iter.next(it.value));
    }
  }

  nextStep(iter.next()); // 开始迭代
}
```
呵呵呵呵，成功了，虽然看起来很弱的样子。

通过对一个`generator`函数进行“处理”，我们可以改变它本身“迭代器生成器”的作用，用来做流程控制，这听起来真是相当蛋疼啊。不知道是谁发明的，但真是个很有创意的想法。

这时候[co](https://github.com/tj/co)就不难理解了，它可以将一个`generator`函数处理成一个异步操作。**这样你可以在`generator`函数里面使用`yield`来实现“顺序调用，异步执行”的效果，**。在co的4.0版本里它完全采用了`Promise`，它会将最终返回值作为参数传递到`promise`的`then`当中。

例子：
```
function someThingSlow(callback){
  setTimeout(callback, 500);
}
co(function* fibonacciGenerator(){
  var p1 = 0, p2 = 1;
  while (true){
    var cur = p1 + p2;
    console.log(cur);
    p1 = p2;
    p2 = cur;

    yield someThingSlow;
  }
});
// 每隔一秒打印斐波那契数列，无限
```
再来个例子，JS程序员梦寐以求的`sleep`
```
function sleep(ms){
  return function(callback){
    setTimeout(callback, ms);
  };
}
co(function* (){
  console.log('1');
  yield sleep(1000);
  console.log('2');
});
```
呵呵呵呵，就是这么无聊……

但是！co之所以这么火并不是没有原因的，当然不是仅仅实现sleep这么无聊的事情，而是它活生生的借着`generator/yield`实现了很类似`async/await`的效果！这一点真是让我~~三观尽毁~~刮目相看。

至于具体怎么用，受篇幅限制，还是等下一篇文章再详细说明吧。嗯，我相信你已经感觉到这是又一个《有生之年》系列了（逃
