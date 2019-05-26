function isType(type) {
  return function (obj) {
    return {}.toString.call(obj) === '[object ' + type + ']';
  };
}
var isString = isType('String');
var isNumber = isType('Number');
var isArray = Array.isArray;
function isVNode(vdom) {
  return vdom.type === 'VNode';
}
function isVText(vdom) {
  return vdom.type === 'VText';
}

/**
 *
 * @param {*} tag
 * @param {*} properties
 * @param  {...Array} children
 */

function h(tag, properties) {
  var childNodes = [];
  var props = properties || {};
  var key = null;

  for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }

  children.reduce(function (arr, val) {
    return arr.concat(val);
  }, []).forEach(function (child) {
    if (isString(child) || isNumber(child)) {
      childNodes.push({
        type: 'VText',
        text: String(child)
      });
      return;
    }

    childNodes.push(child);
  }); // 虚拟 DOM 添加 key 属性

  if (props.hasOwnProperty('key')) {
    key = props.key.toString();
    delete props.key;
  }

  return {
    type: 'VNode',
    tag: tag,
    key: key,
    props: props || {},
    children: childNodes
  };
}

var PATCH = {
  INSERT: 'INSERT',
  // 插入新节点
  REPLACE: 'REPLACE',
  // 替换原节点
  REMOVE: 'REMOVE',
  // 删除原节点
  ORDER: 'ORDER',
  // 移动节点
  VTEXT: 'VTEXT',
  // 文本发生变化
  UPDATE: 'UPDATE',
  // 检查属性或子节点是否有变化
  PROPS: 'PROPS',
  SET_PROP: 'SET_PROP',
  // 新增或替换属性
  REMOVE_PROP: 'REMOVE_PROP' // 删除属性

};

var types = /*#__PURE__*/Object.freeze({
  PATCH: PATCH
});

/**
 *
 * @param {vdom} newNode
 * @param {vdom} oldNode
 */

function diff(newNode, oldNode) {
  var patches = [];
  walk(newNode, oldNode, patches, 0);
  return patches;
}

function walk(newNode, oldNode, patches, index) {
  if (newNode === oldNode) {
    return;
  }

  var patch = patches[index];

  if (!oldNode) {
    // 旧节点不存在，直接插入
    patch = appendPatch(patch, {
      type: PATCH.INSERT,
      vNode: newNode
    });
  } else if (!newNode) {
    // 新节点不存在，删除旧节点
    patch = appendPatch(patch, {
      type: PATCH.REMOVE,
      vNode: null
    });
  } else if (isVNode(newNode)) {
    if (isVNode(oldNode)) {
      if (newNode.tag === oldNode.tag && newNode.key === oldNode.key) {
        // 相同类型节点的 diff
        var propsPatch = diffProps(newNode.props, oldNode.props);

        if (propsPatch && propsPatch.length > 0) {
          patch = appendPatch(patch, {
            type: PATCH.PROPS,
            patches: propsPatch
          });
        }

        patch = diffChildren(newNode, oldNode, patches, patch, index);
      }
    } else {
      // 新节点替换旧节点
      patch = appendPatch(patch, {
        type: PATCH.REPLACE,
        vNode: newNode
      });
    }
  } else if (isVText(newNode)) {
    if (!isVText(oldNode)) {
      patch = appendPatch(patch, {
        type: PATCH.VTEXT,
        vNode: newNode
      });
    } else if (newNode.text !== oldNode.text) {
      // 替换文本
      patch = appendPatch(patch, {
        type: PATCH.VTEXT,
        vNode: newNode
      });
    }
  }

  if (patch) {
    patches[index] = patch;
  }
}

function diffProps(newProps, oldProps) {
  var patches = [];
  var props = Object.assign({}, newProps, oldProps);
  Object.keys(props).forEach(function (key) {
    var newVal = newProps[key];
    var oldVal = oldProps[key];

    if (!newVal) {
      patches.push({
        type: PATCH.REMOVE_PROP,
        key: key,
        value: oldVal
      });
    }

    if (oldVal === undefined || newVal !== oldVal) {
      patches.push({
        type: PATCH.SET_PROP,
        key: key,
        value: newVal
      });
    }
  });
  return patches;
}
/**
 *
 * @param {vdom} newNode
 * @param {vdom} oldNode
 * @param {Array} patches
 * @param {Object} patch
 * @param {Number} index
 */


function diffChildren(newNode, oldNode, patches, patch, index) {
  var oldChildren = oldNode.children; // 新节点重新排序

  var sortedSet = sortChildren(newNode.children, oldChildren);
  var newChildren = sortedSet.children;
  var oldLen = oldChildren.length;
  var newLen = newChildren.length;
  var len = oldLen > newLen ? oldLen : newLen;

  for (var i = 0; i < len; i++) {
    var leftNode = oldChildren[i];
    var rightNode = newChildren[i];
    index++;

    if (!leftNode) {
      if (rightNode) {
        // Excess nodes in b need to be added
        patch = appendPatch(patch, {
          type: PATCH.INSERT,
          vNode: rightNode
        });
      }
    } else {
      walk(leftNode, rightNode, patches, index);
    }
  }

  if (sortedSet.moves) {
    // Reorder nodes last
    patch = appendPatch(patch, {
      type: PATCH.ORDER,
      moves: sortedSet.moves
    });
  }

  return patch;
}
/**
 * 子节点顺序对比，key值相同的子节点只进行顺序调整
 * @param {Array} newChildren 变化后的子节点
 * @param {Array} oldChildren 变化前的子节点
 */


function sortChildren(newChildren, oldChildren) {
  // 找出变化后的子节点中带 key 的 vdom (keys)，和不带 key 的 vdom (free)
  var newChildIndex = keyIndex(newChildren);
  var newKeys = newChildIndex.keys;
  var newFree = newChildIndex.free; // 所有子节点无 key 不进行对比

  if (newFree.length === newChildren.length) {
    return {
      children: newChildren,
      moves: null
    };
  } // 找出变化前的子节点中带 key 的 vdom (keys)，和不带 key 的 vdom (free)


  var oldChildIndex = keyIndex(oldChildren);
  var oldKeys = oldChildIndex.keys;
  var oldFree = oldChildIndex.free; // 所有子节点无 key 不进行对比

  if (oldFree.length === oldChildren.length) {
    return {
      children: newChildren,
      moves: null
    };
  } // O(MAX(N, M)) memory


  var shuffle = [];
  var freeCount = newFree.length;
  var freeIndex = 0;
  var deletedItems = 0; // 遍历变化前的子节点，并找出变化后依然存在的
  // O(N) time,

  for (var i = 0; i < oldChildren.length; i++) {
    var oldItem = oldChildren[i];
    var itemIndex = void 0;

    if (oldItem.key) {
      if (newKeys.hasOwnProperty(oldItem.key)) {
        // 匹配到变化前节点中存在的 key
        itemIndex = newKeys[oldItem.key];
        shuffle.push(newChildren[itemIndex]);
      } else {
        // Remove old keyed items
        itemIndex = i - deletedItems++;
        shuffle.push(null);
      }
    } else {
      // Match the item in a with the next free item in b
      if (freeIndex < freeCount) {
        itemIndex = newFree[freeIndex++];
        shuffle.push(newChildren[itemIndex]);
      } else {
        // There are no free items in b to match with
        // the free items in a, so the extra free nodes
        // are deleted.
        itemIndex = i - deletedItems++;
        shuffle.push(null);
      }
    }
  }

  var lastFreeIndex = freeIndex >= newFree.length ? newChildren.length : newFree[freeIndex]; // Iterate through b and append any new keys
  // O(M) time

  for (var j = 0; j < newChildren.length; j++) {
    var newItem = newChildren[j];

    if (newItem.key) {
      if (!oldKeys.hasOwnProperty(newItem.key)) {
        // Add any new keyed items
        // We are adding new items to the end and then sorting them
        // in place. In future we should insert new items in place.
        shuffle.push(newItem);
      }
    } else if (j >= lastFreeIndex) {
      // Add any leftover non-keyed items
      shuffle.push(newItem);
    }
  }

  var simulate = shuffle.slice();
  var removes = [];
  var inserts = [];
  var simulateIndex = 0;
  var simulateItem;

  for (var k = 0; k < newChildren.length;) {
    var wantedItem = newChildren[k];
    simulateItem = simulate[simulateIndex]; // remove items

    while (simulateItem === null && simulate.length) {
      removes.push(remove(simulate, simulateIndex, null));
      simulateItem = simulate[simulateIndex];
    }

    if (!simulateItem || simulateItem.key !== wantedItem.key) {
      // if we need a key in this position...
      if (wantedItem.key) {
        if (simulateItem && simulateItem.key) {
          // if an insert doesn't put this key in place, it needs to move
          if (newKeys[simulateItem.key] !== k + 1) {
            removes.push(remove(simulate, simulateIndex, simulateItem.key));
            simulateItem = simulate[simulateIndex]; // if the remove didn't put the wanted item in place, we need to insert it

            if (!simulateItem || simulateItem.key !== wantedItem.key) {
              inserts.push({
                key: wantedItem.key,
                to: k
              });
            } // items are matching, so skip ahead
            else {
                simulateIndex++;
              }
          } else {
            inserts.push({
              key: wantedItem.key,
              to: k
            });
          }
        } else {
          inserts.push({
            key: wantedItem.key,
            to: k
          });
        }

        k++;
      } // a key in simulate has no matching wanted key, remove it
      else if (simulateItem && simulateItem.key) {
          removes.push(remove(simulate, simulateIndex, simulateItem.key));
        }
    } else {
      simulateIndex++;
      k++;
    }
  } // remove all the remaining nodes from simulate


  while (simulateIndex < simulate.length) {
    simulateItem = simulate[simulateIndex];
    removes.push(remove(simulate, simulateIndex, simulateItem && simulateItem.key));
  } // If the only moves we have are deletes then we can just
  // let the delete patch remove these items.


  if (removes.length === deletedItems && !inserts.length) {
    return {
      children: shuffle,
      moves: null
    };
  }

  return {
    children: shuffle,
    moves: {
      removes: removes,
      inserts: inserts
    }
  };
}

function remove(arr, index, key) {
  arr.splice(index, 1);
  return {
    from: index,
    key: key
  };
}

function keyIndex(children) {
  var keys = {};
  var free = [];
  var length = children.length;

  for (var i = 0; i < length; i++) {
    var child = children[i];

    if (child.key) {
      keys[child.key] = i;
    } else {
      free.push(i);
    }
  }

  return {
    keys: keys,
    // 子节点中所有存在的 key 对应的索引
    free: free // 子节点中不存在 key 值的索引

  };
}
/**
 *
 * @param {*} patch
 * @param {Array/Object} patches
 */


function appendPatch(patch, patches) {
  if (patch) {
    if (isArray(patches)) {
      patches.push(patch);
    } else {
      patches = [patch, patches];
    }

    return patches;
  } else {
    return patches;
  }
}

function diff$1(newNode, oldNode) {}

function diff$2(newNode, oldNode) {}

function diff$3(newNode, oldNode) {}

var name = "magic-dom";
var version = "1.0.0";

var config = {
  version: version,
  name: name,
  diffType: 'virtual-dom'
};

var diffType = config.diffType;
function diff$4(newNode, oldNode) {
  switch (diffType) {
    case 'virtual-dom':
      return diff(newNode, oldNode);

    case 'cito':
      return diff$1(newNode, oldNode);

    case 'kivi':
      return diff$2(newNode, oldNode);

    case 'snabbdom':
      return diff$3(newNode, oldNode);

    default:
      return diff$3(newNode, oldNode);
  }
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

/**
 *
 * @param {vdom} vdom
 */

function render(vdom) {
  if (isVText(vdom)) {
    return document.createTextNode(vdom.text);
  }

  var tag = vdom.tag,
      props = vdom.props,
      children = vdom.children;
  var element = document.createElement(tag);
  setProps(element, props);
  children.map(render).forEach(element.appendChild.bind(element));
  return element;
}
/**
 *
 * @param {Element} element
 * @param {Object} props
 */

function setProps(element, props) {
  Object.entries(props).forEach(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        key = _ref2[0],
        value = _ref2[1];

    setProp(element, key, value);
  });
}
/**
 *
 * @param {Element} element
 * @param {String} key
 * @param {String/Number} vlaue
 */

function setProp(element, key, vlaue) {
  element.setAttribute(key === 'className' ? 'class' : key, vlaue);
}

/**
 *
 * @param {Element} parent
 * @param {Object} patches
 * @param {Number} index
 */

function patch(parent, patches) {
  var index = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var indices = patchIndices(patches);
  if (!patches) return;
  if (indices.length === 0) return;
  var el = parent.childNodes[index];
  var type = patches.type,
      newNode = patches.newNode;

  for (var i = 0; i < indices.length; i++) {
    var nodeIndex = indices[i];
    rootNode = applyPatch(rootNode, index[nodeIndex], patches[nodeIndex], renderOptions);
  }

  return rootNode;
}

function applyPatch(type, newNode) {
  switch (type) {
    case PATCH.CREATE:
      newEl = render(newNode);
      parent.appendChild(newEl);
      break;

    case PATCH.REMOVE:
      parent.removeChild(el);
      break;

    case PATCH.REPLACE:
      newEl = render(newNode);
      parent.replaceChild(newEl, el);
      break;

    case PATCH.UPDATE:
      var _patches = patches,
          props = _patches.props,
          children = _patches.children;
      patchProps(el, props);
      children.forEach(function (child, idx) {
        patch(el, child, idx);
      });
      break;

    default:
      break;
  }
}
/**
 *
 * @param {Element} element
 * @param {Object} patches
 */


function patchProps(element, patches) {
  patches.forEach(function (patch) {
    var type = patch.type,
        key = patch.key,
        value = patch.value;

    switch (type) {
      case PATCH.SET_PROP:
        setProp(element, key, value);
        break;

      case PATCH.REMOVE_PROP:
        removeProp(element, key);
        break;

      default:
        break;
    }
  });
}
/**
 *
 * @param {Element} element
 * @param {String} key
 */


function removeProp(element, key) {
  element.removeAttribute(key === 'className' ? 'class' : key);
}

function patchIndices(patches) {
  var indices = [];

  for (var key in patches) {
    indices.push(Number(key));
  }

  return indices;
}

export { diff$4 as diff, h, patch, render, types };
