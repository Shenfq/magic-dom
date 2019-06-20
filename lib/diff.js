import virtualDom from './diff/virtual-dom'
import cito from './diff/cito'
import snabbdom from './diff/snabbdom'
import config from './utils/config'

export default function diff(oldNode, newNode) {
  const { diffType } = config

  // 根据配置选择 diff 算法，默认使用 virtual-dom
  switch (diffType) {
    case 'virtual-dom':
      return virtualDom(oldNode, newNode)
    case 'cito':
      return cito(oldNode, newNode)
    case 'snabbdom':
      return snabbdom(oldNode, newNode)
    default:
      return virtualDom(oldNode, newNode)
  }
}
