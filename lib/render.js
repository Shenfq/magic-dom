import { isVText } from './utils/type'

/**
 *
 * @param {vdom} vdom
 */
export default function render(vdom) {
  if (isVText(vdom)) {
    return document.createTextNode(vdom.text)
  }

  const { tag, props, children } = vdom
  const element = document.createElement(tag)
  setProps(element, props)

  children.map(render).forEach(element.appendChild.bind(element))

  return element
}

/**
 *
 * @param {Element} element
 * @param {Object} props
 */
export function setProps(element, props) {
  Object.entries(props).forEach(([key, value]) => {
    setProp(element, key, value)
  })
}

/**
 *
 * @param {Element} element
 * @param {String} key
 * @param {String/Number} vlaue
 */
export function setProp(element, key, vlaue) {
  element.setAttribute(key === 'className' ? 'class' : key, vlaue)
}
