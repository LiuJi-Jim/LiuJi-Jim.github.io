title: "使用Solarized的ls配色"
layout: post
date: 2013-11-20 13:23:12
tags: 
- 编程
---

<a href="http://ethanschoonover.com/solarized/img/screen-javascript-dark.png"><img src="http://ethanschoonover.com/solarized/img/screen-javascript-dark.png" alt="Solarized官方截图" style="width:400px;"></a>

[Solarized](http://ethanschoonover.com/solarized)是一个挺不错的配色方案，给常见的编辑器以及终端软件（木有SecureCRT）提供了配置文件，使用起来也挺方便的，这样在使用Terminal/iTerm/Vim等程序的时候就有不错的配色了。

但我经常需要在远程的机器上进行开发，这时候Vim配色比较好搞定，但是ls的配色就搞不定了，后来发现[dircolors-solarized](https://github.com/seebi/dircolors-solarized)这个东西，可以解决这种问题。

<!--more-->

先把代码下载下来，里面有几个`dircolors`的配色文件，通过执行
```
dircolors solarized.256.dark
```
这样的指令，可以生成一大堆shell命令，因此结合`eval`使用
```
eval `dircolors solarized.256.dark`
```
即可将生成的代码设置到`LS_COLORS`环境变量上面，这个时候再`ls`，可以看到漂亮的配色。不行？试试`ls --color`（速度配个alias吧）。

<a href="https://github.com/seebi/dircolors-solarized/raw/master/img/dircolors.256dark.png"><img src="https://github.com/seebi/dircolors-solarized/raw/master/img/dircolors.256dark.png" alt="dircolors-solarized官方截图"></a>

但实际上我在我厂的远程机器上试了半天，可能是shell版本问题吧，给的几个配色文件只有`solarized.ansi-universal`是可以正确执行的。最终的效果和官方截图有一些差别，比如官方截图上tar是紫色，而在我这边就是紫红色。不过颜色的丰富程度基本上是保持一致的。

最后一步，当然不可能每次都执行上面那些，于是在`~/.bash_profile`里加上刚才的代码。当然有另一种办法，就是把`solarized.ansi-universal`文件拷贝到`~/.dir_colors`，这样shell启动的时候就自动读取它作为配色方案了。
