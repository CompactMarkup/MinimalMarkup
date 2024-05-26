import mm from './mm'
// import type { Cb } from './mm'
import { assert, test } from 'vitest'

let eq = assert.equal

test('sanitize', {}, () => {
  eq('a&amp;b&lt;c', mm('a&b<c'))
})

test('simple', {}, () => {
  eq('', mm(''))
  eq('a', mm('a'))
  eq('*a', mm('a'))
  eq('*a', mm('*a*'))
})

// let pairs = [
//   ['# h', '<h1>h</h1>'],
//   ['a\\\\b', '<p>a<br/>b </p>'],
//   ['**b** **c** //__i__//', '<p><b>b</b> <b>c</b> <em><u>i</u></em> </p>'],
//   ['~~a--b~~', '<p><code>a&mdash;b</code> </p>'],
//   ['---HR', '<hr/>'],
//   [' ---HR', '<p>---HR </p>'],
//   ['* A', '<p><ul><li>A</li></ul></p>'],
//   ['+ A\n+B', '<p><ol><li>A</li><li>B</li></ol></p>'],
//   ['[[a|b]]', '<p><img style="width:b" src="a" alt=""/> </p>'],
//   ['((a|b))', '<p><a target="_blank" href="b"/>a</a> </p>'],
//   ['(((a|b|v)))', '<p>a </p>'],
// ]

// test('mm', () => {
//   pairs.forEach(([mm, html]) => {
//     eq(p(mm!), html)
//   })
//   eq(
//     p('(((a|b|v)))', { arg: (tag: str, img: str) => `[${tag},${img}]` } as Cb),
//     '<p>[a,b] </p>',
//   )
// })
