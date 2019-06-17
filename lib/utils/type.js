export function isType(type) {
  return function(obj) {
    return {}.toString.call(obj) === '[object ' + type + ']'
  }
}

export const isString = isType('String')
export const isNumber = isType('Number')
export const isArray = Array.isArray
export const isObject = isType('Object')
export const isFunction = isType('Function')

export function isVNode(vdom) {
  return vdom && vdom.type === 'VNode'
}
export function isVText(vdom) {
  return vdom && vdom.type === 'VText'
}
