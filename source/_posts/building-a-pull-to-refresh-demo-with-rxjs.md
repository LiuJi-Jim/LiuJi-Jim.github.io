title: 使用RxJS做一个Pull-to-Refresh的例子
tags:
  - 编程
date: 2016-1-15 23:33:33
---

本文将用一个_Pull-to-Refresh_的例子来介绍如何使用RxJS进行高度抽象的复杂DOM事件处理。

文中所开发的完整demo代码可以在[github](https://github.com/LiuJi-Jim/rxjs-pull-to-refresh-demo)找到，在线demo在[这里](http://liuji-jim.github.io/rxjs-pull-to-refresh-demo)（需要使用手机或开启touch模拟，未作浏览器兼容）。

这个程序将会用到的工具：

* [RxJS](https://github.com/Reactive-Extensions/RxJS)
* [VueJS](https://github.com/vuejs/vue)（并非对其依赖，仅仅是为了方便开发一个UI）

<!-- more -->

# 概述

Pull to Refresh是一个流行到甚至让人开始觉得有些过时了的交互，也就是所谓的“下拉刷新”。

这个交互简单描述就是：

> 当一个元素的滚动位置处于其顶端时，做一个下拉手势，将会对元素进行刷新。

由于Web中的限制，在具体实现上有一些妥协，我使用的策略是：

> 在`touchstart`事件中，检测元素的滚动位置是否在其顶端，若是，则记录起始手指位置，并继续
> 在`touchmove`事件中，检测当前手指位置和起始位置的相对关系，若是下拉，则进入下拉状态
> 在下拉状态中，继续监听`touchmove`事件，并更新UI，通常会拉出一个隐藏的元素，通过其提示用户继续下拉可以刷新
> 下拉到一定程度，超过阈值，则可以进入_Release to Refresh_状态，通常也会在UI上做一些提示
> 在下拉手势结束时，检测下拉程度是否超过阈值，若是，则进行更新，否则恢复原貌

接下来的内容中将会实现一个名为`pull-to-refresh`的`directive`，在Vue中将其应用在指定的元素上，并指定相关参数，响应对应的回调函数和事件，则可以复用“下拉刷新”的功能。

使用Vue并非是Pull-to-Refresh本身、或者是RxJS依赖Vue，这只是做Demo的一个选择。同样，实现为`directive`也只是一个选择，将其实现为`component`或者`mixin`都是完全可行的。

# 页面

首先构建一个如图所示的页面框架

<img src="/uploads/2016/pull-to-refresh.png" style="width:320px; border:1px solid #ccc;" />

其结构为

```
#app
  .body
    .staff
      .person
      .person
      ...
      .person
  .bottom-bar
```

其中`.body`是一个局部滚动元素，我们将会在`.staff`元素上应用`pull-to-refresh`，让其相对于body滚动时能够具有下拉刷新功能。

而其他元素不是本文的重点，不在文中赘述了。

# pull-to-refresh 事件流

## Rx 中的事件流

Rx中的`Rx.Observable`可以使用“事件流”的概念来理解，它将一系列类似的、未来发生的事件整合成一条“流”，我们既可以像遍历一个序列一样去“遍历”它，也可以像对序列那样对它进行`map/filter/reduce/flatMap`等等操作，Rx还提供了诸如`skip/take/groupBy`等非常实用的操作，甚至是对两条事件流进行“交织”的操作。

RxJS的API，可以在[rx-book](http://xgrommx.github.io/rx-book)找到，对于很多流操作它还有图形解释，非常棒。[RxMarbles](http://rxmarbles.com/)是一个对Rx中各种流操作的图形化学习工具，也是非常直观。

## drag 事件流

### 传统方式

在使用手工处理`drag`的时候，我们通常的思路是这样：

* 在`touchstart`中记录起始位置，并开始监听`touchmove`和`touchend`
* 在`touchmove`中计算当前位置和起始位置之间的`offset`，并进行拖拽操作
* 在`touchend`中取消监听`touchmove`和`touchstart`，并进行释放操作

上面的描述起始是一个“状态机”，而接下来我们要用Rx的风格来处理`drag`。

### Rx 的风格

首先我们拥有3条事件流，他们看起来分别是这样：

```
touchstart ---------@-----------------@-------------------
touchmove  -----------#-#-#-#-#-#--------#-#-#-#-#-#------
touchend   -----------------------$--------------------$--
```

对于`touchstart`流中的每一个事件，将其`map`成一个`drag`流，其中每一个元素都由`current`和`start`两个对象组成，每一条`drag`都会在整个`touchmove`流中持续，并在`touchend`事件时结束。

将上面“图”里的那组事件流进行这样的组合变换，我们可以得到下面这样一个`drag`流

```
touchstart ---------@-----------------@-------------------
touchmove  -----------#-#-#-#-#-#--------#-#-#-#-#-#------
touchend   -----------------------$--------------------$--

drag       ---------@-----------------@-------------------
                    |-#-#-#-#-#-#     |--#-#-#-#-#-#
```

于是就可以通过Rx的订阅函数来处理这条`drag`流：

```
drags.subscribe(drag => drag.subscribe(move => {
  let start = move.start
  let current = move.current
  obj.translate(current.X - start.X, current.Y - start.Y)
}))
```

## pull-to-refresh 事件流

`pull-to-refresh`比`drag`要稍微复杂一点，不过也复杂不到哪去，下面对着重点代码来梳理一下逻辑，完整代码在`src/directives/pull-to-refresh.js`当中。

```
let touchstart = Rx.Observable.fromEvent(el, 'touchstart')
let touchmove = Rx.Observable.fromEvent(el, 'touchmove')
let touchend = Rx.Observable.fromEvent(el, 'touchend')
```

首先像`drag`那样，建立起`touchstart/touchmove/touchend`三个流。

```
let touchcancel = Rx.Observable.fromEvent(document, 'touchcancel')
let end = Rx.Observable.merge(touchend, touchcancel)
```
对`touchend`和`touchcancel`进行无差别处理，将它们`merge`成一条`end`流，形象描述就是：

```
touchend    ---------#----------------#----
touchcancel ----------------*-------*------
end         ---------#------*-------*-#----
```

对`touchstart`流进行过滤，只处理“元素处于其滚动状态顶端”的那些事件，得到一条叫做`dragAtTop`的流：

```
let dragAtTop = touchstart.filter(e => wrapper.scrollTop === 0)
```

响应`dragAtTop`流，将它`map`成与上面类似的`drag`流，不过这次我们只关心纵轴上的数据。

```
let dragTopDown = dragAtTop.map(start => {
  let startY = start.touches[0].pageY
  return touchmove
    .map(move => {
      let currentY = move.touches[0].pageY
      return {
        startEvent: start,
        moveEvent: move,
        startY: startY,
        currentY: currentY,
        offset: currentY - startY
      }
    })
    .skipWhile(drag => drag.offset < 0) // 先无视向上拖拽的那些动作，直到向下拖拽才开始算dragTopDown
    .takeUntil(end) // 同样，还是到`end`流发生就结束
})
```

还是用上面那组事件来描述的话，`dragTopDown`看起来就是这个样子：

```
                /这个不在顶端，于是被抛弃了
touchstart ----@----@-----------------@-------------------
dragAtTop  ---------@-----------------@-------------------
touchmove  ------^----v-v-^-^-^-v--------v-^-v-v-^-^------
end        -----------------------$--------------------$--

dragTopDown---------@-----------------@-------------------
                    |-----^-^-^-v     |----^-v-v-^-^
```

现在我们就有了“顶部下拉”的事件流`dragTopDown`，对其进行响应，处理交互逻辑：

```
dragTopDown.forEach(drags => {
  // 响应所有drag move
  drags.forEach(drag => {
    drag.moveEvent.preventDefault() // 触发下拉刷新时，屏蔽原生滚动
    let offset = drag.offset / 2 // 压缩滚动距离，实现拖拽“力度”
    if (offset < 0 || offset > maxOffset) {
      return // 超过范围，不处理
    }
    let refresh = offset >= releaseThreshold // 计算阈值，决定是否应该刷新
    this.vm.$emit('pull-to-refresh-drag-move', offset, refresh) // 触发事件
  })

  // 对于最后一个drag move，有其单独逻辑
  drags.last().subscribe(drag => {
    let offset = drag.offset / 2
    let refresh = offset >= releaseThreshold
    if (refresh) {
      // 释放刷新时，先主动回弹到正确高度
      this.vm.$emit('pull-to-refresh-drag-move', releaseThreshold, refresh)
    }

    // 不刷新时，直接释放
    // 需要刷新时，调用onRefresh回调函数，完成刷新后再释放
    let promise = Promise.resolve(refresh ? onRefresh() : undefined)
    promise.then(ret => {
      this.vm.$emit('pull-to-refresh-drag-release', refresh)
    })
  })
})
```

现在我们的`pull-to-refresh`这个`directive`就已经封装了：

* `pull-to-refresh-drag-move`事件，可以获知下拉距离`offset`和是否超过刷新阈值`refresh`
* `pull-to-refresh-drag-release`事件，可以获知本次释放是否超过刷新阈值`refresh`

它依赖:

* 监听`touch`事件族的元素`el`——通过Vue的`directive`机制即可自己获取
* `el`所相对其滚动的容器`wrapper`——通过`directive`的`params`获取
* 释放刷新时的`on-refresh`回调，返回一个`Promise`，在刷新操作完成时`resolve`，进行恢复

## 使用`directive`

接下来对`.staff`元素应用`v-pull-to-refresh-`，并且设定其各种参数，响应事件等，只摘主要的代码了

### 模板

```
<div class="body" v-el:body>
  <list-view class="staff" v-el:staff v-pull-to-refresh :on-refresh="refresh" :wrapper="$els.body">
    <div class="p2r-hidden">
      ... 用于显示下拉刷新状态的隐藏层，通过对.staff使用负值margin来将其隐藏起来，下拉的时候则露出来
    </div>
    <div class="person" v-for="person in staff">
      ... 列表本身
    </div>
  </list-view>
```

上面的代码中对`.staff`应用了`v-pull-to-refresh`，并且对它绑定`on-refresh`回调函数，`wrapper`设置为了`.body`，留下了`v-el:staff`引用，这样我们可以在`pull-to-refresh-drag-move`等事件中修改它的UI样式（当然，通过数据绑定来实现也OK）。

### JS

```
export default {
  methods: {
    pull (offset) {
      this.$els.staff.style.transform = `translate3d(0, ${offset}px, 0)`
    },
    refresh () {
      return new Promise(resolve => setTimeout(() => {
        this.shuffle() // 将原来的数据打乱，假装成刷新了
        resolve()
      }, 2000)) // 延迟2秒，假装成正在加载的样子
    }
  },
  events: {
    'pull-to-refresh-drag-move': function (offset, result) {
      this.pull(offset) // 更新下拉距离
      // 还原其他样式
    },
    'pull-to-refresh-drag-release': function (result) {
      this.pull(0) // 还原下拉距离
      // 还原其他样式
    }
  }
}
```

# 小结

使用Rx可以将离散的事件转换成`Rx.Observable`，我们理解成“流”的概念，“流”虽然是“无定型”的，但我们还是可以把它们当做“序列”来处理。一些原本需要用“状态”来实现的东西现在可以通过对流进行变化和组合来实现了，事件的脉络变得更加清晰。

* **事件监听**可以看做一个永远不会结束的`Observable`
* **异步调用**可以看做一个只会发生一次，就立即结束的`Observable`
* 一个会结束的`Observable`可以通过`toPromise`来转换成`Promise`
* 一个会结束的`Observable`可以通过`toArray`，在其结束时，将它所有的元素转换成数组
* Rx也提供了很多辅助函数，帮助你把DOM事件、callback、Promise等多种异步风格的API转换成`Observable`

over了

# References

* [RxJS](https://github.com/Reactive-Extensions/RxJS)
* [VueJS](https://github.com/vuejs/vue)
* [SVG实现圆环loading进度效果实例页面](http://www.zhangxinxu.com/study/201507/svg-circle-loading.html)
* [JSON Generator](http://beta.json-generator.com/)（生成测试数据的小帮手）
* [rx-book](http://xgrommx.github.io/rx-book)
* [RxMarbles](http://rxmarbles.com/)
