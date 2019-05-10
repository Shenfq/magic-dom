import virtualDom from './diff/virtual-dom'
import cito from './diff/cito'
import kivi from './diff/kivi'
import snabbdom from './diff/snabbdom'

import config from './utils/config'
const { diffType } = config
export default function diff(newNode, oldNode) {
  switch (diffType) {
    case 'virtual-dom':
      return virtualDom(newNode, oldNode)
    case 'cito':
      return cito(newNode, oldNode)
    case 'kivi':
      return kivi(newNode, oldNode)
    case 'snabbdom':
      return snabbdom(newNode, oldNode)
    default:
      return snabbdom(newNode, oldNode)
  }
}
