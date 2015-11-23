title: Swift入门笔记-0
tags:
  - 编程
date: 2015-10-07 23:33:33
---


~~霉霉~~斯威夫特入门笔记，纯熟流水账。

<!-- more -->

# 0. 准备工作

## 工具

Xcode里用Playground来玩是最简单的方法。

## 参考文献

参考文献：[The Swift Programming Language 中文版](http://wiki.jikexueyuan.com/project/swift/)

# 1. 基础部分

## 分号

Swift可以不写分号，也可以写分号，Fuck。

## 变量、常量

### 基本方法

`var`定义变量，`let`定义常量（严格来说不是真正的常量，在class中可以通过构造函数有机会修改它，后文详述）。

### 类型推导和标注

默认具有类型推导，如：

`var msg = "Hello, world!"`

整数literal会被推导成`Int`类型，浮点数literal会被推导成`Double`类型。

需要的时候可以自己加上类型标注，如：

`var msg: String`

## 类型

### 类型转换

把类型当一个函数看就行，如：

`let some_int = Int(some_double)`

### 布尔类型

`true`和`false`将会被推导成`Bool`类型。

### 类型别名

`typealias Byte = UInt8`——C里的`typedef`有木有……

### 元组（直接搬例子了）

#### 定义：

`let http404Error = (404, "Not Found")`

#### 使用：

`let (statusCode, statusMessage) = http404Error`——解构有木有

`let (justTheStatusCode, _) = http404Error`——discard解构有木有

`http404Error.0`——直接访问元组里的某个元素

#### 命名元素：

`let http200Status = (statusCode: 200, description: "OK")`

`http200Status.statusCode`——访问某个元素

### optionals

跟C#里的`Nullable`类型如出一辙……

`var maybeInt: Int? = 404`——`maybeInt`是一个`Int`的optional，现在它包含值，是404

`maybeInt = nil`——现在它不包含值了

东西有点儿多，剩下的关于optionals的东西后面再慢慢说……

## 运算符

### 算术运算符

`+ - * / % ++ --`无外乎这些了，`/`对`Int`类型是整除（好啊我喜欢），自增自减的前置后置规则和C里的一样。同样也有`+= -= *= /=`等……

### 比较运算符

除了常规的`== != < > <= >=`外，也有`===`和`!==`来提供Reference Equal。

### 空合运算符(Nil Coalescing Operator)

专门给optionals用的，和C#如出一辙，`a ?? b`等效于`a != nil ? a! : b`

### 区间构造器

类似巨蟒或者Go那种快速构造一个数组的办法

`a...b`——闭-闭区间

`a..<b`——闭-开区间（还能再丑一点儿吗）

## 字符串

### 基础

`"xxxx"`字符串literal会被推导成`String`类型。

Swift里的`String`被当做值类型，所以不能用`===`来比较，这样让它在参数传递的时候更容易知行合一。但猜测Runtime上还是用了字符串驻留集这类的技术来提高性能。

### 字符

用`str.characters`来获取`str`的字符数组，可以`for-in`来遍历它。

### 字符串连接

大家都喜欢的`+`和`+=`（F\*ck PHP）

### Interpolation

`var msg = "Hello, \(name)"`——几乎是现代语言必备功能了……

### Unicode

用`\u{十六进制}`来表示任意Unicode字符。

用`str.utf8 str.utf16 str.unicodeScalars`可以获取它不同的表示方法。

### strlen

Swift似乎不建议在码元级别对字符串进行处理，而建议用`str.characters`来在字符的级别进行处理，这样可以避免踩到一些组合字符的坑。

### 索引

正因为不能直接在码元级别处理，所以直接用整数下标的方式访问字符串就瞎了，于是Swift里用了一套乍看之下有点复杂的index机制来对字符进行索引，烦，不搬了……

### 比较

用`==`可以比较字符串。用`hasPrefix hasSuffix`相当于C#里面的`startWith endWith`。

## 数组、集合、字典

### 数组

`var arr = Array<Int>()`——完整声明

`var arr = [Int]()`——简便声明

`var arr = [1, 2, 3]`——使用literal声明，类型推导成了`[Int]`

`var arr = arr1 + arr2`——两个字符串连接

`arr[0] = 1`——赋值

`arr[1..3] = [11, 22, 33]`——解构式赋值，少的吞掉，多的插入

——于是可以玩出……`arr[1...1] = [arr[1], 11, 22, 33]`来当插入用，23333（不推荐，哈哈）

```
for item in arr {
    // 遍历
}
for (i, value) in arr {
    // 能获取索引的遍历
}
```

### 集合

`var set = Set<String>()`——空集合

`var set: Set<String> = ["Jim", "Liu"]`——使用literal声明

`var set: Set = ["Liu", "Jim"]`——使用literal简便声明，类型被推导成了`Set<String>`

`set1 == set2`——集合可以用`==`来判等

```
for item in set {
    // 遍历
}
```

……然后还有一堆集合操作的函数

### 字典

`var dict = Dictionary<String, Int>()`——完整声明

`var dict = [String: Int]()`——简便声明

`var dict = ["Jim": 1, "Liu": 2]`——使用literal简便声明，并能使用类型推导

`dict["Jim"] = 10`——赋值

```
if let value = dict["Jim"] {
    // 判断存在外加获取值
}
```

```
for (key, value) in dict {
    // 遍历外加类型推导
}
```

## 枚举

### 定义

```
enum Direction {
    case North
    case South
    case West
    case East
}
```

**Swift里的枚举不会被隐式赋值为自增整数**，如果需要定义一个“带值”的枚举，比如想把它持久化的，可以用“Raw Value”定义方式：

```
enum Direction: Int {
    case North = 0
    case South
    case West
    case East
}
```

这样后面的`South`啥的会自增赋值，当然手工指定也可以。不止是`Int`类型的，其他类型也行。

除了Raw Value以外，Swift还支持“相关值”（Associated Value），具体就不搬运资料了。

### 使用

```
var dir = Direction.North
var dir2: Direction
dir2 = .North
```

如上面第三行所示，对确定类型的枚举变量赋值的时候可以省略枚举的类型名称，又是个挺逗逼的语法糖。

有Raw Value的枚举可以用`.rawValue`来获取值，也可以用`Direction(rawValue: 0)`的方式来构造。

###

## 流程控制

### for循环

```
for var i = 0; i < len; i++ {
    // 传统for循环
}
```

```
for i in 1..<n {
   // for-in循环，功能比较丰富，可以遍历数组、集合、字典
}
```

### while循环

```
while condition {
    // 普通while循环
}
```

```
repeat {
    // 相当于do-while
} while condition
```

### if

好像没什么好说的……

类似C#，Swift里的condition必须是`Bool`表达式，不会像C和JS里那样隐式转换，因此`while n--`或者`if obj`就是不行的了。

### switch

**默认不fallthrough**，但是保留了`break`来满足强迫症患者的需要（其实还是有点儿用的，Swift里的`case`分支内容不允许为空，所以可以写个`break`来占位置）。

类似Go，`switch`的条件可以是区间：

```
switch (n) {
    case 1 ..< 5:
        // xxx
}
```

`switch`一个枚举的时候，也可以省略枚举类型名：

```
switch dir {
    case .North:
        print("running to north")
    default:
        print("unknown")
}
```

`switch`一个元组的时候，可以有一些看起来像模式匹配的语法糖，如：

```
switch point {
    case (0, 0):
        // 精确匹配
    case (_, 0):
        // discard其中某个元素
    case (-2...2, -2...2):
        // 对其元素使用区间条件
    default:
        // 默认
}
```

当需要用到元素值的时候又可以用类似解构的语法了，Swift里称为_值绑定（Value Binding）_：

```
switch point {
    case (let x, 0):
        // 这里可以用x
    case (0, let y):
        // 这里可以用y
    case let (x, y):
        // 呵呵
}
```

然后还支持一个`where`从句，看起来也挺像模式匹配：

```
switch point {
    case let (x, y) where x == y:
        // 哦
}
```

最后，用`fallthrough`可以显式fallthrough。

### guard

```
guard let name = person["name"] else {
    return
}
```

满足条件则继续执行，否则执行`else`，有`if-else`还搞这个语法糖，还是有点儿卵用的。比如你可以写成

```
guard condition else {
    return
}
```

而不需要写成

```
if !condition {
    return
}
```

照照镜子，有没有觉得变帅了？

### continue/break

可以通过标签来跳出指定层次的循环，像JavaScript那样，然而\_\_\_\_\_\_\_\_\_\_\_。

# to be continued

今天先到这儿吧…………下一篇开始函数和闭包。