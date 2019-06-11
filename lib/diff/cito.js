import { isVNode, isArray } from '../utils/type'
import { PATCH } from '../types'

export default function diff(oldNode, newNode) {
  const patches = []
  updateNode(oldNode, newNode, patches, 0)
  return patches
}

function updateNode(oldNode, node, patches, index) {
  if (node === oldNode) {
    return
  }

  let patch = patches[index]

  const tag = node.tag

  if (!oldNode) {
    patch = appendPatch(patch, {
      type: PATCH.INSERT,
      vNode: newNode,
    })
  } else if (!node) {
    patch = appendPatch(patch, {
      type: PATCH.REMOVE,
      vNode: null,
    })
  } else if (oldNode.tag !== tag) {
    appendPatch(patch, {
      type: PATCH.REPLACE,
      vNode: node,
    })
  } else {
    const oldChildren = oldNode.children
    const children = node.children
    if (children !== oldChildren) {
      patch = updateChildren(oldChildren, children, patches, patch, index)
    }

    const oldProps = oldNode.props
    const props = node.props
    if (props !== oldProps) {
      const propsPatch = updateAttributes(props, oldProps)
      if (propsPatch && propsPatch.length > 0) {
        patch = appendPatch(patch, {
          type: PATCH.PROPS,
          patches: propsPatch,
        })
      }
    }
  }
  if (patch) {
    patches[index] = patch
  }
}

function updateAttributes(newProps, oldProps) {
  const patches = []
  const props = Object.assign({}, newProps, oldProps)

  Object.keys(props).forEach(key => {
    const newVal = newProps[key]
    const oldVal = oldProps[key]
    if (!newVal) {
      patches.push({
        type: PATCH.REMOVE_PROP,
        key,
        value: oldVal,
      })
    }

    if (oldVal === undefined || newVal !== oldVal) {
      patches.push({
        type: PATCH.SET_PROP,
        key,
        value: newVal,
      })
    }
  })

  return patches
}

function updateChildren(oldChildren, children, patches, patch, index) {
  const oldChildrenLength = oldChildren.length
  // 如果没有旧子节点，插入新的节点
  if (oldChildrenLength === 0) {
    for (let child of children) {
      patch = appendPatch(patch, {
        type: PATCH.INSERT,
        vNode: child,
      })
    }
    return patch
  }
  const ChildrenLength = children.length
  // 如果没有新子节点，删除旧的节点
  if (ChildrenLength === 0) {
    let idx = index
    for (let child of oldChildren) {
      idx++
      patches[idx] = {
        type: PATCH.REMOVE,
        vNode: null,
      }
      if (isVNode(child) && isArray(child.children)) {
        idx += child.children.length
      }
    }
    return patch
  }

  let oldEndIndex = oldChildrenLength - 1
  let endIndex = ChildrenLength - 1
  let oldStartIndex = 0
  let startIndex = 0
  let successful = true
  let nextChild

  const indexMap = getVNodeIndexMap(oldChildren, index)

  /* eslint-disable no-labels */
  outer: while (
    successful &&
    oldStartIndex <= oldEndIndex &&
    startIndex <= endIndex
  ) {
    successful = false
    let oldStartChild = oldChildren[oldStartIndex]
    let startChild = children[startIndex]
    while (oldStartChild.key === startChild.key) {
      updateNode(oldStartChild, startChild, pathces, indexMap[oldStartChild])
      oldStartIndex++
      startIndex++
      if (oldStartIndex > oldEndIndex || startIndex > endIndex) {
        break outer
      }
      oldStartChild = oldChildren[oldStartIndex]
      startChild = children[startIndex]
      successful = true
    }
    let oldEndChild = oldChildren[oldEndIndex]
    let endChild = children[endIndex]
    while (oldEndChild.key === endChild.key) {
      updateNode(oldEndChild, endChild, pathces, indexMap[oldEndChild])
      oldEndIndex--
      endIndex--
      if (oldStartIndex > oldEndIndex || startIndex > endIndex) {
        break outer
      }
      oldEndChild = oldChildren[oldEndIndex]
      endChild = children[endIndex]
      successful = true
    }

    while (oldStartChild.key === endChild.key) {
      nextChild = endIndex + 1 < ChildrenLength ? children[endIndex + 1] : null
      updateNode(oldStartChild, endChild, pathces, indexMap[oldStartChild])
      // moveChild(endChild, nextChild)
      oldStartIndex++
      endIndex--
      if (oldStartIndex > oldEndIndex || startIndex > endIndex) {
        break outer
      }
      oldStartChild = oldChildren[oldStartIndex]
      endChild = children[endIndex]
      successful = true
    }
    while (oldEndChild.key === startChild.key) {
      nextChild =
        oldStartIndex < oldChildrenLength ? oldChildren[oldStartIndex] : null
      updateNode(oldEndChild, endChild, pathces, indexMap[oldEndChild])
      // moveChild(startChild, nextChild)
      oldEndIndex--
      startIndex++
      if (oldStartIndex > oldEndIndex || startIndex > endIndex) {
        break outer
      }
      oldEndChild = oldChildren[oldEndIndex]
      startChild = children[startIndex]
      successful = true
    }

  }
}

function getVNodeIndexMap(children, index, map) {
  const indexMap = map || new Map()
  for(let child of children) {
    index++
    indexMap.set(child, index)
    if (isArray(child.children)) {
      getVNodeIndexMap(child.children, index, indexMap)
    }
  }
  return indexMap
}

function moveChild(domNode, child, nextChild) {
  var domChild = child.dom
  if (nextChild) {
    domNode.insertBefore(domChild, domChild)
  } else {
    domNode.appendChild(domChild)
  }
}


/**
 *
 * @param {Array/Object} patch
 * @param {*} apply
 */
function appendPatch(patch, apply) {
  if (patch) {
    if (isArray(patch)) {
      patch.push(apply)
    } else {
      patch = [patch, apply]
    }

    return patch
  } else {
    return apply
  }
}
