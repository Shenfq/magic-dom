import { isString, isNumber } from './utils/type'
/**
 *
 * @param {*} tag
 * @param {*} properties
 * @param  {...Array} children
 */
export default function h(tag, properties, ...children) {
  const childNodes = []
  const props = properties || {}
  let key = null

  children
    .reduce((arr, val) => arr.concat(val), [])
    .forEach(child => {
      if (isString(child) || isNumber(child)) {
        childNodes.push({
          type: 'VText',
          text: String(child),
        })
        return
      }
      childNodes.push(child)
    })

  // 虚拟 DOM 添加 key 属性
  if (props.hasOwnProperty('key')) {
    key = props.key.toString()
    delete props.key
  }

  return {
    type: 'VNode',
    tag,
    key,
    props: props || {},
    children: childNodes,
  }
}
