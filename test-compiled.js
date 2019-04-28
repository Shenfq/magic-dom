function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Component {
  constructor() {
    _defineProperty(this, "state", {
      list: ['Vue.js', 'React.js', 'Angular', 'jQuery', 'Koa', 'express']
    });

    _defineProperty(this, "root", null);

    _defineProperty(this, "vdom", null);
  }

  // 组件的虚拟DOM表示
  setState(newState) {
    this.state = { ...this.state,
      ...newState
    };
    const newVdom = this.render();
    const patches = diff(newVdom, this.vdom);
    patch(this.root, patches);
  }

  changeList() {
    const {
      list
    } = this.state;
    this.setState({
      list: list.sort()
    });
  }

  render() {
    const {
      list
    } = this.state;
    return h("ul", null, list.map(item => h("li", {
      key: item
    }, item)));
  }

}

function createElement(root, component) {
  const vdom = component.render();
  component.vdom = vdom;
  component.root = root;
  root.appendChild(render(vdom));
}

const root = document.getElementById('root');
const component = new Component();
createElement(root, component);
setTimeout(() => {
  component.changeList();
}, 1000);
