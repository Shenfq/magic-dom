/**
 * 
 * @param {*} tag 
 * @param {*} props 
 * @param  {...Array} children 
 */
export default function h(tag, props, ...children) {
  return {
    tag,
    props: props || {},
    children: children.reduce((arr, val) => arr.concat(val), [])
  }
}
