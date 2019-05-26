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
    // 旧节点不存在，直接插入
    patch = appendPatch(patch, {
      type: PATCH.INSERT,
      vNode: newNode,
    })
  } else if (!newNode) {
    // 新节点不存在，删除旧节点
    patch = appendPatch(patch, {
      type: PATCH.REMOVE,
      vNode: null,
    })
  } else if (isVNode(newNode)) {
    if (isVNode(oldNode)) {
      if (newNode.tag === oldNode.tag && newNode.key === oldNode.key) {
        // 相同类型节点的 diff
        const propsPatch = diffProps(newNode.props, oldNode.props)
        if (propsPatch && propsPatch.length > 0) {
          patch = appendPatch(patch, {
            type: PATCH.PROPS,
            patches: propsPatch,
          })
        }
        patch = diffChildren(newNode, oldNode, patches, patch, index)
      }
    } else {
      // 新节点替换旧节点
      patch = appendPatch(patch, {
        type: PATCH.REPLACE,
        vNode: newNode,
      })
    }
  } else if (isVText(newNode)) {
    if (!isVText(oldNode)) {
      patch = appendPatch(patch, {
        type: PATCH.VTEXT,
        vNode: newNode,
      })
    } else if (newNode.text !== oldNode.text) {
      // 替换文本
      patch = appendPatch(patch, {
        type: PATCH.VTEXT,
        vNode: newNode,
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

/**
 *
 * @param {vdom} newNode
 * @param {vdom} oldNode
 * @param {Array} patches
 * @param {Object} patch
 * @param {Number} index
 */
function diffChildren(newNode, oldNode, patches, patch, index) {
  const oldChildren = oldNode.children
  // 新节点重新排序
  const sortedSet = sortChildren(newNode.children, oldChildren)
  const newChildren = sortedSet.children

  const oldLen = oldChildren.length
  const newLen = newChildren.length
  const len = oldLen > newLen ? oldLen : newLen

  for (let i = 0; i < len; i++) {
    var leftNode = oldChildren[i]
    var rightNode = newChildren[i]
    index++

    if (!leftNode) {
      if (rightNode) {
        // Excess nodes in b need to be added
        patch = appendPatch(patch, {
          type: PATCH.INSERT,
          vNode: rightNode,
        })
      }
    } else {
      walk(leftNode, rightNode, patches, index)
    }
  }

  if (sortedSet.moves) {
    // Reorder nodes last
    patch = appendPatch(patch, {
      type: PATCH.ORDER,
      moves: sortedSet.moves,
    })
  }

  return patch
}

/**
 * 子节点顺序对比，key值相同的子节点只进行顺序调整
 * @param {Array} newChildren 变化后的子节点
 * @param {Array} oldChildren 变化前的子节点
 */
function sortChildren(newChildren, oldChildren) {
  // 找出变化后的子节点中带 key 的 vdom (keys)，和不带 key 的 vdom (free)
  const newChildIndex = keyIndex(newChildren)
  const newKeys = newChildIndex.keys
  const newFree = newChildIndex.free

  // 所有子节点无 key 不进行对比
  if (newFree.length === newChildren.length) {
    return {
      children: newChildren,
      moves: null,
    }
  }

  // 找出变化前的子节点中带 key 的 vdom (keys)，和不带 key 的 vdom (free)
  const oldChildIndex = keyIndex(oldChildren)
  const oldKeys = oldChildIndex.keys
  const oldFree = oldChildIndex.free

  // 所有子节点无 key 不进行对比
  if (oldFree.length === oldChildren.length) {
    return {
      children: newChildren,
      moves: null,
    }
  }

  // O(MAX(N, M)) memory
  const shuffle = []

  const freeCount = newFree.length
  let freeIndex = 0
  let deletedItems = 0

  // 遍历变化前的子节点，并找出变化后依然存在的
  // O(N) time,
  for (let i = 0; i < oldChildren.length; i++) {
    const oldItem = oldChildren[i]
    let itemIndex

    if (oldItem.key) {
      if (newKeys.hasOwnProperty(oldItem.key)) {
        // 匹配到变化前节点中存在的 key
        itemIndex = newKeys[oldItem.key]
        shuffle.push(newChildren[itemIndex])
      } else {
        // Remove old keyed items
        itemIndex = i - deletedItems++
        shuffle.push(null)
      }
    } else {
      // Match the item in a with the next free item in b
      if (freeIndex < freeCount) {
        itemIndex = newFree[freeIndex++]
        shuffle.push(newChildren[itemIndex])
      } else {
        // There are no free items in b to match with
        // the free items in a, so the extra free nodes
        // are deleted.
        itemIndex = i - deletedItems++
        shuffle.push(null)
      }
    }
  }

  const lastFreeIndex =
    freeIndex >= newFree.length ? newChildren.length : newFree[freeIndex]

  // Iterate through b and append any new keys
  // O(M) time
  for (let j = 0; j < newChildren.length; j++) {
    const newItem = newChildren[j]

    if (newItem.key) {
      if (!oldKeys.hasOwnProperty(newItem.key)) {
        // Add any new keyed items
        // We are adding new items to the end and then sorting them
        // in place. In future we should insert new items in place.
        shuffle.push(newItem)
      }
    } else if (j >= lastFreeIndex) {
      // Add any leftover non-keyed items
      shuffle.push(newItem)
    }
  }

  const simulate = shuffle.slice()
  const removes = []
  const inserts = []
  let simulateIndex = 0
  let simulateItem

  for (let k = 0; k < newChildren.length; ) {
    const wantedItem = newChildren[k]
    simulateItem = simulate[simulateIndex]

    // remove items
    while (simulateItem === null && simulate.length) {
      removes.push(remove(simulate, simulateIndex, null))
      simulateItem = simulate[simulateIndex]
    }

    if (!simulateItem || simulateItem.key !== wantedItem.key) {
      // if we need a key in this position...
      if (wantedItem.key) {
        if (simulateItem && simulateItem.key) {
          // if an insert doesn't put this key in place, it needs to move
          if (newKeys[simulateItem.key] !== k + 1) {
            removes.push(remove(simulate, simulateIndex, simulateItem.key))
            simulateItem = simulate[simulateIndex]
            // if the remove didn't put the wanted item in place, we need to insert it
            if (!simulateItem || simulateItem.key !== wantedItem.key) {
              inserts.push({ key: wantedItem.key, to: k })
            }
            // items are matching, so skip ahead
            else {
              simulateIndex++
            }
          } else {
            inserts.push({ key: wantedItem.key, to: k })
          }
        } else {
          inserts.push({ key: wantedItem.key, to: k })
        }
        k++
      }
      // a key in simulate has no matching wanted key, remove it
      else if (simulateItem && simulateItem.key) {
        removes.push(remove(simulate, simulateIndex, simulateItem.key))
      }
    } else {
      simulateIndex++
      k++
    }
  }

  // remove all the remaining nodes from simulate
  while (simulateIndex < simulate.length) {
    simulateItem = simulate[simulateIndex]
    removes.push(
      remove(simulate, simulateIndex, simulateItem && simulateItem.key)
    )
  }

  // If the only moves we have are deletes then we can just
  // let the delete patch remove these items.
  if (removes.length === deletedItems && !inserts.length) {
    return {
      children: shuffle,
      moves: null,
    }
  }

  return {
    children: shuffle,
    moves: {
      removes: removes,
      inserts: inserts,
    },
  }
}

function remove(arr, index, key) {
  arr.splice(index, 1)

  return {
    from: index,
    key: key,
  }
}

function keyIndex(children) {
  const keys = {}
  const free = []
  const length = children.length

  for (let i = 0; i < length; i++) {
    const child = children[i]

    if (child.key) {
      keys[child.key] = i
    } else {
      free.push(i)
    }
  }

  return {
    keys: keys, // 子节点中所有存在的 key 对应的索引
    free: free, // 子节点中不存在 key 值的索引
  }
}

/**
 *
 * @param {*} patch
 * @param {Array/Object} patches
 */
function appendPatch(patch, patches) {
  if (patch) {
    if (isArray(patches)) {
      patches.push(patch)
    } else {
      patches = [patch, patches]
    }

    return patches
  } else {
    return patches
  }
}
