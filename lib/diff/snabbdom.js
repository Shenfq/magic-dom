import render from '../render'
import { isVText, isArray } from '../utils/type'

export default function diff(oldNode, newNode) {
  const dom = oldNode.dom
  // 相同类型 DOM 进行 diff 对比
  if (sameVnode(oldNode, newNode)) {
    patchVnode(oldNode, newNode)
  } else {
    // 两者类型不同，直接用创建新节点，替换旧元素
    const parent = dom.parentNode
    const newDom = render(newNode)
    if (parent !== null) {
      parent.replaceChild(dom, newDom)
    }
  }
}

/**
 * 判断两个虚拟 DOM 是否是同类型
 * @param {vdom} vnode1 
 * @param {vdom} vnode2 
 */
function sameVnode(vnode1, vnode2) {
  return vnode1.tag === vnode2.tag && vnode1.key === vnode2.key
}

/**
 * snabbdom diff 算法
 * @param {vdom} oldVnode 
 * @param {vdom} vnode 
 */
function patchVnode(oldVnode, vnode) {
  if (oldVnode === vnode) {
    return
  }
  // 获取节点的真实 DOM
  const dom = (vnode.dom = oldVnode.dom)
  const oldCh = oldVnode.children
  const ch = vnode.children
  if (!isVText(vnode)) {
    if (isArray(oldCh) && isArray(ch)) {
      if (oldCh !== ch) {
        updateChildren(dom, oldCh, ch)
      }
    } else if (isArray(ch)) {
      if (isVText(oldVnode)) {
        setTextContent(dom, '')
      }
      addVnodes(dom, null, ch, 0, ch.length - 1)
    } else if (isArray(oldCh)) {
      removeVnodes(dom, oldCh, 0, oldCh.length - 1)
    } else if (isArray(oldVnode.text)) {
      setTextContent(dom, '')
    }
  } else if (oldVnode.text !== vnode.text) {
    if (isArray(oldCh)) {
      removeVnodes(dom, oldCh, 0, oldCh.length - 1)
    }
    setTextContent(dom, vnode.text)
  }
}

/**
 * 根据虚拟 DOM，创建真实 DOM，并插入指定位置
 * @param {Element} parentElm 
 * @param {Element} before 要插入的位置
 * @param {Array} vnodes 要创建的虚拟 DOM 数组
 * @param {Number} startIdx 开始位置
 * @param {Number} endIdx 结束位置
 */
function addVnodes(parentElm, before, vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = vnodes[startIdx]
    if (ch != null) {
      insertBefore(parentElm, render(ch), before)
    }
  }
}

function setTextContent(dom, text) {
  dom.textContent = text
}

/**
 * 插入元素到指定位置
 * @param {Element} parentNode 
 * @param {vdom} newNode 
 * @param {Element|null} referenceNode 
 */
function insertBefore(parentNode, newNode, referenceNode) {
  parentNode.insertBefore(newNode, referenceNode)
}

function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = vnodes[startIdx]
    if (ch != null) {
      parentElm.removeChild(ch.dom)
    }
  }
}

/**
 * 采用两端对比的方式更新子节点
 * @param {Element} parentElm 
 * @param {Array} oldCh 
 * @param {Array} newCh 
 */
function updateChildren(parentElm, oldCh, newCh) {
  let oldStartIdx = 0
  let newStartIdx = 0
  let oldEndIdx = oldCh.length - 1
  let oldStartVnode = oldCh[0]
  let oldEndVnode = oldCh[oldEndIdx]
  let newEndIdx = newCh.length - 1
  let newStartVnode = newCh[0]
  let newEndVnode = newCh[newEndIdx]
  let oldKeyToIdx
  let idxInOld
  let elmToMove
  let before

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    // 跳过两端不存在的旧节点
    if (oldStartVnode == null) {
      oldStartVnode = oldCh[++oldStartIdx]
    } else if (oldEndVnode == null) {
      oldEndVnode = oldCh[--oldEndIdx]
    }
    // 跳过两端不存在的新节点
    else if (newStartVnode == null) {
      newStartVnode = newCh[++newStartIdx]
    } else if (newEndVnode == null) {
      newEndVnode = newCh[--newEndIdx]
    }
    /** 
      * 进行两端对比，分为四种状况：
      * 1. oldStart <=>  newStart
      * 2. oldEnd   <=>  newEnd
      * 3. oldStart <=>  newEnd
      * 4. oldEnd   <=>  newStart
      */
    else if (sameVnode(oldStartVnode, newStartVnode)) {
      patchVnode(oldStartVnode, newStartVnode)
      oldStartVnode = oldCh[++oldStartIdx]
      newStartVnode = newCh[++newStartIdx]
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode)
      oldEndVnode = oldCh[--oldEndIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      patchVnode(oldStartVnode, newEndVnode)
      insertBefore(parentElm, oldStartVnode.dom, oldEndVnode.dom.nextSibling)
      oldStartVnode = oldCh[++oldStartIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // Vnode moved left
      patchVnode(oldEndVnode, newStartVnode)
      insertBefore(parentElm, oldEndVnode.dom, oldStartVnode.dom)
      oldEndVnode = oldCh[--oldEndIdx]
      newStartVnode = newCh[++newStartIdx]
    } 
    // 上面四种情况都不存在，通过 key 值查找对应 VDOM 进行对比
    else {
      // 构造旧子节点的 map 表 { key => vdom }
      if (oldKeyToIdx === undefined) {
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
      }
      idxInOld = oldKeyToIdx[newStartVnode.key]
      // 如果新的子节点在旧子节点不存在，进行插入操作
      if (idxInOld === undefined) {
        insertBefore(parentElm, render(newStartVnode), oldStartVnode.dom)
        newStartVnode = newCh[++newStartIdx]
      } 
      // 如果新的子节点在旧子节点存在，进行对比
      else {
        elmToMove = oldCh[idxInOld]
        // key 值相同，但是 tag 不同，重新生成节点并替换
        if (elmToMove.sel !== newStartVnode.sel) {
          insertBefore(parentElm, render(newStartVnode), oldStartVnode.dom)
        } 
        // 将旧节点移动到对应位置
        else {
          patchVnode(elmToMove, newStartVnode)
          oldCh[idxInOld] = undefined // 该位置已经对比，进行置空
          insertBefore(parentElm, elmToMove.dom, oldStartVnode.dom)
        }
        newStartVnode = newCh[++newStartIdx]
      }
    }
  }
  // 处理一些未处理到的节点
  if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
    if (oldStartIdx > oldEndIdx) {
      before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].dom
      addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx)
    } else {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx)
    }
  }
}

/**
 * 构造旧子节点的 map 表 { key => vdom }
 * @param {Array} children 
 * @param {Number} beginIdx 
 * @param {Number} endIdx
 */
function createKeyToOldIdx(children, beginIdx, endIdx) {
  let i, key, ch
  const map = {}
  for (i = beginIdx; i <= endIdx; ++i) {
    ch = children[i]
    if (ch != null) {
      key = ch.key
      if (key !== undefined) {
        map[key] = i
      }
    }
  }
  return map
}
