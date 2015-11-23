title: 一个伪前端的Go入门——面向对象编程篇
date: 2015-02-7 17:42:34
tags:
- 编程
---

伟大领袖毛主席说，烂尾是不好的。虽然学习Go对我而言多半是玩票性质的，但是既然坑已经挖了就还是先安心填吧，反正快过年了，年前尽量就不要留遗憾了嘛对不对。

这一篇将主要介绍Go当中的类型系统和面向对象编程实现。

<!-- more -->

任何面向对象（或近似于面向对象）编程语言，只要理解了它的类型系统，基本上它的面向对象方法论就能闹明白了。

## 基础概念
一个典型的面向对象语言的类型系统通常都会包含以下几个概念：

* 基础数据类型：如整数、浮点数、布尔、字符串等
* 复杂数据类型：如数组、struct/class、指针等
* “万物之源”类型：如Java/C#里面的`Object`类型

## 类型约束

以上概念只是对类型本身的分类，而在对类型的约束方面，可体现出一门语言的面向对象方法论。例如：

C++中没有“万物之源”类型，也没有接口。在函数签名中指定class是它主要的类型约束方式，使用template进行元编程可以当一点duck typing来看（不严谨）。

C#和Java中的“万物之源”类型是`Object`，这一点上C#更彻底，因为它的基础数据类型也继承`Object`而在Java里则不是。C#和Java都有interface，使用class/interface是最常见的类型约束方式。除了在函数签名中约束，C#强大的泛型编程还支持在定义泛型类型的时候约束。

JavaScript中有一个看起来很像“万物皆为对象”类型的`Object`，但其实它并不是所有类型的源头，这并不是很严谨。JS反正运行时访问不存在的字段就报错，这带来了不少工程化上的劣势，但是确实也增加了很多编程的灵活性。毕竟动态语言和静态语言的思路还是不一样的。

由于实际生产中的JS常常会用类似`if (typeof obj.method === 'function')`来判断一个对象是否包含某个方法/字段，我们可以不严谨地认为JS的类型约束一方面是靠君子协议，一方面是靠“运行时手工duck typing”。

## Go中的结构体

基础数据类型和复杂数据类型在前作中已经介绍过了，这里就不多唠叨了。

Go没有class只有struct，不过其struct上也可以定义方法，但看起来很不一样。C++/C#/Java都是在定义一个class的时候就给它定义方法，直观的感受就是成员方法都会在`class XXX {}`的那一对大括号里面。而Go中struct的成员方法则都是“后来”添加上去的。例如

```
// 定义一个Person类型
type Person struct {
  Name  string
  Age int
}
// 为Person类型添加一个成员方法introduce
func (this Person) Introduce() {
  fmt.Println("My name is", this.Name, "and I'm", this.Age);
}
```

上面的代码就是给现有类型添加成员方法的办法，参数里虽然叫`this`但其实只是图这个名字比较熟悉而已，并不是固定的。

## 继承

Go里没有继承，它用了一种称为“匿名组合”的方式来满足对继承的需要，大概可以理解为`Mixin`吧。例如

```
// 定义一个Coder类型，让它“继承”Person
type Coder struct {
  Person
  APM float32
}
// 为Coder类型添加成员方法coding
func (this Coder) Coding() {
  if this.APM < 100 {
    fmt.Println(this.Person.Name, "is coding slowly");
  } else {
    fmt.Println(this.Person.Name, "is coding fast");
  }
}
jim := Coder{Person{"Jim Liu", 18}, 300};
jim.Introduce();
jim.Coding();
```

这样就让`Coder`“继承”了`Person`。

## 接口
在C#和Java中定义接口，可以用来进行进行类型约束，接口实现表达的是`can-do`语义，比类型继承的`is-a`语义更加灵活。

Go里也使用接口`interface`来约束类型，不过比C#和Java里的要灵活一些。

### 定义接口
```
type IGreetable interface {
  Greeting(name string)
}
```

很简单就是写上函数签名。接口可以组合，就像对`struct`进行匿名组合一样，对`interface`也可以进行匿名组合。

### 实现接口

C#/Java中一个类型要实现一个接口，需要在声明类型的时候连带声明它实现了哪些接口，然后挨个实现接口所声明的方法，否则编译器会无情拒绝。

上面说到由于Go的成员方法是在`struct`定义之后才添加上去的，那么一个`struct`怎么才算实现一个接口呢？Go用了一种我个人称它叫“编译时duck typing”的约束，就是说一个`struct`只要它拥有的成员函数满足一个`interface`的定义，那它就可以满足该接口的约束，例如：

```
func (this Person) Greeting(name string) {
  fmt.Println("Hello", name);
}
```

这样就让`Person`实现了`IGreetable`接口，可以`var gre IGreetable = Coder{Person{"Jim Liu", 18}, 300};`了。

Go中的“万物之源”类型就是空接口`interface{}`，这个……在网上基本对它都是贬义，因为它就像C/C++里面的`void*`一样泛滥。

## 泛型

为什么`interface{}`会泛滥？因为Go没有泛型。我了个去，作为一门现代静态语言竟然没有泛型？没有泛型的情况下，`interface{}`就很容易满天飞。

与此同时，安全的类型转换也是有必要的，在C#中做安全类型转换可以这么做：

```
ICodable coder = person as ICodable;
if (coder != null) {
  coder.Coding();
}
```

Go搞了一个叫“接口查询”的东西，跟上面比较像

```
func tryCoding(person IGreetable) {
  if coder, ok := person.(ICodable); ok {
    coder.Coding();
  } else {
    fmt.Println("Oops, not a coder.");
  }
}
```

上面代码里那个`person.(ICodable)`就是一个“接口查询”，这个嘛我觉得倒是挺恶心的。

## 小结
Go虽然没有常见的class、继承、虚函数等概念，但是通过匿名组合大概实现了继承和虚函数的效果。

Go的接口是先定义后实现的，这样一旦定义了一个新接口，只要它的签名和某些已有类型能match上，那么旧类型也可以当新接口实例来用，比较灵活。

Go没有泛型，少了一种现代静态语言的元编程和类型约束的利器，真是啧啧啧，这个实在不应该，不知道以后打不打算引入。