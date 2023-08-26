import { ComponentChild, ContainerNode } from './index.d'
import { slice } from './util'
import { createElement, Fragment } from './create-element'
import { commitRoot, diff } from './diff/index'
import { EMPTY_OBJ } from './constants'

//
// Preact render
// -----------------------------------
export function render(vnode: ComponentChild, parentDom: ComponentChild): void
export function render(
  vnode: ComponentChild,
  parentDom: ContainerNode,
  replaceNode?: Element | Text
): void
export function render(
  vnode: ComponentChild,
  parentDom: ContainerNode,
  replaceNode?: Element | Text
): void {
  console.log(vnode, parentDom, replaceNode)
  console.log('createElement', createElement(vnode, null, []))

  // We abuse the `replaceNode` parameter in `hydrate()` to signal if we are in
  // hydration mode or not by passing the `hydrate` function instead of a DOM
  // element..
  let isHydrating: boolean = typeof replaceNode === 'function'
  let oldVNode = isHydrating
    ? null
    : (replaceNode && replaceNode._children) || parentDom._children

  // vnode = ((!isHydrating && replaceNode) || parentDom)._children =
  //   createElement(Fragment, null, [vnode])

  let commitQueue = [],
    refQueue = []

  diff(
    parentDom,
    // Determine the new vnode tree and store it on the DOM element on
    // our custom `_children` property.
    vnode,
    EMPTY_OBJ,
    EMPTY_OBJ,
    false,
    !isHydrating && replaceNode
      ? [replaceNode]
      : oldVNode
      ? null
      : parentDom.firstChild
      ? slice.call(parentDom.childNodes)
      : null,
    commitQueue,
    !isHydrating && replaceNode
      ? replaceNode
      : oldVNode
      ? oldVNode._dom
      : parentDom.firstChild,
    isHydrating,
    refQueue
  )

  commitRoot(commitQueue, vnode, refQueue)
}

export function hydrate(vnode: ComponentChild, parent: ContainerNode): void {}
