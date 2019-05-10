import { version, name } from '../../package.json'

const config = {
  version,
  name,
  diffType: 'snabbdom',
}

export default config

export function get(key) {
  let c = config

  key.split('.').forEach(name => {
    c = c[name]
  })
  return c
}

export function set(key, value) {
  let c = config
  const keyArr = key.split('.')
  const length = keyArr.length - 1
  keyArr.forEach((name, index) => {
    if (index < length) {
      c = c[name]
    } else {
      c[name] = value
    }
  })
}
