import {
  CREATE,
  REMOVE,
  REPLACE,
  UPDATE,
  SET_PROP,
  REMOVE_PROP,
} from './types'

/**
 * 
 * @param {vdom} newNode 
 * @param {vdom} oldNode 
 */
export default function diff(newNode, oldNode) {
  if (oldNode === undefined) {
    return { type: CREATE, newNode }
  }

  if (newNode === undefined) {
    return { type: REMOVE }
  }

  if (changed(newNode, oldNode)) {
    return { type: REPLACE, newNode }
  }

  if (newNode.tag) {
    return {
      type: UPDATE,
      props: diffProps(newNode, oldNode),
      children: diffChildren(newNode, oldNode)
    }
  }
}

function diffProps(newNode, oldNode) {
  const patches = []
  const props = Object.assign({}, newNode.props, oldNode.props)

  Object.keys(props).forEach(key => {
    const newVal = newNode.props[key]
    const oldVal = oldNode.props[key]

    if (!newVal) {
      patches.push({
        type: REMOVE_PROP,
        key, value: oldVal
      })
    }

    if (oldNode === undefined || newVal != oldVal) {
      patches.push({
        type: SET_PROP,
        key, value: newVal
      })
    }
  })

  return patches
}

/**
 * 
 * @param {vdom} newNode
 * @param {vdom} oldNode
 */
function diffChildren(newNode, oldNode) {
  const patches = []

  const maxLen = Math.max(
    newNode.children.length,
    oldNode.children.length
  )

  for (let i = 0; i < maxLen; i++) {
    patches[i] = diff(
      newNode.children[i],
      oldNode.children[i]
    )
  }

  return patches
}

/**
 * 
 * @param {vdom} newNode 
 * @param {vdom} oldNode
 */
function changed(newNode, oldNode) {
  return typeof (newNode) !== typeof (oldNode) ||
    newNode.type !== oldNode.type ||
    (
      (
        typeof (newNode) === 'string' ||
        typeof (newNode) === 'number'
      ) &&
      newNode !== oldNode
    )
}