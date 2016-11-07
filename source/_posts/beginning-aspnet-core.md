title: "初窥 ASP.NET Core MVC"
date: 2016-11-5 15:36:20
tags: 
- 编程
---

最近心血来潮，想搞一下ASP.NET Core，于是准备把练琴记录仪的服务端迁移到ASP.NET Core MVC上，不过遇到些小问题，记录一下。

<!-- more -->

# 安装

## 安装.NET Core

[官网](https://www.microsoft.com/net/core)上可以下载各平台的Binary，macOS很简单直接按它说明的操作步骤做就行了。

中间有个步骤是要求用brew安装openssl，我试了一下`brew link`然而并没有什么卵用，于是就按它说的做了。

装完以后就可以使用`dotnet`命令了，用`dotnet new`可以初始化一个Hello World程序，`dotnet restore`用来安装依赖，`dotnet run`编译运行。

## 安装VS Code扩展

VS Code中搜索C#，就能找到C#扩展，官方的。安装重启VSC后会自动下载OmniSharp，如果网速不好的话这个过程比较悲剧……

然后就可以用VSC打开刚才建的Hello World了，和VS差不多，按F5启动调试，就可以愚快的断点调试了。

# 使用MVC

## 使用脚手架

一种网上比较多的方式是用yeoman做脚手架，这个是OK的，但是如果网速不是很快的话千万不要装那个完整的web app示例，因为它会下载一大堆依赖，bower超级坑爹。

## 启动网站

ASP.NET Core和ASP.NET在这里有稍许不同，ASP.NET Core可以不需要作为IIS的一个模块来运行了，内建了一个Kestrel模块，就是用.NET Core自己实现的轻量级Web Server，这个也算一种潮流的方法吧。当然它也还是有一个IISIntergration模块，不过我没琢磨。

于是启动网站的方法还是和普通程序一样F5，或者`dotnet run`，然后会告诉你启动在多少端口上，就能访问了。

## 依赖注入

ASP.NET Core里加了一堆依赖注入的功能，就是说可以在程序启动的时候配置好不同级别的依赖注入，比如注入单件、每个Request注入一个新实例等等。配置好了以后再为Controller重载一个构造函数，把你需要的那几个被注入了的类型作为参数，就可以在构造函数里拿到注入的实例了。

然而，我并不是很适应，因为这样的话我想注入多个对象的时候需要把他们挨个写在构造函数里，徒增一大堆参数——也许有更简便的自动注入到属性的办法吧，不过我暂时没这么做，而是只注入了少量几个类，写了一个`BaseController`类，其它用得上的类都在这个地方初始化，然后所有的Controller都继承它，就完成集中式的依赖初始化了。

## API变化

### JSON序列化

在Controller里`return Json(xxx);`可以不需要加`JsonRequestBehavior.AllowGet`了，虽然我早就在`BaseController`里面封装了一个吧。

默认的JSON序列化格式当中，`DateTime`类型的序列化结果不再像之前那样是蛋疼的`\Date(xxxxxxx)`了，而是改成了比较友好的`yyyy-MM-dd HH:mm:ss`，方便多了。

### URL Encode

原本在`System.Web.HttpUtility`中的`UrlEncode`方法现在改用`System.Net.WebUtility`了，您说这不是蛋疼么。

### Request对象

原本的`HttpContext.Request`现在有了比较大的变化，现在的类型是`Microsoft.AspNetCore.Http.HttpRequest`，原本的`.Url`属性没有了，要取当前请求的URL的话需要用`Request.Path + Request.QueryString`了。

## 其他

由于没有了nuget命令行，所以原本用`PM-Install`来搞定的事情现在需要先去`project.json`里添加一行依赖，然后再`dotnet restore`安装依赖。需要去nuget网站上查对应的程序集的版本号是多少，手工指定，相比之下就会稍微麻烦一点点。

# 使用Entity Framework和MySql

## 引入EF

主要涉及到引入`Microsoft.EntityFrameworkCore`，具体方法网上到处都是，就不说了，貌似默认的那个yeoman脚手架已经有了，不过配置的是Sqlite的。

## 引入MySql

最坑爹的事情来了，我搞了半个晚上都没搞定，因为…………………………

MySQL官方实现的那个程序集`MySql.Data.EntityFrameworkCore`，您注意看，是`MySql`，但是实际上使用的时候，要引用的命名空间却是`MySQL.Data.EntityFrameworkCore.Extensions`，您看，是`MySQL`，我只能说这个包吧，MySQL是请临时工写的吧。

剩下的用起来基本上就是正常用EntityFramework的方法了，网上到处都是例子。

# 部署

我在macOS上开发，然后部署到我的linux服务器上。我的系统是ubuntu 14.04，linux上的`dotnet`安装方式也不复杂，基本上安装官网的步骤就搞定了。不过中间也遇到一些小插曲，我的环境上面有些系统工具没装全，不过那些和本文主线无关我就不说了。

## 编译发布

正经方式是在`project.json`里写上`runtime`，然后运行`dotnet publish`，它可以一次性把所有依赖在那个平台上对应的dll都copy到生成目录里面，也就是说整个目录扔到了目标机器上不需要在运行`dotnet restore`安装依赖了，可以直接`dotnet xxx.dll`运行主程序。

我用的办法是到目标机器上用`dotnet restore`、`dotnet build`重新编译，不过说起来应该也是差不了太多吧。

## 应用程序配置

web.config真是弱鸡！在ASP.NET Core中它不再是推荐的进行应用程序配置的方式。

在官方的例子中，有一个多环境配置的例子，默认的应用程序配置`appsettings.json`，可以给它配置`appsettings.{env.EnvironmentName}.json`，两者会做merge，这样的话，`appsetting.json`里就全部是生产环节的配置了，在开发和测试环境上通过环境变量来选择用哪个配置文件去覆盖它。

比方说，脚手架里给F5的task配置了注入Development环境，所以会自动用appsettings.Development.json来和默认配置做merge。

我只能说，现代化多了……

## supervisor

[官方的指南](https://docs.asp.net/en/latest/publishing/linuxproduction.html)里推荐的方式是使用nginx做前端，反向代理到应用程序自己host的那个Kestrel服务器。

原本的脚手架里面配置了`wwwroot`目录作为静态文件目录，考虑到可以不用把静态文件的流量都放到.NET里来，我直接在nginx里面把`/static`给rewrite到了`<app>/wwwroot/static`，拦住了绝大部分静态文件，其它少部分，比如`favicon.ico`什么的放了就放了罢。

由于不再依附IIS，也没有fast-cgi，这种self hosted运行方式就是单进程容易挂了，比如nodejs、HHVM也是有这种问题，官方指南里写了使用supervisor来监控并重启进程。

supervisor以前在狼厂的时候用得很多，不过都是OP配置好的，我还没自己配过，暂时就先放这儿，等我把程序写完了正式部署的时候再配置吧。
