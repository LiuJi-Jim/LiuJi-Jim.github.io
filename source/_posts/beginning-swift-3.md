title: Swift入门笔记-3
tags:
  - 编程
date: 2015-10-10 23:33:33
---


~~霉霉~~斯威夫特入门笔记，继续流水账。

<!-- more -->

# 5. 错误处理

Swift的错误处理使用比较常见的结构化异常处理方式，配合Optional类型。

## 异常类型

有如C#里，`Exception`是所有异常的基类，Swift里有`ErrorType`这个协议（协议有点像`interface`，以后再说）来充当异常的。

由于Swift里面可以让枚举也实现协议，于是可以写出这种看起来很奇怪的代码（搬运例子）

```
enum VendingMachineError: ErrorType {
    case InvalidSelection
    case InsufficientFunds(required: Double)
    case OutOfStock
}
```

## 抛出异常

有点像JAVA，声明函数的时候加一个`throws`就表示这个函数可能会抛出异常，在这个函数里就能用`throw`了。

```
func willThrow() throws {
    // 这里就可以throw
    throw VendingMachineError.OutOfStock
}
func wontThrow() {
    // 这里就不能throw
    // throw VendingMachineError.OutOfStock
}
```

## 捕获异常

在调用`throws`声明的函数的时候，就必须要捕获异常。如果你认为捕获异常是用`try`的话，只对了一半……

很明显，`throws`声明是具有传染性的，一旦一个函数链上有某个函数会抛异常，那么它的上游必须能够妥善处理这个异常，否则上游就得继续抛异常，上游的上游……

对于~~我们无处安放的青春~~无法妥善处理的异常，只能继续向上抛，于是Swift提供了一个语法糖

```
func cannotHandleError() throws {
    try willThrow()
}
```

## 真·捕获异常

要想捕获到异常，需要这样：

```
func canHandleError() {
    do {
        try cannotHandleError()
    } catch VendingMachineError.OutOfStock {
        print("sold out")
    } catch {
        print("oops")
    }
}
```

其中`catch`和之前`switch-case`一样，支持模式匹配语法。

## 无视异常

如果调用一个`throws`方法的时候，“自认为”这次它不会抛出异常，可以用`try!`来调用，这样不会让`throws`传染。如果在运行时发生异常，它会造成运行时错误。

## 收尾工作

Swift没有`finally`，有点像Go那样有个`defer`

```
func canHandleError() -> String {
    defer {
        print("do some cleaning up before return")
    }
    do {
        try cannotHandleError()
    } catch VendingMachineError.OutOfStock {
        print("sold out")
    }
    return "over"
}
```

`defer`代码块会在函数结束之后，`return`之前执行，即使执行过程中发生了异常，也会保证被执行。而且和Go类似，一个函数里有多个`defer`的时候它们是倒序执行的。

# 6. 类型转换

## 类型检查

和C#非常像，用`is`来检查一个对象是否是某个类型的实例

## type casting

还是和C#非常像，使用`as`来做类型转换。

不过`as`有两种，一种是`as?`，转换结果是一个Optional类型，转换失败的时候就为`nil`。另一种是`as!`，转换失败的时候直接抛出运行时错误。

## “万物之源”类型

Go里有两种“万物之源”类型，一种是`AnyObject`，一种是`Any`，前者包含任意`class`的，后者包含任意类型（包括函数）。

在使用`as`转换一个数组的时候，有一个类似C# 4.0里泛型逆变的语法糖

```
for movie in someObjects as! [Movie] {
    // ..
}
```

其中`someObjects`本身是一个`[AnyObject]`，在遍历的时候把它转成了`[Movie]`。然而对于真·泛型类型，似乎不起作用

```
class Container<T> {
    
}
var c1 = Container<Shape>()
var c2: Container<Rect>? = c1 as? Container<Rect>
```

发现c2是`nil`，Xcode也在c2那一行提示了这个转换永远不可能成功（好残忍）。

# 7. 扩展

Swift提供给一个类添加功能的能力，这有点像是Go里的“先定义类型，再实现接口”这种说法，但事实上看疗效的话更像是Ruby那种可以把语言改得面目全非的样子。

Swift 中的扩展可以：（搬运）

* 添加getter/setter（包括静态的）
* 添加方法（包括静态的）
* 提供新的构造器
* 定义下标脚本
* 定义和使用新的嵌套类型
* 使一个已有类型符合某个协议

语法就不演示了，很简单的。

# 8. 协议

Swift里的`protocol`就是C#和Java里的`interface`

协议的语法跟C#太像了，不写例子了…………

协议可以用来规定属性getter/setter（包括静态的）、方法（包括静态的）、构造函数。

Swift里的协议可以提供默认实现，也就是说它在一定程度上可以当做`abstract class`的作用。

其他什么实现协议、协议继承、协议组合这些，看一眼就明白了……

# 9. 泛型

啊啊，有泛型的语言我喜欢。

Swift里的泛型和C#的如出一辙，并且Swift里也有`where`从句来对泛型参数进行约束。

惟独在泛型协议这一块，Swift用起来很奇怪，比如我想定义一个泛型List接口，在C#里：

```
interface IList<T> {
    // 我瞎写的可能语法有点不全对
    void Push(T item);
    int Count { get; }
    T this[int index] { get; set; }
}
```

在Swift里要用一个叫“关联类型”的特性

```
protocol IList {
    typealias T
    func push(item: T)
    var count: Int { get }
    subscript(index: Int) -> T { get set }
}
```

突然又不好看了……

这样可以用一个具体类型来实现它

```
class IntList: IList {
    typealias T = Int
    func push(item: Int) {
        
    }
    var count: Int {
        get {
            return 0
        }
    }
    subscript(index: Int) -> Int {
        get {
            return 0
        }
        set {
            
        }
    }
}
```

因为有类型推导，上面的`typealias T = Int`可以省略。

也可以实现成泛型的：

```
class GenericList<T>: IList {
    var items = [T]()
    func push(item: T) {
        
    }
    var count: Int {
        get {
            return 0
        }
    }
    subscript(index: Int) -> T {
        get {
            return items[index]
        }
        set {
            
        }
    }
}
```

# to be continued

今天先到这儿吧（好少）…………

等等，后面好像，没什么东西可以说了，访问限制、运算符重载什么的，看一眼就知道了啊。

要不后面就开始看看iOS开发的吧。