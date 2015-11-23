title: 一个关于JavaScript解构（destructuring）语法的……呃，陷阱？
date: 2015-06-09 18:31:35
tags:
- 编程
---
没有摘要，直接看文可好？
<!-- more -->

```JavaScript
function arr() {
  return [1, 2];
}
var [a, b] = arr();
// a = 1, b = 2;

function obj() {
  return { foo: 'bar' };
}
var {foo: fu} = obj();
// fu = 'bar'
```

上面是两种最基本的解构语法

那么看看下面的例子（来源[@SYSU_Joyee的微博](http://weibo.com/2930876843/Ckzs5kD76)）

```JavaScript
var foo = ['a', [{ foo: 'bar' }, 1, 2, 3, 4, 5]];
var [a, [{ foo: fu }, , ...tail], missing, def = 'default value'] = foo;
```

晕了吧，解读一下。

第一步，整体上，左边是一个数组解构，其中几个声明分别为`a, 一个数组, missing, def（带默认值）`。

* `a`对应的是`'a'`。
* `一个数组`是一个嵌套的解构，这个下面再看。
* `missing`对应数组越界，也就是`undefined`。
* `def`对应数组越界，本来也是`undefined`，但是它带默认值了，所以应该是`'default value'`。

上面的`一个数组`是嵌套在解构里的另一个数组解构，对它单独拆开，左边的几个声明是`一个对象, 抛弃, 剩余`。

* `一个对象`是一个对象解构，结果是`fu = 'bar'`。
* `抛弃`这个就不用说了，它抛弃了`1`。
* `剩余`就是剩下的**数组**，结果是`tail = [2, 3, 4, 5]`。

so far，看起来还是比较简单的。

下面看一些复杂的。

以下例子来自[Belleve Invis的博客](http://typeof.net/2014/m/dont-invent-a-language-when-idle.html)

```JavaScript
var a = {};
var b = a;
[a.x, a.y, a.x] = [1, (a = {}), 3];
```

注意第三行的赋值语句右边也有一个赋值语句，那么执行顺序是怎样？

按照人类直觉的理解，上面的代码应该等价于：

```JavaScript
a.x = 1;
a.y = (a = {});
a.x = 3;
```

于是最终结果是`a = { x: 3 }, b = { x: 1, y: Object }`其中的`y`就是`a`的引用

然而实际结果却是

```JavaScript
a = { x: 3, y: Object } // 其中的y就是a的引用
b = {}
```

虽然绝大多数人这辈子也不会写这种shit一样的代码，但还是需要知道为什么会是这样。

因为es6的草案对解构的策略是：

* 先分析左侧，得到一个赋值模式（AssignmentPattern）
* 计算右侧，得到一个值
* 按照左侧的模式，将右侧的值当中一部分赋值到左侧

其中第三步隐含了左侧的模式可能内嵌了另一个解构，所以上述步骤是递归进行的。

于是乎上面的代码正确的等价应该是：

```JavaScript
var a = {};
var b = a;
var _tmp = [1, (a = {}), 3];
a.x = _tmp[0];
a.y = _tmp[1];
a.x = _tmp[2];
```

在上述代码中，第3行将`a`赋值为了`{}`，此时`a`与`b`不再指向同一个对象。第4行中，（新的）`a`被赋值`a.x = 1`。第4行，（新的）`a`被赋值`a.y = a`，这里形成了一个循环引用的结构。第5行就不用说了，`a.x = 3`。而至始至终，`b`还是最早的那个`{}`。

这样的策略虽然反直觉，但细想之下不难理解。

首先是这样的策略非常的普适，如果左边的结构复杂，那么就会有一些分歧，比如应该按照深度优先还是广度优先来求值赋值呢？另一方面就是实现起来的话符合直觉的方式会变得更复杂一些，而现在的策略则只是需要在语法分析层面对赋值语句的语法树递归展开就行了。

我们把上面两段代码分别扔进[babel](https://babeljs.io)里可以得到如下的transpile结果：

```JavaScript
function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

var foo = ['a', [{ foo: 'bar' }, 1, 2, 3, 4, 5]];
var a = foo[0];

var _foo$1 = _toArray(foo[1]);

var fu = _foo$1[0].foo;

var tail = _foo$1.slice(2);

var missing = foo[2];
var _foo$3 = foo[3];
var def = _foo$3 === undefined ? 'default value' : _foo$3;

// ---------------------------------
var a = {};
var b = a;
var _ref = [1, a = {}, 3];
a.x = _ref[0];
a.y = _ref[1];
a.x = _ref[2];
_ref;
```

可以发现babel的转译是非常遵循于es6草案的。

到了这里，我们应该可以安心的玩解构了，对于一些场景它会显得非常非常的有用，例如：

```JavaScript
[a, b] = [b, a]; // swap

function hsl2rgb(h, s, l) {
  // ...
  return [r, g, b];
}
var [r, g, b] = hsl2rgb(h, s, l);

function negate(x, y) {
  // ...
  return [x, y];
}
[x, y] = negate(x, y);
```

在一些函数当中为了实现多返回值通常都会用返回一个数组或者KV来当元组的概念，但在接收返回值的时候却需要很麻烦的手工展开。有解构就可以更愉快的写这些代码了。

对于上面举例的解构在求值策略上的坑，只要注意用的姿势就OK了。
