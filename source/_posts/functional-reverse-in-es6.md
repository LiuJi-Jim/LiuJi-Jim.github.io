title: ES6实现递归reverse函数的新装逼技巧
tags:
  - 编程
date: 2015-10-15 23:33:33
---

今天翻到[@SYSU_Joyee](http://weibo.com/joyeecheung)妹子的一篇博客[逆转序列的递归/尾递归（+destructuring assignment）实现（JavaScript + ES6）](http://www.cnblogs.com/joyeecheung/p/4216058.html)，瞬间觉得很好玩，然后就玩上瘾了……

<!-- more -->

在[上一篇装逼教程](/2015/10/14/curry-function-in-es6/)中介绍了ES6里的箭头函数，用箭头函数可以把代码写的非常Functional，但是有一个非常严重的问题：

**所有的箭头函数都是匿名函数，所以怎么递归！！！**，事实上在JS里面，函数体内是可以访问函数名本身的，函数表达式`function f() {}`也能获得一个只有自身才能访问的函数名`f`，甚至当直接把箭头函数定义成一个变量时，其内部也可以访问到，但是那个就不好玩了，所以我们还是先严格的限制：**所有函数表达式和箭头函数都是匿名的，只有函数声明可以有名字。**

这个问题实在太经典了，因为有一个非常著名的东西就是专门用来干这个的，它就是[Y组合子](http://www.zhihu.com/question/21099081/answer/18830200)（这篇文章本来是在GitHub上看到的，不过找不到那个地址了……）

首先我们装个逼，用ES6箭头函数实现一个Y组合子：

```
const Y = f =>
    (x => f(y => x(x)(y)))
    (x => f(y => x(x)(y)))
```

为什么用`const`不用`var`或者`let`呢？因为我们要装逼啊，要immutable（扯远了）……![](/uploads/public/AC-1.png)

关于Y组合子我就不多说了，因为我理解也不透彻，暂时还只是搬运。

接下来就可以用箭头函数写递归了，比如说阶乘：

```
const factorial = Y(
    f => n => n == 0 ? 1 : n * f(n - 1)
)
```

无`function`，无`return`，看起来是不是很Functional啊，这货一点也不像JS了嘛。![](/uploads/public/AC-25.png)

回到原来的话题，结合解构和spread语法，可以把`reverse`函数实现得相当像Haskell了：

```
const reverse = Y(
   rev => ([x, ...xs]) =>
       x === undefined ?
       [] :
       [...rev(xs), x]
)
```

注意以上代码目前应该只有Firefox才能运行的，因为V8似乎不支持参数解构（即使加了`--harmony`）。

然而对于妹子博客里的尾递归版本，则又有新的难度了，因为我们所实现的“穷人的Y组合子”只支持单参函数，而尾递归版本是需要两个参数的，咋搞？

呵呵呵呵，作为Functional Programming装逼犯，多参函数完全是异端，必须烧死啊，所以两个参数的函数就写成curry形式，函数叠罗汉。

这个转换怎么做呢？先用最经典的多参递归函数：**辗转相除求最大公约数**来举个例子：

```
function gcd(a, b) {
    if (b == 0) return a
    return gcd(b, a % b)
}
```

转换成箭头函数的话大概是这样

```
gcd = (a, b) => b == 0 ? a : gcd(b, a % b)
```

由于只让使用一个参数，需要改成curry形式：

```
gcd = a => b => b == 0 ? a : gcd(b)(a % b)
```

这样这个`gcd`就是一个单参的curry函数了，然后用上面使用Y组合子构造递归匿名函数的方式

```
Y(
    _gcd => a => b =>
        b == 0 ? a : _gcd(b)(a % b)
)
```
这样构造出来的是一个单参函数`gcd(a)(b)`，然后再裹一层，把它铺开成双参函数

```
const gcd = (a, b) => Y(
    _gcd => a => b =>
        b == 0 ? a : _gcd(b)(a % b)
)(a)(b)
```

这样就成功构造出了`gcd(a, b)`![](/uploads/public/AC-1.png)

然后如法炮制，即可构造出尾递归版本的`reverse`函数：

```
const tailReverse = seq => Y(
    rev => ([x, ...xs]) => ret =>
        x === undefined ?
        ret :
        rev(xs)([x, ...ret])
)(seq)([])
```

计划通![](/uploads/public/AC-49.png)