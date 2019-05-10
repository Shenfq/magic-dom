(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.magic = {}));
}(this, function (exports) { 'use strict';

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
   * @param {*} props
   * @param  {...Array} children
   */

  function h(tag, props) {
    var childNodes = [];

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
    });
    return {
      type: 'VNode',
      tag: tag,
      props: props || {},
      children: childNodes
    };
  }

  var CREATE = 'CREATE'; // 新增一个节点

  var REMOVE = 'REMOVE'; // 删除原节点

  var REPLACE = 'REPLACE'; // 替换原节点

  var UPDATE = 'UPDATE'; // 检查属性或子节点是否有变化

  var SET_PROP = 'SET_PROP'; // 新增或替换属性

  var REMOVE_PROP = 'REMOVE PROP'; // 删除属性

  var types = /*#__PURE__*/Object.freeze({
    CREATE: CREATE,
    REMOVE: REMOVE,
    REPLACE: REPLACE,
    UPDATE: UPDATE,
    SET_PROP: SET_PROP,
    REMOVE_PROP: REMOVE_PROP
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

    if (isVText(newNode) && isVText(oldNode)) {
      if (newNode.text !== oldNode.text) {
        patch = appendPatch(patch, createPatch(newNode, oldNode));
      }
    } else if (isVNode(newNode) && isVNode(oldNode) && newNode.tag === oldNode.tag) {
      var propsPatch = diffProps(newNode.props, oldNode.props);

      if (propsPatch) {
        patch = appendPatch(patch, createPatch(newNode.props, propsPatch));
      }

      patch = diffChildren(newNode, oldNode, patches, patch, index);
    } else {
      patch = appendPatch(patch, createPatch(newNode, oldNode));
    }

    if (patch) {
      patches[index] = patch;
    }
  }

  function diffProps(newNode, oldNode) {
    var patches = [];
    var props = Object.assign({}, newNode.props, oldNode.props);
    Object.keys(props).forEach(function (key) {
      var newVal = newNode.props[key];
      var oldVal = oldNode.props[key];

      if (!newVal) {
        patches.push({
          type: REMOVE_PROP,
          key: key,
          value: oldVal
        });
      }

      if (oldNode === undefined || newVal !== oldVal) {
        patches.push({
          type: SET_PROP,
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
   */


  function diffChildren(newNode, oldNode) {
    var patches = [];
    var maxLen = Math.max(newNode.children.length, oldNode.children.length);

    for (var i = 0; i < maxLen; i++) {
      patches[i] = diff(newNode.children[i], oldNode.children[i]);
    }

    return patches;
  }

  function appendPatch(patch, changed) {
    if (patch) {
      if (isArray(patch)) {
        patch.push(changed);
      } else {
        return [patch, changed];
      }
    }

    return changed;
  }

  function createPatch() {}

  function diff$1(newNode, oldNode) {}

  function diff$2(newNode, oldNode) {}

  function diff$3(newNode, oldNode) {}

  var name = "magic-dom";
  var version = "1.0.0";

  var config = {
    version: version,
    name: name,
    diffType: 'snabbdom'
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
    if (!patches) return;
    var el = parent.childNodes[index];
    var type = patches.type,
        newNode = patches.newNode;
    var newEl = null;

    switch (type) {
      case CREATE:
        newEl = render(newNode);
        parent.appendChild(newEl);
        break;

      case REMOVE:
        parent.removeChild(el);
        break;

      case REPLACE:
        newEl = render(newNode);
        parent.replaceChild(newEl, el);
        break;

      case UPDATE:
        var props = patches.props,
            children = patches.children;
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
        case SET_PROP:
          setProp(element, key, value);
          break;

        case REMOVE_PROP:
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

  exports.diff = diff$4;
  exports.h = h;
  exports.patch = patch;
  exports.render = render;
  exports.types = types;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
