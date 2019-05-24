import { PATCH } from '../types'

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

  if (!oldNode) {
    patch = appendPatch(patch, {
      type: PATCH.INSERT,
      vNode: newNode
    })
  } else if (!newNode) {
    patch = appendPatch(patch, {
      type: PATCH.REMOVE,
      vNode: null
    })
  } else if (isVNode(newNode)) {
    if (isVNode(oldNode)) {
      if (
        newNode.tag === oldNode.tag &&
        newNode.key === oldNode.key
      ) {
        // TODO: 相同节点的 diff
        const propsPatch = diffProps(newNode.props, oldNode.props)
        if (propsPatch) {
          patch = appendPatch(patch, {
            type: PATCH.PROPS,
            patches: propsPatch
          })
        }
        patch = diffChildren(newNode, oldNode, patches, patch, index)
      }
    } else {
      patch = appendPatch(patch, {
        type: PATCH.REPLACE,
        vNode: newNode
      })
    }
  } else if (isVText(newNode)) {
    if (!isVText(oldNode)) {
      patch = appendPatch(patch, {
        type: PATCH.VTEXT,
        vNode: newNode
      })
    } else if (newNode.text !== oldNode.text) {
      patch = appendPatch(patch, {
        type: PATCH.VTEXT,
        vNode: newNode
      })
    }
  }

  if (patch) {
    patches[index] = patch
  }
}

function diffProps(newProps, oldProps) {
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

    if (oldNode === undefined || newVal !== oldVal) {
      patches.push({
        type: PATCH.SET_PROP,
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
function diffChildren(newNode, oldNode, patches, patch, index) {
  const oldChildren = oldNode.children
  const newChildren = sortChildren(newNode.children, oldChildren)

  const oldLen = oldChildren.length
  const newLen = newChildren.length
  const len = oldLen > newLen ? oldLen : newLen

  for (let i = 0; i < len; i++) {
    var leftNode = oldChildren[i]
    var rightNode = newChildren[i]
    index += 1

    if (!leftNode) {
      if (rightNode) {
        // Excess nodes in b need to be added
        patch = appendPatch(patch, {
          type: PATCH.INSERT,
          vNode: rightNode
        })
      }
    } else {
      walk(leftNode, rightNode, patches, index)
    }

    if (isVNode(leftNode) && leftNode.count) {
      index += leftNode.count
    }
  }

  if (oldChildren.moves) {
    // Reorder nodes last
    patch = appendPatch(patch, {
      type: PATCH.ORDER,
      moves: newChildren.moves
    })
  }

  return apply
}

// List diff, naive left to right reordering
function sortChildren(newChildren, oldChildren) {

  var bKeys = keyIndex(newChildren)

  if (!bKeys) {
    return newChildren
  }

  var aKeys = keyIndex(oldChildren)

  if (!aKeys) {
    return newChildren
  }

  var bMatch = {}, aMatch = {}

  for (var aKey in bKeys) {
    bMatch[bKeys[aKey]] = aKeys[aKey]
  }

  for (var bKey in aKeys) {
    aMatch[aKeys[bKey]] = bKeys[bKey]
  }

  var aLen = oldChildren.length
  var bLen = newChildren.length
  var len = aLen > bLen ? aLen : bLen
  var shuffle = []
  var freeIndex = 0
  var i = 0
  var moveIndex = 0
  var moves = {}
  var removes = moves.removes = {}
  var reverse = moves.reverse = {}
  var hasMoves = false

  while (freeIndex < len) {
    var move = aMatch[i]
    if (move !== undefined) {
      shuffle[i] = newChildren[move]
      if (move !== moveIndex) {
        moves[move] = moveIndex
        reverse[moveIndex] = move
        hasMoves = true
      }
      moveIndex++
    } else if (i in aMatch) {
      shuffle[i] = undefined
      removes[i] = moveIndex++
      hasMoves = true
    } else {
      while (bMatch[freeIndex] !== undefined) {
        freeIndex++
      }

      if (freeIndex < len) {
        var freeChild = oldChildren[freeIndex]
        if (freeChild) {
          shuffle[i] = freeChild
          if (freeIndex !== moveIndex) {
            hasMoves = true
            moves[freeIndex] = moveIndex
            reverse[moveIndex] = freeIndex
          }
          moveIndex++
        }
        freeIndex++
      }
    }
    i++
  }

  if (hasMoves) {
    shuffle.moves = moves
  }

  return shuffle
}

function keyIndex(children) {
  var i, keys

  for (i = 0; i < children.length; i++) {
    var child = children[i]

    if (child.key !== undefined) {
      keys = keys || {}
      keys[child.key] = i
    }
  }

  return keys
}