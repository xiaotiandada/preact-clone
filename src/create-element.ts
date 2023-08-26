let vnodeId = 0

//
// Preact createElement
// -----------------------------------

/**
 * Create an virtual node (used for JSX)
 */
export function createElement(
  type: string,
  props: object | null | undefined,
  children: unknown[]
) {
  let normalizedProps = {},
    key,
    ref,
    i

  for (i in props) {
    //
  }

  return createVNode(type, normalizedProps, key, ref, null)
}

export function createVNode(
  type: string,
  props: unknown,
  key: unknown,
  ref: unknown,
  original: unknown
) {
  const vnode = {
    type,
    props,
    key,
    ref,
    _children: null,
    _parent: null,
    _depth: 0,
    _dom: null,
    // _nextDom must be initialized to undefined b/c it will eventually
    // be set to dom.nextSibling which can return `null` and it is important
    // to be able to distinguish between an uninitialized _nextDom and
    // a _nextDom that has been set to `null`
    _nextDom: undefined,
    _component: null,
    _hydrating: null,
    constructor: undefined,
    _original: original == null ? ++vnodeId : original,
  }

  return vnode
}

export function createRef() {
  return { current: null }
}

export function Fragment(props: any): any {
    return props.children
}

/**
 * Check if a the argument is a valid Preact VNode.
 * 检查传递给它的当前虚拟 DOM 节点是否有效。
 * @param {*} vnode
 * @returns {vnode is import('./internal').VNode}
 */
export const isValidElement = (vnode: unknown) =>
    vnode != null && vnode.constructor === undefined;