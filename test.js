class Component {
  state = {
    list: [
      'Vue.js',
      'React.js',
      'Angular',
      'jQuery',
      'Koa',
      'express'
    ]
  }

  root = null // 组件的挂载点
  vdom = null // 组件的虚拟DOM表示

  setState(newState) {
    this.state = {
      ...this.state,
      ...newState
    }
    const newVdom = this.render()
    const patches = diff(newVdom, this.vdom)
    patch(this.root, patches)
  }

  changeList() {
    const { list } = this.state
    this.setState({
      list: list.sort()
    })
  }

  render() {
    const { list } = this.state
    return (
      <ul>{
        list.map(item => <li key={item}>{item}</li>)
      }</ul>
    )
  }
}

function createElement (root, component) {
  const vdom = component.render()
  component.vdom = vdom
  component.root = root
  root.appendChild(
    render(vdom)
  )
}

const root = document.getElementById('root')
const component = new Component
createElement(root, component)

setTimeout(() => {
  component.changeList()
}, 1000);

