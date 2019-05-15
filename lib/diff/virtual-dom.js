import { PATCH } from '../types'

import { isVNode, isVText, isArray } from '../utils/type'

const {
  INSERT,
  REMOVE,
  REPLACE,
  VTEXT,
  PROPS,
  SET_PROP,
  REMOVE_PROP,
} = PATCH

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
      type: INSERT,
      vNode: newNode
    })
  } else if (!newNode) {
    patch = appendPatch(patch, {
      type: REMOVE,
      vNode: null
    })
  } else if (isVNode(oldNode)) {
    if (isVNode(newNode)) {
      if (
        newNode.tag === oldNode.tag &&
        newNode.key === oldNode.key
      ) {
        // TODO: 相同节点的 diff
        const propsPatch = diffProps(newNode.props, oldNode.props)
        if (propsPatch) {
          patch = appendPatch(patch, {
            type: PROPS,
            patches: propsPatch
          })
        }
        patch = diffChildren(newNode, oldNode, patches, patch, index)
      }
    } else {
      patch = appendPatch(patch, {
        type: REPLACE,
        vNode: newNode
      })
    }
  } else if (isVText(oldNode)) {
    if (!isVNode(newNode)) {
      patch = appendPatch(patch, {
        type: REPLACE,
        vNode: newNode
      })
    } else if (newNode.text !== oldNode.text) {
      patch = appendPatch(patch, {
        type: VTEXT,
        vNode: newNode
      })
    }
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
function diffChildren(newNode, oldNode, patches, patch, index) {
  var newChildren = newNode.children
  var oldChildren = reorder(newChildren, oldNode.children)

  var newLen = newChildren.length
  var oldLen = oldChildren.length
  var len = newLen > oldLen ? newLen : oldLen

  for (var i = 0; i < len; i++) {
    var leftNode = newChildren[i]
    var rightNode = oldChildren[i]
    index += 1

    if (!leftNode) {
      if (rightNode) {
        // Excess nodes in b need to be added
        apply = appendPatch(apply,
          new VPatch(VPatch.INSERT, null, rightNode))
      }
    } else {
      walk(leftNode, rightNode, patch, index)
    }

    if (isVNode(leftNode) && leftNode.count) {
      index += leftNode.count
    }
  }

  if (oldChildren.moves) {
    // Reorder nodes last
    apply = appendPatch(apply, new VPatch(VPatch.ORDER, a, oldChildren.moves))
  }

  return apply
}

// List diff, naive left to right reordering
function reorder(newChildren, oldChildren) {

  var bKeys = keyIndex(oldChildren)

  if (!bKeys) {
    return oldChildren
  }

  var aKeys = keyIndex(newChildren)

  if (!aKeys) {
    return oldChildren
  }

  var bMatch = {}, aMatch = {}

  for (var aKey in bKeys) {
    bMatch[bKeys[aKey]] = aKeys[aKey]
  }

  for (var bKey in aKeys) {
    aMatch[aKeys[bKey]] = bKeys[bKey]
  }

  var aLen = newChildren.length
  var bLen = oldChildren.length
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
      shuffle[i] = oldChildren[move]
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