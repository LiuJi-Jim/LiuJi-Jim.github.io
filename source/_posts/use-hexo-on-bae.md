title: "在BAE上使用hexo搭建博客"
layout: post
date: 2013-11-20 19:23:12
tags: 
- 编程
---

在[之前的文章](/2013/09/08/%E4%BD%BF%E7%94%A8hexo%E6%90%AD%E5%BB%BA%E9%9D%99%E6%80%81%E5%8D%9A%E5%AE%A2/)中，我介绍了如何使用[hexo](http://zespia.tw/hexo/)来编辑博客内容，以及它自带的发布到[GitHub-Pages](http://pages.github.com/)的功能。

但是我最后并没有把它部署到GitHub-Pages上，原因主要有：

1. 在国内的访问速度比较一般；
2. 提交代码后，要等好几分钟才能看到效果；
3. 一个网站只能绑定一个域名。

作为熊掌社的一名码农，我自然想到了把博客部署到[BAE](http://developer.baidu.com/bae)上面去。

<!-- more -->

相比之下有如下优点：

1. BAE/SAE这些国内的PaaS在国内访问速度非常快；
2. 提交即部署，基本上实时；
3. BAE一个应用可以绑5个域名（SAE没研究过）。

方法与发布到GitHub-Pages非常类似。

首先需要在BAE上申请一个应用，得到SVN后，直接把整个hexo博客目录都放SVN上，这个时候，我们依然可以在本地用`hexo server`来看效果。然后改改好了以后，`hexo generate`生成`public`目录，这个时候同样把整个hexo博客的目录提交上去。这里我的观点就是既然是用了版本控制软件，那么源代码我肯定也是要管理的，所以会整个目录地提交。

这时候重点来了，我们需要把`public`目录作为静态目录来使用，最方便快捷的方法是使用`url-rewrite`，BAE已经提供了这个功能。

在BAE的程序配置里，加入一个规则，规则类型为`url`，将`(.*)`给rewrite到`/public/$1`，对应的`app.conf`代码大概如下，用BAE的网页界面配置也一样。
```
- url : (.*)
  script : /public/$1
```
生效以后，任何访问的路径都会被映射到`/public`下，例如`http://your-domain/index.html`就会实际上映射到`/public/index.html`，于是直接访问应用程序域名就能访问`/public`里的静态文件了。

这样，一个SVN就可以即保存文章的源代码，又可以做到commit即发布，是不是感觉方便程度也不输word press了呢？
