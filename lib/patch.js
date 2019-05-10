import { CREATE, REMOVE, REPLACE, UPDATE, SET_PROP, REMOVE_PROP } from './types'

import render, { setProp } from './render'
/**
 *
 * @param {Element} parent
 * @param {Object} patches
 * @param {Number} index
 */
export default function patch(parent, patches, index = 0) {
  if (!patches) return
  const el = parent.childNodes[index]
  const { type, newNode } = patches
  let newEl = null
  switch (type) {
    case CREATE:
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
