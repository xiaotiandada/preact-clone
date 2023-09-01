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

type Hooks = {
  vnode?: ({ attributes }: { attributes: { [key: string]: any } }) => void
}
/** @public @object Global hook methods */
let hooks: Hooks = {}

/** @public Render JSX into a `parent` Element.
 * Component是一个基础组件，类似于React中的组件。
 * 它有一些生命周期方法，例如shouldComponentUpdate和render，以及一些用于更新组件状态和属性的方法，例如setState和setProps。triggerRender方法将组件标记为脏，并将其排队以进行渲染。
 * _render方法将组件渲染到DOM中。
 */
export function render(component: any, parent: HTMLElement): any {
  console.log('render', component, parent)
  let built = build(null, component)
  let c = built?._component
  // 执行生命周期 componentWillMount
  if (c) hook(c, 'componentWillMount')
  parent.appendChild(built)
  // 执行生命周期 componentDidMount
  if (c) hook(c, 'componentDidMount')

  return build
}

/**
 * 例如，如果我们有以下JSX代码：
 * <div className="foo" style={{ color: 'red' }}>Hello, World!</div>
 * 那么在解析这段代码时，attributes对象将包含className和style属性。在执行到这段代码时，它将检查attributes对象是否包含style属性，如果包含，则将其转换为CSS样式字符串。然后，它将检查attributes对象是否包含className属性，如果包含，则将其值赋给c变量，并将className属性删除。最后，它将检查c变量是否存在，并且是否不是一个字符串。如果是，则将其转换为一个CSS类名，并将其设置为attributes对象的class属性。
 */
/** @protected Processes all created VNodes */
hooks.vnode = ({ attributes }) => {
  console.log('hooks.vnode', attributes)
  // 检查虚拟DOM节点的attributes属性，如果存在，则会对其进行处理。
  if (!attributes) return

  // 检查attributes对象中是否包含style属性。如果存在，并且style属性不是一个字符串，则将其转换为CSS样式字符串，并将其设置为attributes对象的style属性。
  let s = attributes.style
  if (s && !s.substring) {
    attributes.style = styleObjToCss(s)
  }

  // 检查attributes对象中是否包含className属性。如果存在，则将其值赋给c变量，并将className属性删除。然后，它检查c变量是否存在，并且是否不是一个字符串。如果是，则将其转换为一个CSS类名，并将其设置为attributes对象的class属性。
  let c = attributes['class']
  if (attributes.hasOwnProperty('className')) {
    c = attributes['class'] = attributes.className
    delete attributes.className
  }
  if (c && !c.substring) {
    attributes['class'] = hashToClassName(c)
  }
}

/** @public Base Component, with API similar to React. */
export class Component {
  _dirty: boolean
  _disableRendering: boolean
  nextProps: null
  base: null
  props: object
  state: object
  constructor() {
    /** @private */
    this._dirty = this._disableRendering = false
    /** @public */
    this.nextProps = this.base = null
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

  // 这段代码定义了一个名为_render的方法，它用于渲染组件并更新DOM。
  // 这个方法是Preact中组件更新的核心方法，它会在组件状态或属性发生变化时被调用，用于重新渲染组件并更新DOM。
  /** @private */
  _render(opts = EMPTY) {
    // 检查this._disableRendering属性是否为true，如果是，则直接返回。
    if (this._disableRendering === true) return

    // 否则，它将this._dirty属性设置为false，表示组件已经渲染完成。
    this._dirty = false

    // 检查this.base属性是否存在，并且调用hook(this, 'shouldComponentUpdate', this.props, this.state)方法来判断组件是否需要更新。
    if (
      this.base &&
      hook(this, 'shouldComponentUpdate', this.props, this.state) === false
    ) {
      // 如果不需要更新，则将this.props属性设置为this.nextProps属性，并直接返回。
      this.props = this.nextProps
      return
    }

    // 如果需要更新，则将this.props属性设置为this.nextProps属性，
    this.props = this.nextProps

    // 生命周期
    // 并调用hook(this, 'componentWillUpdate')方法。
    hook(this, 'componentWillUpdate')

    // 调用hook(this, 'render', this.props, this.state)方法来获取组件的虚拟DOM树。
    let rendered = hook(this, 'render', this.props, this.state)

    // 检查this.base属性是否存在或者opts.build属性是否为true
    if (this.base || (opts as typeof DOM_RENDER).build === true) {
      // 调用build方法来创建DOM节点，并将其添加到父节点中
      let base = build(this.base, rendered || EMPTY_BASE, this)
      // 如果this.base属性存在，并且新创建的DOM节点与旧的DOM节点不同，则将新的DOM节点替换旧的DOM节点。
      if (this.base && base !== this.base) {
        let p = this.base.parentNode
        if (p) p.replaceChild(base, this.base)
      }
      this.base = base
    }

    // 生命周期
    // 调用hook(this, 'componentDidUpdate')方法来通知组件已经更新完成。
    hook(this, 'componentDidUpdate')
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
  attributes: { [key: string]: string | number | object },
  ...args: any
) {
  console.log('h', nodeName, attributes, args)

  let children
  let sharedArr: any = []
  let len = args.length
  let arr: any[] | undefined
  let lastSimple

  if (len) {
    children = []
    for (let i = 0; i < len; i++) {
      let p = args[i]
      // 过滤 null、 undefined

      /**
       * 这段代码是JSX/hyperscript解析器中的一部分，用于将JSX/hyperscript语法中的子节点转换为一个数组。
       * 在Preact中，子节点可以是一个单独的元素，也可以是一个包含多个元素的数组。
       * 因此，这段代码的作用是将子节点转换为一个数组，以便在后续的处理中更方便地操作。
       *
       * 具体来说，这段代码首先检查当前子节点是否为null或undefined，如果是，则跳过当前循环。否则，它检查当前子节点是否为一个数组，如果是，则将其赋值给arr变量。
       * 否则，它将当前子节点放入一个共享的数组sharedArr中，并将sharedArr赋值给arr变量。这样，无论当前子节点是一个单独的元素还是一个包含多个元素的数组，最终都会被转换为一个数组arr。
       *
       * 那么在解析这段代码时，args数组将包含两个元素：一个span元素和一个字符串“World!”。在执行到这段代码时，它将把这两个元素放入一个数组中，以便在后续的处理中更方便地操作。
       */
      if (p === null || p === undefined) continue

      // p 是一个数组，arr 设置为 p
      if (p.join) {
        arr = p
      } else {
        // 不是数组，设置默认值。设置数组第一个元素为 p
        arr = sharedArr
        arr![0] = p
      }

      for (let j = 0; j < arr!.length; j++) {
        let child = arr![j]
        // 简单元素
        let simple = notEmpty(child) && !isVNode(child)
        if (simple) {
          // 文本节点
          child = String(child)
        }
        // 是一个不为空的简单元素，并且有内容
        if (simple && lastSimple) {
          /**
           * 这行代码是JSX/hyperscript解析器中的一部分，用于将相邻的文本节点合并为一个文本节点。
           * 如果当前子节点是一个文本节点，并且上一个子节点也是文本节点，则将它们合并为一个文本节点。否则，将当前子节点添加到子节点列表中。
           *
           * <div>Hello, {'world!'}</div>
           * 那么在解析这段代码时，children数组将包含两个元素：一个字符串“Hello, ”和一个字符串“world!”。在执行到这行代码时，它将把这两个字符串合并为一个字符串“Hello, world!”，并将其设置为children数组的最后一个元素。
           */
          children[children.length - 1] += child
        } else if (notEmpty(child)) {
          children.push(child)
        }

        // 设置最后一个元素
        lastSimple = simple
      }
    }
  }

  /**
   * 这行代码是JSX/hyperscript解析器中的一部分，用于删除attributes对象中的children属性。
   * 在Preact中，children属性是一个特殊的属性，用于表示当前节点的子节点。
   * 但是，当我们使用JSX/hyperscript语法时，我们通常会将子节点作为当前节点的参数传递，而不是将它们作为children属性传递。
   * 因此，这行代码的作用是确保attributes对象中不包含children属性，以避免与传递给当前节点的子节点发生冲突。
   *
   * 那么在解析这段代码时，attributes对象将不包含children属性，因为子节点是作为当前节点的参数传递的。在执行到这行代码时，它将检查attributes对象是否包含children属性，如果包含，则将其删除。
   */
  if (attributes && attributes.children) {
    delete attributes.children
  }

  let p = new VNode(nodeName, attributes || undefined, children || undefined)
  hook(hooks, 'vnode', p)
  return p
}

/** @private Apply the component referenced by a VNode to the DOM. */
function buildComponentFromVNode(dom: any, vnode: VNode) {
  console.log('Building Component', dom, vnode)
  let c = dom && dom._component
  if (c) {
    // ...
  } else {
    if (c) {
      // ...
    }
    return createComponentFromVNode(vnode)
  }
}
/** @private Instantiate and render a Component, given a VNode whose nodeName is a constructor. */
function createComponentFromVNode(vnode: VNode) {
  let component = componentRecycler.create(vnode.nodeName)
  console.log('component', component)

  let props = {}
  component.setProps(props, NO_RENDER)
  component._render(DOM_RENDER)

  let node = component.base
  node._component = component
  node._componentConstructor = vnode.nodeName

  return node
}

/** @private Apply differences in a given vnode (and it's deep children) to a real DOM Node. */
function build(dom: any, vnode: VNode, rootComponent?: unknown) {
  //
  console.log('build', dom, dom?.nodeName, vnode, rootComponent)

  let out = dom
  let nodeName: string | Component = vnode.nodeName

  if (typeof nodeName === 'function') {
    return buildComponentFromVNode(dom, vnode)
  }

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

/** @private Managed re-rendering queue for dirty components. */
let renderQueue = {
  items: [],
  itemsOffline: [],
  pending: false,
  add(component) {
    //
  },
  process() {
    //
  },
}

/** @private @function Trigger all pending render() calls. */
let rerender = renderQueue.process

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

/**
 * 这段代码定义了一个名为componentRecycler的对象，它用于缓存和重用组件实例。
 * 具体来说，它维护了一个以组件名称为键的对象，每个键对应一个组件实例列表。当需要创建一个新的组件实例时，它会首先检查该组件名称对应的实例列表是否存在，如果存在，则从列表中取出一个实例并返回。否则，它将创建一个新的组件实例并返回。
 * 
 * 例如，如果我们有以下组件定义：
  class MyComponent extends Component {
  // ...
  }
 * 那么在创建一个新的MyComponent实例时，可以使用componentRecycler.create(MyComponent)方法。如果之前已经创建过一个MyComponent实例并将其添加到缓存中，则可以使用componentRecycler.create(MyComponent)方法从缓存中取出该实例并返回。这样可以避免重复创建实例，提高性能。
 */
/** @private Retains a pool of Components for re-use, keyed on component name. */
let componentRecycler = {
  components: {},
  // collect方法用于将一个组件实例添加到缓存中。它接受一个组件实例作为参数，并根据该实例的构造函数名称将其添加到对应的实例列表中。如果该列表不存在，则会创建一个新的列表。
  collect(component: Component) {
    let name = component.constructor.name
    let list =
      componentRecycler.components[name] ||
      (componentRecycler.components[name] = [])
    list.push(component)
  },
  // create方法用于创建一个新的组件实例。它接受一个组件构造函数作为参数，并根据该构造函数的名称从对应的实例列表中取出一个实例。如果该列表不存在或为空，则会创建一个新的组件实例并返回。
  create(ctor) {
    let name = ctor.name
    let list = componentRecycler.components[name]
    if (list && list.length) {
      return list.splice(0, 1)[0]
    }
    return new ctor()
  },
}

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
  /**
   * list.getNamedItem是一个DOM API，用于获取指定名称的属性节点。在这段代码中，它被用于检查node.attributes对象是否包含getNamedItem方法，以确定该对象是否是一个有效的属性列表。
   * 具体来说，node.attributes是一个NamedNodeMap对象，它表示一个元素节点的所有属性节点。getNamedItem方法接受一个属性名称作为参数，并返回该属性的节点对象。如果该属性不存在，则返回null。
   */
  if (!list || !list.getNamedItem) return list
  if (list.length) return getAttributesAsObject(list as NamedNodeMap)
}

/** @private Convert a DOM `.attributes` NamedNodeMap to a hashmap. */
function getAttributesAsObject(list: NamedNodeMap): { [key: string]: string } {
  console.log('getAttributesAsObject list', list)
  let attrs: { [key: string]: string } = {}
  for (let i = list.length; i--; ) {
    let item = list[i]
    attrs[item.name] = item.value
  }
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
    let l = node._listeners || (node._listeners = {})

    if (!l[type]) node.addEventListener(type, eventProxy)
    l[type] = value
    return
  }

  let type = typeof value
  if (value === null) {
    node.removeAttribute(name)
  } else if (type !== 'function' && type !== 'object') {
    node.setAttribute(name, value)
  }
}

function eventProxy(e: Event) {
  console.log('eventProxy', e, this, this._listeners)
  let l = this._listeners
  let fn = l[normalizeEventType(e.type)]
  if (fn) return fn.call(this, hook(hooks, 'event', e) || e)
}

/** @private @function Normalize an event type/name to lowercase */
let normalizeEventType = memoize((type: string) => type.toLowerCase())

/** @private Convert a hashmap of styles to CSSText */
function styleObjToCss(s: { [key: string]: any }): string {
  let str = ''
  let sep = ': '
  let term = '; '
  for (let prop in s) {
    // css 属性拼接
    if (s.hasOwnProperty(prop)) {
      let val = s[prop]
      str += jsToCss(prop)
      str += sep
      str += val
      // 数字处理
      if (
        typeof val === 'number' &&
        !NON_DIMENSION_PROPS.hasOwnProperty(prop)
      ) {
        str += 'px'
      }
      str += term
    }
  }
  return str
}

/** @private Convert a hashmap of CSS classes to a space-delimited className string */
function hashToClassName(c: { [key: string]: any }): string {
  let str = ''
  for (let prop in c) {
    if (c[prop]) {
      if (str) str += ' '
      str += prop
    }
  }
  return str
}

/**
 * 这行代码定义了一个名为jsToCss的函数，它用于将JavaScript风格的CSS属性名转换为CSS风格的属性名。具体来说，它使用正则表达式将大写字母前面添加一个短横线，并将所有字母转换为小写。例如，将backgroundColor转换为background-color。

这个函数使用了memoize函数，它是一个高阶函数，用于缓存函数的计算结果。具体来说，它接受一个函数作为参数，并返回一个新的函数。新的函数会在第一次调用时计算结果，并将结果缓存起来。如果后续再次调用该函数，并且参数相同，则直接返回缓存的结果，而不是重新计算。

例如，如果我们调用jsToCss('backgroundColor')，则返回'background-color'。如果我们再次调用jsToCss('backgroundColor')，则直接返回缓存的结果，而不是重新计算。
 */

/** @private @function Convert a JavaScript camel-case CSS property name to a CSS property name */
let jsToCss = memoize((s: string) => s.replace(/([A-Z])/, '-$1').toLowerCase())

export { options, hooks, rerender }
export default { options, hooks, render, rerender, h, Component }
