import test from 'ava';
import { h, diff, patch, render, types, utils } from '../../dist/magic-dom';
const {
  isVNode,
  isVText
} = utils;
test('h', t => {
  const vdom = h("div", {
    id: "app"
  }, "hello world");
  const {
    type,
    tag,
    props: {
      id
    },
    children: [child]
  } = vdom;
  t.true(isVNode(vdom));
  t.true(isVText(child));
  t.is(tag, 'div');
  t.is(id, 'app');
  t.is(child.text, 'hello world');
});
test('diff', t => {
  const array = [1, 2, 3, 4, 5];
  const left = h("ul", null, array.map(i => h("li", {
    key: i
  }, "i")));
  const right = h("ul", null, array.reverse().map(i => h("li", {
    key: i
  }, i)));
  const patches = diff(left, right);
  console.info('patches', patches);
  t.pass();
});