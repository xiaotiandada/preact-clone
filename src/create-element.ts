import { ComponentType } from './internal'
import { slice } from './util'

let vnodeId = 0

//
// Preact createElement
// -----------------------------------

/**
 * Create an virtual node (used for JSX)
 */
export function createElement(
  type: string | ComponentType<any>,
  props: object | null | undefined,
  children: unknown[]
) {
  console.log('createElement', type, props, children)

  let normalizedProps = {},
    key,
    ref,
    i

  console.log('createElement type', type)
  console.log('createElement props', props)

  for (i in props) {
    // 处理 key
    if (i == 'key') key = props[i]
    // 处理 ref
    else if (i == 'ref') ref = props[i]
    // 其他标准、规范的 Props
    else normalizedProps[i] = props[i]
  }

  if (arguments.length > 2) {
    /**
     * 处理 children
     * 如果函数的参数个数大于2，那么将第三个参数及其之后的参数作为子节点添加到 normalizedProps 对象的 children 属性中。
     * 如果只有两个参数，那么将 children 参数直接赋值给 normalizedProps 对象的 children 属性。
     * 其中 slice.call(arguments, 2) 是将 arguments 对象从第三个元素开始截取到最后一个元素，返回一个新的数组。
     */
    normalizedProps.children =
      arguments.length > 3 ? slice.call(arguments, 2) : children
  }

  // Component VNode
  if (typeof type == 'function') {
    //
  }

  console.log('normalizedProps', normalizedProps)

  return createVNode(type, normalizedProps, key, ref, null)
}

export function createVNode(
  type: string,
  props: unknown,
  key: unknown,
  ref: unknown,
  original: unknown
) {
  // V8 seems to be better at detecting type shapes if the object is allocated from the same call site
  // Do not inline into createElement and coerceToVNode!
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

  // Only invoke the vnode hook if this was *not* a direct copy:
  if (original == null) {
    //
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
  vnode != null && vnode.constructor === undefined
