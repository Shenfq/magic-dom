import test from 'ava'
import { h, diff, patch, render, types, utils } from '../../dist/magic-dom'

const {
  isVNode, isVText
} = utils

test('h', t => {
  const vdom = <div id="app">hello world</div>
  const {
    tag, 
    props: { id }, 
    children: [ child ] 
  } = vdom
  t.true(isVNode(vdom))
  t.true(isVText(child))
  t.is(tag, 'div')
  t.is(id, 'app')
  t.is(child.text, 'hello world')
})

test('diff', t => {
  const array = [1, 2, 3, 4, 5]
  const left = (
    <ul>
      {array.map(i => (
        <li key={i}>i</li>
      ))}
    </ul>
  )
  const right = (
    <ul>
      {array.reverse().map(i => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  )
  const patches = diff(left, right)
  
  t.pass()
})
