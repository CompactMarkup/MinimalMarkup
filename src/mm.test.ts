import mm from './mm'
// import type { Cb } from './mm'
import { assert, test } from 'vitest'

let eq = assert.equal

test('sanitize', {}, () => {
  eq('a&amp;b&lt;c', mm('a&b<c'))
})

test('line breaks', {}, () => {
  eq('a<br/>b', mm('a\\\\b'))
  eq('a<br/>b<br/>c', mm('a\\\\b\\\\c'))
})

test('bold and italics', {}, () => {
  eq('<b>a</b>', mm('**a**'))
  eq('<em>a</em>', mm('//a//'))
  eq('<b><em>a</em></b>', mm('**//a//**'))
})

test('underline', {}, () => {
  eq('<u>a</u>', mm('__a__'))
})

test('code', {}, () => {
  eq('<code>a</code>', mm('~~a~~'))
})

test('dashes', {}, () => {
  eq('a&ndash;b', mm('a--b'))
  eq('a&mdash;b', mm('a---b'))
})

// TODO this is not quite right
test('nested tags', {}, () => {
  eq('<b><em>a</b></em>', mm('**//a**//'))
  eq('<u><b>a</u></b>', mm('__**a__**'))
})

// test('headers', {}, () => {
//   eq('<h1>h</h1>', mm('# h'))
//   eq('<h2>h</h2>', mm('## h'))
//   eq('<h3>h</h3>', mm('### h'))
// })

// test('horizontal rule', {}, () => {
//   eq('<hr/>', mm('---HR'))
// })

// test('unordered list', {}, () => {
//   eq('<ul><li>A</li></ul>', mm('* A'))
//   eq('<ul><li>A</li><li>B</li></ul>', mm('* A\n* B'))
// })

// test('ordered list', {}, () => {
//   eq('<ol><li>A</li></ol>', mm('+ A'))
//   eq('<ol><li>A</li><li>B</li></ol>', mm('+ A\n+ B'))
// })

// test('image', {}, () => {
//   eq('<img style="width:b" src="a" alt=""/>', mm('[[a|b]]'))
// })

// test('link', {}, () => {
//   eq('<a target="_blank" href="b"/>a</a>', mm('((a|b))'))
// })

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
