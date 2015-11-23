title: "使用hexo搭建静态博客"
layout: post
date: 2013-09-08 12:00:00
tags: 
- 编程
---

[hexo](http://zespia.tw/hexo/)是一个博客程序，拥有一个简单的服务器（可以用来当简单的动态博客使用），也有生成器，生成的静态文件可以一键部署到Github Pages上，也可以部署到任意静态文件服务器上面。

由于它相当简约，并且使用Markdown来编写文章，深得我心，于是我把博客迁移到hexo了，但是为了国内访问速度，我没有放在Github Pages上，而是选择了放在BAE上面。

下面一步一步地说怎么用hexo搞一个博客。
<!-- more -->

## 搭环境

hexo是用[node.js](http://nodejs.org/)开发的，首先需要在电脑上安装node.js，在windows用安装包是很方便的，完成后记得要把系统盘的`用户/AppData/Roaming/npm/`这个目录加到系统的`PATH`环境变量里面。

在需要的地方打开命令行，这时候我们要安装hexo
```
npm install -g hexo
```
安装了hexo后，如果之前有做`PATH`环境变量那一步操作的话，这时候就可以直接运行`hexo`这个命令了，后面的工作都要靠它。

## 新建博客

在工作目录打开命令行，运行
```
hexo init <目录名>
```
会生成个目录，`cd`进去，可以看到很多东西，这就是一个全新的hexo博客。

后面我们的命令行就都在这个新建的目录下了。

运行
```
hexo server
```
会看到服务在`4000`端口上启动了，打开http://localhost:4000/ 就能看到效果。

## 调整设置

对于站点的配置基本上都在`_config.yaml`里面，其中比较重要的有

* `title`, `subtitle` 这类基本信息
* `language` 可以用`zh-CN`，这在后面的theme配置当中有作用
* `url`, `root` 填以后要布的域名和路径
* `plugins` 我加了一个`hexo-generator-feed`，通过`npm install hexo-generator-feed --save`安装，这样在生成的时候会自动生成`atom.xml`，用来提供别人订阅

修改`_config.yaml`的话有时候是需要重新启动`hexo server`才能看到效果的。

## 编写文章

这个时候的博客空空如也，如何新建文章呢？可以使用hexo提供的Scaffold（脚手架）功能。
```
hexo new post 文章标题
```
就会在`/source/_post`目录里新建一个markdown文件，这里的`post`就是普通的文章类型，看看`scaffolds`目录里，有几个类型，可以自己尝试一下。

写好内容后去浏览器里刷新一下，发现`hexo server`是有自动生成功能的，可以看到新的文章。

这里就和Word Press很不一样了，以前都是所见即所得的写文章，而现在是写markdown，看生成出来的效果。可能需要适应一下。

如果是Word Press用户的话，可以有办法把上面的内容迁移过来。

首先，需要在Word Press导出博客，会得到一个xml文件，把它拷贝到hexo博客目录下，比如叫`wordpress.xml`。

安装hexo-migrator-wordpress这个插件
```
npm install hexo-migrator-wordpress --save
```
这时候运行
```
hexo migrate wordpress wordpress.xml
```
会看到导入了一些Word Press里的文章和页面，看看`source`里的文件，发现给转成了markdown格式的，这时候多半还需要一些格式微调。另外，文章里面的图片会指向原来的博客资源，文章链接也是绝对的，不嫌麻烦的话，这些东西最好也迁过来吧。我在`source`目录下建了`uploads`目录，结构基本上和之前的Word Press一模一样，所以大多数东西只用改下路径就行了。

现在再刷新看看效果吧。

值得一说的是，hexo对于文章分类的处理和Word Press很不一样，我原来的文章都同时属于好几个category，但hexo里的分类是纯粹树形的。所以我彻底放弃了category管理，而全部用tag。

## 部署博客

如果你使用Github Pages来部署，会非常简单，首先当然电脑上要装了Git。在`_config.yaml`里找到`deploy`一节，`type`填`github`，写上`repository`是你在Github上的Repo地址。
```
hexo deploy --generate
```
这时候会先进行一次完整生成，然后会自动部署到Github的`gh-pages`分支上面。为了管理博客源代码，可以把整个hexo目录放在对应Repo的`master`分支上，然后就像管理一般的开源项目一样处理就好了。

我不使用Github Pages来放，是因为部署上去要等10来分钟才能看到效果，而且国内速度比较一般。

如果你有网站空间，静态空间就可以，那么运行
```
hexo generate
```
后，把`public`目录的内容扔到你的空间上去就行了。

后面我会再说下怎么弄到BAE上。

## 调整样式

默认的theme叫light，已经很不错了，但是有的内容不大“符合国情”，所以需要进行一些调整。

主题都在`themes`目录下面，按主题名字分，可以在`_config.yaml`里选择喜欢的主题，改个配置就行。可以在官方网站上找到其他主题，数量不多，但是都挺精彩的，下载下来放在`themes`目录里就行。

打开`/themes/light/_config.yaml`可以看见里面也有一些主题自己的配置，这主题配置说起来话就长了，捡重点的。

`menu`是配置右上角的链接，如果你加了一个`page`，那么是需要在这里配进去才能看到的。

`addthis`我给去掉了，因为都是些外国的社交网站，似乎没啥搞头。

至于我的博客右边那堆widget，一部分是light自带的，一部分是我自己开发的。我已经把light的Github分支给fork出来了，有兴趣可以去[看看](https://github.com/LiuJi-Jim/hexo-theme-light)，如果用那个分支的代码的话，下面的这堆修改已经都整合进去了，瞟一眼就明白了。

light主题自带Google Analytics支持，但我没用GA所以没研究。为了使用百度统计，我在`layout/_partial/after_footer.ejs`里加入了百度统计的代码。

Word Press有评论功能，而静态博客的评论咋搞呢？我使用了[多说](http://duoshuo.com/)社会化评论框，号称社会化，其实就是和微博这类的社交网络有一定的关联性。

如何申请使用多说评论框，我就不多说了，下面说下如何在light主题里面安装。

首先在`layout/_partial/`下新建一个`duoshuo.ejs`，内容如下：
```
<!-- Duoshuo Comment BEGIN -->
<div class="ds-thread" data-title="<%= item.title %>" data-url="<%- item.permalink %>"></div>
<script type="text/javascript">
var duoshuoQuery = {short_name:"jimliu-net"};
(function() {
    var ds = document.createElement('script');
    ds.type = 'text/javascript';ds.async = true;
    ds.src = 'http://static.duoshuo.com/embed.js';
    ds.charset = 'UTF-8';
    (document.getElementsByTagName('head')[0] 
    || document.getElementsByTagName('body')[0]).appendChild(ds);
})();
</script>
<!-- Duoshuo Comment END -->
```
基本上就是在多说网站上拿到的`通用代码`，在第二行上我加入了`data-title`和`data-url`，用来给多说传一些参数。
`data-url`这个参数可以让多个域名上的文章评论共享，只要同一篇文章的`data-url`固定就可以。例如`blog.jimliu.net`和`jimliu.net`上文章的`data-url`都是`http://jimliu.net/xxxxxxx`这样两个域名就可以共享评论了。
第四行的`short_name`是自己多说代码独有的，不要照抄哦。

接下来在`layout/post.ejs`下面，加入一行
```
<%- partial('_partial/duoshuo', {item: page, index: false}) %>
```
就能在文章页面看到评论框了，如果想在其他`page`，例如我博客右上角那个“About、Feedback”里面也看到的话，对`layout/page.ejs`如法炮制即可。