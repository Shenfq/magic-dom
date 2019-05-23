import { PATCH } from './types'
import render, { setProp } from './render'

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
 * @param {Element} parent
 * @param {Object} patches
 * @param {Number} index
 */
export default function patch(parent, patches, index = 0) {
  const indices = patchIndices(patches)
  if (!patches) return
  if (indices.length === 0) return

  const el = parent.childNodes[index]
  const { type, newNode } = patches
  let newEl = null


  for (var i = 0; i < indices.length; i++) {
    var nodeIndex = indices[i]
    rootNode = applyPatch(rootNode,
      index[nodeIndex],
      patches[nodeIndex],
      renderOptions)
  }

  return rootNode
}

function applyPatch(type, newNode) {
  switch (type) {
    case PATCH.CREATE:
      newEl = render(newNode)
      parent.appendChild(newEl)
      break
    case REMOVE:
      parent.removeChild(el)
      break
    case REPLACE:
      newEl = render(newNode)
      parent.replaceChild(newEl, el)
      break
    case UPDATE:
      const { props, children } = patches
      patchProps(el, props)
      children.forEach((child, idx) => {
        patch(el, child, idx)
      })
      break
    default:
      break
  }
}

/**
 *
 * @param {Element} element
 * @param {Object} patches
 */
function patchProps(element, patches) {
  patches.forEach(patch => {
    const { type, key, value } = patch

    switch (type) {
      case SET_PROP:
        setProp(element, key, value)
        break
      case REMOVE_PROP:
        removeProp(element, key)
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