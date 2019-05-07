import { isString, isNumber } from './utils/type'
/**
 * 
 * @param {*} tag 
 * @param {*} props 
 * @param  {...Array} children 
 */
export default function h(tag, props, ...children) {
  const childNodes = []
  
  children
  .reduce((arr, val) => arr.concat(val), [])
  .forEach(child => {
    if (isString(child) || isNumber(child)) {
      childNodes.push({
        type: 'vText',
        text: String(child)
      })
      return
    }
    childNodes.push(child)
  })

  return {
    type: 'vNode',
    tag,
    props: props || {},
    children: childNodes
  }
}
