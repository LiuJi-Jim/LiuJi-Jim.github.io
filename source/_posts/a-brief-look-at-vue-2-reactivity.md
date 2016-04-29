title: "Vue 2.0数据绑定实现一瞥"
date: 2016-04-29 23:33:33
tags:
- 编程
---
抽了点时间看了一下[Vue](https://github.com/vuejs/vue) 2.0的代码，主要着重于如何实现数据绑定这一块，在小右的指导下基本上算是知道了个六成吧。

<!-- more -->

# 概览

代码可以在Vue的GitHub Repo上`next`分支里找到。`cloc`一下：

```
$ cloc src/ test/ examples/
     143 text files.
     143 unique files.                                          
      12 files ignored.

http://cloc.sourceforge.net v 1.62  T=0.58 s (241.3 files/s, 18204.4 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
Javascript                     119            817           1003           7360
HTML                            11             35             25            591
CSS                              7             84             13            541
JSON                             2              0              0             19
-------------------------------------------------------------------------------
SUM:                           139            936           1041           8511
-------------------------------------------------------------------------------
```

其中，`src`是4000多行，可以不客气的说，Vue完全可以称为是轻量级。

## 结构

Vue 2不再是Browser-Only的，所以加入了`render`和`runtime`的概念。

`render`是将v-dom树（下文中v-dom和v-tree基本表示一个意思）进行输出的实现层，比如`server`就是一个实现。

`runtime`是对v-tree进行数据绑定、更新、事件处理等具体操作的实现层，比如`web-runtime`就是将抽象dom操作全部实现在DOM API上。

# 数据绑定实现分析

## 初始化

初始化一个Vue Instance的过程，本文不做重点描述，大概如下：

* 模板编译——如果使用的是未进行预编译的模板，需要将其编译成一个构建v-dom的函数。
* 生成初始v-dom——使用初始数据进行`_render`，得到一棵v-tree。
* mount——如果使用的是服务端渲染，则将v-tree和元素建立一个mount关系；如果是客户端渲染，则建立一个新的dom-tree。

上述过程还包括对数据绑定的解析，对vm中的数据字段进行包装，通过`getter/setter`触发变化以此实现“Reactivity”，并收集依赖，注册Watcher。这个过程和现在的Vue差不多。

现在，我们有了一棵v-tree，并且它已经mount到了一个dom-tree上，初始化的过程差不多就先介绍到这里吧。

## 实现数据绑定

下面以一个简单的计数器例子来介绍一下Vue 2中是如何把`getter/setter`与v-dom结合起来实现数据绑定的。

```
<div id="counter-app">
  <h1>已续命{{count}}s</h1>
  <button @click="count++">喜+1</button>
</div>

<script>
  var counterApp = new Vue({
    el: '#counter-app',
    data: {
      count: 0
    }
  })
</script>
```

点击“喜+1”的时候，会执行`(this.$data.)count++`，这个`count`是一个“reactiveSetter”。`reactiveSetter`会将这个修改所涉及的，在初始化过程中收集到的一系列依赖进行`notify()`。

```
// /core/observer/index.js

set: function reactiveSetter (newVal) {
  // ...
  dep.notify()
}
```

这里的`dep`是一个`Dep`实例，`dep.notify()`会对其对应的所有注册的`Watcher`实例（在最初parse时注册）逐一进行`update()`。

```
// /core/observer/dep.js

Dep.prototype.notify = function () {
  // stablize the subscriber list first
  var subs = this.subs.slice()
  for (var i = 0, l = subs.length; i < l; i++) {
    subs[i].update()
  }
}
```

`Watcher.prototype.update()`会将自己添加到一个全局的batch queue里面：

```
// /core/observer/watcher.js

Watcher.prototype.update = function (shallow) {
  // ...
  pushWatcher(this)
}
```

然后等待下一个tick的来临（批量更新机制）。

当下一个tick来临时，会将batch queue里的每个`Watcher`实例都拿出来并且调用它的`run()`

```
// /core/observer/watcher.js

Watcher.prototype.run = function () {
  // ...
  var value = this.get()
  if (value !== this.value) {
    // set new value
    var oldValue = this.value
    this.value = value
    this.cb.call(this.vm, value, oldValue)
  }
}
```

其中的`this.get()`：

```
// /core/observer/watcher.js

Watcher.prototype.get = function () {
  // ...
  const value = this.getter.call(this.vm, this.vm)
  return value
}
```

对于vm实例而言，这里的`this.getter`绑定的是`vm._render`，它会调用`this.$options.render`，也就是在初始化时，模板编译所生产的v-dom函数。

```
// /core/instance/render.js

Vue.prototype._render = function () {
  // ...
  const { render, _renderChildren } = this.$options
  const vnode = render.call(this._renderProxy)
  return vnode
}
```

于是这里，一个vm所关联的`Watcher`实例就通过`vm._render()`得到了一棵（更新后的）v-tree。

回到`Watcher`里，`run()`当中，接下来就会调用`this.cb.call(this.vm, value, oldValue)`。上面已经看到`value`和`oldValue`分别是`this.vm`所对应的新、老v-tree。而这里的`this.cb`则绑定的是`vm._update`。

```
// /core/instance/lifecycle.js

Vue.prototype._update = function (vnode) {
  // ...
  this.__patch__(this._vnode, vnode)
}
```

可以看到，`vm._update`当中，调用了`Vue.prototype.__patch__`，那么这个函数又是从哪来的呢？

答案在/entries/web-runtime.js、/platforms/web/runtime/node-ops.js、/core/vdom/patch.js等几个文件里。

在程序启动的时候，xxx-runtime.js（比如web-runtime.js）会作为一个Provider，提供一系列dom操作，如熟悉的`createElement()`、`insertBefore()`等。把这些操作的具体实现（如web-runtime就是把它们直接落在原生DOM函数上）交给v-dom的`createPatchFunction()`。后者则会生成这个`__patch__`方法，糅合了通用的tree-diff逻辑，以及因runtime而异的dom操作实现。

```
// /entries/web-runtime.js
Vue.prototype.__patch__ = createPatchFunction({ nodeOps, modules })
```

这个`__patch__`函数当中即包含了tree-diff过程又包含了patch过程，并且是在一遍里完成的，在`__patch__(oldVTree, newVTree)`被调用之后，`oldVTree`所关联的真实backend（在浏览器里，它就是DOM元素）已经被tree-diff算法所patch成newVTree所对应的样子。

上述过程就完成了一次[属性更新 -> UI自动更新]的过程。

## 优化

优化过程主要是在模板编译阶段通过/compiler/optimizer.js实现的。

主要的方法有两种：

* 将元素的attributes中不会变化的那部分提取出来，在对比两个v-node的时候，直接跳过这部分字段。
* 将v-tree中纯静态的sub-tree提取出来，在对比两棵v-tree的时候，直接跳过这棵子树。

其中第二点，在遇到static sub-tree的时候，会命中`oldNode === newNode`的全等逻辑，可以直接跳过整棵子树。不过我发现一些小问题，一个是对于`<button @click="count++">喜+1</button>`这种v-dom，我不太确定它应该被当做是纯静态的还是动态的，这个我还没想明白，暂时就先不说了，至少在目前的optimizer中，还是把它当动态的。另一个问题是对于模板中的各种HTML注释和换行所带来的一些空白的TextNode，明显应该是静态的，但却被当做了“动态”节点——之所以加引号是因为这部分节点的确是不会变，但没有提取成static node，所以每次`_render`的时候它还是会被render成一个新的v-node，这样就命中不了全等逻辑，然后对它再进行一次比较（尽管是代价非常低的一次比较）。（关于这个问题的例子可以看[这个Gist](https://gist.github.com/LiuJi-Jim/e12b9df4c5bb5022cbe8f9308287e4e7)）

另一个问题是，如果使用服务端渲染，初始化会将v-dom直接`mount`到服务端输出的dom树上。但在客户端渲染的情况下，直接在浏览器里进行模板编译的话，首次输出会生成一个新的dom节点并`mount`到它上面，原版的那个用来当模板的dom节点则没用了。这是个浪费，但可以理解，第一是因为模板里有很多最后不会输出的节点（比如v-if/v-else中未命中的分支），另一个是到了生产环境下应该大多数人都会选择模板预编译吧。

那么关于数据绑定的实现差不多就是这样了，后面有时间（不用掩饰了，肯定要坑）的话，再继续探索一下依赖追踪、`computed`属性的实现，以及更多内容（吧……
