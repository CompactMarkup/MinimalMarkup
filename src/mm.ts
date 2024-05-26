// Minimal Markup - a super lightweight markup language

type ArgCb = (...args: str[]) => str
type ImgCb = (src: str) => str
type LinkCb = (text: str, href: str, loc?: (url: str) => str) => str

/**
 * callbacks
 *
 * @typedef {Object} Cb
 * @property {ArgCb} [val] - callback for `[[tag|img|val]]`
 * @property {ImgCb} [img] - callback for `[[image (|width)]]`
 * @property {LinkCb} [link] - callback for `((text|link))`
 */
export type Cb = {
  arg?: ArgCb
  img?: ImgCb
  link?: LinkCb
}

/**
 * Default location resolver.
 * Returns the input url unchanged.
 *
 * @param {str} url - The url to resolve.
 * @returns {str} The input url unchanged.
 */
let defLoc = (url: str) => url

/**
 * Default callbacks
 * @type {Cb}
 */
let defCb: Cb = {
  arg: (tag) => tag,
  img: (src) => src,
  link: (text, href, loc) => {
    if (!href.includes('://')) href = (loc || defLoc)(href)
    href = JSON.stringify(href)
    return `<a target="_blank" href=${href}/>${text}</a>`
  },
}

// wrap tag around val
let tag = (tag: str, val: str) => `<${tag}>${val}</${tag}>`

// ----------------------------------
// parse text -> html, with callbacks
export default (tx: str, cb: Cb = {}): str => {
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
          .replace(/\*\*(.*?)\*\*/gu, '<b>$1</b>') // **bold**
          .replace(/\/\/(.*?)\/\//gu, '<em>$1</em>') // //italics//
          .replace(/__(.*?)__/gu, '<u>$1</u>') // __underline__
          .replace(/~~(.*?)~~/gu, '<code>$1</code>') // ~~code~~
          .replace(/([^-])--([^-])/gu, '$1&mdash;$2'), // m-dash
    )
    .join('\n')

  tx = tx.replace(
    /\(\(\(([\s\S]*?)\|([^\|]*)\|([\s\S]*?)\)\)\)/gu, // (((tag|img|val)))
    (_, tag, img, val) =>
      cb.arg!(tag.trim(), img.trim(), val.replace(/\n/g, '0x01')),
  )

  // split to lines and process
  tx.split('\n').map((line) => {
    line = line.replace(/0x01/g, '\\n')
    if (div(line) || hr(line)) return
    line = line
      .trimEnd()
      .replace(
        /\[\[(.*)\]\]/gu, // [[image (|width)]]
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
