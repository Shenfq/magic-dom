import { isVNode, isVText } from '../utils/type'

export default function diff(oldNode, newNode) {
  updateNode(oldNode, newNode, oldNode.dom.parentNode)
}

/**
 * cito 的 diff 算法
 * @param {vdom} oldNode 
 * @param {vdom} node 
 * @param {Element} domParent 
 */
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

/**
 * 通过虚拟 DOM 构造真实 DOM
 * @param {vdom} node 
 * @param {Element} domParent 
 * @param {Element|null} nextChild 
 * @param {Boolean} replace 
 */
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
/**
 * 将所有子节点构造成真实 DOM
 * @param {Element} domNode 
 * @param {Array} children 
 */
function createAllchildren(domNode, children) {
  for (let child of children) {
    createNode(child, domNode)
  }
}

/**
 * 移除所有子节点
 * @param {Element} domNode 
 * @param {Array} children
 */
function removeAllChildren(domNode, children) {
  removeChildren(domNode, children, 0, children.length)
}

/**
 * 移除指定区间的子节点
 * @param {Element} domNode
 * @param {Array} children
 * @param {Number} i   start
 * @param {Number} to  end
 */
function removeChildren(domNode, children, i, to) {
  for (; i < to; i++) {
    domNode.removeChild(children[i].dom)
  }
}

/**
 * 指定位置插入元素
 * @param {Element} domParent
 * @param {Element} domNode
 * @param {Element|null} nextChild
 * @param {Boolean} replace 
 */
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

/**
 * 元素所有子节点替换为指定文本
 * @param {Element} domNode 
 * @param {String} text 
 */
function setTextContent(domNode, text) {
  if (text) {
    domNode.innerText = text
  } else {
    while (domNode.firstChild) {
      domNode.removeChild(domNode.firstChild)
    }
  }
}

/**
 * 根据虚拟 DOM 移动真实 DOM
 * @param {Element} domNode 
 * @param {vdom} child 
 * @param {vdom} nextChild 
 */
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

/**
 * 更新元素属性
 * @param {Element} domNode 
 * @param {Object} newProps 
 * @param {Object|null} oldProps 
 */
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

/**
 * 采用两端对比的方式更新子节点
 * @param {Element} domNode 
 * @param {vdom} node 
 * @param {Array} oldChildren 
 * @param {Array} children
 */
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
  // 两端对比
  outer: while (
    successful &&
    oldStartIndex <= oldEndIndex &&
    startIndex <= endIndex
  ) {
    successful = false
    let oldStartChild = oldChildren[oldStartIndex]
    let startChild = children[startIndex]
    // oldStart <=> start
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
    // oldEnd <=> end
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
    // oldStart <=> end
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
    // oldEnd <=> start
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

  // 如果旧节点全部对比完，插入剩余的新节点
  if (oldStartIndex > oldEndIndex) {
    nextChild = endIndex + 1 < childrenLength ? children[endIndex + 1] : null
    for (let i = startIndex; i <= endIndex; i++) {
      createNode(children[i], domNode, nextChild)
    }
  } 
  // 如果新节点全部对比完，删除剩余的旧节点
  else if (startIndex > endIndex) {
    removeChildren(domNode, oldChildren, oldStartIndex, oldEndIndex + 1)
  } 
  // 新旧节点都还有剩余
  else {
    let i, oldChild, nextChild, child
    let oldNextChild = oldChildren[oldEndIndex + 1]
    // 构造旧节点的 map 表 { key => vdom }
    const oldChildrenMap = {}
    for (i = oldEndIndex; i >= oldStartIndex; i--) {
      oldChild = oldChildren[i]
      oldChild.next = oldNextChild
      oldChildrenMap[oldChild.key] = oldChild
      oldNextChild = oldChild
    }
    nextChild = endIndex + 1 < childrenLength ? children[endIndex + 1] : null
    /**
     * 遍历剩余的新节点
     * 1. 如果 key 值在旧节点 map 表存在，进行对比并移动旧节点到指定位置
     * 2. 如果 key 值在旧节点 map 表不存在，插入新节点到指定位置
     */
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
    // 删除新节点中不存在的旧节点
    for (i = oldStartIndex; i <= oldEndIndex; i++) {
      oldChild = oldChildren[i]
      if (oldChildrenMap[oldChild.key] !== null) {
        domNode.removeChild(oldChild.dom)
      }
    }
  }
}
