import {
  // CREATE,
  // REMOVE,
  // REPLACE,
  // UPDATE,
  SET_PROP,
  REMOVE_PROP,
} from '../types'

import { isVNode, isVText, isArray } from '../utils/type'
/**
 *
 * @param {vdom} newNode
 * @param {vdom} oldNode
 */
export default function diff(newNode, oldNode) {
  const patches = []
  walk(newNode, oldNode, patches, 0)
  return patches
}

function walk(newNode, oldNode, patches, index) {
  if (newNode === oldNode) {
    return
  }

  let patch = patches[index]

  if (isVText(newNode) && isVText(oldNode)) {
    if (newNode.text !== oldNode.text) {
      patch = appendPatch(patch, createPatch(newNode, oldNode))
    }
  } else if (
    isVNode(newNode) &&
    isVNode(oldNode) &&
    newNode.tag === oldNode.tag
  ) {
    var propsPatch = diffProps(newNode.props, oldNode.props)
    if (propsPatch) {
      patch = appendPatch(patch, createPatch(newNode.props, propsPatch))
    }
    patch = diffChildren(newNode, oldNode, patches, patch, index)
  } else {
    patch = appendPatch(patch, createPatch(newNode, oldNode))
  }

  if (patch) {
    patches[index] = patch
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
        key,
        value: oldVal,
      })
    }

    if (oldNode === undefined || newVal !== oldVal) {
      patches.push({
        type: SET_PROP,
        key,
        value: newVal,
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

  const maxLen = Math.max(newNode.children.length, oldNode.children.length)

  for (let i = 0; i < maxLen; i++) {
    patches[i] = diff(newNode.children[i], oldNode.children[i])
  }

  return patches
}

function appendPatch(patch, changed) {
  if (patch) {
    if (isArray(patch)) {
      patch.push(changed)
    } else {
      return [patch, changed]
    }
  }
  return changed
}

function createPatch() {}
