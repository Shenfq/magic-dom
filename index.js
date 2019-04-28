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








/* function diffChildren(newVDom, parent) {
  // 有key的子元素
  const nodesWithKey = {};
  let nodesWithKeyCount = 0;

  // 没key的子元素
  const nodesWithoutKey = [];
  let nodesWithoutKeyCount = 0;

  const childNodes = parent.childNodes,
    nodeLength = childNodes.length;

  const vChildren = newVDom.children,
    vLength = vChildren.length;

  // 用于优化没key子元素的数组遍历
  let min = 0;

  // 将子元素分成有key和没key两组
  for (let i = 0; i < nodeLength; i++) {
    const child = childNodes[i],
      props = child[ATTR_KEY];

    if (props !== undefined && props.key !== undefined) {
      nodesWithKey[props.key] = child;
      nodesWithKeyCount++;
    } else {
      nodesWithoutKey[nodesWithoutKeyCount++] = child;
    }
  }

  // 遍历vdom的所有子元素
  for (let i = 0; i < vLength; i++) {
    const vChild = vChildren[i],
      vProps = vChild.props;
    let dom;

    vKey = vProps !== undefined ? vProps.key : undefined;
    // 根据key来查找对应元素
    if (vKey !== undefined) {
      if (nodesWithKeyCount && nodesWithKey[vKey] !== undefined) {
        dom = nodesWithKey[vKey];
        nodesWithKey[vKey] = undefined;
        nodesWithKeyCount--;
      }
    }
    // 如果没有key字段，则找一个类型相同的元素出来做比较
    else if (min < nodesWithoutKeyCount) {
      for (let j = 0; j < nodesWithoutKeyCount; j++) {
        const node = nodesWithoutKey[j];
        if (node !== undefined && isSameType(node, vChild)) {
          dom = node;
          nodesWithoutKey[j] = undefined;
          if (j === min) min++;
          if (j === nodesWithoutKeyCount - 1) nodesWithoutKeyCount--;
          break;
        }
      }
    }

    // diff返回是否更新元素
    const isUpdate = diff(dom, vChild, parent);

    // 如果是更新元素，且不是同一个dom元素，则移动到原先的dom元素之前
    if (isUpdate) {
      const originChild = childNodes[i];
      if (originChild !== dom) {
        parent.insertBefore(dom, originChild);
      }
    }
  }

  // 清理剩下的未使用的dom元素
  if (nodesWithKeyCount) {
    for (key in nodesWithKey) {
      const node = nodesWithKey[key];
      if (node !== undefined) {
        node.parentNode.removeChild(node);
      }
    }
  }
  // 清理剩下的未使用的dom元素
  while (min <= nodesWithoutKeyCount) {
    const node = nodesWithoutKey[nodesWithoutKeyCount--];
    if (node !== undefined) {
      node.parentNode.removeChild(node);
    }
  }
} */