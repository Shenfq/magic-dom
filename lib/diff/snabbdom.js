import render from '../render'
import { isVText, isArray } from '../utils/type';

export default function diff(oldNode, newNode) {
  const dom = oldNode.dom
  // 相同类型 DOM 进行对比
  if (sameVnode(oldNode, newNode)) {
    patchVnode(oldNode, newNode)
  } else {
    const parent = dom.parentNode
    const newDom= render(newNode)
    if (parent !== null) {
      parent.replaceChild(dom, newDom)
    }
  }
}

function sameVnode(vnode1, vnode2) {
  return vnode1.tag === vnode2.tag && vnode1.key === vnode2.key
}

function patchVnode(oldVnode, vnode) {
  if (oldVnode === vnode) {
    return
  }
  const dom = vnode.dom = oldVnode.dom
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
  } else if (oldVnode.text !== vnode.text){
    if (isArray(oldCh)) {
      removeVnodes(dom, oldCh, 0, oldCh.length - 1)
    }
    setTextContent(dom, vnode.text)
  }
}


function addVnodes(parentElm, before, vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = vnodes[startIdx];
    if (ch != null) {
      insertBefore(parentElm, render(ch), before)
    }
  }
}

function setTextContent(dom, text) {
  dom.textContent = text
}

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

function updateChildren(parentElm, oldCh, newCh) {
  let oldStartIdx = 0, newStartIdx = 0
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
    // 进行两端对比
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
    } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
      patchVnode(oldEndVnode, newStartVnode)
      insertBefore(parentElm, oldEndVnode.dom, oldStartVnode.dom)
      oldEndVnode = oldCh[--oldEndIdx]
      newStartVnode = newCh[++newStartIdx]
    } else {
      if (oldKeyToIdx === undefined) {
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
      }
      idxInOld = oldKeyToIdx[newStartVnode.key]
      if (idxInOld === undefined) {
        insertBefore(parentElm, render(newStartVnode), oldStartVnode.dom)
        newStartVnode = newCh[++newStartIdx]
      } else {
        elmToMove = oldCh[idxInOld]
        if (elmToMove.sel !== newStartVnode.sel) {
          insertBefore(parentElm, render(newStartVnode), oldStartVnode.dom)
        } else {
          patchVnode(elmToMove, newStartVnode)
          oldCh[idxInOld] = undefined;
          insertBefore(parentElm, (elmToMove.dom), oldStartVnode.dom);
        }
        newStartVnode = newCh[++newStartIdx];
      }
    }
  }
  if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
    if (oldStartIdx > oldEndIdx) {
      before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].dom
      addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx)
    } else {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx)
    }
  }
}

function createKeyToOldIdx(children, beginIdx, endIdx) {
  let i, key, ch
  const map = {}
  for (i = beginIdx; i <= endIdx; ++i) {
    ch = children[i];
    if (ch != null) {
      key = ch.key
      if (key !== undefined) {
        map[key] = i
      }
    }
  }
  return map
}