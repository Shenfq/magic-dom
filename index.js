const CREATE = 'CREATE'   //新增一个节点
const REMOVE = 'REMOVE'   //删除原节点
const REPLACE = 'REPLACE'  //替换原节点
const UPDATE = 'UPDATE'    //检查属性或子节点是否有变化
const SET_PROP = 'SET_PROP'  //新增或替换属性
const REMOVE_PROP = 'REMOVE PROP'  //删除属性

/**
 * 
 * @param {*} tag 
 * @param {*} props 
 * @param  {Array} children 
 */
function h(tag, props, ...children) {
  return {
    tag,
    props: props || {},
    children: children.flat()
  }
}

/**
 * 
 * @param {Object} vdom 
 */
function render (vdom) {
  if (typeof vdom === 'string' || typeof vdom === 'number') {
    return document.createTextNode(vdom)
  }

  const { tag, props, children } = vdom
  const element = document.createElement(tag)
  setProps(element, props)

  children
    .map(render)
    .forEach(element.appendChild.bind(element))

  return element
}

function setProps (element, props) {
  Object.entries(props).forEach(([key, value]) => {
    setProp(element, key, value)
  })
}

function setProp (element, key, vlaue) {
  element.setAttribute(
    key === 'className' ? 'class' : key,
    vlaue
  )
}
function removeProp(element, key) {
  element.removeAttribute(key === 'className' ? 'class' : key)
}

function changed(newNode, oldNode) {
  return typeof (newNode) !== typeof (oldNode) ||
    newNode.type !== oldNode.type ||
    (
      (
        typeof (newNode) === 'string' || 
        typeof (newNode) === 'number'
      ) && 
      newNode !== oldNode
    )
}

function diff(newNode, oldNode) {
  if (oldNode === undefined) {
    return { type: CREATE, newNode }
  }
  
  if (newNode === undefined) {
    return { type: REMOVE }
  }
  
  if (changed(newNode, oldNode)) {
    return { type: REPLACE, newNode }
  }

  if (newNode.tag) {
    return {
      type: UPDATE,
      props: diffProps(newNode, oldNode),
      children: diffChildren(newNode, oldNode)
    }
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
        key, value: oldVal
      })
    }

    if (oldNode === undefined || newVal != oldVal) {
      patches.push({
        type: SET_PROP,
        key, value: newVal
      })
    }
  })

  return patches
}

function diffChildren(newNode, oldNode) {
  const patches = []

  const maxLen = Math.max(
    newNode.children.length,
    oldNode.children.length
  )

  for (let i = 0; i < maxLen; i++) {
    patches[i] = diff(
      newNode.children[i],
      oldNode.children[i]
    )    
  }

  return patches
}

function patch(parent, patches, index = 0) {
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
