title: '"北上广大迁徙"前端开发心得'
layout: post
date: 2014-5-6 23:23:12
tags: 
- 编程
---

前阵子和好基友[@licstar](http://weibo.com/licstar)一起做了一个~~很蛋疼~~很好玩的数据可视化小品，叫做[北上广大迁徙](http://bsgdqx.sinaapp.com/)。使用了[百度地图](http://wuxian.baidu.com/map/)手机App的热力图数据，做成了动态的，并对其中的热点进行解读，来了解大城市中人群每天一个循环的“迁徙”。

整个开发用了几个小时的时间吧，我负责前端，他负责数据部分以及提供算法，这篇文章简单介绍一下其中前端部分在开发中的一些小心得。

<!-- more -->

## 灰度图

实际上看到的热力图是彩色的，但为什么标题是灰度图？这个说来话长。

虽然最终是图片，但其实一开始我们就并没有打算用图片，因为采集到的数据只有整点的，每天从0点到24点，只有25张图，做个GIF就好了，基本比较难看出什么门道来。所以需要把动画效果做出来，就要进行**插值**。也就是需要传输**原始数据**。

地图的大小不完全一样，大概是600\*600的点阵，每个时间节点有36万个点，以每个1字节计，不压缩需要**360KB**，25张也接近10MB了。这种二进制存储要在WEB里传输并用JS处理，就得先经过BASE64，会损失33%的体积，大概**13~15MB**，即使用之前在我俩的[Bad Apple](https://github.com/liuji-jim/bad-apple)山寨的一种“BASE91”，也会超过10MB，所以是必须压缩的。

于是我想到了结合二者的办法，**把数据编码成图片**。前端先使用canvas的`drawImage`把图片画到canvas上，再用`getImageData`获取字节数组，这样可以反解出每个像素使用颜色所表示的数值。
用图片还完美解决了压缩问题，在Bad Apple里我们用了自己实现的LZW，效果其实也不错~~而且听起来更酷~~（那时候为什么没想到用这个办法来着），不过这次没那么大动干戈，JPG无疑是不二选择。

编码其实再简单不过了，热力图中从蓝到红的各种颜色其实是对一个归一化值的映射，并不是真正的彩色。那么存的时候只需要存一个数值就够了，为了尽可能照顾压缩，直接存成了灰度图，最后灰度图每个小时是**30~40KB**，一天不到**1MB**，事实上如果再把画质调低一点会更小（估计500~600KB没压力），而且也不怎么看得出来。

因为JPG会产生伪色，所以前端取颜色的时候把rgb做了平均——图简单的话直接rgb随便取一个也行，差不了多少，可以省一个除法——但是这个取值只用每幅图做一次，所以不重要，懒得优化。然后对数据重新进行一次归一化（直接插值的话我觉得可以不做归一化，而是插值完了再归一化）。

## 动画

动画是通过`requestAnimationFrame`做的，这里面用了3个时间概念。
**当时是半夜写的，思路很晕，所以这么乱七八糟的计时不看也罢。**

`秒表时间`：基本的计时，用秒表当前掐出来的时间，是后面的基础
`播放时间`：用来表示动画播放了多久，用它除`每一个小时所对应的秒表时间`就可以知道应该播放哪一帧
`挂钟时间`：表示“真实”时间，这个真实是指最终映射到的24H里的时间，而并不是计时概念上的真实，用于显示以及触发`故事板`

每一帧先用`秒表时间`减去`开始时间`，再加上次`暂停时间`，获得当前的`播放时间`，用它和所定义的播放时间与挂钟时间的比例进行简单运算（比如播放4秒对应现实1小时），可以算出当前应该播放哪一帧，插值的`delta`值，同时也得到了`挂钟时间`。

在暂停的时候更新`暂停时间`为当前的`播放时间`；在开始的时候更新`开始时间`为当前的`秒表时间`。

如果要实现进度条，可以在拖拽的时候先暂停，拖拽过程中更新`暂停时间`，撒手了重新播放就行了。

但不得不吐槽`requestAnimationFrame`，我估计它实现的初衷是做60FPS，但是事实上我发现它触发率很不稳定，常常在17ms左右，也就是根本达不到60FPS。
这也就算了，也许我只需要老老实实地按照它触发频率，配合计时器做动画就够了。但问题是我每一帧的计算量可能比较大，现在我觉得60FPS下CPU占用太高了，想实现更低的帧率，用它就根本没精度可言了。所以后来我在另一个程序里，考虑用`setInterval 0`配合高精度计时来做到像20, 25这样的帧率控制。

## 插值

为了模拟非整点的状态变化，用了最简单的线性插值（LERP），每次通过两帧来插值：
```
var color = val1 * (1 - delta) + val2 * delta;
```
值得一提的是里面的颜色值并不是原始值，因为热力图里的值事实上是阶梯状的，对插值不友好，所以licstar先自己YY了一个转换规则把他们都转换成线性分布的，插值完了再转回来。
本来以为插值会比较影响性能，但实际上发现因为LERP实在太简单，影响很小。

对插值结果进行一下归一化，可以通过查表或者简单if的方式变换到最终要画的颜色。

画的时候因为是逐像素的，所以还是用`getImageData`和`putImageData`（简直是神器……）绘图非常简单，因为canvas是透明的，所以只要把地图垫在底下，canvas直接画就行了。

这个插值极其山寨，因为它只能表示每一个点自己的变化状态，所以看起来就像是“躁动”而不是“迁徙”。由于数据源的归一化效果很奇怪，上海和广州的结果插值之后会有很明显的很奇怪的呼吸效果，整个地图会忽明忽暗的，这里就不吐槽数据源了，因为其实也算来之不易……

## 故事板

后来纠结的licstar发现这么看动画好像看不出来什么，于是加了一个在旁边显示一些注解的功能，我称其为故事板。

每个Story都是一个div这类的东西，用绝对定位，事先设计好，指定一个开始时间、结束时间（形如9.5表示9:30）。

开始播放前遍历所有这一类div，对他们的开始时间和结束时间分别给个数组并且排序，在播放过程中，两个数组各有一个只增不减的游标，跟着时间走，对应的div显示或隐藏就行了，简单粗暴……大概是这么个样
```
while (list.index < list.length && list[list.index].time <= currentTime){
  list[list.index].dom.fadeIn(200);
  list.index++;
}
```

## 黑科技

**快速取整**

一般会用`Math.floor`来向下取整，之前在网上有看到用`~~(x)`就能快速取整，计算密集的时候真的比`Math.floor`快不少！这程序里面需要做除法结果取整的地方挺多的，所以到处都充斥着这个办法。

~~吐槽下，帮官微带了1000转发呢……抽奖有礼品，这个都不单独给来个礼品神马的 T_T~~