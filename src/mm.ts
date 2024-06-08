// Minimal Markup – a super lightweight markup language

type str = string // minimal markup

// replace &, < with html entities
let sanitize = (tx: str): str =>
  tx.replace(/&/gu, '&amp;').replace(/</gu, '&lt;')

// split into trimmed lines
let split = (tx: str): str[] => tx.split('\n').map((line) => line.trimEnd())

// join lines
let join = (ls: str[]): str => ls.join('\n')

// TODO inside out xx..xx
// bold: *...*
// italics: /.../
// underline: _..._
// code: ~...~
let tags = (line: str): str =>
  line
    .replace(/\*\*(.*?)\*\*/gu, '<b>$1</b>')
    .replace(/\/\/(.*?)\/\//gu, '<em>$1</em>')
    .replace(/__(.*?)__/gu, '<u>$1</u>')
    .replace(/~~(.*?)~~/gu, '<code>$1</code>')

// n-dash: --
// m-dash: --
let typo = (line: str): str =>
  line
    .replace(/([^-])--([^-])/gu, '$1&ndash;$2')
    .replace(/([^-])---([^-])/gu, '$1&mdash;$2')

// break: \\
let breaks = (line: str): str => line.replace(/\\\\/gu, '<br/>')

// link root resolver
let nulRoot = (href: str) => href

// callbacks
type CbRoot = (href: str) => str
type CbImg = (src: str, width?: str) => str
type CbLink = (text: str, href: str, root?: (href: str) => str) => str
type CbArgs = (...args: str[]) => str

export type Cbs = {
  root?: CbRoot // root resolver
  img?: CbImg // [[src (|width)]]
  link?: CbLink // ((text|href))
  args?: CbArgs // (((tag|...)))
}

let defCbs: Cbs = {
  root: (href:str)=>href,
  img: (src,width) => {
    return root + `<img${width ? ` style="width:${width.trim()}"` : ''} src="${cb.img!(src.trim())}" alt=""/>`
  }
  link: (text, link, root) => {
    if (!link.includes('://')) link = (root || nulRoot)(link)
    link = JSON.stringify(link)
    return `<a target="_blank" href=${link}/>${text}</a>`
  },
  args: (tag) => tag,
}

let cbImg = (line: str, cb: CbImg): str =>
  line.replace(
    /\(\(\(([\s\S]*?)\|([^\|]*)\|([\s\S]*?)\)\)\)/gu,
    (_, tag, src, val) => cb(tag.trim(), src.trim(), val.trim()),
  )

let cbLink = (line: str, cb: CbLink): str =>
  line.replace(/\(\((.*)\|(.*)\)\)/gu, (_, text, link) =>
    cb(text.trim(), link.trim()),
  )

let cbArgs = (line: str, cb: CbArgs): str =>
  line.replace(/\(\((.*)\|(.*)\)\)/gu, (_, text, link) =>
    cb(text.trim(), link.trim()),
  )

let compose =
  (...fns: ((line: str) => str)[]) =>
  (init: str) =>
    fns.reduceRight((line, fn) => fn(line), init)

// process minimal markup:
// split into lines, trim ends, process listeners, join
let mm = (tx: str): str =>
  sanitize(tx)
    .split('\n')
    .map((line) => compose(breaks, typo, tags)(line.trimEnd()))
    .join('\n')

export default mm

/*

// wrap tag around val
let tag = (tag: str, val: str) => `<${tag}>${val}</${tag}>`
*/
// ----------------------------------
// parse text -> html, with callbacks
/*
let qqq = (tx: str, cb: Cb = {}): str => {
  cb = {
    ...defCb, // default callbacks
    ...cb, // override by user callbacks
  }

  // work in progress
  let ul = '', // unordered list
    ol = '', // ordered list
    tbl = '', // table
    p = '', // paragraph
    res = '' // result

  // flush work in progress
  let flushLists = () => {
    if (ul) p += tag('ul', ul)
    ul = ''
    if (ol) p += tag('ol', ol)
    ol = ''
  }

  let flushTbl = () => {
    if (tbl) p += tag('table', tbl)
    tbl = ''
  }

  let flushP = () => {
    if (p) res += tag('p', p)
    p = ''
  }

  let flushAll = () => {
    flushLists()
    flushTbl()
    flushP()
  }

  let starts = (tag: str, line: str) =>
    !line.startsWith(tag) ? '' : line.substring(tag.length).trim()

  let first = (tag: str, line: str) => line.startsWith(tag)

  let addEl = (h: str) => {
    flushAll()
    res += h
  }

  let nDiv = 0

  let div = (line: str) => {
    let l: str
    if ((l = starts('{{', line))) {
      let cl: any = []
      if (l.includes('::')) cl.push('j')
      else if (l.includes(':')) cl.push('c')
      if (l.includes('>')) cl.push('r')
      if (l.includes('*')) cl.push('b')
      if (l.includes('/')) cl.push('i')
      if ((cl = cl.join(' '))) cl = ` class="${cl}"`
      addEl(`<div${cl}>`)
      ++nDiv
    } else if (first('}}', line)) {
      --nDiv
      addEl('</div>')
    } else return false
    return true
  }

  let header = (line: str) => {
    let l: str
    if ((l = starts('###', line))) addEl(tag('h3', l))
    else if ((l = starts('##', line))) addEl(tag('h2', l))
    else if ((l = starts('#', line))) addEl(tag('h1', l))
    else return false
    return true
  }

  let hr = (line: str) => {
    if (first('---', line)) addEl(`<hr/>`)
    else return false
    return true
  }

  let uli = (line: str) => {
    let l: str
    if ((l = starts('*', line))) {
      flushP()
      ul += tag('li', l)
    } else return false
    return true
  }

  let oli = (line: str) => {
    let l: str
    if ((l = starts('+', line))) {
      flushP()
      ol += tag('li', l)
    } else return false
    return true
  }

  let table = (line: str) => {
    if (starts('|', line)) {
      flushP()
      let t = '',
        span: any = 1
      line
        .split('|')
        .slice(1)
        .forEach((_) => {
          if ('-' == _.trim()) {
            ++span
          } else {
            let l: str,
              cl = ''
            if ((l = starts(':', _))) {
              cl = 'c'
            } else if ((l = starts('>', _))) {
              cl = 'r'
            } else {
              l = _
            }

            if (1 < span) {
              span = ` colspan="${span}"`
            } else {
              span = ''
            }

            if (cl) cl = ` class="${cl}"`
            t += `<td${cl}${span}>${l.trim()}</td>`
            span = 1
          }
        })
      tbl += '<tr>' + t + '</tr>'
      return true
    }
    return false
  }

  let plain = (line: str) => {
    flushLists()
    flushTbl()
    line = line.trim()
    if (!line) flushP()
    else p += line + ' '
    return true
  }

  // sanitize <, &
  tx = tx.replace(/&/gu, '&amp;').replace(/</gu, '&lt;')

  // sanitize end-of-lines, do simple markup
  tx = tx
    .split('\n')
    .map(
      (line) =>
        line
          .trimEnd()
          .replace(/\\\\/gu, '<br/>') // br
          .replace(/\*\*(.*?)\*\* /gu, '<b>$1</b>') // **bold**
          .replace(/\/\/(.*?)\/\//gu, '<em>$1</em>') // //italics//
          .replace(/__(.*?)__/gu, '<u>$1</u>') // __underline__
          .replace(/~~(.*?)~~/gu, '<code>$1</code>') // ~~code~~
          .replace(/([^-])--([^-])/gu, '$1&mdash;$2'), // m-dash
    )
    .join('\n')



  // split to lines and process
  tx.split('\n').map((line) => {
    line = line.replace(/0x01/g, '\\n')
    if (div(line) || hr(line)) return
    line = line
      .trimEnd()
      .replace(
        /\[\[(.*)\]\]/gu, //
        (_, img) => {
          let [src, w] = img.split('|')
          let style = w ? ` style="width:${w.trim()}"` : ''
          return `<img${style} src="${cb.img!(src.trim())}" alt=""/>`
        },
      )
      .replace(
        /\(\((.*)\|(.*)\)\)/gu, // ((text|link))
        (_, text, link) => cb.link!(text.trim(), link.trim()),
      )
    header(line) || uli(line) || oli(line) || table(line) || plain(line)
  })

  flushAll()
  while (0 < nDiv--) res += '</div>'
  return res.replace(/\x01/g, '<')
}
*/
