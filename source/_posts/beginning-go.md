title: 一个伪前端的Go入门
date: 2015-01-17 23:42:34
tags:
- 编程
---

最近因为突发奇想对并发编程不知道哪就来了兴趣，然后想来Go是现在非常炙手可热的一门并发编程语言，而Erlang虽然有其迷人之处，但是这么纯正的函数式语言要学起来实在是曲线也有点陡。

![吉祥物](/uploads/2015/go.gif)
这货是Go的吉祥物，强行卖萌，是个……鼹鼠吗？

OK不扯了，打算边学边写一点文章介绍下Go的入门，那么这一篇就是入门中的入门了，可能会显得有点无聊。

<!-- more -->

## Hello World
安装：官网提供了常用系统的安装包，无需再自己编译，安装完了需要配一下`GOPATH`环境变量
```
package main
import "fmt"
func main() {
  fmt.Println("Hello, Go!")
}
```

上面这段程序主要包含的内容是：
* 可执行程序至少需要一个叫`main`的`package`
* `main`包中包含一个签名为无参数无返回值的`main`函数作为入口函数

运行：`go run hello.go`
编译：`go build -o hello hello.go`
开发工具：我使用的是SublimeText配合GoSublime插件，官方自带了gofmt程序用来格式化源代码，于是代码风格的争论可以减少了，GoSublime会在保存文件的时候自动调用gofmt。

## 数据类型
### 基础数据类型
* 布尔：bool
* 整数：int, uint, int16, int32, int64等等
* 浮点数：float32, float64
* 复数：complex64, complex128
* 字符串：string

其中字符串操作主要有
```
"Jim" + "Liu" // 连接
len(s)        // 长度
s[1]          // 取字符
```

`int`和`int32`是两种类型，需要做类型转换的。~~然后有的文档说`int`是平台无关的，有的文档说是平台相关的，傻傻分不清楚，~~现在好了，新版的Go里面`int`长度是平台相关的。根据不同场景选择具体长度的类型是种好习惯，平常偷懒直接用`int`也无妨。

浮点数用`==`比较也是不安全的。

### 复杂数据类型
常用的复杂数据类型有
* 指针
* 数组和slice
* map
* struct和interface
* channel
* 枚举

#### 数组和slice
Go里面的数组是值类型，赋值、传参的时候会copy，这个和PHP比较像但是和C#、JS不大一样。如果想传引用可以通过指针，不过Go推荐在这种时候用slice。

Go里的数组比较像C里的数组，`[5]int`跟`[10]int`是两种不同的类型。数组是不可变长的，但可以通过slice来提高具体使用时候的灵活性。

slice和数组看起来很像
```
var arr1 [5]int  // 这货是个数组
var slice1 []int // 这货是个slice
```

slice用起来和Python里的数组有点像，可以把它理解为数组的一个view，而真正存放元素的是数组。那么slice是引用还是值呢？我把它当引用看，因为对它的下标赋值，会改到它指向的数组上面，传参、赋值的时候也是如此，表现和C#、JS里的基本一致。

一个数组上可以建立多个slice，用
```
arr[:]
arr[2:4]
arr[:5]
arr[5:] 
```
这样的语法可以方便地基于数组或者slice来生成slice，下界包含，上界不含。

如果懒得通过数组建立slice，可以直接用
```
make([]int, len)
[]int{1, 2, 3, 4, 5} // 显式初始化内容
```
的方式来生成一个slice。

用`append(slice, 1, 2, 3)`或者`append(slice1, slice2...)`的方式向slice里添加元素。注意两点：1.`append`是返回新值的，而不是直接修改参数。2.可以任意多个元素作为参数，或一个slice加上`...`作为不定长参数。

slice和C++里的`vector<T>`类似，它具有`len(slice)`和`cap(slice)`两个操作，前者是元素个数，后者是容量，容量用满以后再加入新元素就会（被）扩容。

#### map
用惯了JavaScript的`{}`，不难发现现在随便写个程序对于字典的依赖有多大。Go很良心，把`map`做成内置类型了。而且比JS更好的是它的key不像JS那样仅限字符串或者数字。**map也是引用类型**。
```
kv := make(map[string]int) // 初始化一个key为string，value为int的map
kv["foo"] = 100            // 元素赋值
val, ok := kv["foo"]       // 查找
delete(kv, "foo")          // 删除
```

查找的那个比较特殊，它利用了Go中的多返回值特性，如果查到了那么`ok`就是`true`，否则就是`false`。

值得一提的是，通过某些资料指出，Go的map是树查找结构，而不是hash，也就是说它的时间复杂度是`O(logn)`的，不是`O(1)`的。在数量小的时候也许性能会比较好，因为常数比hash表好，而数量大的时候访问时间会有增长。再结合hash碰撞、内存等各方面综合考虑，有优有劣，不展开讨论。

事实上也的确只要求key的类型实现了等与不等的操作，不需要实现hash操作。

#### struct
Go没有`class`，但是有`struct`。
```
type Klass struct {
  Name  string
  Value int
}
```

这个语法跟C里的`typedef`很像，定义了个结构体。Go里面没有`private`，`public`这样的访问修饰符，首字母大写的字段是public的，首字母小写的就是private的，只能在这个`struct`所在的`package`内能访问到。

初始化一个struct的方法有多种，比较常用的有
```
k1 := Klass{"Jim", 999}  // 带值初始化，按定义顺序传值
k2 := Klass{Name: "liu"} // 命名传参，其余参数会被赋值为对应类型的“零值”
```

#### 枚举
Go里没有严格意义上的枚举，相比C是一个不足，更不用比C#那种强类型枚举了。定义一个枚举大概是这么个样
```
type Direction int
const (
  DirSouth Direction = iota
  DirNorth // 后续的可以省略类型以及iota
  DirEast
  DirWest
)
```
`iota`是一个编译时常量，每出现一次就会自动`+1`，并且会在每个`const`声明的时候重置为0

可以看出这样的山寨枚举会缺少一些编译时检查，于是用一个type define来让它变成“强类型”的。而`iota`是`int`型的，可以和我们定义的类型做隐式转换，还算比较方便。

## 变量
声明变量时需要指定类型
```
var v1 int
var s1 string
var arr1 [10]int
var slice1 []int
```
所以你看出来了，上面都是只声明，不赋初值的方式，要赋初值很简单，后面跟个赋值语句就行了。

当然也可以利用一下类型~~推倒~~推导
```
var s1 = "hello"
s2 := "world"
```
上面这两种写法没声明类型，是靠类型推导来完成的，很方便，尤其是最后一种，是非常常用的写法。

## 流程控制
### 条件
#### if
```
if condition {
  // ...
} else if another_condition {
  // ...
} else {
  // ...
}
```
几个要点
* 条件语句不加括号
* 左花括号`{`不换行（![](/uploads/public/bye.gif)代码风格之争）
* 即使只有一句话也必须加花括号（![](/uploads/public/bye.gif)代码规范之争）

`if`的条件之前还可以放一个短的声明语句，放个临时的条件变量简直不要太方便
```
if val, ok := kmap["foo"]; ok {
  fmt.Println(val)
} else {
  fmt.Println("not found")
}
```

#### switch
```
val := 1
switch val {
case 0:
  // ...
case 1, 2, 3:
  // ...
  fallthrough
default:
  //
}
```
要点：case后面的值可以是多个；默认不fallthrough，可以通过`fallthrough`语句来显式达成。

```
val := 1
switch {
case val == 0:
  // ...
case 0 < val && val < 100:
  // ...
  fallthrough
default:
  //
}
```
要点：switch后面不跟变量的时候，case后面可以是完整的表达式，很多时候这种写法可以取代`if/else`。

### 循环
Go里面只有`for`循环一种循环，但是它有几个变种。

最基础的
```
for i := 0; i < 10; i++ {
  // ...
}
```

当起始语句和累加语句不写时，那两个分号也可以省了，这个就相当于`while`了
```
sum := 2
for sum < 1000 {
  sum += sum
}
```

还有“for-ever”
```
for {
  // ...
}
```

`for`循环可以通过`break`打断，`continue`跳过。

`for`循环可以配合`range`来更方便地遍历数组、slice、KV、channel等，例如
```
for k, v := range kv {
  fmt.Println(k, ":", v)
}
```

## 函数
### 基础概念
* 函数是一等公民
* 函数是强类型的
* 函数可以有多返回值，可以使用named返回值
* 函数也有闭包

#### 简单函数，A+B Problem
```
func add(a, b int) int {
  return a + b
}
```

#### 多返回值
```
func divide(a, b int) (result int, err string) {
  if b == 0 {
    return 0, "divided by zero"
  }
  return a / b, ""
}
```
如果具名返回值都已经被赋值了，那么可以直接`return`就能返回多个值

#### 不定参数
```
func printEverything(message string, args ...string) {
  fmt.Println(message)
  for i, v := range args {
    fmt.Println(i, v)
  }
}
printEverything("hello", "one", "two", "three")
```
这里本质上`args`是一个`[]string`的slice。

#### 函数变量 && 匿名函数
```
sayHello := func(name string) {
  fmt.Println("hello", name)
}
sayHello("jim")
```
`sayHello`是一个函数变量，它的值是一个匿名函数，和JS里差不多，区别就是Go里的函数变量是强类型的。

#### 闭包
这个就不演示了，和JS里的闭包差不多。

## 下期预告
这一篇介绍的东西都太基础，比较无聊，接下来的内容应该会稍微有意思点，希望不要“有生之年”。

下一篇应该会包含如下内容
* 关于struct的更多：Go里的“面向对象”和interface
* channel和goroutine简单应用