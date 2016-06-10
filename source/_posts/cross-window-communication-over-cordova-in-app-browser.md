title: Cordova中与In App Browser的通讯
tags:
  - 编程
date: 2016-6-8 23:33:33
---

为了把我的练琴记录仪改成多用户App，我需要做一个Weibo OAuth功能，因为练琴记录仪是Single Page App，我不愿意直接跳转到OAuth页面，那样会打断我的应用状态，于是我打算打开一个新窗口来完成OAuth。

这样一来，问题自然就转换为跨窗口通讯问题了。

窗口间通讯毫无疑问首选是`window.postMessage`，在cordova当中，原生`window.open`是不能用的，官方给的方案是使用`cordova-plugin-inappbrowser`插件所提供的`cordova.InAppBrowser.open(url, target, options)`来取代`window.open`，这两者基本上API差不多一致。

但是IAB插件所返回的对象并不是真正的`window`，它没有`postMessage`功能，并且在IAB所打开的页面中，也没有`window.opener`，于是只能另辟蹊径，找点不靠谱的挫方法来试试了。

<!-- more -->

# OAuth基本流程

OAuth的基本流程这里就不赘述了，简单描述一下

0. Client需要授权，把自己（由服务商分配的）`client_id`——也称`app key`以及在服务商注册的`redirect_url`拼在一起，让用户去访问服务商的`authorize`地址。
1. 服务商会询问用户是否对这个`client_id`授权自己的账号，如果是，会跳转到`redirect_url?code=xxxxxx`。
2. 应用的服务端接收到`redirect_url`的访问，用URL参数中的`code`和自己的`client_id`以及`app secret`（相当于密码）去请求服务商的`access_token`接口，得到`access_token`，这个就是此应用对于这个用户账号的访问凭条。
3. `redirect_url`页面根据应用自身需要把获得的`access_token`传回应用，完成授权过程。

# 使用`window.open`时的流程

0. 客户端`var win = window.open(oauth_url)`。
1. 完成OAuth授权，跳转到`redirect_url`。
2. 在`redirect_url`上，把`access_token`用`window.opener.postMessage`的方式发给应用。
3. 应用监听`win`的`onmessage`事件，一旦收到了`access_token`就完成授权，可以`win.close()`了。

然后我先把它写成了一个函数

```JavaScript
function crossWindowViaBrowser(url, target, opts, key, timeout) {
  let defer = Promise.defer()
  let resolve = defer.resolve.bind(defer)
  let reject = defer.reject.bind(defer)
  let promise = defer.promise
  let timing

  let win = window.open(url, target, utils.buildOpenWindowOptions(opts))

  let onMessage = e => {
    let data = e.data || {}
    if (data.type === 'cross-window' && data.key === key) {
      parseResult(data.result, resolve, reject)
    }
  }

  // close（貌似）没有可用的事件，`win.addEventListener('close')`没用的样子
  // `win.addEventListener`不好用的问题也可能是因为跨域，真是蛋疼啊
  // 于是轮询`closed`属性吧
  let pollingClosed = setInterval(() => {
    if (win.closed) {
      reject(new Error(ErrorType.CANCELED))
    }
  }, POLLING_INTERVAL)

  window.addEventListener('message', onMessage, false)

  // 超时`reject`
  if (timeout > 0) {
    timing = setTimeout(() => {
      reject(new Error(ErrorType.TIMEOUT))
    }, timeout)
  }

  promise.finally(() => {
    // clean up
    clearInterval(pollingClosed)
    clearTimeout(timing)
    window.removeEventListener('message', onMessage)
    win.close()
  })

  return promise
}
```

# 使用`cordova.InAppBrowser.open`时的流程

0. 客户端`var win = cordova.InAppBrowser.open(oauth_url)`。
1. 客户端开始对`win.executeScript`并进行轮询，其内容是尝试读取`localStorage.getItem(key)`。
2. `redirect_url`页面把获取到的`access_token`写到`localStorage.setItem(key, access_token)`。
3. 客户端一旦轮询到`localStorage.getItem(key)`有值，就可以得到`access_token`，然后就可以`localStorage.removeItem(key)`，完成授权，`win.close()`。

然后我也单独写了一个函数

```JavaScript
function crossWindowViaCordovaIAB(url, target, opts, key, timeout) {
  let defer = Promise.defer()
  let resolve = defer.resolve.bind(defer)
  let reject = defer.reject.bind(defer)
  let promise = defer.promise
  let timing

  let win = cordova.InAppBrowser.open(url, target, utils.buildOpenWindowOptions(opts))
  // cordova的InAppBrowser没有window.opener对象，只能使用轮询罢。。
  const code = `(function() {
    var key = '${key}'
    var data = localStorage.getItem(key)
    if (data !== null) {
      localStorage.removeItem(key)
      return data
    }
    return false
  })()`

  let poll = () => {
    win.executeScript({ code: code }, ret => {
      if (ret[0] === false) {
        // 等待
      } else {
        clearInterval(pollingData)
        parseResult(ret[0], resolve, reject)
      }
    })
  }
  let pollingData = setInterval(poll, POLLING_INTERVAL)

  // 窗口关闭时`reject`
  // 正常流程上面`resolve`后才会`win.close()`，所以这里再`reject`也不会有影响
  win.addEventListener('exit', e => {
    reject(new Error(ErrorType.CANCELED))
  })

  // 超时`reject`
  if (timeout > 0) {
    timing = setTimeout(() => {
      reject(new Error(ErrorType.TIMEOUT))
    }, timeout)
  }

  promise.finally(() => {
    // clean up
    clearInterval(pollingData)
    clearTimeout(timing)
    win.close()
  })

  return promise
}
```

# 整合

```
function crossWindow(...args) {
  if (window.cordova !== undefined && cordova.InAppBrowser !== undefined) {
    return crossWindowViaCordovaIAB(...args)
  } else {
    return crossWindowViaBrowser(...args)
  }
}
```

# 服务端

服务端的Redirect Page我是用PHP写的，涉及到上面的`cross-browser`的部分大概是：

```PHP
<script>
window.onload = function() {
  var key = <?= json_encode($key) ?>

  var result = <?= json_encode($output) ?>

  localStorage.setItem(key, result)
  if (window.opener) {
    window.opener.postMessage({
      type: 'cross-window',
      key: key,
      result: result
    }, '*')
  }
}
</script>
```

其中`$output`是对`access_token`接口`curl`得到的返回值，虽然微博给的返回值理论上说都是合法的JSON，但出于通用考虑我还是直接把它当字符串传递，让客户端自己在`parse`的时候进行`try/catch`，而且这样对`localStorage`也比较直接。
