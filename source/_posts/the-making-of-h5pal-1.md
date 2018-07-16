title: "h5pal是怎样练成的 - 二进制处理篇"
date: 2018-07-13
tags:
- 编程
---

[书接上回](/2017/09/16/the-making-of-h5pal-0/)，竟然已经 10 个月过去了，真是羞于见人（并没有羞，脸皮太厚，咬我啊）。

本期节目将会介绍在 JS 中如何高效率的处理二进制文件，这里的“高效率”不仅限于性能方面，还包括我们的编程体验。

[课前阅读：JS中的二进制操作简介](/2015/09/26/a-brief-look-at-binary-ops-in-js/)。

<!-- more -->

## 开始前的唠叨-二进制概述

在我们日常的编程当中，直接和二进制打交道的机会其实并不多，因为编程语言已经给我们准备好了**数据类型**，比如在 JS 里我们有`Number/String/Boolean`等等这些基础数据类型、`Array/Object`等复杂数据类型或数据结果，已经够帮我们解决 99% 的日常需求。真正要处理二进制的时候，最常见的场景，比方说要搞一个图片上传、文件上传，也无外乎是用 `Blob/File/Buffer` 这一类的封装，把二进制的数据当作一个整体来处理，很少很少会需要对它的内容进行处理。

但在这篇文章里缩说的“二进制处理/操作”都是指对二进制文件或数据的内容进行具体的操作，比方说，如果您想裸写一个 WebSocket 协议实现，或者写一个 Protobuf 编解码，那么就免不了要和二进制打交道了。下文中具体涉及到的技术细节和 API 怎么用这类的东西可以看上面的课前阅读。如果那篇文章看完了，那么这篇文章在技术点方面几乎不会有无法理解的地方，只是一些实现的思路和技巧而已。

所以这一节先对 JS 里的二进制操作，也就是上面那篇文章里的主要内容做一个梗概：

* 与绝大多数语言一样，JS 里以字节为二进制数据的基本单位（最小单位是 bit，但本文里基本不会涉及），所以下文中涉及到“长度、容量、偏移量”等概念的时候所用的单位都是字节。
* JS 里使用`ArrayBuffer`来做字节数组的作用，指向一片内存，承载一份数据，但一般很少直接用它来对内容进行操作。
* JS 里使用`TypedArray`来作为`ArrayBuffer`的“视图”（View），处理多字节整数、浮点数的读写。同一个`ArrayBuffer`上可以随便建立`TypedArray`，它们的读写都会落到同一片内存上。
* JS 里也提供了`DataView`来实现非内存对齐情况下的多字节数据读写，以及指定字节序的处理。
* JS 里通常通过`XMLHttpRequest/File/Blob/剪贴板`等方式拿到二进制数据。

## 仙剑中涉及的二进制处理

首先是对资源文件的处理，仙剑的资源文件是用一种叫 yj_1 的算法（应该是他们自己弄的，基本上就是哈夫曼，具体不在这里讨论）压缩的二进制文件，它拥有一个文件头和被压缩的载荷，载荷分为若干个块（Block），每个块也有自己的头和载荷。所以要使用资源文件先要对它进行解压。

有了解压以后的资源文件，它通常是多个同类型文件封装在一个压缩包里的，每个类型的文件又有各自的文件头和载荷。

到了具体的载荷，比如位图、地图的 Tiles 描述、Tile 图元素、Sprite、调色盘、道具条目、角色条目、敌人条目、脚本条目、存档文件……所有资源，都有各自的二进制格式，需要一一处理。

## C 中的结构体、字节数组、内存、文件

SDLPAL 是用 C 写的，它使用了一种非常常用的技巧，来实现快捷的二进制操作。

我们知道在 C 里面一个结构体占多少内存是可以算出来的，因为它声明的时候就已经决定了它的内存布局，比方说

```
struct Vector3F {
  double x;
  double y;
  double z;
};
```

那么编译的时候就能知道，它的结构是 3 个`double`顺次排列，每个`double`是 8 字节，因此它会占 24 字节的内存，如果把它当作字节数组写进文件，它也就会占 24 字节的磁盘空间。

那么反过来，如果要通过`fread`函数把这个文件读进内存里，也要准备 24 字节的内存空间，`fread`接受的缓冲区参数类型是`void *`，这是因为 C 里缺少`byte`类型的锅，初始化的时候我们可以用`unsigned char`来代替，准备一个长为 24 的`unsigned char`数组，把它强制转换成`void *`，传给`fread`，就可以顺利的读入内存了。

读进来以后，我们再把`unsigned char *ptr`强制转换为`Vector3F *`。**技巧时间到**，一个`Vector3F *v`指向我们刚才那片内存的时候，我们对它的成员的读写，自然就会被编译器翻译成偏移量，落在正确的内存偏移位置上。如果访问`v->x`，就落在`ptr[0]`上，如果访问`v->y`就会落在`ptr[8]`上，`v->z`则是`ptr[16]`。

![Vector3F 的内存布局](/uploads/2018/vector3f.png)

这样一来，只要一个结构体的内存布局明确，就可以把结构体指针当作一个“View”，把它“贴”在一片内存上，就能用比较对象化的方式来访问这片内存，而不需要再去记忆它的具体内存布局和偏移量。如果要把它写入文件的时候，只要把结构体指针强制转换为`void *`然后传给`fwrite`（并且传入正确的长度）就可以把它存上了，根本不需要序列化和反序列化。

这样做还有一个非常好的应用场景就是，当我们要处理一个文件头，或者协议的包头/帧头这类东西的时候，我们可以直接对照着它的二进制布局，声明一个结构体，通过结构体的字段来访问内存就显然比通过偏移量来访问要方便一百倍。

比如仙剑里的 yj_1 文件头定义如下

![yj_1 文件头定义](/uploads/2018/yj1_header.png)

那么对应的内存布局和结构体声明就是

![yj_1 文件头 C 结构体声明和内存布局](/uploads/2018/yj1_header_c.png)

## 在 JS 里实现类似的效果

前文中我们提到，用`DataView`可以精确读写任意偏移量的二进制多字节数据，并且能指定字节序，于是它非常适合用来读写这种有固定内存布局的二进制数据，比如我们的`Vector3F`在 JS 里就可以这么用

```
const vRaw = new ArrayBuffer(24) // 申请内存
const vView = new DataView(vRaw) // 建立 View
const x = vView.getFloat64(0, true)
const y = vView.getFloat64(8, true)
const z = vView.getFloat64(16, true)
```

![使用 DataView 访问内存](/uploads/2018/vector3f-dataview.png)

当我们需要把这个`Vector3F`写进文件里的时候直接把`vRaw`写进去就行了，读出来的时候也一样原封不动。

但是这么用只解决了内存“View”的建立的问题，用的时候还是要记每一个字段的偏移量，这不还是坑爹吗？

在 h5pal 里，我利用 JS 中的`Object.defineProperty`来实现了一个使用体验与 C 中结构体非常近似的方案。这里还是用`Vector3F`来举例子

```
function Vector3F(buffer) {
  this._buffer = buffer // buffer 是个 ArrayBuffer 实例
  this._view = new DataView(buffer)
  this._LE = true // 这里先简化处理，都用小端序，演示一下而已
}
Object.defineProperty(Vector3F.prototype, 'x', {
  get: function() {
    return this._view.getFloat64(0, this._LE)
  },
  set: function(val) {
    this._view.setFloat64(0, val, this._LE)
  }
})
Object.defineProperty(Vector3F.prototype, 'y', {
  get: function() {
    return this._view.getFloat64(8, this._LE)
  },
  set: function(val) {
    this._view.setFloat64(8, val, this._LE)
  }
})
Object.defineProperty(Vector3F.prototype, 'z', {
  get: function() {
    return this._view.getFloat64(16, this._LE)
  },
  set: function(val) {
    this._view.setFloat64(16, val, this._LE)
  }
})
```

这样就可以通过如下代码来使用

```
const ptr = ..... // 管它从哪来的 24 字节内存
const v = new Vector3F(ptr) // 把 v “贴”在 ptr 这片内存上
console.log(v.x) // 这个读操作会落在 ptr[0] 上
v.y = 100 // 这个写操作会落在 ptr[8] 上
v.z = Math.PI // 这个写操作会落在 ptr[16] 上

// 可以通过在 ptr 上建立一个 Float64Array 的“View”来验证下刚才的操作对不对
const fp = new Float64Array(ptr)
console.log(fp) // Float64Array(3) [0, 100, 3.141592653589793]
```

就实现了一个“空壳”类，对它的字段操作都会落在背后指定的一片内存上，具体的过程如图

![使用 getter/setter 结合 DataView 访问内存](/uploads/2018/vector3f-gettersetter.png)

当然上面那一堆`defineProperty`如果手写的话是很难受的，h5pal 中为了方便定义各种结构体，自己搞了一个库，一个类似 DSL 的东西。中间为了迁移到这个新的方式，经历了一次惨绝人寰的重构。后来我把相关代码重新实现了一遍，单独弄了一个项目 [liuji-jim/c-struct](https://github.com/liuji-jim/c-struct)。不过是给 nodejs 用的，那时候 nodejs 貌似还没有全面推行`ArrayBuffer`和`TypedArray`相关的东西，不然其实可以一套代码前后端都能跑。

当然这样做也有缺点，因为类成员是运行时添加的，造成它们无法被编辑器的基于类声明的自动补全所识别，解决方法要么是改成代码生成，要么是再借助`Annotation`这类的新语言特性，不过那些自然都是后话了。

## 小结

在 h5pal 里随处都要和二进制打交道，因为它所有资源文件——从地图到 Sprite 到道具再到脚本等等一切——都是二进制存储的，而非序列化存储。当然，如果我做一次预处理，把它们全都弄成 JSON，那用的时候不是方便得多？是的，但那样就不够“原汁原味”了，背离了 h5pal 的初衷。

另外，在仙剑中有一个巨大的全局变量`Global`，是整个游戏的状态，它本身的定义是一个巨大的结构体，存档和读档的实现就是用上面那种方式，直接把`Global`所指向的内存写进文件/从文件读出来，可以说是非常简单粗暴直接有效。于是也造成不同版本的仙剑存档互相使用的时候很容易有问题，甚至根本没法用。这也是序列化相对于二进制的优势之一，在新旧版本之间的兼容会稍微容易一些。

那么，本期节目就到这里了，散~
