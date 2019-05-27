import virtualDom from './diff/virtual-dom'
import cito from './diff/cito'
import kivi from './diff/kivi'
import snabbdom from './diff/snabbdom'

import config from './utils/config'
const { diffType } = config
export default function diff(oldNode, newNode) {
  switch (diffType) {
    case 'virtual-dom':
      return virtualDom(oldNode, newNode)
    case 'cito':
      return cito(oldNode, newNode)
    case 'kivi':
      return kivi(oldNode, newNode)
    case 'snabbdom':
      return snabbdom(oldNode, newNode)
    default:
      return snabbdom(oldNode, newNode)
  }
}
