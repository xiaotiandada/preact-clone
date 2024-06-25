import { ComponentChild, ContainerNode } from './index.d'
import { slice } from './util'
import { createElement, Fragment } from './create-element'
import { commitRoot, diff } from './diff/index'
import { EMPTY_ARR, EMPTY_OBJ } from './constants'
import { diff as diffPreact } from '../node_modules/preact/src/diff/index'

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
  // 开始渲染
  console.log('render args', vnode, parentDom, replaceNode)
  // console.log('createElement', createElement(vnode, null, []))

  // We abuse the `replaceNode` parameter in `hydrate()` to signal if we are in
  // hydration mode or not by passing the `hydrate` function instead of a DOM
  // element..
  let isHydrating: boolean = typeof replaceNode === 'function'
  let oldVNode = isHydrating ? null : null

  // 创建最外层的容器

  // 给节点设置 _children，使用 createElement
  // vnode 使用 createElement 赋值
  // 第一个参数是 function，后续在 diff 里面执行 `outer: if (typeof newType == 'function')`
  vnode = createElement(Fragment, null, [vnode])

  console.log('render vnode', vnode, vnode.type)

  let commitQueue: any[] = [],
    refQueue: any[] = []

  // 执行 diff
  diff(
    parentDom,
    // Determine the new vnode tree and store it on the DOM element on
    // our custom `_children` property.
    vnode,
    oldVNode || (EMPTY_OBJ as any),
    EMPTY_OBJ,
    false,
    EMPTY_ARR,
    commitQueue,
    !isHydrating && replaceNode
      ? replaceNode
      : oldVNode
      ? oldVNode._dom
      : parentDom.firstChild,
    isHydrating,
    refQueue
  )

  // commitRoot(commitQueue, vnode, refQueue)
}

export function hydrate(vnode: ComponentChild, parent: ContainerNode): void {
  //
}
