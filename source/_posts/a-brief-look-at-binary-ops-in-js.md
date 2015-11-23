title: JS中的二进制操作简介
date: 2015-09-26 12:31:35
tags:
- 编程
---

写这篇博客的起源是在[div.io](http://div.io)上的一篇[文章《你所不知道的JavaScript数组》by 小胡子哥](http://div.io/topic/766)下的评论中的讨论。

因为随着XHR2和现代浏览器的普及，在浏览器当中处理二进制不再向过去那样无所适从，随着Canvas/WebGL等新技术逐渐开始进入大众视野，也会用到一些字节数组或者16位、8位整数等东西。在node.js刚刚发布的4.0版本中，Buffer的底层使用了更符合JS标准的`Uint8Array`来实现，浏览器和node.js再次向相同的目标靠近了一点点，所以对于JS中处理二进制，我就打算写这篇文章作一个入门性质的流水账，方便一些对二进制处理不了解的同学快速入门，虽然在前端领域用到的不多，不过也可以作为茶余饭后的休闲谈资。

<!-- more -->

## 二进制数据在JS程序里的表达

现今世界上几乎所有的计算机体系结构都是以字节（byte）为二进制数据的基本单位（注：不是说最小单位），所以二进制常常以字节数组的形式存在于程序当中。例如在C#里面，就用`byte[]`，标准C里面没有`byte`类型，但可以通过`typedef`把`byte`定义为`unsigned char`的别名，效果是一样的。

JS设计之初似乎根本没想过要处理二进制的东西，加上对类型的极度弱化，对于字节的概念可以说是非常非常的模糊。如果要表达字节数组，那么似乎只能用一个普通数组来表示。

HTML5体系引入了一大堆新的东西，比如XHR2，是可以上传或下载二进制内容的，与之配套的东西就是JS里的[ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)和[Typed Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray)了。

`ArrayBuffer`是一个固定长度的字节序列，你可以通过`new ArrayBuffer(length)`来得到一片空间，或者用下文将会介绍的方法从XHR2等途径获取。由于内部实现与数组不一样，`ArrayBuffer`通常都是连续内存（注意，这只是经验之谈，并不是规范也不是文档所明确的），因此对于高密度的访问操作而言它比JS中的Array速度会快很多（但并不要用它来简单地代替Array）。如果用Chrome的Profile工具查看Heap Snapshot，会发现ArrayBuffer会被单独列为一类，也许它的内存分配和布局与Array以及其他JS对象有一些差别吧。

`ArrayBuffer`是不能直接被访问的，因此需要借助Typed Array。Typed Array是一组具体数据类型的Array-Like类型的统称，包括

```
Int8Array             8位有符号整数，类似于C里面的char
Uint8Array            8位无符号整数，类似于C里面的unsigned char
Uint8ClampedArray     8位无符号整数，跟Uint8类似，但在溢出处理上不大一样
Int16Array            后面这些类型就不罗嗦了
Uint16Array
Int32Array
Uint32Array
Float32Array
Float64Array
```

Typed Array的背后是一个`ArrayBuffer`，也就是说，**事实上的数据是存在`ArrayBuffer`里面的，而Typed Array只是给你提供了一个某种类型的读写接口**，用[MDN的话](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays)说，叫做

> Multiple views on the same data

举个栗子，如果我们有一个`ArrayBuffer`名为buffer（先不考虑怎么构造这个测试数据），内容如下：

```
01 02 03 04 05 06 07 08
```

也就是说它有8个字节，我们分别用它来构造`Uint8Array`, `Uint16Array`, `Uint32Array`，则可以得到

```
var  u8 = new  Uint8Array(buffer); // length为8
var u16 = new Uint16Array(buffer); // length为4
var u32 = new Uint32Array(buffer); // length为2
```

它们的内容分别为

```
[1, 2, 3, 4, 5, 6, 7, 8]
[513, 1027, 1541, 2055]
[67305985, 134678021]
```

这不难理解。

可以看出，如果要手工构造上面的测试数据`ArrayBuffer`，用`Uint8Array`就会很方便（呃事实上这是我个人最常用的一种Typed Array）。

而如果用同样的`ArrayBuffer`构建带符号整数类型，则可能因为整数溢出而得到不同的结果，上面的例子并没有碰到，有兴趣的话可以自己试试。因此使用Typed Array也可以用来做有符号数和无符号数的转换。

如果你用过canvas的`getImageData/putImageData`的话，会发现它给你的就是一个`Uint8ClampedArray`，这东西访问起来速度比JS的原生Array快很多，使得对canvas进行高速的像素操作成为可能。

然而最最重要的一个概念还是：**Typed Array不直接存放任何数据，所有对Typed Array进行读写的操作，最终都会落实到它背后所持有的`ArrayBuffer`的身上。**`ArrayBuffer`才是真正的**raw bytes，而Typed Array只是一个操作窗口/操作视图（View）。**

## 获取二进制数据

nodejs那边先按住不表，这里谈谈在网页里如何获取二进制数据？常见的办法有3种，1是通过`XMLHttpRequest 2`，2是通过`File`和`Blob`一套相关接口。

### 通过XMLHttpRequest 2

XHR2的接口跟XHR几乎是一样的，当制定`xhr.responseType = 'arraybuffer'`以后，在成功获取数据的回调里就可以通过`xhr.response`来得到请求结果的`ArrayBuffer`了，然后就可以按照你的意愿来构造各种Typed Array进行访问。

`responseType`还可以有`blob`取值，可以用`xhr.response`获得[Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob)对象。

### 通过File和Blob

在HTML5中提供了对表单的文件控件`<input type="file" />`更丰富的操作，可以通过`input`DOM对象的`.files`来获取一个`FileList`，当然通常浏览器都只提供了单选的文件控件，于是这里都只会有一个[File](https://developer.mozilla.org/en-US/docs/Web/API/File)对象。另外，通过拖拽、剪贴板等方式也能获取到`File`或者`Blob`。

`File`继承了`Blob`，并提供了`name`, `lastModifiedDate`等基础元数据，但是依然是一个深度封装，不能直接获取到它的二进制。


`Blob`是`Binary large object`的缩写，它与`ArrayBuffer`的区别是除了raw bytes以外它还提供了mime type作为元数据。但它依然是无法直接被读写的。

这时候需要借助[FileReader](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)的帮忙。`FileReader`提供了一组用来将`Blob`读取为更为实用的类型的方法

```
readAsArrayBuffer()
readAsBinaryString()
readAsDataURL()
readAsText()
```

例如
```
var file = get_file_some_how();
var fr = new FileReader();
fr.onload = function(e) {
    e.target.result; // 读取的结果
};
fr.readAsDataUrl(file); // readAsArrayBuffer
```

可以干什么呢？例如图片上传之前的本地预览（甚至基于canvas的编辑）等等都可以实现了。

`Blob`的其他构造方法多而杂，这里就先不到处搬运文档了。

## 消费二进制数据

何谓消费？最常见的方式也许就是通过XHR2直接把二进制数据以文件方式POST到服务端去。

这里我比较推荐使用[FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)来构造POST数据。因为在服务端收的时候会比较容易一些，具体有兴趣可以去找找别人的例子。

虽然直接提交`ArrayBuffer`也是可以的，但是这种时候服务端收到的POST body会是一大团，用起来不方便。如果要使用`FormData`来提交`ArrayBuffer`，需要先将其构造成`Blob`。

## 对Typed Array的构造留个心眼

当使用`new xxxxxArray(arrayBuffer)`这个重载进行构造的时候，它会默认基于此`ArrayBuffer`进行构造。但当使用`new xxxxArray(another_typed_array)`这个重载的时候，则是进行“拷贝构造”，这样两个Typed Array会指向不同的buffer，需要注意这是否符合预期。

如果需要基于同一个`ArrayBuffer`来构造Typed Array，可以使用Typed Array的`buffer`, `byteLength`, `byteOffset`来获取它背后的`ArrayBuffer`。

## Tips（坑）

### 对内存对齐留个心眼

当使用ArrayBuffer来构造Typed Array的时候，可以指定`byteOffset`参数，例如

```
var buffer = get_array_buffer_some_how();
var i16 = new Int16Array(buffer, 10);
```

上面的代码就能以`buffer`向后偏移10字节处为起点来构造`Int16Array`，但是如果将10设置为一个奇数，会发现如下错误：

```
RangeError: start offset of Int16Array should be a multiple of 2
```

这是因为Typed Array对内存对齐有要求，它不能在非对齐的位置建立，同理，`Uint32Array`和`Int32Array`则要求偏移量是4字节对齐的。

因此如果你希望在非对齐的位置进行读写，则需要借助[DataView](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView)的帮忙。

### 对字节序留个心眼

**我们日常中所写的程序，几乎都不需要关心[字节序](https://zh.wikipedia.org/wiki/%E5%AD%97%E8%8A%82%E5%BA%8F)**，因此这个问题没那么严重，知道自己的程序会有字节序问题的人，开发到这里也肯定会知道问题的存在，但这里还是稍微提一下。

按照MDN的说法，Typed Array只会使用当前平台的字节序，例如我们现在用的桌面电脑不论PC还是Mac都是x86/x64的，也就是little-endian了。

使用`DataView`，不仅可以解决上面说到的内存对齐的问题，还可以指定读写时的字节序，具体参数都在文档里面了，就不搬运了。

使用`DataView`配合Typed Array也可以做到一个检测当前平台字节序的技巧：

```
function isLittleEndian() {
    var buf = new ArrayBuffer(2);
    var view = new DataView(buf);
    view.setInt16(0, 256, true); // 显式以little endian写入数据
    // 此时buf里的内存布局应该是 00 01

    var i16 = new Int16Array(buf);
    // 如果以little endian读取，它就是256；以big endian读取，则是1
    return (i16[0] === 256);
}
```

如果你编写的程序需要垮体系结构例如x86/ARM/PPC等，则在交换文件和网络包的时候需要谨慎处理字节序，当然一个办法是在这些地方预先规范统一字节序以防后患。不过那些都是题外话了。

### ~~小姐~~小结

使用`ArrayBuffer`来存储一段字节，使用Typed Array来构建一个具体数值类型的访问窗口，使用`DataView`对非对齐或在乎字节序的`ArrayBuffer`进行更精确的操作，使用XHR2, `Blob`, `File`, `FileReader`, `FormData`等多种方式来获取或消费`ArrayBuffer`。

另外罗嗦一句，浏览器还提供了一系列所谓的“Binary String”，就是一些看起来像乱码一样的字符串，然后又提供了`atob`/`btoa`这种方式来对Base64和“Binary String”进行相互转换，甚至`FileReader`还提供了`readAsBinaryString`方法（已经废弃了，善哉）。**这个Binary String真是谁用谁遭殃**，别问我为什么知道……