import test from 'ava';
import { h, diff, types } from '../dist/magic-dom';
const {
  UPDATE,
  REPLACE
} = types;
test('h', t => {
  const vdom = h("div", null, h("p", null, "hello ", h("del", null, "world")), h("p", null, "hello ", h("b", null, "world")), h("p", null, "hello world ", h("span", null, "!!!")));
  vdom.children.forEach(element => {
    console.info(element);
  });
  t.pass();
});
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