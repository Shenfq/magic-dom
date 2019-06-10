import { isVNode, isVText } from '../utils/type'
import { setProp } from './render'

export default function diff(oldNode, newNode) {
  return updateNode(oldNode.dom.parentNode, oldNode, newNode)
}

function updateNode(domParent, oldNode, node) {
  if (node === oldNode) {
    return
  }
  const tag = node.tag
  const domNode = oldNode.dom
  if (oldNode.tag !== tag) {
    createNode(domParent, node)
  } else {
    const oldChildren = oldNode.children
    const children = node.children
    if (children !== oldChildren) {
      updateChildren(domNode, oldChildren, children)
    }

    const oldProps = oldNode.props
    const props = node.props
    if (props !== oldProps) {
      updateAttributes(domNode, props, oldProps)
    }
  }
}

function createNode(domParent, node) {
  const children = node.children
  const props = node.props

  let domNode

  if (isVNode(node)) {
    domNode = document.createElement(node.tag)
    if (children.length === 1 && isVText(children)) {
      setTextContent(domNode, children[0])
    } else {
      createAllChildren(domNode, children)
    }

    if (props) {
      updateAttributes(domNode, props)
    }
  } else if (isVText(node)) {
    domNode = document.createTextNode(node.text)
  }

  if (domParent && domNode) {
    node.dom = domNode
    insertChild(domParent, domNode)
  }
}

function setTextContent(domNode, vText) {
  const { text } = vText
  domNode.innerText = text
}

function createAllChildren(domNode, children) {
  for (let child of children) {
    createNode(domNode, child)
  }
}

function removeAllChildren(domNode, children) {
  for (let child of children) {
    const domChild = child.dom
    domChild && domNode.removeChild(domChild)
  }
}

function insertChild(domParent, domNode) {
  domParent.appendChild(domNode)
}

function updateAttributes(domNode, props) {
  Object.entries(props).forEach(([key, value]) => {
    setProp(domNode, key, value)
  })
}

function updateChildren(domNode, oldChildren, children) {
  const oldChildrenLength = oldChildren.length
  if (oldChildrenLength === 0) {
    createAllChildren(domNode, children)
    return
  }
  const ChildrenLength = children.length
  if (ChildrenLength === 0) {
    removeAllChildren(domNode, children)
  }

  let oldEndIndex = oldChildrenLength - 1
  let endIndex = ChildrenLength - 1
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
      updateNode(domNode, oldStartChild, startChild)
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
      updateNode(domNode, oldEndChild, endChild)
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
      updateNode(domNode, oldEndChild, endChild)
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
      updateNode(domNode, oldEndChild, endChild)
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
}

function moveChild(domNode, child, nextChild) {
  var domChild = child.dom
  if (nextChild) {
    domNode.insertBefore(domChild, domChild)
  } else {
    domNode.appendChild(domChild)
  }
}
