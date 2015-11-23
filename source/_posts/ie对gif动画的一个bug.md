title: "IE对GIF动画的一个BUG"
id: 320
date: 2013-03-02 23:04:04
tags: 
- 编程
---

正文开始之前不得不说：GIF真的是个灭绝人性的东西，为什么——可以从[我的另一篇博客](/2012/06/04/伪转载-gif速度的那些事儿/ "[伪转载]GIF速度的那些事儿")里看到一点点。

最近的一个项目中发现GIF动画在某些版本的IE里经常无故停止。
<!-- more -->

有简单地查了一下，据说GIF动画用作CSS background时，IE里容易不动，于是乎我给改成了`<img>`，没有明显的效果，说明这个说法是站不住脚的，至少并不是根本成因。由于忙于开发，没有功夫仔细推敲成因，一直只是觉得很诡异。

后来终于开发的差不多了，才重点想这个问题。一天晚上肚子疼的厉害，无心写码，就在那开着程序瞎点，突然发现当在程序里切换TAB的时候，GIF动画就会停止，BUG出现时机非常准确。

于是一条线上网找原因，一条线观察这部分代码。

Google之下在[Stack Overflow](stackoverflow.com/questions/780560/animated-gif-in-ie-stopping)看到一类似问题，里面就有提到在IE里`beforeunload`事件会掐断GIF。瞬间恍然大~~雾~~悟，以前一直知道`beforeunload`会掐断所有Ajax请求，并没有把它和GIF关联在一起考虑。

部分原文：
> IE assumes that the clicking of a link heralds a new navigation where the current page contents will be replaced. As part of the process for perparing for that it halts the code that animates the GIFs. I doubt there is anything you can do about it (unless you aren't actually navigating in which case use return false in the onclick event).

马上观察代码发现，TAB切换用的是`<a href="javascript:void(0);">`，因为protocol不同，是会触发`beforeunload`的。对这里的`<a>`加上了`stopPropagation`和`preventDefault`，可怜的GIF果然没被掐断。

由于是一个SPA程序，大量地使用了`<a>`做按钮，到处改毕竟麻烦，所以简单地
``` javascript
$('body').delegate('a[href^=javascript]', 'click', function(e){
    e.stopPropagation();
    e.preventDefault();
});
```
虽然比较暴力，而且未必能解决所有问题，不过好歹还是快速简单有效地遏制了这个倒霉的问题。

弦外之音：一直比较认为`javascript:void(0);`是目前环境下的最佳实践，并反对使用`#`（因为hash对于SPA做路由是很有用的），而不写`href`则会造成IE旧版本上`:hover`和`:active`伪类失效，于是乎现在看来`javascript:void(0);`并不能完全胜任，还是禁止事件冒泡和默认行为最靠谱。