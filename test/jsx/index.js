import test from 'ava'

import {
  h, diff, types
} from '../../dist/magic-dom'

const {
  UPDATE, REPLACE
} = types

test('h', t => {
  const vdom = <div>
    <p>hello <del>world</del></p>
    <p>hello <b>world</b></p>
    <p>hello world <span>!!!</span></p>
  </div>
  
  console.info(vdom)
  
  t.pass()
})
/* 
test('test diff', t => {
  const left = h("div", { className: "test" }, "Left")
  const right = h("div", { className: "test" }, "Right")
  const patches = diff(left, right)
  const childPatch = patches.children[0]
  
  t.is(patches.type, UPDATE)
  t.is(childPatch.type, REPLACE)
  t.is(childPatch.newNode, 'Left')
})
 */