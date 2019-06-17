import { isVNode, isVText } from '../utils/type'

export default function diff(oldNode, newNode) {
  updateNode(oldNode, newNode, oldNode.dom.parentNode)
}

function updateNode(oldNode, node, domParent) {
  if (node === oldNode) {
    return
  }

  const tag = node.tag

  if (oldNode.tag !== tag) {
    // 标签不一致，创建新节点
    createNode(node, domParent, oldNode, true)
  } else {
    const oldChildren = oldNode.children
    const children = node.children
    const domNode = oldNode.dom
    node.dom = domNode
    // 子节点对比
    if (children !== oldChildren) {
      updateChildren(domNode, node, oldChildren, children)
    }

    const oldProps = oldNode.props
    const props = node.props
    // 属性对比
    if (props !== oldProps) {
      updateAttributes(domNode, props, oldProps)
    }
  }
}

function createNode(node, domParent, nextChild, replace) {
  let domNode
  if (isVNode(node)) {
    const children = node.children
    const props = node.props
    domNode = document.createElement(node.tag)
    node.dom = domNode
    if (children.length > 0) {
      createAllchildren(domNode, children)
    }
    if (props) {
      updateAttributes(domNode, props)
    }
  } else if (isVText(node)) {
    domNode = document.createTextNode(node.text)
    node.dom = domNode
  }

  if (domParent && domNode) {
    insertChild(domParent, domNode, nextChild, replace)
  }
}

function createAllchildren(domNode, children) {
  for (let child of children) {
    createNode(child, domNode)
  }
}

function removeAllChildren(domNode, children) {
  removeChildren(domNode, children, 0, children.length)
}

function removeChildren(domNode, children, i, to) {
  for (; i < to; i++) {
    domNode.removeChild(children[i].dom)
  }
}

function insertChild(domParent, domNode, nextChild, replace) {
  if (nextChild) {
    var domNextChild = nextChild.dom
    if (replace) {
      domParent.replaceChild(domNode, domNextChild)
    } else {
      domParent.insertBefore(domNode, domNextChild)
    }
  } else {
    domParent.appendChild(domNode)
  }
}

function setTextContent(domNode, text) {
  if (text) {
    domNode.innerText = text
  } else {
    while (domNode.firstChild) {
      domNode.removeChild(domNode.firstChild)
    }
  }
}

function moveChild(domNode, child, nextChild) {
  const domRefChild = nextChild && nextChild.dom
  let domChild = child.dom
  if (domChild !== domRefChild) {
    if (domRefChild) {
      domNode.insertBefore(domChild, domRefChild)
    } else {
      domNode.appendChild(domChild)
    }
  }
}

function updateAttributes(domNode, newProps, oldProps) {
  const patches = []
  const props = Object.assign({}, newProps, oldProps)

  Object.keys(props).forEach(key => {
    const newVal = newProps[key]
    const oldVal = oldProps[key]
    if (!newVal) {
      domNode.removeAttribute(key === 'className' ? 'class' : key)
    }
    if (oldVal === undefined || newVal !== oldVal) {
      domNode.setAttribute(key === 'className' ? 'class' : key, newVal)
    }
  })

  return patches
}

function updateChildren(domNode, node, oldChildren, children) {
  const oldChildrenLength = oldChildren.length
  // 如果没有旧子节点，插入新的节点
  if (oldChildrenLength === 0) {
    createAllchildren(domNode, children)
    return
  }
  const childrenLength = children.length
  // 如果没有新子节点，删除旧的节点
  if (childrenLength === 0) {
    removeAllChildren(domNode, oldChildren)
    return
  } else if (childrenLength < 2) {
    // 处理一个子节点的情况
    const child = children[0]
    if (isVText(child)) {
      const { text } = child
      if (childrenLength === oldChildrenLength) {
        const oldChild = oldChildren[0]
        if (text === oldChild.text) {
          return
        } else {
          domNode.firstChild.nodeValue = text
          return
        }
      }
      setTextContent(domNode, text)
    } else if (oldChildrenLength < 2) {
      const oldChild = oldChildren[0]
      const child = children[0]
      updateNode(oldChild, child, domNode)
      return
    }
  }

  let oldEndIndex = oldChildrenLength - 1
  let endIndex = childrenLength - 1
  let oldStartIndex = 0
  let startIndex = 0
  let successful = true
  let nextChild

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
      updateNode(oldStartChild, startChild, domNode)
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
      updateNode(oldEndChild, endChild, domNode)
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
      nextChild = endIndex + 1 < childrenLength ? children[endIndex + 1] : null
      updateNode(oldStartChild, endChild, domNode)
      moveChild(domNode, endChild, nextChild)
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
      updateNode(oldEndChild, startChild, domNode)
      moveChild(domNode, startChild, nextChild)
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

  if (oldStartIndex > oldEndIndex) {
    nextChild = endIndex + 1 < childrenLength ? children[endIndex + 1] : null
    for (let i = startIndex; i <= endIndex; i++) {
      createNode(children[i], domNode, nextChild)
    }
  } else if (startIndex > endIndex) {
    removeChildren(domNode, oldChildren, oldStartIndex, oldEndIndex + 1)
  } else {
    let i, oldChild, nextChild, child
    let oldNextChild = oldChildren[oldEndIndex + 1]
    const oldChildrenMap = {}
    for (i = oldEndIndex; i >= oldStartIndex; i--) {
      oldChild = oldChildren[i]
      oldChild.next = oldNextChild
      oldChildrenMap[oldChild.key] = oldChild
      oldNextChild = oldChild
    }
    nextChild = endIndex + 1 < childrenLength ? children[endIndex + 1] : null
    for (i = endIndex; i >= startIndex; i--) {
      child = children[i]
      const key = child.key
      oldChild = oldChildrenMap[key]
      if (oldChild) {
        oldChildrenMap[key] = null
        oldNextChild = oldChild.next
        updateNode(oldChild, child, domNode)

        if (domNode.nextSibling !== (nextChild && nextChild.dom)) {
          moveChild(domNode, child, nextChild)
        }
      } else {
        createNode(child, domNode, nextChild)
      }
      nextChild = child
    }
    for (i = oldStartIndex; i <= oldEndIndex; i++) {
      oldChild = oldChildren[i]
      if (oldChildrenMap[oldChild.key] !== null) {
        domNode.removeChild(oldChild.dom)
      }
    }
  }
}
