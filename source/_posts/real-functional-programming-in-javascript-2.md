title: 使用JavaScript实现“真·函数式编程”-2
tags:
  - 编程
date: 2015-10-22 23:33:33
---

上一篇文章[使用JavaScript实现“真·函数式编程”](/2015/10/21/real-functional-programming-in-javascript-1/)本来以为可以一次性写完的，结果话痨本色，没办法，继续填坑，这篇应该可以完结了，讲道理嘛。

这篇当中将介绍如何在纯函数式的限制之下实现“局部变量”和“状态”。

<!-- more -->

# 2. 实现局部变量

首先考虑这样一段代码

```
function getName() {
    return 'name from somewhere'
}
function greeting(word) {
    var name = getName()
    return word + ', ' + name
}
console.log(greeting('Hello'))
```

这是一段典型的命令式编程的代码，它最主要的问题就是**局部变量`name`**。

在上一篇文章的第一个实现对数组遍历的例子当中我们已经对“顺序执行”初窥门径，通过构造了一个`two_steps`函数，实现两个步骤（函数）顺序执行。

在这个构造过程当中，我们得到一个重要的思路，就是在函数式语言当中，**如果你想“获得”一个什么东西，就构造一个新的函数，把它参数化**。对于`two_steps`的例子而言，“想获得”的是一个`step2`，就把它参数化了。

所以当需要“获得”局部变量的时候，自然而然我们会想到，把要拿的东西参数化就OK了，于是我们可以简单的这么构造：

```
// local :: a -> (a -> b) -> b
const local = a => f => f(a)
```

`local`函数接收两个参数，`a`是要“捕获”的值，`f`是接收或者说消费这个值的函数，用它来改造上面的代码

```
function greeting(word) {
    return local(getName())(name => word + ', ' + name)
}
```

上文当中将`getName()`的结果“捕获”作为后面函数的参数，实现了“局部变量”`name`。把上面的函数按照“真·函数式编程”规则改写：

```
const getName = () => 'name from somewhere'

const greeting = word => local(getName())(name => word + ', ' + name)

console.log(greeting('Hello')) // 结果是'Hello, name from somewhere'
```

![](/uploads/public/perfect.jpg)

不难发现我们这个`local`其实就是`two_steps`的简化版，区别在于`two_steps`的第一个`step1`是一个函数，而`local`则是一个值，如果用`two_steps`实现`local`那么就是：

```
const local = value => step2 => two_steps (_ => value) (step2) ()
```

看，我们这个`local`的风格，看起来非常像JS当中的“回调”的方式——事实上，因为像Haskell这样的纯函数式语言没有顺序执行，你可以认为每一行代码执行顺序是不一定的，这非常类似于在JS中我们遇到了海量异步操作的时候：**异步操作的执行顺序是不一定的，所以才会用回调函数来保证“异步操作->处理结果”这个顺序。**回调是一种非常朴素，非常好理解，但写起来却反人类的异步编程方式。我一直不批判浏览器和node.js里把API都用回调风格来定义，因为它很原始，大家都懂，至于后来的如`Promise`这些方式，也可以用回调的API轻松封装出来，咸甜酸辣，五仁叉烧，任君挑选。

OK，扯远了，也许你觉得上面的例子太过简单，下面我们来看这篇文章中真正重点的内容。

# 3. 实现状态

以下的例子基本上都源自从[陈年译稿——一个面向Scheme程序员的monad介绍](http://www.cnblogs.com/fzwudc/archive/2011/04/19/2020982.html)文中搬运和改造，我从这篇文章获得了巨大的启发，也先对作者和译者表示感谢。

我们写程序的过程当中常常回用到**自增ID**这种东西，如果在JS里要实现一个自增ID，可能会这么写

```
var __guid = 0
function guid() {
    return __guid++
}
```

好嘛，绕了一圈，又回到刚才的话题了，局部变量（这次在闭包里面而已，本质是一样的），和二次赋值。但是经过前文的启发很容易就能用参数化的方式来解决这个问题

```
function guid(oldValue) {
    var newValue = oldValue + 1
    return [newValue, newValue]
}
```

也就是

```
const guid = oldValue =>
    local(oldValue + 1)(newValue => [newValue, newValue])
```

我们把局部变量参数化，然后把返回值改成了一个数组（因为JS里没有元组，所以只能用数组暂代），这样在需要`guid`的时候，需要把之前的返回值的第二个值作为参数传进去；而整个程序则需要使用一个初始值（我们管叫“种子”）来启动它。

现在假如我们有3个名字，分别要对它们用`guid`来编号并且输出，也就是说需要连续执行3次`guid`，这里涉及到的就是顺序执行以及`guid`的状态参数传递：

```
const counting = state =>
    local (guid(state)) (([id1, state1]) =>
        local (guid(state1)) (([id2, state2]) =>
            local (guid(state2)) (([id3, state3]) =>
               `Alice:${id1} Bob:${id2} Chris:${id3}`
            )
        )
    )
console.log(counting(0)) // 结果是Alice 0, Bob 1, Chris 2
```

也许你已经被后面谜一般的这一堆括号所惹毛了，如果你能忍着继续看下去的话也许可以真的获得这篇文章的乐趣（捂脸

对于没有副作用的函数（纯函数），不需要带上`state`这个参数，而对于有副作用的函数——我们称之为“操作”——这里体现为调用了`guid`函数的，就需要带上`state`这个参数。

看，`state`就是我们所说的“状态”，整个过程中，都把它（用数组的第二个值）揣着，当一个函数需要状态的时候就传给它，它用完了又捡回来揣着。

看起来没什么不对，但是`guid(state)`这个函数总是给人隐隐的不爽：`state`是`guid`自身的状态，却需要`counting`这个消费者在整个调用过程当中帮它传递，这是不爽的，因此不妨把`guid`的`state`参数定义为`curry`形式：

```
const guid = () => state =>
    local(state + 1)(state1 => [state1, state1])
```

进而`counting`中的`local`的第一步不再是一个已算出的值，而是一个`curry`了第一个参数（空），需要第二个参数`state`的`guid`函数，这就是`curry`函数的精妙之处，它让函数可以“部分地”被执行，从而能够实现演算——我们把整个演算过程像代数推导一样列出来，最后把值代入就能计算出结果，是不是很像中学的时候解代数题、物理题什么的？

于是，用了新的`guid`以后，`local`就不能应用于`guid`了，使用`two_steps`改写一下

```
const counting_by_steps = state => two_steps
    (guid()) (([id1, state1]) => two_steps
        (guid()) (([id2, state2]) => two_steps
            (guid()) (([id3, state3]) => `Alice:${id1} Bob:${id2} Chris:${id3}`)
            (state2))
        (state1))
    (state)
console.log(counting_by_steps(0))
```

这时候你会觉得更烦了，因为这次虽然我们不需要给`guid()`主动传递`state`了，但在连续多次调用`two_steps`的时候，却需要把`state1`和`state2`给`two_steps`传递下去，能不能构造一个新的`two_steps`函数，让它能够透明地传递`state参数`呢？

答案是显然的，回顾一下上文中`two_steps`的定义和实现：

```
// two_steps :: (a -> b) -> (b -> c) -> a -> c
const two_steps = step1 => step2 => param =>
    step2(step1(param))
```

我们想想，`two_steps`的`param`参数作用无外乎是作为“状态”传给`step1`，它的定义是`curry`化的，如果`two_steps`不传第三个参数，获得的就是一个内容为`step1-then-step2`的“部分函数”这个函数接收`param`参数，返回`step2`的结果。要让`two_steps`能够继续透明地使用这种“部分函数”，就是说`two_steps`的结果可以继续被`two_steps`组合，我们可以对`step1`和`step2`函数的类型进行限定

```
step1 :: State -> [Value, State]
step2 :: State -> [Value, State]
param :: State
```

其中`State`是状态的类型，`Value`是返回值的类型，在`guid`的例子里面，这两者都是`Number`。这样结合起来，新的`two_steps`——我们给它一个新名字叫`begin`——的类型限定就是

```
begin :: (State -> [Value, State]) -> (State -> [Value, State]) -> State -> [Value, State]
```

对吧，`begin`的两个参数`step1`和`step2`都是`State -> [Value, State]`类型，这跟它在只`curry`前两个参数，剩余`param`参数时的那个部分函数`step3`的类型（函数签名）是一样 的。

从中抽取出一个模式：`State -> [Value, State]`，我们用一个泛型来抽象它叫做`M<Value>`，不难发现，`guid`是`() -> Number -> [Number, Number]`也就是`() -> M<Number>`类型（其`State`也是`Number`类型），用这个泛型可以把`begin`描述成：

```
begin :: M<Value> -> M<Value> -> State -> [Value, State]
```

这样我们可以顺利的推出`begin`的实现

```
const begin = step1 => step2 => state => {
    const [value1, state1] = step1(state)
    return step2(state1)
}
```

简化之，结果是

```
const begin = step1 => step2 => state => step2(step1(state)[1])
```

这和`two_steps`如出一辙，区别只在于，对于`step2`，它**丢弃了`step1`所产生的`Value`**，而只保留了它所产生的`State`。

然而我们还是需要`Value`啊！说丢就丢这也太不负责任了吧！这时候自然想到“再加一个中间层”，我们设计这样一个函数：它的第二个参数消费`step1`所产生的`Value`，返回`step2`，这个`step2`再去消费`step1`所产生的`State`。把这个函数命名为`bind`，它的类型描述如下

```
bind :: (State -> [Value, State]) -> (Value -> (State -> [Value, State])) -> State -> [Value, State]
```

使用`M`泛型来描述它就是

```
bind :: M<Value> -> (Value -> M<Value>) -> State -> [Value, State]
```

看，当使用`bind`来结合两个操作`step1`和`build_step2`的时候，`step1`消费掉`State`种子，产生一个返回值`Value`（并且可能产生了新的状态`State`）。紧接着`build_step2`消费了`step1`所返回的`Value`，并且它返回一个新的`M<Value>`也就是`step2`，`bind`函数会像`begin`那样，把`step1`所产生的新`State`作为参数传给`step2`，并且返回其结果。于是我们终于构造出了`bind`的实现：

```
const bind = step1 => build_step2 => state => {
    const [value1, state1] = step1(state)
    const step2 = build_step2(value1)
    return step2(state1)
}
```

转换成“真·函数式编程”，这里利用`local`实现局部变量：

```
const bind = step1 => build_step2 => state =>
    local (step1(state)) (([value1, state1]) =>
        local (build_step2(value1)) (step2 =>
            step2(state1)
        )
    )
```

不难发现，`begin`是`bind`的一个特例，用`bind`来构造它的话就是

```
const begin = step1 => step2 => bind (step1) (_ => step2)
```

非常的直白，忽略`step1`产生的`Value`，继续调用`step2`。现在使用`bind`来改进上面的多个带状态的顺序执行的代码

```
const returns = value => state => [value, state]
const main = state =>
    bind (guid()) (id1 =>
        bind (guid()) (id2 =>
            bind (guid()) (id3 =>
                returns(`Alice:${id1} Bob:${id2} Chris:${id3}`)
            ))) (state) [0]
console.log(main(0)) // 结果是'Alice:1 Bob:2 Chris:3'
```

![](/uploads/public/perfect.jpg)

注意上面的代码里面我们定义了一个`returns`函数，它接收一个`Value`，并且返回一个`M<Value>`。毫无疑问，`M<Value>`是比`Value`更“高阶”的类型，因为`M<Value>`当中含有`State`，而`Value`不含。

`bind`函数作用于`M<Value>`类型，因此需要`returns`，于是通过`returns`将一个`Value`转成`M<Value>`；而`main`函数是返回`Value`类型的，则通过`[0]`来将一个`M<Value>`抛弃`State`转回`Value`。

还记得刚才那句话吗：

> 对于没有副作用的函数（纯函数），不需要带上`state`这个参数，而对于有副作用的函数——我们称之为“操作”——这里体现为调用了`guid`函数的，就需要带上`state`这个参数。

因为`main`函数抛弃了最终的`State`，所以它不在有副作用，又变成纯函数了；而正是因为它抛弃了`State`，它自身也变成无状态的了，所以毫无疑问重新调用`main(0)`就会让`guid`清零重新开始——局部变量，作用域，生命周期，有没有发现命令式编程里面的概念在这里体现出来了？

## 那么，`M<Value>`到底是什么？

从面相对象的角度去理解，我们可以说，`M<Value>`是一个封装了`State`在里面的“操作”。从函数式编程的角度去理解，我们理解为`Value`是一个“值”，而`M<Value>`是一个“计算”。

对上面的东西做一个小结

1. `returns`函数将一个`Value`“提升”成`M<Value>`类型。
2. `begin`和`bind`函数将两个`M<Value>`绑定顺序关系（`begin`是`bind`的简化版）。`bind`函数中的`build_step2`将会有一个“临时”的机会获得`Value`，但是用完以后又必须回到`M<Value>`。
3. `[0]`将`M<Value>`“降级”回`Value`——这个过程将会不可逆地丢失掉`State`。

我们上面的`returns`和`bind`这一对函数就实现了一个`Monad`——准确的说是`State Monad`。在Haskell里面，我们的`returns`叫做`return`，我们的`bind`叫做`bind`或者运算符`>>=`。这张图

[![via《道可叨 | Monad 最简介绍》](/uploads/2015/monad.png)](http://zhuoqiang.me/what-is-monad.html)

是我所见到的一个非常形象的描述。

除了`State Monad`外还有很多种`Monad`，例如`Maybe`帮助Haskell实现了非常自然的错误处理，`IO`帮助Haskell实现了IO。在`Monad`的帮助之下Haskell更实现了`do notation`这种“顺序执行”的语法糖，可谓是Haskell的核心之一。

# 4. 总结

到现在为止，循环有了，局部变量有了，状态也有了，可以说基本上已经没有写不出的程序了。当然，正经的程序是不可能这么写的，所以这两篇文章也就是分享一下我个人的学习心得，玩玩所谓“真·函数式编程”，以及——最重要的——还是装逼。

好了，最后，我也不想说什么了，只能深吸口气，紧闭眼睛，一言(tú)以蔽之：

![](/uploads/public/zhe-bi-zhuang-de-you-dian-ji-shu.jpg)