title: "[伪转载]GIF速度的那些事儿"
id: 57
date: 2012-06-04 22:05:59
tags: 
- 编程
---

有时候会发现，在IE下面看着挺好的GIF动画，到Firefox或者Chrome里就会跟抽疯了似的。

比如新浪微博的鼓掌表情![](http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/36/gza_org.gif)和兔斯基揉脸的表情![](http://ww4.sinaimg.cn/large/6e3cfcf1gw1dnkvq7h3jcg.gif)。

~~虽然一旦接受了这种设定，似乎还挺带感儿的~~，但是身为一名2B程序员，在高呼一声：“这不科学啊！”的同时，还是要找寻其中的原因。

<!--more-->其实已经有人早就通过实验证明了[[不存在的网站](http://coolcd.blogspot.com/2009/03/firefoxiechrome-gif.html)][[免梯子版](http://eikolog.sinaapp.com/archives/20/)]。

**[结论党醒目]**
这里我就直接说下结论：

* IE里如果一帧的时间在60ms以上，正常显示；Firefox/Chrome里也正常，这种情况下，两者的播放速度是一样的。
* 遇到一帧的时间在50ms或者更低的时候，IE就萎了，速度会自动降到一帧100ms！
* 而Firefox/Chrome则需要降到10ms或者更低的时候，才会拉到100ms。
* 这样如果一帧的时间介于10ms~50ms之间的时候，IE里就会比实际速度要慢，而Firefox/Chrome里则是正常。
* 这样如果以IE为基准制作出的GIF图片，速度又介于这个区间，放到Firefox/Chrome里看就会抽疯。

细心一点的话会发现把符合这个条件的GIF图片弄进QQ里当表情，速度也是慢的。所以我估计这不是IE的问题，而是Windows系统自己的GIF库就有这问题，可能计时器精度不够啊神马的，而Firefox/Chrome则是用了自己的GIF库，就没有遇到这个问题了。

所以看来搞图的也要玩玩兼容性……