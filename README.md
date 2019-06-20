# magic dom

> Virtual DOM library

## 简介

介绍了多种虚拟 DOM 库的 diff 算法，可在 `lib/diff/` 下查看。

- virtual-dom
- cito
- snabbdom

```javascript
import { utils } from './dist/magic-dom.js'
const { set } = utils

set('diffType', 'virtual-dom') // 默认：使用 virtual-dom 的 diff 算法
set('diffType', 'cito')        // 使用 cito.js 的 diff 算法
set('diffType', 'snabbdom')    // 使用 snabbdom 的 diff 算法
```

### 使用方法

```javascript
import { h, diff, render, patch, utils } from './dist/magic-dom.js'
const { set } = utils

const list = ['a', 'b', 'c', 'd']
const vdom = h(
  'div', 
  { data: 'info' }, 
  list.map(t => {
    return h('p', {key: t}, t)
  )
)
const $dom = render(vdom) // 将虚拟 DOM 渲染成 真实 DOM
const $app  = document.getElementById('app')
$app.appendChild($dom) // 进行 DOM 挂载 
```

### diff 操作

#### virtual-dom

```javascript
set('diffType', 'virtual-dom') // 默认：使用 virtual-dom 的 diff 算法

// 将 list 随机排序
const newList = list.sort((a, b) => Math.random() * 2 - 1)
// 构造新的虚拟 DOM
const newVdom = h(
  'div', 
  { data: 'info' }, 
  list.map(t => {
    return h('p', {key: t}, t)
  )
)
// diff 得到更新补丁
const patches = diff(vdom, newVdom)
// 将补丁更新到视图上
patches && patch($app, patches)
```

#### cito

```javascript
set('diffType', 'snabbdom')    // 使用 snabbdom 的 diff 算法

// 将 list 随机排序
const newList = list.sort((a, b) => Math.random() * 2 - 1)
// 构造新的虚拟 DOM
const newVdom = h(
  'div', 
  { data: 'info' }, 
  list.map(t => {
    return h('p', {key: t}, t)
  )
)

// cito diff 过程中会直接更新 DOM，不再需要 patch
diff(vdom, newVdom)
```

#### snabbdom

```javascript
set('diffType', 'snabbdom')    // 使用 snabbdom 的 diff 算法

// 将 list 随机排序
const newList = list.sort((a, b) => Math.random() * 2 - 1)
// 构造新的虚拟 DOM
const newVdom = h(
  'div', 
  { data: 'info' }, 
  list.map(t => {
    return h('p', {key: t}, t)
  )
)

// snabbdom diff 过程中会直接更新 DOM，不再需要 patch
diff(vdom, newVdom)
```


