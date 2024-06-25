export { ComponentChild } from 'preact/src/index.d.ts'
import { JSXInternal } from 'preact/src/jsx.d'

//
// Preact render
// -----------------------------------

export interface ContainerNode {
  nodeType: Node['nodeType']
  parentNode: Node['parentNode']
  firstChild: Node['firstChild']
  insertBefore: Node['insertBefore']
  appendChild: Node['appendChild']
  removeChild: Node['removeChild']
  childNodes: ArrayLike<Node>
}

//
// Preact createElement
// -----------------------------------

export namespace createElement {
  export import JSX = JSXInternal
}
