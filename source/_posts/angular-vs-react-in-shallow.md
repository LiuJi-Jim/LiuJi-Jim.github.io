title: "浅谈Angular与React"
date: 2015-02-05 00:23:12
tags:
- 编程
---
用Angular写了一个管理系统，用React只写了几百行玩具代码。

因此是浅谈，真的很浅，完全可以说是对手感的评价。

<!-- more -->

## UI描述
### Angular
Angular基本是做到了声明式UI，`ng-if`、`ng-repeat`这类的“流程控制”语法虽然看起来土鳖，但活儿好。至少对于UI的展现逻辑，基本上不再需要去它的controller里`if`或者`for`了。

### React
React说它的JSX是声明式的UI，这不扯吗，用了就知道，这东西只是比编程生成UI容易那么一丁丁点，仅仅是一丁丁点。

要循环生成一个列表，还得先把它生成到一个数组里，再把数组塞进JSX，真是闹心。例如：

```
var CardList = React.createClass({
  render: function() {
    var button;
    if (loggedIn) {
      button = <AddCardButton />;
    } else {
      button = <LoginButton />;
    }
    var cards = this.props.data.map(function(item) {
      return (
        <Card data={item} />
      );
    });
    return (
      <div className="card-list">
        <ul>
          {cards}
        </ul>
        <div className="footer">
          {button}
        </div>
      </div>
    );
  }
});
```

不要怀疑哦，上面演示的条件与循环的实现基本上就是官方示例里面给的方式。恶心吗？恶心就对了。

## UI构建
### Angular
Angular的UI构建基本上还是按照“模板”的思路，是基于文本的，稍微方便一点代码分离啊、build啊什么的。管理文本资源对于前端来说是很熟悉的事情。

### React
React当中没有模板，它万物皆组件。JSX是编程语言，React的“模板”是基于DOM的，于是所有UI都是程序片段，视图与逻辑的分离的界线变得非常模糊。

用JSX几乎是构建React组件的唯一办法，因为不用JSX的话，手写那些`React.createElement`无疑是反人类的，而且更跟“声明式UI”没有半毛钱的关系了。

当然理解React的UI是程序片段这一点后，也就有办法来做视图和逻辑的拆分了——把视图当做JS模块来管理，可以部分借鉴现在各种JS模块化的思路。不过技术实现上差强人意。因为我没专注研究，就不丢人现眼了。

## 数据驱动UI
两者都实现了由model去驱动view，本世代的前端框架，包括不限于Ember、Polymer、Vue、Avalon都是这个思路，可以说以jQuery为代表的围绕DOM操作构建UI的时代已经过去了。

### Angular
Angular用脏检查驱动视图更新，如果理解了`$digest`循环，就基本上了解了什么时候视图会被更新，如果要整合自己已有的组件，可以脱离`$digest`循环尽情玩耍，完事以后一个`$apply`把控制权交回去。被诟病的就是性能问题了。

### React
React使用虚拟DOM，可谓天马行空。

React开发者认为“组件就是一个个状态机”（原文：React thinks of UIs as simple state machines），所以它是通过`setState`来驱动的。于是事实上你会发现还是需要手工去`setState`更新状态。当然对于控制狂来说这是好的，首先是UI的更新时机变得很明确；其次React认为这样可以让UI变得“Predictable”，可以通过编写任意`state`来精确地控制UI，提高UI的可测性。

但虚拟DOM和传统DOM之间几乎是不兼容的，如果要整合一些自己已有的组件，而这些组件——不管是为了实现方便还是为了性能——有魔改DOM，比如modal把元素摘到body上去方便定位；比如slide每次只保留两个元素其他一律干掉。那么会打破虚拟DOM与传统DOM之间的关联关系，React会无情罢工。

> Unable to find element. This probably means the DOM was unexpectedly mutated (e.g., by the browser), usually due to forgetting a &lt;tbody&gt; when using tables, nesting tags like &lt;form&gt;, &lt;p&gt;, or &lt;a&gt;, or using non-SVG elements in an &lt;svg&gt; parent. Try inspecting the child nodes of the element with React ID

## 基础设施
### Angular
Angular提供了大量的基础设施，如大量的内建`directive`、依赖注入等，明确了`controller`、`service`等概念，这样就给出了一个基本稳定的应用开发的路数。不论这种大量输出价值观是否好坏，至少在使用Angular开发该怎么构建应用程序的问题分歧是比较少的。

### React
React几乎不提供任何基础设施，我并不理解这一点是因为他们不输出价值观还是完成度不够。React的官方文档目录里面“TIPS”栏目几乎与“GUIDES”栏目一样多，让我觉得有点尴尬。相比Angular的大而全，React比较专注于以一种“万物皆组件”的方式构建一个干净的UI，而并不是构建一个完整的应用程序（那是Flux里的内容）。

## 周边设施
### Angular
Angular的插件很丰富，ui-router几乎是市面上最强的SPA路由组件；ng-resource把数组魔改成Promise也是有点儿意思。如上文所说，理解了`$digest`循环后要整合现有的UI组件并不难。

### React
React的插件相对要少一些，本次React Conf上有演示的一个router组件我没体会过，不评价。如上文所说，因为虚拟DOM与传统DOM之间微妙的关系，整合现有UI组件会比较容易踩坑。

## 结论
如果Angular是一个家务活干得好的小媳妇儿，那么React就是一个磨人的小妖精。

虽然很多人都觉得Angular主张太强，但其实除了“数据驱动UI”的观念需要稍微突破一下，两者相比之下Angular并没有那么多概念冲击，反而React要舍弃不少东西。

经我观察其实Facebook也只在个人主页的侧边栏使用了React，然后据说Instagram是整个用React的，因为我不玩这个就没试。

用React构建应用程序会存在方法论的分歧，当然既然React很专注解决UI组件的问题，那么我们可以用它配合一些之前对于View做的不好的框架，嗯你一定知道我说的就是backbone。

Angular受大家诟病性能的问题比较突出，移动端肯定没戏了，React据说性能很好，这个我没有去评估。

结论之结论：Angular是一个循序渐进的MVVM框架，之所以说循序渐进，是因为这些概念在其他语言和平台上面都已经得到过验证了，希望Angular 2.0能继续保留这些中庸而好用的哲学。React是一个狼群中的异类，JSX的存在让我觉得他们团队有JS偏执，虚拟DOM的存在让我觉得这个东西并不是Web开发，使用React开发项目也许需要做好面对“Culture Shock”的准备。