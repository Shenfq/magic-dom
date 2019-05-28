import { PATCH } from '../types'

import { isVNode, isVText, isArray } from '../utils/type'

/**
 *
 * @param {vdom} newNode
 * @param {vdom} oldNode
 */
export default function diff(oldNode, newNode) {
  const patches = []
  walk(oldNode, newNode, patches, 0)
  return patches
}

function walk(oldNode, newNode, patches, index) {
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
        patch = diffChildren(oldNode, newNode, patches, patch, index)
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
 * 子节点对比
 * @param {vdom} oldNode
 * @param {vdom} newNode
 * @param {Array} patches
 * @param {Object} patch
 * @param {Number} index
 */
function diffChildren(oldNode, newNode, patches, patch, index) {
  const oldChildren = oldNode.children
  // 新节点重新排序
  const sortedSet = sortChildren(oldChildren, newNode.children)
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
        // 新节点进行插入操作
        patch = appendPatch(patch, {
          type: PATCH.INSERT,
          vNode: rightNode,
        })
      }
    } else {
      // 相同节点进行比对
      walk(leftNode, rightNode, patches, index)
    }
  }

  if (sortedSet.moves) {
    // 最后进行重新排序
    patch = appendPatch(patch, {
      type: PATCH.ORDER,
      moves: sortedSet.moves,
    })
  }

  return patch
}

/**
 * 子节点顺序对比，key值相同的子节点只进行顺序调整
 * @param {Array} oldChildren 变化前的子节点
 * @param {Array} newChildren 变化后的子节点
 */
function sortChildren(oldChildren, newChildren) {
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

  // 遍历变化前的子节点，对比变化后子节点的 key 值
  // 并按照对应顺序将变化后子节点的索引放入 shuffle 数组中
  for (let i = 0; i < oldChildren.length; i++) {
    const oldItem = oldChildren[i]
    let itemIndex

    if (oldItem.key) {
      if (newKeys.hasOwnProperty(oldItem.key)) {
        // 匹配到变化前节点中存在的 key
        itemIndex = newKeys[oldItem.key]
        shuffle.push(newChildren[itemIndex])
      } else {
        // 移除变化后节点不存在的 key 值
        deletedItems++
        shuffle.push(null)
      }
    } else {
      if (freeIndex < freeCount) {
        // 匹配变化前后的无 key 子节点
        itemIndex = newFree[freeIndex++]
        shuffle.push(newChildren[itemIndex])
      } else {
        // 如果变化后子节点中已经不存在无 key 项
        // 变化前的无 key 项也是多余项，故删除
        deletedItems++
        shuffle.push(null)
      }
    }
  }

  const lastFreeIndex =
    freeIndex >= newFree.length ? newChildren.length : newFree[freeIndex]

  // 遍历变化后的子节点，将所有之前不存在的 key 对应的子节点放入 shuffle 数组中
  for (let j = 0; j < newChildren.length; j++) {
    const newItem = newChildren[j]
    if (newItem.key) {
      if (!oldKeys.hasOwnProperty(newItem.key)) {
        // 添加所有新的 key 值对应的子节点
        // 之后还会重新排序，我们会在适当的地方插入新增节点
        shuffle.push(newItem)
      }
    } else if (j >= lastFreeIndex) {
      // 添加剩余的无 key 子节点
      shuffle.push(newItem)
    }
  }

  const simulate = shuffle.slice()
  const removes = []
  const inserts = []
  let simulateIndex = 0
  let simulateItem
  let wantedItem

  for (let k = 0; k < newChildren.length; ) {
    wantedItem = newChildren[k] // 期待元素: 表示变化后 k 的子节点
    simulateItem = simulate[simulateIndex] // 模拟元素: 表示变化前 k 位置的子节点

    // 删除在变化后不存在的子节点
    while (simulateItem === null && simulate.length) {
      removes.push(remove(simulate, simulateIndex, null))
      simulateItem = simulate[simulateIndex]
    }

    if (!simulateItem || simulateItem.key !== wantedItem.key) {
      // 期待元素的 key 值存在
      if (wantedItem.key) {
        if (simulateItem && simulateItem.key) {
          // 如果一个带 key 的子元素没有在合适的位置，则进行移动
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
      // 该位置期待元素的 key 值不存在，且模拟元素存在 key 值
      else if (simulateItem && simulateItem.key) {
        // 变化前该位置的元素
        removes.push(remove(simulate, simulateIndex, simulateItem.key))
      }
    } else {
      // 如果期待元素和模拟元素 key 值相等，跳到下一个子节点比对
      simulateIndex++
      k++
    }
  }

  // 移除所有的模拟元素
  while (simulateIndex < simulate.length) {
    simulateItem = simulate[simulateIndex]
    removes.push(
      remove(simulate, simulateIndex, simulateItem && simulateItem.key)
    )
  }

  // 如果只有删除选项中有值
  // 将操作直接交个 delete patch
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
  arr.splice(index, 1) // 移除数组中指定元素

  return {
    from: index,
    key: key,
  }
}
/**
 * 
 * @param {Array} children 子节点
 */
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
