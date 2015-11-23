title: Swift入门笔记-2
tags:
  - 编程
date: 2015-10-09 23:33:33
---


~~霉霉~~斯威夫特入门笔记，继续流水账。

<!-- more -->

# 3. struct与class

## 基础

Swift~~抄C#设计~~里的`struct`和`class`可谓貌合神离，`struct`是值类型，`class`是引用类型。

所以`class`可以用`===`和`!==`来比较Reference Equal。

**Swift里的数组、字符串、字典是值类型。**

## 定义

太老套了，没什么值得说的……

### 构造函数

```
class Person {
    init() {
        // ...
    }
}
```
构造函数固定叫`init`，可以被重载。

### 定义property

像是JS和C#的结合体，并不像C#那样区分field和property，但是在对property定义getter/setter的时候语法很像。

```
class Person {
    var firstName: String = ""
    var lastName: String = ""
    var fullName: String {
        return firstName + " " + lastName
    }
}
```

上面的例子里`fullName`因为只有getter所以可以使用隐藏get写法，完整写法：

```
var someProperty: String {
    get {
        // blablabla
    }
    set(newValue) {
        // blablabla
    }
}
```

如果把setter的参数省略，在函数体里面可以隐式使用`newValue`这个变量。

对于一般的属性（Swift里管叫存储属性）可以定义Observer来监听它的变动：

```
class Person {
    var firstName: String = "" {
        willSet(newValue) {
            print("willSet", firstName, "to", newValue)
        }
        didSet(oldValue) {
            print("didSet", oldValue, "to", firstName);
        }
    }
}
```

类似地，这里的`newValue`和`oldValue`两个参数也是可以隐式使用的。

属性可以定义成lazy的，在`var`前面加个`lazy`就行，这样只有在这个属性第一次被访问的时候才会进行初始化。

属性可以定义成只读的，用`let`定义的属性在构造函数里有唯一的一次赋值机会。

静态属性的定义及使用方法和C#没有太大区别。

### 定义method

和定义一般的方法没有明显区别，可以隐式使用`self`访问上下文对象。

给`struct`定义方法时，默认只支持纯函数，如果修改了自身属性，需要在`func`前面声明一下`mutating`，因为是值类型，甚至可以对`self`重新赋值。

### 定义索引器

索引器，在C++里好像叫`[]`运算符，在Swift里叫“下标脚本”

```
class Person {
    subscript(i: Int) -> String {
        get {
            // 返回与入参匹配的Int类型的值
        }
        
        set(newValue) {
            // 执行赋值操作
        }
    }
}
```

和定义property的时候类似，当只有getter的时候也可以用简便写法。

### 继承

```
class Car: Vehicle {
    override func run() {
        // ...
    }
}
```

getter/setter也可以重写，属性observer也可以重写，用`final`标记的方法和属性不能重写。用`final`标记的`class`不能被继承。

## 实例化

### 构造

如上面所说，构造函数叫`init`，与普通函数的区别是，构造函数的第一个参数在调用时不能省略参数名（也还是可以用`_`来discard）。

```
class Car {
    let brand: String
    init(brand: String) {
        self.brand = brand
    }
}

var c1 = Car(brand: "BMW") // 这里brand: 不能省
```

常量字段在构造函数里有唯一一次赋值机会（父类的常量字段在子类构造函数里不能改）。

构造函数分两种，一种叫“指定构造器”就是上面那种看起来很普通的，一种叫“便利构造器”，在构造函数声明前面加个`convenience`：

```
convenience init() {
    self.init(brand: "unknown")
}
```

在`convenience`构造函数里面必须调用它的其他构造函数。

Swift的实例构造过程也是常见的所谓“两段式构造”：

1. 申请内存、给属性赋空值；调用子类构造器，完成子类属性赋值；调用父类构造器，完成父类属性赋值。
2. 构造完成，可在子类构造器中执行任何其他操作。

换句话说，在调用`super.init`之前，是不能访问父类属性的，在之后就可以了。

Swift里还有一种特殊的“可失败构造器”，就是在`init`后面加个`?`，在构造失败的时候，可以`return nil`。

### 析构

析构函数叫`deinit`（还敢再难听一点吗），是一个无参数无返回值函数，没有别的重载。

对象的析构时机当然就是生命周期结束的时候啦，这个比较复杂，等学到ARC的时候再细看吧。

# 4. ARC

ARC就是Automatic Reference Counting，自动引用计数。

Swift里没有传统意义上说的GC，对于引用计数为0的对象将会销毁（析构）。

```
func nonsense() {
    let car = Car()
    print(car.brand)
}
nonsense()
```

函数`nonsense`执行完以后，`car`就被销毁了，它的析构函数也被调用。

## 循环引用

这种情况太常见了，比如对象`a`持有一个对象`b`的引用，`b`也持有一个`a`的引用，也就是`a.b = b`，`b.a = a`，就构成了一个循环引用。这种时候，`a = nil; b = nil;`并不会让`a`和`b`被析构，因为虽然外部引用没了，但内部还存在引用，于是内存泄露，gg。

```
class A {
    var b: B?
    deinit {
        print("A is dead")
    }
}
class B {
    var a: A?
    deinit {
        print("B is dead")
    }
}

var a: A? = A()
var b: B? = B()
a!.b = b
b!.a = a

a = nil
b = nil
```

会发现`a`和`b`的析构函数都没被调用。

## 弱引用

如果一个对象只被弱引用，那么它就可以被回收掉。在Swift里面用`weak`来把一个引用声明为弱引用，如

```
class B {
    weak var a: A?
    deinit {
        print("B is dead")
    }
}
```

还是刚才的代码，这时候神奇的时期发生了，`a`和`b`被销毁了。为什么呢？因为`b`对`a`的引用改成了弱引用，在`a`和`b`都被赋值为`nil`后，`a`就只被弱引用（被`b`）了，于是它可以被回收，所以先看到`A is dead`；进而`a`对`b`的强引用也就不存在了（`a`都挂了），于是可以回收`B is dead`，计划通。

## 无主引用

弱引用的例子是非常容易，就是弱引用对象可能会为`nil`。例如游客`Customer`与票`Ticket`，游客可以不持有票，但是票必须有主人。表现为`Customer`的`ticket`数学是一个`Ticket?`，而`Ticket`的`holder`属性是`Customer`（不能为`nil`）。

```
class Customer {
    var ticket: Ticket?
    deinit {
        print("Customer is dead")
    }
}
class Ticket {
    var holder: Customer
    init(holder: Customer) {
        self.holder = holder
    }
    deinit {
        print("Ticket is dead")
    }
}

var jim: Customer? = Customer()
jim!.ticket = Ticket(holder: jim!)

jim = nil
```

很明显上面的代码有循环强引用，`jim`不会被销毁，它所持有的`ticket`也不会被销毁。

然而票对游客的引用其只是一个“从属”关系，并不是真正的“持有”，所以这里应该把`Ticket`的`holder`属性定义为**无主引用**

```
unowned var holder: Customer
```

这样就上面的代码将`jim`置为空时，`jim`仅仅被`jim.ticket`持有无主引用，于是它可以被销毁，先能看到`Customer is dead`；接下来，因为`jim`不存在了，`jim`对`jim.ticket`所持有的强引用也随之被打破，`jim.ticket`也被销毁，于是看到`Ticket is dead`，计划通。

我理解其实无主引用是一个语法糖，因为其实只用`weak ptr`也够了（C++11就只有`weak_ptr<T>`而没有`unowned_ptr<T>`，但是这样在语义上必须允许一个引用为`nil`，也许Swift希望在概念上保留不能为空的机会，于是引入了这个东西。而如果没有它的话就只能靠程序员自己去理解了……

## 两边都不能为空时的循环引用

例如`City`必须属于一个国家，`Country`也必须有一个`capital`，两者缺一不可。

```
class City {
    let name: String
    unowned let country: Country // 因为City“隶属于”Country，这里声明成无主引用
    init(name: String, country: Country) {
        self.name = name
        self.country = country
    }
    deinit {
        print("\(self.name) is dead")
    }
}
class Country {
    let name: String
    var capital: City
    init(name: String, capitalName: String) {
        self.name = name
        self.capital = City(name: capitalName, country: self)
    }
    deinit {
        print("\(self.name) is dead")
    }
}

var usa: Country? = Country(name: "USA", capitalName: "Washington")
usa = nil
```

看起来很美好啊，但其实是不行的，因为在`self.capital = City(name: capitalName, country: self)`这句话当中，`self.capital`还没有值，这样`self`就还没构造完成（所谓两段式构造），于是`country: self`这个传参就不能用，造成了先有鸡还是先有蛋的问题。

Swift为了解决这个问题提供了一个叫做“隐式解析可选类型”的特性，把

```
var capital: City
```

的定义改成

```
var capital: City!
```

这样在`Country`的构造阶段它的值会被自动赋值为`nil`（于是妈了个臀的我就想问问这和`City?`有啥区别？）。

然后就可以先后看到`USA is dead`和`Washington is dead`了。~~我不会告诉你一开始我写的demo是`China`和`Beijing`，然后程序一跑通我给吓尿了，赶紧改？~~

# to be continued

今天先到这儿吧…………下一篇什么内容再说了。
