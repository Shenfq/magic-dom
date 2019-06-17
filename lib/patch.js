import { PATCH } from './types'
import render, { setProp } from './render'
import { isArray } from './utils/type'

/**
 *
 * @param {Element} parentNode
 * @param {Object} patches
 * @param {Number} index
 */
export default function patch(rootNode, patches) {
  if (!patches) return
  const indices = patchIndices(patches)
  if (indices.length === 0) return
  const nodes = domIndex(rootNode, indices)
  for (let nodeIndex of indices) {
    applyPatch(nodes[nodeIndex], patches[nodeIndex])
  }
}

function applyPatch(node, patchList) {
  if (isArray(patchList)) {
    for (let patch of patchList) {
      patchOp(node, patch)
    }
  } else {
    patchOp(node, patchList)
  }
}

function patchOp(node, patch) {
  const { type, vNode } = patch
  const parentNode = node.parentNode
  let newNode = null
  switch (type) {
    case PATCH.INSERT:
      newNode = render(vNode)
      parentNode.appendChild(newNode)
      break
    case PATCH.REMOVE:
      parentNode.removeChild(node)
      break
    case PATCH.REPLACE:
      newNode = render(vNode)
      parentNode.replaceChild(newNode, node)
      break
    case PATCH.ORDER:
      reorderChildren(node, patch)
      break
    case PATCH.VTEXT:
      newNode = document.createTextNode(vNode.text)
      parentNode.replaceChild(newNode, node)
      break
    case PATCH.PROPS:
      const { patches } = patch
      patchProps(node, patches)
      break
    default:
      break
  }
}

function reorderChildren(rootNode, patch) {
  const { moves } = patch
  const { removes, inserts } = moves
  const childNodes = rootNode.childNodes
  const keyMap = {}
  let node

  for (let remove of removes) {
    node = childNodes[remove.from]
    // console.log('remove: ', remove.key, remove.from, node)
    if (node) {
      if (remove.key) {
        keyMap[remove.key] = node
      }
      rootNode.removeChild(node)
    }
  }

  var length = childNodes.length

  for (let insert of inserts) {
    node = keyMap[insert.key]
    // console.log('insert: ', insert.key, insert.to, node)
    if (node) {
      // this is the weirdest bug i've ever seen in webkit
      rootNode.insertBefore(
        node,
        insert.to >= length++ ? null : childNodes[insert.to]
      )
    }
  }
}
/**
 *
 * @param {Element} node
 * @param {Object} patches
 */
function patchProps(node, patches) {
  patches.forEach(patch => {
    const { type, key, value } = patch

    switch (type) {
      case PATCH.SET_PROP:
        setProp(node, key, value)
        break
      case PATCH.REMOVE_PROP:
        removeProp(node, key)
        break
      default:
        break
    }
  })
}

/**
 *
 * @param {Element} element
 * @param {String} key
 */
function removeProp(element, key) {
  element.removeAttribute(key === 'className' ? 'class' : key)
}

function patchIndices(patches) {
  const indices = []

  for (let key in patches) {
    indices.push(Number(key))
  }

  return indices
}

function domIndex(rootNode) {
  const nodes = [rootNode]

  const children = rootNode.childNodes

  if (children.length) {
    for (let child of children) {
      if (child.nodeType === 1 || child.nodeType === 3) {
        if (child.nodeType === 1) {
          nodes.push(...domIndex(child))
        } else if (child.nodeType === 3) {
          nodes.push(child)
        }
      }
    }
  }

  return nodes
}
