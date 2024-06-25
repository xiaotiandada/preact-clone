import { diff } from '.'
import { EMPTY_ARR, EMPTY_OBJ } from '../constants'
import { isArray } from '../util'

/**
 * 这是一个用于比较虚拟节点的子节点的方法。
 * 它接收多个参数，包括父节点的 DOM 元素、新的子节点数组、新的父虚拟节点、旧的父虚拟节点等等。
 * 它会遍历新的子节点数组，对比旧的子节点数组，找出需要更新、添加或删除的节点，并进行相应的操作。
 * 在比较过程中，它会调用其他的辅助方法，如 reorderChildren、placeChild 等等。
 * 最终，它会更新父虚拟节点的 _children 属性和 _dom 属性，并删除旧的子节点数组中剩余的节点。
 * Diff the children of a virtual node
 * @param {import('../internal').PreactElement} parentDom The DOM element whose
 * children are being diffed
 * @param {import('../internal').ComponentChildren[]} renderResult
 * @param {import('../internal').VNode} newParentVNode The new virtual
 * node whose children should be diff'ed against oldParentVNode
 * @param {import('../internal').VNode} oldParentVNode The old virtual
 * node whose children should be diff'ed against newParentVNode
 * @param {object} globalContext The current context object - modified by getChildContext
 * @param {boolean} isSvg Whether or not this DOM node is an SVG node
 * @param {Array<import('../internal').PreactElement>} excessDomChildren
 * @param {Array<import('../internal').Component>} commitQueue List of components
 * which have callbacks to invoke in commitRoot
 * @param {import('../internal').PreactElement} oldDom The current attached DOM
 * element any new dom elements should be placed around. Likely `null` on first
 * render (except when hydrating). Can be a sibling DOM element when diffing
 * Fragments that have siblings. In most cases, it starts out as `oldChildren[0]._dom`.
 * @param {boolean} isHydrating Whether or not we are in hydration
 * @param {Array<any>} refQueue an array of elements needed to invoke refs
 */
export function diffChildren(
  parentDom,
  renderResult,
  newParentVNode,
  oldParentVNode,
  globalContext,
  isSvg,
  excessDomChildren,
  commitQueue,
  oldDom,
  isHydrating,
  refQueue
) {
  console.log(
    'diffChildren',
    parentDom,
    renderResult,
    newParentVNode,
    oldParentVNode,
    globalContext,
    isSvg,
    excessDomChildren,
    commitQueue,
    oldDom,
    isHydrating,
    refQueue
  )
  //
  let i,
    j,
    oldVNode,
    childVNode,
    newDom,
    firstChildDom,
    skew = 0

  // This is a compression of oldParentVNode!=null && oldParentVNode != EMPTY_OBJ && oldParentVNode._children || EMPTY_ARR
  // as EMPTY_OBJ._children should be `undefined`.
  let oldChildren = oldParentVNode?._children || EMPTY_ARR

  let oldChildrenLength = oldChildren.length,
    remainingOldChildren = oldChildrenLength,
    newChildrenLength = renderResult.length

  newParentVNode._children = []

  for (i = 0; i < newChildrenLength; i++) {
    childVNode = renderResult[i]

    console.log(
      'diffChildren childVNode',
      newChildrenLength,
      renderResult,
      childVNode
    )

    if (
      childVNode == null ||
      typeof childVNode == 'boolean' ||
      typeof childVNode == 'function'
    ) {
      //
      // childVNode = newParentVNode._children[i] = null
    } else if (typeof childVNode == 'string' || typeof childVNode == 'number') {
      //
    } else if (isArray(childVNode)) {
      //
    } else if (childVNode._depth > 0) {
      //
    } else {
      //
    }
    // Terser removes the `continue` here and wraps the loop body
    // in a `if (childVNode) { ... } condition
    if (childVNode == null) {
      //
    }

    // Morph the old element into the new one, but don't append it to the dom yet
    diff(
      parentDom,
      childVNode || EMPTY_OBJ,
      (oldVNode || EMPTY_OBJ) as any,
      globalContext,
      isSvg,
      excessDomChildren,
      commitQueue,
      oldDom,
      isHydrating,
      refQueue
    )

    newDom = childVNode?._dom

    // if (newDom != null) {
    if (typeof childVNode.type == 'function') {
      //
      console.log('diffChildren == `function`', childVNode, oldDom, parentDom)

      oldDom = reorderChildren(childVNode, oldDom, parentDom)
    } else if (typeof childVNode.type != 'function') {
      //
      console.log('diffChildren !== `function`', parentDom, newDom, oldDom)
      oldDom = placeChild(parentDom, newDom, oldDom)
    } else if (false) {
      //
    } else {
    }

    if (typeof newParentVNode.type == 'function') {
      //
    }
    // }
  }

  newParentVNode._dom = firstChildDom
}

function placeChild(parentDom, newDom, oldDom) {
  console.log('placeChild', parentDom, newDom, oldDom)

  // const newNode = document.createElement('span')
  // newNode.innerHTML = 'placeChild'

  // parentDom.insertBefore(newNode, null)

  if (oldDom == null || oldDom.parentNode !== parentDom) {
    console.log('placeChild 1')
    parentDom.insertBefore(newDom, null)
  } else if (newDom != oldDom || newDom.parentNode == null) {
    console.log('placeChild 2')
    parentDom.insertBefore(newDom, oldDom)
  }

  //   return newDom.nextSibling
}

function reorderChildren(childVNode, oldDom, parentDom) {
  console.log('reorderChildren', childVNode, oldDom, parentDom)
  // Note: VNodes in nested suspended trees may be missing _children.
  let c = childVNode._children

  let tmp = 0
  for (; c && tmp < c.length; tmp++) {
    let vnode = c[tmp]
    if (vnode) {
      // We typically enter this code path on sCU bailout, where we copy
      // oldVNode._children to newVNode._children. If that is the case, we need
      // to update the old children's _parent pointer to point to the newVNode
      // (childVNode here).
      vnode._parent = childVNode

      if (typeof vnode.type == 'function') {
        oldDom = reorderChildren(vnode, oldDom, parentDom)
      } else {
        oldDom = placeChild(parentDom, vnode._dom, oldDom)
      }
    }
  }

  return oldDom
}

export function toChildArray(children, out) {
  return out
}
