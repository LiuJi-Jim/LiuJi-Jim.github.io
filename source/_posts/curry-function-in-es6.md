title: ES6实现Curry函数的新装逼技巧
tags:
  - 编程
date: 2015-10-14 23:33:33
---

Curry函数是老掉牙的话题了，不过有ES6的新语法糖以后，可以更愚快的装逼了。

<!-- more -->

定义：

```
var curry = fn => (...left) => (...right) => fn(...left, ...right)
```

有没有很像Haskell，2333333。上面装的逼主要用到了ES6中的以下新特性：

**箭头函数**（Arrow Function），其他语言里一般叫Lambda表达式（Lambda Expression）。

**剩余参数**（Rest Parameters)，因为ES6之前一般用`arguments`来做可变长参数，而strict mode里是不给用`arguments`的，于是ES6提供这个特性，可以让函数声明的时候最后一个参数是变长的，而形参可以当数组来用。

**展开参数**（Spread Parameters），这算是一个`apply`的语法糖，可以在函数调用的时候把一个数组扔进去，展开成多个参数传递。

使用：

```
var concat = (...args) => args.join('')

var hehe = curry(concat)('hehe', 'haha')
console.log(hehe('heihei')) // hehehahaheihei
```

脑洞开一下，可以实现一个`curryR`，就是从右往左curry：

```
var curryR = fn => (...right) => (...left) => fn(...left, ...right)
```

既然要装逼，那不妨把`curry`和`curryR`弄到`Function.prototype`上，发现还是有点难的，必须回归`function`了，不能光用Lambda表达式了。

这是因为ES6里的箭头函数设计为`this`固定是定义时的上下文，而不能会随着调用时而改变，即使重新用`call/apply/bind`也无效，既然是挂在`prototype`上，必须用到`this`，所以为了获得`this`就得回归`function`了。

```
Function.prototype.curry = function(...left) {
  return curry(this)(...left)
}

Function.prototype.curryR = function(...right) {
  return curryR(this)(...right)
}
```

装逼值大减啊……

```
var append = concat.curry('hehe')
var prepend = concat.curryR('hehe')

console.log(append('1')) // hehe1
console.log(prepend('1')) // 1hehe

var saySomethingTo = (word, name, end) => concat(word, ', ', name, end)

var sayHelloTo = saySomethingTo.curry('Hello').curryR('!!!')
console.log(sayHelloTo('Jim')) // Hello, Jim!!!
```

不过上面这个实现`curry`的方法虽然逼格够高，但其实有一个小小的缺陷，不知道观众老爷有没有看出来？

装逼完毕……