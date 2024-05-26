declare global {
  type num = number

  type str = string
  type chr = str // only a hint, no checking

  type bol = boolean

  type Dct<T> = { [key: string]: T }
}

export {}
