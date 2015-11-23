title: Swift入门笔记-1
tags:
  - 编程
date: 2015-10-08 23:33:33
---


~~霉霉~~斯威夫特入门笔记，继续流水账。

<!-- more -->

# 2. 函数

## 定义

```
func sayHello(name: String) -> String {
    return "Hello, \(name)!"
}
```

## 参数

但如果你的函数有两个或更多参数……

```
func my_max(a: Int, b: Int) -> Int {
    return a > b ? a: b
}
my_max(3, 4) // 这样调用是不对的
my_max(3, b: 4) // 这样才行
```

有没有很想骂人？![](/uploads/public/tiebaxiao.gif)

辣磨，如何才能用`my_max(3, 4)`来调用呢？

首先，在Swift里参数名有“内外”之分，函数外可以用一个名字（具名传参），函数内可以用另一个名字，例如：

```
func my_max(one a: Int, the_other b: Int) -> Int {
    return a > b ? a: b
}
```

其中`one`和`the_other`分别叫外部参数名（External Parameter Name），而`a`和`b`叫内部参数名或者局部参数名（Local Parameter Name），这样在调用它的时候可以使用具名传参：

```
my_max(one: 3, the_other: 4)
```

有没有想继续骂人？![](/uploads/public/tiebaxiao.gif)别着急，到目前为止，我们大概可以猜到如下规则：

* 第一个参数在没有指定外部参数名的时候，不用具名传参
* 第一个参数在指定外部参数名的时候，需要具名传参
* 其他参数不论是否指定参数名，都需要具名传参
* ？？？？？？？？？

补全第四条，似乎就找到了“其他参数不需要具名传参”的真谛了……于是乎Swift里有这么个东西叫“忽略外部参数名（Omitting External Parameter Names）”

```
func my_max(a: Int, _ b: Int) -> Int {
    return a > b ? a: b
}
my_max(3, 4) // 终于可以这样写了
```

把参数`b`的外部参数名写叫`_`，传参的时候就可以忽略它了……**获得BUFF：心满意足**

![](/uploads/public/kengdie.gif)

我只想说：呵呵

### 参数默认值

```
func greeting(name: String, word: String = "Hello") -> String {
    return "\(word), \(name)!"
}

greeting("Jim")
greeting("Jim", word: "hehe")
```

四不四很简单呐？虽然一般来说把带默认值的参数放在最后是比较方便的，但是也可以用些取巧的做法，比如：

```
func rnd(min: Int = 0, max: Int) -> Int {
    return min + random() % (max - min)
}
rnd(10, max: 20)
rnd(max: 10)
```

小子有种放学别走，我和你聊聊什么是**函数重载**。

### 可变参数（Variadic Parameters）

```
func my_max(nums: Int...) -> Int {
    var max = Int.min
    for n in nums {
        if (n > max) {
            max = n
        }
    }
    return max
}
my_max(11, 33, 22, 55, 44)
```

和C#里的可变参数差不多，不过事实上Swift只限制一个函数至多有一个可变参数，但却不限制可变参数必须是最后一个参数，于是结合具名参数，可以搞出很奇怪的东西来，比如：

```
func my_max(nums: Int..., nonsense: Int) -> Int {
    var max = Int.min
    for n in nums {
        if (n > max) {
            max = n
        }
    }
    return max
}
my_max(11, 33, 22, 55, 44, 66, nonsense: 999)
```

反正如果谁写这样的代码我绝对不会砍ta的……

**然而我没有找到JS里的`apply`或者C#那样可以把数组直接扔进去铺开可变参数那种语法……**

### 常量参数和变量参数

参数在函数里都被当做常量（`let`定义的），如果想在函数里修改参数的值，需要在定义前面加一个`var`。

**但是这里的修改只是对传参副本的修改，不会对传参原本值进行修改。**这么设计也许只是为了让函数看起来更pure一点，默认immutable。

### inout参数

正如上面所说，`var`参数只能修改传参副本，那么要修改参数原本的话，就需要用到`inout`参数：

```
func my_swap(inout a: Int, inout _ b: Int) {
    let tmp = a
    a = b
    b = tmp
}
var aa = 3, bb = 5
my_swap(&aa, &bb)
```

还搞个`&`看着跟取址似的，蒙谁呢……

## 函数重载

```
func rnd(min: Int, _ max: Int) -> Int {
    let range = max - min
    return min + random() % range
}
func rnd(max: Int) -> Int {
    return rnd(0, max)
}
rnd(10, 20)
rnd(100)
```

参考文献里没有，试出来的，大概就是这么个样吧……

## 函数类型

Swift应该也算First-class Function语言吧。

Swift里的函数类型用了一个很像Haskell的很讨巧的表示方法，如上面的rnd那个双参数重载，它的类型为：

```
(Int, Int) -> Int
```

知道了定义，那么函数就可以当强类型变量来用了：

```
var secretFunc: (Int, Int) -> Int = rnd
secretFunc(20, 40)
```

也可以用来传参，实现高阶函数

```
func run(fn: () -> Void) {
    fn()
}
func haha() {
    print("Haha")
}
run(haha)
```

也可以用来当返回值类型……

```
func mkFunc() -> () -> Void {
    func hehe() {
        print("Hehe")
    }
    return hehe
}
let fn = mkFunc()
fn()
```

于是就可以用来实现Curry函数（¯﹃¯）……

```
func saySomethingTo(word: String, to name: String) -> String {
    return "\(word), \(name)!"
}
func curry(fn: (String, String) -> String, _ first_param: String) -> (String) -> String {
    func f2(second_param: String) -> String {
        return fn(first_param, second_param)
    }
    return f2
}
let sayHelloTo = curry(saySomethingTo, "Hello")
sayHelloTo("Jim")
```

看起来有点挫…………或许可以把它写得更像Haskell一点…………

```
func saySomethingTo(word: String)(_ name: String) -> String {
    return "\(word), \(name)!"
}
let sayHelloTo = saySomethingTo("Hello")
sayHelloTo("Jim")
```

Ahhhhhhh STFU，看起来就像Haskell里的函数叠罗汉，这里的`saySometingTo`其实是一个`(String) -> (String -> String)`，所以它是“自带curry功能的函数”，然后Swift大概是实现了一个语法糖使得上面那个`name`参数也可以访问。

## 闭包

### 基本概念

在上面的第一个curry函数例子里面其实已经展示了闭包，和JS还有C#里面没有什么区别，简单的理解还是函数可以捕获它词法上下文当中的变量，即使它的父级上下文已经结束，被捕获的变量依然会存在。

### 匿名函数

C#里有两种方式来构造匿名函数，一个是C# 2.0里的“Anonymous Function”也就是匿名函数，一种是C# 3.0里面的“Lambda Expression”。貌似类似的东西在OC里面叫做代码块（block）——一听这名字就low多了是不（论起名的重要性）。

Swift使用一种叫“闭包表达式（Closure Expressions）”的方式构造匿名函数，我觉得这个命名太玄了，还是习惯叫匿名函数吧。它的语法是：

```
{ (parameters) -> returnType in
    statements
}
```

基本用法：

```
var testFunc: (Int, Int) -> Int
testFunc = { (a: Int, b: Int) in
    return a + b
}
```

参数可以支持类型推导，这时候参数列表的`( )`也可以省略

```
testFunc = { a, b in
    return a - b
}
```

当匿名函数只有一个表达式的时候，可以用隐式返回（Implicit Return），可以不写`return`

```
testFunc = { a, b in a * b }
```

像Haskell里一样丧心病狂的是，可以把运算符当函数用……

```
testFunc = (/)
```

### 尾随闭包（Trailing Closure）

当函数的最后一个参数是一个函数时，在调用的时候可以把它写在参数列表之外，形成一个很奇怪的语法结构：

```
func printAndDo(n: Int, then: (Int) -> Int) -> Int {
    print(n)
    return then(n)
}
// 传统方式
printAndDo(100, then: { n in
    print(n)
    return n
})
// 使用Trailing Closure
printAndDo(100) { n in
    print(n)
    return n
}
```

又到了同学们都喜欢的填空题时间了，这次的题目是：然而\_\_\_\_\_\_\_\_\_\_\_

如果用匿名函数来“美化”一下上面写的那个curry函数，大概是这么个样子

```
func curry(fn: (String, String) -> String, _ first_param: String) -> (String) -> String {
    return { second_param in
        fn(first_param, second_param)
    }
}
```

当然其实更“严肃”的curry函数也许应该是这么写

```
func curry(fn: (String, String) -> String) -> (String -> (String -> String)) {
    return { f1 in
        { f2 in
            fn(f1, f2)
        }
    }
}
let sayHelloTo = curry(saySomethingTo)("Hello")
```

甚至直接写成泛型的吧

```
func curry<T1, T2, T3>(fn: (T1, T2) -> T3) -> (T1 -> (T2 -> T3)) {
    return { f1 in { f2 in fn(f1, f2) } }
}
```

有没有觉得自己的装逼技巧又提高了？![](/uploads/public/tiebaxiao.gif)

# to be continued

今天先到这儿吧…………下一篇开始struct和class。