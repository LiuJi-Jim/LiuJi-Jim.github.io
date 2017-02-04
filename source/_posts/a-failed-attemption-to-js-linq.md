title: "在JavaScript中实现LINQ——一次“失败”的尝试"
date: 2017-2-4 23:33:33
tags: 
- 编程
---

这篇文章的起因是我在知乎上对[JavaScript 函数式编程存在性能问题么？](https://www.zhihu.com/question/54637225/answer/140613065)这个问题的回答。其实在这个问题之前挺久我就想做相关的尝试，但懒癌无药医，挖坑如山倒，填坑如抽丝。

废话不多说，走你。

C# 3.0引入了引以为豪的LINQ（Language INtergrated Query），可以用类函数式的方式操作集合（C#中的IEnumerable<T>接口）。

在JS中，数组也有类似的`filter`、`map`、`reduce`一类方法，但存在重复遍历问题，利用C#中LINQ的思路，给JS实现一套LINQ是否可行呢？

<!-- more -->

# C#中的LINQ

C#中的LINQ是通过`yield`来避免重复遍历的，抽象的说，`Where`(对应filter)、`Select`(对应map)这类的方法调用的时候，都只会把操作“暂存”起来，直到调用了`ToArray`、`Aggregate`(对应reduce)之类的方法，才会“驱动”它去进行遍历。

举一个简单的例子

```
var array = new []{ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 };
var sum = array.Where(n => n % 2 === 0)
               .Select(n => n + 3)
               .Aggregate((sum, n) => sum + n, 0);
// 代码不一定能编译，我是裸写的
```

上面是一个最基本的`filter`/`map`/`reduce`的过程（下文也会继续用这个例子），只有在`Aggregate`调用的时候，才会对数组进行遍历，而`Where`和`Select`只是一些类型为`IQueryable<T>`的中间过程。

C#中的LINQ得益于C#的`yield`关键字，配合First-Class-Function可以不费吹灰之力地构建`IEnumerable<T>`，而C#中的`foreach`提供了对`IEnumerable<T>`的语法糖，这样就可以很自然的对LINQ的中间结果进行二次加工，而不需要繁琐地手工调用`.Next()`。

# JS中的filter/map/reduce

JS中的原生数组就自带了`filter`/`map`/`reduce`等一系列函数化的集合操作方法，但使用中有一个隐患就是，每次调用它们都会进行一次完整的遍历，这样当用这样连写的风格，就会造成重复遍历

```
var sum = array.filter(n => n % 2 === 0)
               .map(n => n + 3)
               .reduce((sum, n) => sum + n, 0)
```

上面的代码，在`filter`和`map`被调用的时候，都会遍历一次数组，`reduce`的时候再遍历一次，这样总共就被遍历了三次，当集合比较大的时候，这估计不是大家所想见发生的事情。

如果在`filter`/`map`/`reduce`的回调函数里打印一些调试信息，我们会发现调用的次序大概会是这样的

```
filter
filter
filter
... x10
map
map
map
... x5
reduce
reduce
reduce
... x5
```

# JS中的LINQ

## yield/generator

ES6中有了`yield`和Generator Function（不熟悉的可以先回顾一下我几百年前写的[这篇](/2014/11/28/a-brief-look-at-es6-generator-function/)和[这篇](/2015/01/18/more-about-es6-generator-function/)文章），并且，由于`Symbol.iterator`和`for of`语法的引入，能用生成器构造集合了，并且还能和`for of`无缝衔接。

也就是说，ES6已经有了C#那样优雅地实现LINQ的基础设施，我们就来实现一个简单的试试。

## IQuerable

首先我们像C#那样实现一个`IQueryable`类，并且它通过`Symbol.iterator`能够支持被`for of`遍历

```
class Queryable {
  constructor(iterable) {
    this.iterable = iterable
  }

  [Symbol.iterator]() {
    let iterator = this.iterable[Symbol.iterator]()
    return iterator
  }
}

Array.prototype.asQuerable = function() {
  return new Queryable(this)
}
```

由于我们是“面向接口编程”的，这里我们并不关心`new Queryable(xxx)`传入的是一个`Array`、一个`Generator`还是一个`Querable`，反正它们都可以被`for of`遍历。

然后为了方便，在`Array.prototype`上挂了一个方法，别嫌脏，娱乐而已。

尝试一下

```
let arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
for (let item in arr.asQueryable()) {
  console.log(arr)
}
```

## filter/map/reduce

我们的`Queryable`类已经可以享受`for of`语法糖的便利了，然后我们就可以基于这个给它愚快地添加各种集合操作方法了

```
function* _filter(iterable, predicate) {
  for (let item of iterable) {
    let checked = predicate(item)
    if (checked) {
      yield item
    }
  }
}

function* _map(iterable, mapper) {
  for (let item of iterable) {
    let mapped = mapper(item)
    yield mapped
  }
}

class Queryable {
  constructor(iterable) {
    this.iterable = iterable
  }

  [Symbol.iterator]() {
    let iterator = this.iterable[Symbol.iterator]()
    return iterator
  }

  filter(predicate) {
    let iterable = _filter(this, predicate)
    return new Queryable(iterable)
  }

  map(mapper) {
    let iterable = _map(this, mapper)
    return new Queryable(iterable)
  }

  reduce(reducer, initial) {
    let result = initial
    for (let item of this) {
      result = reducer(result, item)
    }
    return result
  }
}
```

这里注意，`filter`和`map`分别调用了`_filter`和`_map`方法，它们返回的结果都是`Generator`，我们知道一个`Generator`只定义了集合如何“被遍历”，而事实上它没有真正发生操作，需要调用`next()`或者`for of`（也就是`next()`的语法糖）来“驱动”它进行遍历。

而`reduce`当中调用了`for of`，也就是它真正发生了遍历。

赶紧爽一爽

```
var sum = array.asQueryable()
               .filter(n => n % 2 === 0)
               .map(n => n + 3)
               .reduce((sum, n) => sum + n, 0)
```

如果在`filter`/`map`/`reduce`的回调函数里打印一些调试信息，我们会发现调用的次序大概会是这样的

```
filter/map/reduce
filter
filter/map/reduce
filter
...
```

只遍历了一遍

## 扩展LINQ

有了上面三个方法我们可以顺便构造一下`length`和`toArray`这类的方法，比如

```
Queryable.prototype.length = function() {
  return this.reduce(n => n + 1, 0)
}

Queryable.prototype.toArray = function() {
  return this.reduce((arr, it) => {
    arr.push(it)
    return arr
  }, [])
}
```

当然其实`map`/`reduce`都是`foldl`/`foldr`的具象（吃我一发安利，参考我写的[使用JavaScript实现“真·函数式编程”](/2015/10/21/real-functional-programming-in-javascript-1/)，所以上面的那些方法其实都可以写得更“函数式”，但既然这篇文章只是为了实验，就不搞那么多幺蛾子了。

## 性能测试

我们用[benchmark](https://www.npmjs.com/package/benchmark)模块对上述代码进行性能测试，并且引入两个对照组，不多说了，直接看代码吧

```

function useRawLoop() {
  let result = 0
  for (let i = 0; i < arr.length; ++i) {
    let n = arr[i]
    if (n % 2 === 0) {
      n += 3
      result += n
    }
  }
  return result
}

function useLoop() {
  let result = 0
  for (let n of arr) {
    if (isEven(n)) {
      n = add3(n)
      result = sum(result, n)
    }
  }
  return result
}

function useArray() {
  return arr.filter(isEven)
            .map(add3)
            .reduce(sum, 0)
}

function useLINQ() {
  return arr.asQueryable()
            .filter(isEven)
            .map(add3)
            .reduce(sum, 0)
}
```

用长度为100的数组进行测试，结果

```
RawLoop x 380,068 ops/sec ±1.01% (88 runs sampled)
Loop x 138,121 ops/sec ±1.91% (81 runs sampled)
Array x 59,682 ops/sec ±1.14% (89 runs sampled)
LINQ x 17,235 ops/sec ±1.69% (87 runs sampled)
```

可以看出，我们的LINQ性能非常非常的废柴，主要原因：

* JS对Generator的优化非常废柴
* JS对`for of`的优化非常废柴——因为它就是`Generator#next()`的语法糖

# 结论

虽然我们通过ES6的一系列新特性给JS实现了lazy的LINQ，避免重复遍历，是实现了，但想象中的性能提高却是化为泡影。

当然，通过不断优化，减少`for of`的使用，改为手工`.next()`遍历，也许性能还会高一些，但一来我不太相信它会有很明显的变化。二来更重要的是，不用`for of`的话，我们就不能实现“无痛”的集合操作代码编写了，既然已经不能“无痛”，那么同样“痛”的方法自然有性能更优的，而且根本不需要`Symbol.iterator`、Generator等等这一大堆新特性。

所以这是一个成功的尝试，也是一个失败的尝试。成功之处在于很开心能看到ES6有如此强大的基础设施用于编写优雅代码，发挥创造力。失败之处么，自然是由于现阶段的JS引擎并没有对这些新引入的特性进行值得称道的优化，这也提醒我对于这些新特性——至少是说，需要runtime支持的新特性——不要盲目的追新。