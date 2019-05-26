import test from 'ava';
import { h, diff } from '../../dist/magic-dom';
import { url } from 'inspector';
/* test('h', t => {
  const vdom = <div>
    <p>hello <del>world</del></p>
    <p>hello <b>world</b></p>
    <p>hello world <span>!!!</span></p>
  </div>
  
  console.info(vdom)
  
  t.pass()
}) */

test('diff', t => {
  const array = [1, 2, 3, 4, 5];
  const left = h("ul", null, array.map(i => h("li", {
    key: i
  }, "i")));
  const right = h("ul", null, array.reverse().map(i => h("li", {
    key: i
  }, i)));
  console.log('left', left);
  console.log('right', right);
  const patches = diff(left, right);
  console.info('patches', JSON.stringify(patches));
});