title: 使用JavaScript实现“真·函数式编程”
tags:
  - 编程
date: 2015-10-21 23:33:33
---

其实这篇文章有点标题党了，因为函数式编程是一个非常大的课题。而标题里的“真”听起来就有一股浓浓的中二气息。

没错，这篇文章是函数式装逼系列[（1）](/2015/10/14/curry-function-in-es6/)[（2）](/2015/10/15/functional-reverse-in-es6/)的进阶版。函数式编程是很火的，然而现在网上很多入门级的JS函数式编程教程（甚至书）都太水了，以为用用`forEach`用用`map`用用`reduce`用用`immutable`就叫函数式编程了。

> Too young. Too simple.

本着搞一个大新闻的目的，我又开了这个无底天坑。当然一切都是从学习与娱乐的目的出发（这两件事其实并不冲突嘛），请勿评论本文中代码的实用价值。

瑞迪？黑喂狗！

<!-- more -->

# 0. 开篇

## 背景

要实现“真·函数式编程”，就要玩的彻底一点，必须~~挥刀自宫~~先禁用JavaScript里的大量语言特性，目前我能想到的有：

1. 禁用`var`/`let`，所有东西都用`const`定义，也就是说**无变量**，强制immutable。
2. 禁用分号，也就是**不让“顺序执行”，解除过程式编程范式**。~~你不是不爱写分号吗，这次彻底不需要写了~~
3. 禁用`if/else`，但允许用**条件表达式**`condition ? expr1 : expr2`。
4. 禁用`for/while/do-while`。
5. 禁用`prototype`和`this`来**解除JS中的面向对象编程范式**。
6. 禁用`function`和`return`关键字，**仅用lambda表达式来编程**（JS里叫箭头函数）。
7. 禁用多参数函数，只允许使用单个参数，相当于**强行curry化**

但是为了更可读（其实也可读不到哪去），我们允许使用大量ES6的新特性，比如箭头函数（lambda表达式）、解构、参数解构等等。如果你想玩这些特性，建议使用最新版的Firefox，或者node.js 4.0或更高版本加上`--harmony --harmony_modules --harmony_destructuring`等参数。

因为文中会用到一些ES6的特性，可能有的同学还不太清楚，所以这里花一小点篇幅简单的挑重点介绍一下：

## 箭头函数

其他语言里面一般叫做**lambda表达式**，其实我个人当然是喜欢这个名字，但是因为ES6的语言规范里就把它管叫箭头函数，自然文中还是会尽量这么说。

箭头函数的基本定义方式是：

```
(参数列表) => {
    函数体
}
```

当只有一个参数的时候，可以省略括号，写成

```
参数名 => {
    函数体 
}
```

当函数体是一个表达式（而不是段落）的时候，可以隐式`return`，写成

```
参数名 => 返回表达式
```

由于我们的“真·函数式编程”是禁用过程式编程的，不存在段落，于是你可以见到下文中几乎所有的箭头函数都是最简单的形式，例如`x => x * 2`。

箭头函数可以返回函数，并且在返回函数的时候，它也可以隐式`return`，因此可以像haskell一样构建curry风格的函数，如

```
const add = x => y => x + y
```

用传统的风格来“翻译”上面的`add`函数，就是

```
function add(x) {
    return function(y) {
        return x + y
    }
}
```

调用的时候自然也是使用curry风格的逐个传参`add(5)(3)`，结果就是8。

## 解构

解构是现代编程语言当中一个非常非常甜的语法糖，有时候我们为了实现多返回值，可能会返回一个数组，或者一个KV，这里以数组为例

```
const pair = a => b => [a, b]
```

我们可以用解构一次性将数组中的元素分别赋值到多个变量如

```
const [a, b] = pair('first')('second') // a是'first'，b是'second'
```

**参数结构**就是在定义函数参数的时候使用结构

```
const add = ([a, b]) => a + b

add([5, 3])
```
在`add`函数里面，数组`[5, 3]`可以被自动解构成`a`和`b`两个值。数组解构有一个高级的“剩余值”用法：

```
const [first, ...rest] = [1, 2, 3, 4, 5] // first是1，rest是[2, 3, 4, 5]
```

可以把“剩余值”解构到一个数组，这里叫`rest`。

关于解构语法的更多趣闻，可以看看[我之前的一篇博客](/2015/06/09/trap-in-es6-destructuring-syntax/)。

----------

OK，前戏就到这里，下面进入主题。

# 1. 实现循环

## 实现for循环遍历数组

命令式编程当中，循环是最基本的控制流结构之一了，基本的`for`循环大概是这样：

```
for (var i = 0; i < arr.length; i++) {
    // ...
}
```

看见了`var i`和`i++`了吗？因为不让用变量，所以在“真·函数式编程”当中，这样做是行不通的。

**函数式语言当中使用递归实现循环**。首先拆解一下循环的要素：

```
for (初始化; 终止条件; 迭代操作) {
    迭代体
}
```

使用递归来实现的话，无外乎也就是把迭代终止换成递归终止。也就是说，只要有上面4个要素，就可以构造出`for`循环。首先将问题简化，我们只想遍历一个数组，首先定义一个迭代函数`loop`

```
function loop_on_array(arr, body, i) {
    if (i < arr.length) {
        body(arr[i])
        loop_on_array(arr, body, i + 1)
    }
}
```

上面的函数有几个地方不满足“真·函数式编程”的需要：

0. 使用了`function`定义：这个最简单，改成箭头函数就行了
1. 使用了多个参数：这个可以简单的通过curry化来解决
2. 使用了`if/else`：这个可以简单的通过条件表达式来解决
3. 使用了顺序执行，也就是`body(i)`和`loop(arr, body, i + 1)`这两句代码使用了顺序执行

为了解除顺序执行，我们可以使用像“回调函数”一样的思路来解决这个问题，也就是说让`body`多接收一个参数`next`，表示它执行完后的下一步操作，`body`将会把自己的返回值以参数的形式传给`next`

```
const body = item => next =>
    next(do_something_with(item))
```

这样需要修改`body`是不爽的，因此可以将其进行抽象，我们写一个`two_steps`函数来组合两步操作

```
const two_steps = step1 => step2 => param =>
    step2(step1(param))
```

这样，上面的两行顺序执行代码就变成了

```
two_steps (body) (_ => loop_on_array(arr, body, i + 1)) (arr[i])
```

注意中间那个参数它是一个函数，而并不是直接`loop(arr, body, i + 1)`，它所接收的是`body(arr[i])`的结果，但是它并不需要这个结果。函数式语言当中常常用`_`来表示忽略不用的参数，我们的“真·函数式编程”也会保留这个习惯。

这样通过`two_steps`来让两步操作能够顺序执行了，我们可以完成遍历数组的函数了

```
const loop_on_array = arr => body => i =>
    i < arr.length ?
    two_steps (body) (_ => loop_on_array(arr)(body)(i + 1)) (arr[i]) :
    undefined
```

调用的时候就是

```
loop_on_array ([1, 2, 3, 4, 5]) (item => console.log(item)) (0)
```

但是你会发现最后那个`(0)`其实是很丑的对吧，毕竟它总是0，还不能省略，所以我们还是可以通过构造一个新的函数来抽取递归内容

```
const _loop = arr => body => i =>
    // 原来的loop_on_array的内容

const loop_on_array = arr => body => _loop(arr)(body)(0)

// 调用
loop_on_array ([1, 2, 3, 4, 5]) (item => console.log(item))
```

![](/uploads/public/perfect.jpg)

## 实现map

在上面的遍历的代码里，我们用`for`循环的套路来实现了对一个数组的遍历。这个思想其实还不算特别functional，要让它逼格更高，不妨从`map`这个函数来考虑。

`map`就是把一个数组`arr`通过函数`f`映射成另一个数组`result`，在Haskell里面`map`的经典定义方式是

```
map :: (a -> b) -> [a] -> [b]
map f []     = []
map f (x:xs) = f x : map f xs
```

简单的说就是：

1. 对于空数组，`map`返回的结果是空数组
2. 对于非空数组，将第一个元素使用f进行映射，结果作为返回值（数组）的第一个元素，再对后面的剩余数组递归调用`map f xs`，作为返回值（数组）的剩余部分

直接将上面的代码“翻译”成JS的话，大概是这个样子

```
const map = f => arr =>
    arr.length === 0 ?
    [] :
    [f(arr[0])].concat(map(f)(arr.slice(1)))
```

利用解构语法来简化的话大概是这个样子

```
const map = f => ([x, ...xs]) =>
    x === undefined ?
    [] :
    [f(x), ...map(f)(xs)]
```

至于`map`的用法大家其实都是比较熟悉的了，这里就只做一个简单的例子

```
const double = arr =>
    map(x => x * 2)(arr)

double([1, 2, 3, 4, 5]) // 结果是[2, 4, 6, 8, 10]
```

## 实现sum

接下来需要实现一个`sum`函数，对一个数组中的所有元素求和，有了`map`的递归思想，很容易写出来`sum`

```
const sum = accumulator => ([x, ...xs]) =>
    x === undefined ?
    accumulator :
    sum (x + accumulator) (xs)

sum (0) ([1, 2, 3, 4, 5]) // 结果是15
```

依然会发现那个`(0)`传参是无比丑陋的，用一开始那个`loop_on_array`相同的思想提取一个函数

```
const _sum = accumulator => ([x, ...xs]) =>
    x === undefined ?
    accumulator :
    _sum (x + accumulator) (xs)

const sum = xs => _sum (0) (xs)
```

计划通。

## 实现reduce

比较`map`和`sum`可以发现事实上他们是非常相似的：

1. 都是把数组拆解为**（头，剩余）**这个模式
2. 都有一个“累加器”，在`sum`中体现为一个用来不断求和的数值，在`map`中体现为一个不断被扩充的数组
3. 都通过“对头部执行操作，将结果与累加器进行结合”这样的模式来进行迭代
4. 都以空数组为迭代的终点

也许你觉得上面的`map`实现并不是这个模式的，事实上它是的，不放把`map`按照这个模式重新实现一下

```
const _map = f => accumulator => ([x, ...xs]) =>
    x === undefined ?
    accumulator :
    _map (f) ([...accumulator, f(x)]) (xs)
const map = f => xs => _map (f) ([]) (xs)

map(x => x * 2)([1, 2, 3, 4, 5])
```

和`sum`的模式惊人的一致对么？这就是所谓的`foldr`，`foldr`是一个对这种迭代模式的抽象，我们把它简单的描述成：

```
// foldr :: (a -> b -> b) -> b -> [a] -> b
const foldr = f => accumulator => ([x, ...xs]) =>
    x === undefined ?
    accumulator :
    f (x) (foldr(f)(accumulator)(xs))
```

其中`f`是一个“fold函数”，接收两个参数，第一个参数是“当前值”，第二个参数是“累加器”，`f`返回一个更新后的“累加器”。`foldr`会在数组上迭代，不断调用`f`以更新累加器，直到遇到空数组，迭代完成，则返回累加器的最后值。

下面我们用`foldr`来分别实现`map`和`sum`

```
const map = f => foldr (x => acc => [f(x), ...acc]) ([])
const sum = foldr (x => acc => x + acc) (0)

map (x => x * 2) ([1, 2, 3, 4, 5]) // 结果是[2, 4, 6, 8, 10]
sum ([1, 2, 3, 4, 5]) // 结果是15
```

这时候你会发现foldr的定义其实就是JavaScript里自带的`reduce`函数，没错这俩定义是一样的，通过`foldr`或者说叫`reduce`抽象，我们实现了对数组的“有状态遍历”，相比于上面的`loop_on_array`则是“无状态遍历”，因为“累加器”作为状态，是在不断的被修改的（严格的说它不是被修改了，而是用一个新值取代了它）。

用`foldr`实现的`sum`非常形象，就像把摊成一列的扑克牌一张一张叠起来一样。

“有状态”当然可以实现“无状态”，不care状态不就行了吗，所以使用`foldr`来实现`loop_on_array`也是完全没问题的

```
const loop_on_array = f => foldr(x => _ => f(x)) (undefined)

loop_on_array (x => console.log(x)) ([1, 2, 3, 4, 5])
```

呃，等等，为什么输出顺序是反的？是54321呢？很明显`foldr`中的`r`就表示它是“右折叠”，从递归的角度很好理解，无外乎**先进后出**嘛。所以要实现“左折叠”自然也有`foldl`函数（这里的左折叠右折叠表示折叠的起始方向，就跟东风北风一个道理）：

```
// foldl :: (b -> a -> b) -> b -> [a] -> b
const foldl = f => accumulator => ([x, ...xs]) =>
    x === undefined ?
    accumulator :
    foldl (f) (f(accumulator)(x)) (xs)
```

用它重新实现`loop_on_array`，注意这次`f`的参数顺序和`foldr`是相反的，这次是`accumulator`在前、`x`在后，这样能更形象的表达“左折叠”的概念

```
const loop_on_array = f => foldl(_ => x => f(x)) (undefined)

loop_on_array (x => console.log(x)) ([1, 2, 3, 4, 5])
```

![](/uploads/public/perfect.jpg)

## 循环小结

在第一个`for`循环的例子中，我们使用了命令式编程的思路，通过构造“顺序执行”组合函数来让“循环体”和“下一次迭代”这两个操作能够顺序执行。

这个思路毫无疑问是行得通的，但是似乎又有点命令式编程思想根深蒂固的感觉，于是在后面的例子里面，通过`map`、`sum`抽象出`foldr`和`foldl`函数，实现了“有状态遍历”。

`foldr/foldl`是对数组（列表）操作的一个高度抽象，它非常非常强大。

而在第一个例子实现`for`循环的过程中，我们费了老鼻子劲才构造出的“顺序执行”难道就这么被抛弃了？其实并没有，因为`foldr/foldl`抽象的是对列表的操作，而“顺序执行”则是更为普适的将两个操作的顺序进行安排的方式。至于它又有什么进一步的应用，看来只能下一篇文章才能继续写了。

# 下集预告

不小心发现光是循环已经写了这么多……所以我觉得还是分开写吧，下一篇文章将会介绍如何实现“局部变量”和“状态”。