// 空 ｜ 空属性
const EMPTY = {}
const NO_RENDER = { render: false }
const SYNC_RENDER = { renderSync: true }
const DOM_RENDER = { build: true }
const EMPTY_BASE = ''
// 尺寸相关的属性, 用于判断是否需要加单位
const NON_DIMENSION_PROPS: { [key: string]: boolean } = {}

// 设置属性名单
'boxFlex boxFlexGroup columnCount fillOpacity flex flexGrow flexPositive flexShrink flexNegative fontWeight lineClamp lineHeight opacity order orphans strokeOpacity widows zIndex zoom'
  .split(' ')
  .forEach((k: string) => (NON_DIMENSION_PROPS[k] = true))

/** @private */
let slice = Array.prototype.slice

/** @private */
let memoize =
  (fn: any, mem: { [key: string]: any } = {}) =>
  (k: any) => {
    let result = mem.hasOwnProperty(k) ? mem[k] : (mem[k] = fn(k))
    console.log('memoize result', result, mem)
    return result
  }

/** @public @object Global options */
let options = {
  /** If `true`, `prop` changes trigger synchronous component updates. */
  syncComponentUpdates: true,
}

/** @public @object Global hook methods */
let hooks = {}

let rerender = {}

/** @private DOM node pool, keyed on nodeName. */
let recycler = {
  nodes: {},
  create(nodeName: string) {
    let name = recycler.normalizeName(nodeName)
    let list = recycler.nodes[name]
    return (list && list.pop()) || document.createElement(nodeName)
  },
  normalizeName: memoize((name: string) => name.toUpperCase()),
} as {
  nodes: { [key: string]: HTMLElement[] }
  create: (nodeName: string) => HTMLElement
  normalizeName: (name: string) => string
}

/** @public Render JSX into a `parent` Element.
 * Component是一个基础组件，类似于React中的组件。
 * 它有一些生命周期方法，例如shouldComponentUpdate和render，以及一些用于更新组件状态和属性的方法，例如setState和setProps。triggerRender方法将组件标记为脏，并将其排队以进行渲染。
 * _render方法将组件渲染到DOM中。
 */
export function render(component: any, parent: HTMLElement): any {
  console.log('render', component, parent)

  // let built = build(null, component)
  let built = build(null, component)
  // let c = built._component
  // 执行生命周期 componentWillMount
  // if (c) hook(c, 'componentWillMount')
  parent.appendChild(built)
  // 执行生命周期 componentDidMount
  // if (c) hook(c, 'componentDidMount')

  return build
}

/** @public Base Component, with API similar to React. */
export class Component {
  props: object
  state: object
  constructor() {
    //
    /** @type {object} */
    this.props = hook(this, 'getDefaultProps') || {}
    /** @type {object} */
    this.state = hook(this, 'getInitialState') || {}

    hook(this, 'initialize')
  }

  /** Returns a `boolean` value indicating if the component should re-render when receiving the given `props` and `state`.
   *	@param {object} props
   *	@param {object} state
   */
  shouldComponentUpdate(props: object, state: object) {
    return true
  }

  render(props: object, state: object) {
    console.log('Component render', props, state)
    return h('div', { component: this.constructor.name }, props.children)
  }

  /** @private */
  _render(opts = EMPTY) {
    let rendered = this.render({}, {})
    let base = build(null, rendered || EMPTY_BASE, this)
  }
}

/** @public JSX/hyperscript reviver
 *  h 是一个JSX/hyperscript解析器，用于将JSX转换为虚拟DOM节点。它接受节点名称、属性和子节点作为参数，并返回一个虚拟DOM节点。
 *	@see http://jasonformat.com/wtf-is-jsx
 *  @example
 *  /** @jsx h *\/
 *  import { render, h } from 'preact';
 *  render(<span>foo</span>, document.body);
 */
export function h(
  nodeName: string | Component,
  attributes: { [key: string]: string },
  ...args: any
) {
  console.log('h', nodeName, attributes, args)

  let children
  let sharedArr = []
  let len = args.length
  let arr
  let lastSimple

  if (len) {
    children = []
    for (let i = 0; i < len; i++) {
      let child = args[i]
      // if (p === null || p === undefined) continue
      children.push(child)
    }
  }

  let p = new VNode(nodeName, attributes || undefined, children || undefined)
  return p
}

function build(dom: any, vnode: VNode, rootComponent?: unknown) {
  //
  console.log('build', dom, dom?.nodeName, vnode, rootComponent)

  let out = dom
  let nodeName: string = vnode.nodeName

  // 创建文本节点
  if (typeof vnode === 'string') {
    return document.createTextNode(vnode)
  }

  // 创建为定义的元素
  if (nodeName === null || nodeName === undefined) {
    console.log('x-undefined-element', nodeName)

    nodeName = 'x-undefined-element'
  }

  console.log('dom', dom)

  // 没有 dom 节点，创建一个新的节点
  if (!dom) {
    console.log('nodeName', nodeName)
    out = recycler.create(nodeName)

    console.log('out', out)
  } else if (false) {
    //
  } else {
    //
  }

  // apply attributes
  let old: { [key: string]: any } = getNodeAttributes(out) || EMPTY
  let attrs: { [key: string]: any } = vnode.attributes || EMPTY

  console.log('xxx', old, attrs)

  // new & updated attributes
  if (attrs !== EMPTY) {
    for (let name in attrs) {
      if (attrs.hasOwnProperty(name)) {
        let value = attrs[name]
        if (value !== undefined && value !== null && value !== false) {
          let prev = getAccessor(out, name, old[name])
          if (value !== prev) {
            setAccessor(out, name, value, old[name])
          }
        }
      }
    }
  }

  // 循环处理子节点
  let newChildren = []
  if (vnode.children) {
    for (let i = 0, vlen = vnode.children.length; i < vlen; i++) {
      let vchild = vnode.children[i]
      let attrs = vchild.attributes
      let key
      let child
      if (attrs) {
        //
      }

      /**
       * 这段代码的作用是尝试从现有的子节点中获取与当前虚拟节点相同类型的节点。
       * 如果找到了相同类型的节点，则将其从现有的子节点中删除并返回该节点。如果没有找到相同类型的节点，则返回 undefined。
       */

      // attempt to pluck a node of the same type from the existing children
      if (!child) {
        //
      }

      // 循环处理子节点
      // morph the matched/found/created DOM child to match vchild (deep)
      newChildren.push(build(null, vchild))
    }
  }

  // 循环处理子节点
  // apply the constructed/enhanced ordered list to the parent
  for (let i = 0, len = newChildren.length; i < len; i++) {
    // we're intentionally re-referencing out.childNodes here as it is a live array (akin to live NodeList)
    if (out.childNodes[i] !== newChildren[i]) {
      let child = newChildren[i]
      // let c = child._component
      let next = out.childNodes[i + 1]

      // 有下一个节点，插入到下一个节点之前
      if (next) {
        out.insertBefore(child, next)
      } else {
        // 插入到最后
        out.appendChild(child)
      }
    }
  }

  console.log('out childNodes', out.childNodes)

  return out
}

/** Virtual DOM Node */
export class VNode {
  nodeName: string | Component
  attributes: { [key: string]: any } | undefined
  children: VNode[] | undefined

  constructor(
    nodeName: string | Component,
    attributes: { [key: string]: any },
    children: VNode[] | undefined
  ) {
    /** @type {string|class} */
    this.nodeName = nodeName

    /** @type {object<string>|undefined} */
    this.attributes = attributes

    /** @type {array<VNode>|undefined} */
    this.children = children
  }
}
VNode.prototype.__isVNode = true

/** @private Invoke a "hook" method with arguments if it exists. */
function hook(obj: any, name: string, ...args: any) {
  console.log('hook method', obj, name, args)

  let fn = obj[name]
  if (fn && typeof fn === 'function') return fn.apply(obj, args)
}

/** @private Fast check if an object is a VNode. */
function isVNode(obj: VNode) {
  return obj && obj.__isVNode === true
}

/** @private Check if a value is `null` or `undefined`. */
function notEmpty(x: unknown) {
  return x !== null && x !== undefined
}

/** @private Get a node's attributes as a hashmap, regardless of type. */
function getNodeAttributes(node: VNode) {
  console.log('getNodeAttributes list', node)

  let list = node.attributes
  if (!list || !list.getNamedItem) return list
  if (list.length) return getAttributesAsObject(list)
}

/** @private Convert a DOM `.attributes` NamedNodeMap to a hashmap. */
function getAttributesAsObject(list: { [key: string]: string }) {
  console.log('getAttributesAsObject list', list)
  let attrs: { [key: string]: string } = {}
  return attrs
}

/** @private Get the value of a rendered attribute */
function getAccessor(node: HTMLElement, name: string, value: string) {
  if (name === 'class') return node.className
  if (name === 'style') return node.style.cssText
  return value
}

/** @private Set a named attribute on the given Node, with special behavior for some names and event handlers.
 *	If `value` is `null`, the attribute/handler will be removed.
 */
function setAccessor(node: HTMLElement, name: string, value: string, old: any) {
  if (name === 'class') {
    node.className = value
  } else if (name === 'style') {
    node.style.cssText = value
  } else {
    setComplexAccessor(node, name, value, old)
  }
}
/** @private For props without explicit behavior, apply to a Node as event handlers or attributes. */
function setComplexAccessor(
  node: HTMLElement,
  name: string,
  value: string,
  old: any
) {
  if (name.substring(0, 2) === 'on') {
    let type = name.substring(2).toLowerCase()
    if (type) {
      node.addEventListener(type, value as any)
    }
    return
  }

  let type = typeof value
  if (value === null) {
    node.removeAttribute(name)
  } else if (type !== 'function' && type !== 'object') {
    node.setAttribute(name, value)
  }
}

export { options, hooks, rerender }
export default { options, hooks, render, rerender, h, Component }
