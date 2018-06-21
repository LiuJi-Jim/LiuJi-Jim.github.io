title: "NAS折腾记-硬件及系统篇"
date: 2018-6-20 23:33:33
tags:
- 生活
---

最近终于折腾了一下 NAS，开个坑记录一下（流水账）。

硬件及系统篇。

<!-- more -->

## 1. 硬件选型及配置

#### 群晖、QNAP

优点是系统整合度高，群晖的 DSM 软件口碑不错，硬件设计比较精密（体积小耗电低）。但价格偏高，4 盘位的群晖，X86 型号 DS418play 的话价格接近 4000，即使 618 期间可以 3600 左右拿下，还是贵啊。

#### 自组

这个多花几句话说说。

优点是自由度高，可以~~发扬图吧精神~~淘宝各种电子垃圾，肯折腾和钻研的话价格是很低的，折腾硬件的过程也可以获得一些乐趣（Are you serious??）盘位设计比较极限，有的机箱提供了 4 x 3.5 盘位同时还能在侧板上装一个 2.5 的。

缺点也比较明显，体积方面 Mini-ITX 是极限。但很多淘宝货 4 盘位的 NAS 小机箱对 CPU 散热器要求严苛，大概只有 4-5 厘米的高度空间，这样的散热器嗷嗷贵（像样一点，最便宜的也要一百多，大概 5 厘米高，再薄一点的就两三百了），另外因为 NAS 机箱的设计一般都是主板上方正对硬盘盒，造成即使装进去了下压式的散热器，也没有风道可用，散热效果大概率靠不住。当然也有贵的、稍微大一点点的机箱（比如联力 Q25）可以装塔式散热，能提供 7 盘位，PCI-E 挡板还是双槽位的，然而真的会有那么烧么……用整合 CPU 的板子，选择不多，而且基本上都是赛扬 J 系列，这倒不是不够用，不过就是为了压成本的玩法了。

另外就是 Mini-ITX 的用服务器芯片组（比如 C226、C236）的主板不是没有，妖板自然先看华擎，E3C226D2I 这板子就是，Chiphell 上有人就晒了基于它的装机。但问题也不少，首先它只有 VGA 输出，不能兼职 HTPC 了，其次它自带了一个某某某芯片，用来接管显示和 IMPI 功能，这样就不能用核显（这大概也是它只有 VGA 的原因吧），也就意味着它作为流媒体服务使用的话，服务端是没法利用 Intel 核显的 QuickSync 硬解技术的，所以它其实是比较严格的服务器主板，在家用这种可能需要身兼数职的场合会比较受限。

#### 服务器准系统

一般 4 盘位，体积和淘宝货 NAS 机箱差不多，胜在不需要折腾，主板一般是服务器主板，提供 VGA 和 DP 输出，2 到 3 个千兆网口，大概 6 个左右 USB。用 1U 电源或者 FLEX 电源，然后还有一个无卵用的 Slim 光驱位。

#### 对比一下

我的理解：不折腾自然选成品，但性能是一般，价格也最高。愿意折腾可以选自组，其实也非常受限，如果不追求小体积的话换个 M-ATX 机箱，那么整体成本和装机难度都大幅下降，选择也一下多很多。而服务器准系统相对来说比较平衡，可以自由发挥的空间不大，顶多也就是换个 CPU、扩下内存啥的，硬件方面基本不需要折腾。

所以最终我的选择是**服务器准系统**。

经过一番不走心的调研，圈定了 [HPE ProLiant MicroServer Gen10](https://www.hpe.com/us/en/product-catalog/servers/proliant-servers/pip.hpe-proliant-microserver-gen10.1009955118.html) 和 [Acer Altos C100 F3](https://www.acer.com/ac/zh/CN/content/series/altosc100f3)，共同点都是 4 盘位，体积差不多，HP 似乎还稍微小一点点。

HP 机器新一些，性能也更好，用的是 AMD Opteron X3000 系列，据说性能可以对标 6 代酷睿 i3。2 LAN，2 DP 输出，设相对较偏家用，外观比较漂亮。

Acer 机器旧一些，芯片组是 Intel C226，LGA 1150 平台，LGA 1150 接口最高可以上 E3 1285L。v3，3 LAN，1 DP 输出，偏服务器一点，外观比较粗犷。

最后选了 Acer 那个，价格便宜一些……查了一下各种电子垃圾旧 DDR3 ECC 内存，太他娘的贵了，8G 竟然要四百多，内存不愧是年度最佳理财产品。还是直接买卖家组好的吧，烈士墙在等待我，淘宝挑了一个北京的卖家，名叫“联想服务器北京xxx”，呵呵呵一听就是专卖电子垃圾的啊。配置选了一个“中配”，i3 4130 + 8G 内存。选这个配置是因为再高一档的 E3 1225 v3 + 8G 感觉目前而言用不上，而且 TDP 高了 20W，以后有需要了再升级 CPU 吧，最后入手价格 2230。

#### 适合 NAS 与小服务器的 LGA 1150 CPU 粗略对比

|  | 核心 | 主频 | 睿频 | TDP | L3 Cache | ￥ |
| ---:| ---:| ---:| ---:| ---:| ---:| ---:|
| i3 4130 | 2C4T | 3.4 | N/A | 54 | 3M | 430 |
| E3 1225 v3 | 4C4T | 3.2 | 3.6 | 84 | 8M | 750 |
| E3 1285L v3 | 4C8T | 3.1 | 3.9 | 65 | 8M | 1200 |

硬盘先买了个 Sandisk 的 120G SSD 做系统盘（再山寨的牌子实在不敢买，也就便宜二三十块），和一个 WD 2T 红盘。为什么只买 2T 这么小的？因为长线计划是 2T 做私有云，8T 存片儿，但目前片儿少，并不需要 8T 那么大，而且现在 8T 要接近 2000 块钱，先把系统搭建起来再说，就不一次性投资那么大了，大不了后面忍受一次数据迁移的苦呗。

到手，拆开看看，没啥好看的，里面布局还是比较紧凑的，但其实整体并不小，从 4 盘位的群晖或 QNAP 产品图上看，这货要大一圈，大概是供电和散热方面、还有那个无卵用的光驱位占了不少体积吧，毕竟定位是比较通用的服务器准系统，而且是 LGA 1150 平台的，集成度肯定没有那么高。

这机器 4 x 3.5 的盘位，没有 M.2 接口，于是系统盘要占一个盘位。装的时候我还刻意把 HD 放在了最下面一个盘位，感觉重心低点可能减少工作时共振的噪音（yy的）？但其实如果肯折腾一下，是可以把 2.5 寸 SSD 装在光驱位的，反正现在我盘位也没用满，我折腾那劲干啥啊。

因为是准系统，装机环节就没多少好说的了，记得 BIOS 里开启网络唤醒（WOL）就好，现在的路由器一般也都支持，这部分就先到这里，照片也没拍，从淘宝上盗两张吧。

![](/uploads/2018/acer-altos-c100-f3-1.jpg)

![](/uploads/2018/acer-altos-c100-f3-2.jpg)

以盘位为参考大小，可以对比一下 DS418play 看的话体积还是比较大的，考虑以后如果放在电视柜兼职 HTPC 的话体积还真不能说小，估计还是找个角落藏起来比较好。

![](/uploads/2018/synology-ds418play.jpg)

## 2. 系统

### 2.0. 选型

系统可以选 Linux 和 Windows，为什么不选黑群晖、FreeNAS 这类的专门做 NAS 的系统？首先，既然有 X86 那么肯定是性能取向的，虚拟机和 docker 可以燥起来，于是宿主环境自然要选择全功能系统，不然那些玩意够折腾死，遇到有需要的时候再用虚拟化来解决。

先做一个粗略的功能对比吧

#### 运维

* Linux：几乎都 CLI，GUI 用的人少
* Windows：GUI 为主，也可以用 CLI (PowerShell)

PowerShell 不太会，Linux 上有些过去我自己写的以及从运维那里偷来的脚本可以沿用一下。

#### 远程桌面

* Linux：[Jump Desktop](https://jumpdesktop.com/)
* Windows：官方

Linux 用远程桌面的人应该不多吧……另外 Jump Desktop 的 Mac 客户端好贵好贵。

微软官方的新版远程桌面体验很好，再也不是过去那个老掉牙的了，Mac 版中国区没上架，需要用个外国区的 Apple ID 才能下。

#### Web Shell

* Linux：[Cockpit](https://cockpit-project.org/)
* Windows：Windows Admin Center

Cockpit 更多是一个 Web 监控，附带一些基础运维功能、一个 Web 终端；Windows Admin Center 没用过，但看介绍的话很强大，连注册表编辑器都有。

#### 文件共享

* Linux：Samba、NFS
* Windows：Samba

NFS 性能应该比 Samba 好一些？Windows 自然也可以用 NFS，不过系统整合程度就没有 Samba 那么高，折腾一点。

#### 私有云

* Linux：[Seafile](https://www.seafile.com/)、[Nextcloud](https://nextcloud.com/)
* Windows：[Seafile](https://www.seafile.com/)

Seafile 国产的，Nextcloud 歪国的，都没用过，不知道。

#### 迅雷

* Linux：[xware](http://luyou.xunlei.com/forum-51-1.html)
* Windows：官方

xware 是迅雷官方的一个东西，原本是作为迅雷路由器的固件来发布的，于是自然有人给它做了前端。主流的用法其实是把它跑做一个后台程序，作为一个远程下载的设备。然而迅雷远程这玩意官方已经关掉大多数入口，怕是不知道啥时候就下线了。而且实际用下来（我是 docker 跑的）发现不能离线加速（点了无卵用），感觉略废柴。而且 xware 官方早已不更新，只是服务本身还没下线而已。

Win 客户端虽然又臃肿又慢，但离线加速的功能至少是好的，由于 Win 客户端也已经关闭了添加远程的入口，无法实验远程离线加速是否可用。

#### 百度云

* Linux：bypy
* Windows：官方

bypy 这玩意是基于 PCS API 的一个微型客户端（一堆脚本），它只能访问应用沙盒里的路径，用起来比较别扭。另一个问题是，PCS API 的所有入口都关闭了，只是服务还在，过去申请的 AppKey/AppSecret 依然可以使用。

如果没有自己的 AK/AS 的话只能用项目作者的中转服务器来做 OAuth，虽然不诛心，不过谁知道他会不会把 access token 存下来……当然他也提供了一个本地认证的方式，需要自己有 AK/AS 并且是开通了 PCS API 权限的，现在自然是无法申请到了，还好我有一个祖传的。

#### 远程下载

* Linux：Aria2
* Windows：Aria2

没啥区别，Aria2 的 WebUI 选择不少，我用的是 AriaNG。不过 Aria2 不支持 eMule，有时候显得很无能狂怒。

#### 媒体中心

* Linux：PLEX、Emby
* Windows：PLEX、Emby

都没用过，到时候再看看。

#### 小结

这两者我一开始是偏向 Linux 的，因为我在 Windows 方面的运维经验几乎为 0。发行版就选 Ubuntu 吧，apt 用起来比较简单，社区热度和其他开源项目对 Ubuntu 的友好程度也还行。

### 2.1. Linux 篇

于是，做好 Ubuntu Server 18.04 LTS 的安装 U 盘就操练起来了。

Ubuntu Server 的安装不难，过程中配置一下网卡，网………………卡，等等，卡住了……再试试，又卡住了。思索 10 秒钟，从现象判断是这版本 Linux 不支持其中两张网卡（？？？），啧啧啧，毕竟 Acer 的官方文档里也没写这机器支持 Ubuntu，要换 SUSE 吗？No way 我就是喜欢 Ubuntu 嘛（扭）。好，至少我现在只用一根网线，那么就先去 BIOS 里屏蔽掉另外两张网卡吧。

系统安装成功。

进系统，终于可以把显示器和键盘还给我的台式机了，剩下的工作就用 SSH 搞定吧。

嗡嗡嗡………………等下这声音从哪来的，我去为什么机箱风扇转速有 19xx RPM？啧啧啧，找了一下资料，装上 sensors-detect 和 fancontrol ，却找不到 PWM 调速风扇。

啊？难道这倒霉系统不支持另外两块网卡也就算了，连给风扇调速都不支持？要不……换 Win 试试？

### 2.2. Windows 篇

嗯，反正折腾呗，做个 Windows Server 2016 的安装 U 盘，再次操练起来吧。

安装过程也是很顺利的，开启了远程桌面服务以后，就可以把显示、鼠标键盘还给台式机了。

然后装一个 fanspeed 软件，当场脸青了，还是找不到风扇。

所以……绝了，我大概明白了，这风扇只受 BIOS 控制，目测 BIOS 只给它两档，不开智能调速就是 6100 RPM，那声音跟进了厂房差不多，开了的话常规情况就是 19xx RPM，一是转速不算低，二是它很厚，叶片面积那是相当的大，声音还是不能接受。

于是默默地京东下单买了个 12cm 的低速风扇，1200 RPM 的，50 块钱，好贵，但淘宝解不了急啊，第二天装上以后安静了，只有安静的时候在机器范围大概 1 米以内的样子能听见轻微的声音。

### 2.3. 插曲

中途有一次重启过后突然进不去远程桌面了，无奈，再次把显示器、鼠标键盘借给服务器，发现开机显示 `Warning: Chassis is opened`，呵呵呵，服务器就是矫情，本来想着风扇到货之前先拆掉裸奔，既然这样那就还是都装上吧。

却还是继续报这个，好的，按 F1 忽略或按 F2 进 BIOS，我按，我按，却没反应……

啊？？？

难道刚才折腾的时候把传感装置弄坏了？拆开机箱，观察了一下，主板上有一个 `Case Open` 的 2 Pin 接口，连一根线接到机箱旁边有一个继电器（还是微动开关？whatever，反正就是个开关），只要机箱盖子正确的盖上，开关接通，2 Pin 就会接通。

简单嘛，手把那个开关压住就行了，开机，问题依旧。

难道是因为刚才暴力拆装把开关弄坏了？声音很清脆啊，弹簧手感也很正常，没这么娇嫩吧？管它，先把开关拆了，直接镊子短接一下主板上的两根针脚，开机，问题依旧。

难道是我手法不够犀利，想当年电脑电源开关坏了，用镊子短接针脚一下开机，不要太娴熟啊，唉，老了老了。

查下说明书，把 BIOS Reset 一下，开机，问题依旧。

我苦思冥想，等等，难道………………………………

我不服啊，去了一趟公司，把另一块键盘拿回家，顺便把无线鼠标也拿回来了，接上，开机，好……好了…………

倒霉键盘我掰了……算了，不少钱呢，反正在台式机上用着是好的，留着继续用吧。

所以最终是什么原因呢？我也不知道，反正第一时间进 BIOS 里把这个提示给关了。

### 2.4. 小结

要不……咱又换回 Linux？算了……闹心，用 Windows，挺好。

----

本期节目就先到这里，下期开始进入软件篇。这期写的枯燥了一点，主要是过程中也懒得拍照片，不过既然是准系统大概也没什么好晒图的，下期既然是软件那就争取多配点图吧。
