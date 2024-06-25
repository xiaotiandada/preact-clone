// 一个空的对象。
// 空 ｜ 空属性
const EMPTY = {}
// 不需要渲染组件。
const NO_RENDER = { render: false }
// 同步渲染组件。
const SYNC_RENDER = { renderSync: true }
// 需要构建 DOM 元素。
const DOM_RENDER = { build: true }
// 表示一个空的基础元素。
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
  debounceRendering?: any
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
  let built = build(null, component) as (HTMLElement | Text) & {
    _component: Component
  }
  let c = built?._component
  // 执行生命周期 componentWillMount
  if (c) hook(c, 'componentWillMount')
  // 追加到元素
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
    // _dirty 和 _disableRendering 属性都是私有属性，用于表示组件是否需要重新渲染。
    this._dirty = this._disableRendering = false
    /** @public */
    // nextProps 和 base 属性都是公共属性，用于表示组件的下一个 props 和组件的根元素。
    this.nextProps = this.base = null
    /** @type {object} */
    // props 属性表示组件的当前 props，它的值是通过调用 getDefaultProps 钩子函数获取的，如果没有定义 getDefaultProps 钩子函数，则默认为一个空对象。
    this.props = hook(this, 'getDefaultProps') || {}
    /** @type {object} */
    // state 属性表示组件的当前状态，它的值是通过调用 getInitialState 钩子函数获取的，如果没有定义 getInitialState 钩子函数，则默认为一个空对象。
    this.state = hook(this, 'getInitialState') || {}
    // initialize 钩子函数会在组件实例化时被调用，用于初始化组件。
    hook(this, 'initialize')
  }

  /** Returns a `boolean` value indicating if the component should re-render when receiving the given `props` and `state`.
   *	@param {object} props
   *	@param {object} state
   */
  // @ts-ignore
  shouldComponentUpdate(props: object, state: object) {
    return true
  }

  /** Update component state by copying values from `state` to `this.state`.
   *	@param {object} state
   */
  setState(state: Record<string, any>) {
    extend(this.state, state)
    this.triggerRender()
  }

  /** Set `props` for the component.
   * 设置组件的 props 属性
   *	@param {object} props props 是一个对象，表示要设置的新的 props 值
   *	@param {object} [opts] opts 是一个可选的对象，表示一些选项，包括 renderSync 和 render。
   *	@param {object} [opts.renderSync] - If `true` and {@link options.syncComponentUpdates} is `true`, triggers synchronous rendering.
   *	@param {object} [opts.render=true] - If `false`, no render will be triggered.
   */
  setProps(
    props: Record<string, any>,
    opts: { renderSync?: boolean; render?: boolean } = EMPTY
  ) {
    let d = this._disableRendering === true
    // 先将 _disableRendering 属性设置为 true，表示禁止组件渲染。
    this._disableRendering = true
    // 然后会调用 componentWillReceiveProps 钩子函数，将 props 和 this.props 作为参数传入。
    hook(
      this,
      'componentWillReceiveProps',
      props,
      this.props
    )(
      // 接着会将 props 赋值给 nextProps 属性。
      this as Component
    ).nextProps = props
    this._disableRendering = d

    // 最后，如果 opts.renderSync 为 true，并且全局选项 options.syncComponentUpdates 也为 true，则会调用 _render 方法进行同步渲染；
    if (opts.renderSync === true && options.syncComponentUpdates === true) {
      this._render()
    } else if (opts.render !== false) {
      // 否则，会调用 triggerRender 方法，将组件标记为需要重新渲染。
      this.triggerRender()
    }
  }

  /** Mark component as dirty and queue up a render. */
  triggerRender() {
    if (this._dirty !== true) {
      this._dirty = true
      renderQueue.add(this)
    }
  }

  render(props: object, state: object) {
    console.log('Component render', props, state)
    return h(
      'div',
      { component: this.constructor.name },
      (props as any).children
    )
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
      ;(this as any).props = this.nextProps
      return
    }

    // 如果需要更新，则将this.props属性设置为this.nextProps属性，
    ;(this as any).props = this.nextProps

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
        let p = (this as any).base.parentNode
        // 替换节点
        if (p) p.replaceChild(base, this.base)
      }
      ;(this as any).base = base
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

/** Virtual DOM Node */
export class VNode {
  nodeName: string | Component
  attributes: Record<string, any> | undefined
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
;(VNode as any).prototype.__isVNode = true

/** @private Invoke a "hook" method with arguments if it exists. */
function hook(obj: any, name: string, ...args: any) {
  console.log('hook method', obj, name, args)

  let fn = obj[name]
  if (fn && typeof fn === 'function') return fn.apply(obj, args)
}

/** @private Fast check if an object is a VNode. */
function isVNode(obj: VNode) {
  return obj && (obj as any).__isVNode === true
}

/** @private Check if a value is `null` or `undefined`. */
function notEmpty(x: unknown) {
  return x !== null && x !== undefined
}

/** @private Check if two nodes are equivalent. */
function isSameNodeType(
  node: HTMLElement & { _componentConstructor: any },
  vnode: VNode
): boolean {
  if (node.nodeType === 3) {
    return typeof vnode === 'string'
  }
  let nodeName = vnode.nodeName
  if (typeof nodeName === 'function')
    return node._componentConstructor === nodeName
  return node.nodeName.toLowerCase() === nodeName
}

/**
 * buildComponentFromVNode 是 preact 中的一个函数，用于根据 VNode 对象构建组件。
 * 它接受两个参数：dom 和 vnode。其中，dom 表示要构建的组件的 DOM 元素；vnode 表示要构建的组件的 VNode 对象。
 */
/** @private Apply the component referenced by a VNode to the DOM. */
function buildComponentFromVNode(dom: any, vnode: VNode) {
  let c = dom && dom._component

  // 如果 dom 已经存在，并且它的 _componentConstructor 属性等于 vnode.nodeName，则说明这个 DOM 元素已经是一个组件的实例，此时会调用 setProps 方法更新组件的 props 属性，并返回这个 DOM 元素。
  if (c && dom._componentConstructor === vnode.nodeName) {
    let props = getNodeProps(vnode)
    c.setProps(props, SYNC_RENDER)
    return dom
  } else {
    // 会先卸载这个 DOM 元素上的组件
    if (c) unmountComponent(dom, c)
    // 然后调用 createComponentFromVNode 方法创建一个新的组件实例，并返回这个组件实例的 base 属性。
    return createComponentFromVNode(vnode)
  }
}

/** @private Instantiate and render a Component, given a VNode whose nodeName is a constructor. */
function createComponentFromVNode(vnode: VNode) {
  let component = componentRecycler.create((vnode as any).nodeName)
  console.log('component', component)

  let props = getNodeProps(vnode)
  component.setProps(props, NO_RENDER)
  component._render(DOM_RENDER)

  let node: any = component.base
  node._component = component
  node._componentConstructor = vnode.nodeName

  return node
}

/** @private Remove a component from the DOM and recycle it. */
function unmountComponent(dom: any, component: Component) {
  console.warn('unmounting mismatched component', component)

  delete dom._component
  hook(component, 'componentWillUnmount')
  let base = component.base! as HTMLElement
  if (base && base.parentNode) {
    base.parentNode.removeChild(base)
  }
  hook(component, 'componentDidUnmount')
  componentRecycler.collect(component)
}

/** @private Apply differences in a given vnode (and it's deep children) to a real DOM Node. */
function build(
  dom: any,
  vnode: VNode,
  rootComponent?: any
): HTMLElement | Text {
  let out = dom
  let nodeName = vnode.nodeName

  // 类组件｜函数组件
  if (typeof nodeName === 'function') {
    return buildComponentFromVNode(dom, vnode)
  }

  // 字符节点
  if (typeof vnode === 'string') {
    if (dom) {
      // 它会判断 dom 是否存在，如果存在，则判断 dom 的节点类型是否为文本节点（nodeType 为 3），如果是，则将 dom 的文本内容设置为 vnode，并返回 dom；
      if (dom.nodeType === 3) {
        dom.textContent = vnode
        return dom
      } else {
        // 如果 dom 的节点类型为元素节点（nodeType 为 1），则将 dom 回收到对象池中，然后返回一个新的文本节点，其文本内容为 vnode
        if (dom.nodeType === 1) recycler.collect(dom)
      }
    }
    // 如果 dom 不存在，则直接返回一个新的文本节点，其文本内容为 vnode。
    return document.createTextNode(vnode)
  }

  // 未知 nodeName
  if (nodeName === null || nodeName === undefined) {
    nodeName = 'x-undefined-element'
  }

  if (!dom) {
    // 如果 dom 不存在，则创建一个新的 DOM 元素，并将其赋值给 out。
    out = recycler.create(nodeName as string)
  } else if (dom.nodeName.toLowerCase() !== nodeName) {
    // 如果 dom 的节点名称与 vnode 的节点名称不同，则创建一个新的 DOM 元素，
    out = recycler.create(nodeName as string)
    // 并将 dom 的子节点添加到新的 DOM 元素中，
    appendChildren(out, slice.call(dom.childNodes))
    // 然后将 dom 回收到对象池中，最后将新的 DOM 元素赋值给 out。
    // reclaim element nodes
    if (dom.nodeType === 1) recycler.collect(dom)
  } else if (dom._component && dom._component !== rootComponent) {
    // 如果 dom 是一个组件，并且它的构造函数不是 rootComponent，则卸载该组件，并创建一个新的 DOM 元素，并将其赋值给 out。
    unmountComponent(dom, dom._component)
  }

  // apply attributes
  let old: Record<string, any> = getNodeAttributes(out) || EMPTY
  let attrs: Record<string, any> = vnode.attributes || EMPTY

  // removed attributes
  if (old !== EMPTY) {
    for (let name in old) {
      if (old.hasOwnProperty(name)) {
        let o = attrs[name]
        if (o === undefined || o === null || o === false) {
          setAccessor(out, name, null, old[name])
        }
      }
    }
  }

  // new & updated attributes
  if (attrs !== EMPTY) {
    for (let name in attrs) {
      if (attrs.hasOwnProperty(name)) {
        let value = attrs[name]
        if (value !== undefined && value !== null && value !== false) {
          let prev = getAccessor(out, name, old[name])
          if (value !== prev) {
            setAccessor(out, name, value, prev)
          }
        }
      }
    }
  }

  /**
   * 这段代码是 preact 中 build 函数的一部分，用于处理 out 元素的子节点。
   */

  // 将 out 元素的子节点转换为一个数组，存储到 children 变量中。
  let children = slice.call(out.childNodes)
  //  创建一个空对象 keyed，用于存储具有 key 属性的子节点。
  // 遍历完所有子节点后，keyed 对象中存储了所有具有 key 属性的子节点，children 数组中存储了所有没有 key 属性的子节点。
  let keyed: Record<string, any> = {}
  // 它会将 out 元素的子节点转换为一个数组，并遍历该数组，
  for (let i = children.length; i--; ) {
    // 将具有 key 属性的子节点存储到 keyed 对象中，同时从 children 数组中删除该子节点。
    let t = children[i].nodeType
    let key
    // 遍历 children 数组，对于每个子节点，判断其节点类型（nodeType）：
    if (t === 3) {
      // 如果节点类型为文本节点（nodeType 为 3），则将 key 设置为 t.key
      key = t.key
    } else if (t === 1) {
      //  如果节点类型为元素节点（nodeType 为 1），则将 key 设置为该节点的 key 属性。
      key = children[i].getAttribute('key')
    } else {
      // 如果子节点没有 key 属性，则不做处理。
      //  如果节点类型不是文本节点也不是元素节点，则跳过该节点。
      continue
    }
    // 如果 key 不为 undefined，则将该子节点存储到 keyed 对象中，并从 children 数组中删除该子节点。
    if (key) keyed[key] = children.splice(i, 1)[0]
  }

  /**
   * 这段代码是 preact 中 build 函数的一部分，用于处理 vnode 的子节点。
   */
  let newChildren = []

  if (vnode.children) {
    //  遍历 vnode 的子节点数组，对于每个子节点，执行以下操作：
    for (let i = 0, vlen = vnode.children.length; i < vlen; i++) {
      let vchild = vnode.children[i]
      let attrs = vchild.attributes
      // 如果该子节点具有 key 属性，则从 keyed 对象中获取对应的子节点，存储到 child 变量中。
      let key, child
      if (attrs) {
        key = attrs.key
        child = key && keyed[key]
      }

      //  如果该子节点没有 key 属性，则尝试从 out 元素的子节点中找到一个与该子节点类型相同的节点，存储到 child 变量中。
      // attempt to pluck a node of the same type from the existing children
      if (!child) {
        let len = children.length
        // 如果找到了对应的子节点，则将其从 children 数组中删除，
        if (children.length) {
          for (let j = 0; j < len; j++) {
            if (isSameNodeType(children[j], vchild)) {
              child = children.splice(j, 1)[0]
              break
            }
          }
        }
      }

      // 并将其传递给 build 函数进行深度匹配，将返回的子节点存储到 newChildren 数组中。
      // 最后，将匹配或创建的子节点添加到 newChildren 数组中。
      // morph the matched/found/created DOM child to match vchild (deep)
      newChildren.push(build(child, vchild))
    }
  }

  /**
   * 这段代码是 preact 中 build 函数的一部分，用于将构建好的子节点添加到父节点中。
   * 它会遍历 newChildren 数组，对于每个子节点，判断其是否已经存在于父节点中。
   * 如果该子节点已经存在于父节点中，则不做处理；否则，将该子节点添加到父节点中，并触发相应的生命周期方法。
   */
  // 遍历 newChildren 数组，对于每个子节点，执行以下操作：
  // apply the constructed/enhanced ordered list to the parent
  for (let i = 0, len = newChildren.length; i < len; i++) {
    // 判断该子节点是否已经存在于父节点中，如果已经存在，则不做处理。
    // we're intentionally re-referencing out.childNodes here as it is a live array (akin to live NodeList)
    if (out.childNodes[i] !== newChildren[i]) {
      // 如果该子节点不存在于父节点中，则将其添加到父节点中，并触发相应的生命周期方法：
      let child = newChildren[i],
        c = (child as any)._component,
        next = out.childNodes[i + 1]
      // 如果该子节点是组件，则触发 componentWillMount 和 componentDidMount 生命周期方法。
      if (c) hook(c, 'componentWillMount')
      // 有下一个节点插入
      if (next) {
        out.insertBefore(child, next)
      } else {
        // 没有下一个节点追加
        out.appendChild(child)
      }
      if (c) hook(c, 'componentDidMount')
    }
  }

  /**
   * 这段代码是 preact 中 build 函数的一部分，用于移除父节点中已经不存在于 vnode 中的子节点。
   */
  // remove orphaned children
  //  遍历 out 元素的子节点数组，对于每个子节点，执行以下操作：
  for (let i = 0, len = children.length; i < len; i++) {
    let child = children[i],
      c = child._component
    if (c) hook(c, 'componentWillUnmount')
    // 如果该子节点不存在于 newChildren 数组中，则将其从父节点中移除，并触发相应的生命周期方法：
    child.parentNode.removeChild(child)
    if (c) {
      // 如果该子节点是组件，则触发 componentWillUnmount 和 componentDidUnmount 生命周期方法，并将该组件回收到组件池中。
      hook(c, 'componentDidUnmount')
      componentRecycler.collect(c)
    } else if (child.nodeType === 1) {
      // 如果该子节点不是组件，则将其回收到元素池中。
      recycler.collect(child)
    }
  }

  return out
}

/**
 * 这段代码定义了一个 renderQueue 对象，用于管理需要重新渲染的组件。它包含了以下属性和方法：
 */
/** @private Managed re-rendering queue for dirty components. */
let renderQueue = {
  // 一个数组，存储需要重新渲染的组件。
  items: [],
  // 一个数组，用于在重新渲染组件时存储 items 数组的副本。
  itemsOffline: [],
  // 一个布尔值，表示是否有待处理的重新渲染请求。
  pending: false,
  // 一个方法，用于向 items 数组中添加需要重新渲染的组件。
  add(component) {
    if (renderQueue.items.push(component) !== 1) return

    // 如果 hooks.debounceRendering 存在，则调用
    let d = hooks.debounceRendering
    // 如果 items 数组中已经存在该组件，则不做处理；
    if (d) d(renderQueue.process)
    //  如果 hooks.debounceRendering 不存在
    else setTimeout(renderQueue.process, 0)
  },
  // 一个方法，用于处理需要重新渲染的组件。
  process() {
    let items = renderQueue.items
    let len = items.length
    if (!len) return
    // 将 items 数组清空，并将 itemsOffline 数组设置为 items 数组的副本。
    renderQueue.items = renderQueue.itemsOffline
    renderQueue.items.length = 0
    renderQueue.itemsOffline = items
    // loop
    while (len--) {
      // 如果需要，则调用其 _render() 方法进行重新渲染。
      if (items[len]._dirty) {
        items[len]._render()
      }
    }
  },
} as {
  items: any[]
  itemsOffline: any[]
  pending: boolean
  add: (component: any) => void
  process: () => void
}

/** @private @function Trigger all pending render() calls. */
let rerender = renderQueue.process

// 定义了一个 recycler 对象，用于回收和创建 DOM 节点。它包含了以下属性和方法
/** @private DOM node pool, keyed on nodeName. */
let recycler = {
  // 一个对象，用于存储回收的 DOM 节点。该对象的键是节点名称，值是一个数组，存储该节点名称对应的所有回收的节点。
  nodes: {},
  // 一个方法，用于回收指定的 DOM 节点。它会将该节点从其父节点中移除，并清空该节点的属性和子节点。然后，将该节点添加到 nodes 对象中对应节点名称的数组中。
  collect(node: HTMLElement) {
    //  调用 clean(node) 方法，清空该节点。
    recycler.clean(node)
    // 获取该节点的名称，并将其转换为大写形式。
    let name = recycler.normalizeName(node.nodeName)
    // 从 nodes 对象中获取该节点名称对应的数组，如果该数组存在，则将该节点添加到该数组中；否则，创建一个新的数组，并将该节点添加到该数组中，然后将该数组添加到 nodes 对象中对应节点名称的属性中。
    let list = recycler.nodes[name]
    if (list) list.push(node)
    else recycler.nodes[name] = [node]
  },
  // 一个方法，用于创建指定名称的 DOM 节点。它会从 nodes 对象中对应节点名称的数组中取出一个节点，如果该数组为空，则创建一个新的节点。然后，返回该节点。
  // 方法用于创建指定名称的 DOM 节点。它会从 nodes 对象中对应节点名称的数组中取出一个节点，如果该数组为空，则创建一个新的节点。然后，返回该节点。具体来说，它会执行以下操作：
  create(nodeName: string) {
    // 获取指定名称的节点，并将其转换为大写形式。
    let name = recycler.normalizeName(nodeName)
    // 从 nodes 对象中获取该节点名称对应的数组，如果该数组存在且不为空，则从该数组中取出一个节点并返回；否则，创建一个新的节点，并返回该节点。
    let list = recycler.nodes[name]
    return (list && list.pop()) || document.createElement(nodeName)
  },
  // 一个方法，用于清空指定的 DOM 节点。它会将该节点从其父节点中移除，并清空该节点的属性和子节点。
  clean(node: HTMLElement) {
    // 将该节点从其父节点中移除。
    node.remove()
    let len = node.attributes && node.attributes.length
    if (len)
      // 获取该节点的属性个数，并遍历该节点的所有属性，将其从该节点中移除。
      for (let i = len; i--; ) {
        node.removeAttribute(node.attributes[i].name)
      }

    // if (node.childNodes.length>0) {
    // 	console.warn(`Warning: Recycler collecting <${node.nodeName}> with ${node.childNodes.length} children.`);
    // 	slice.call(node.childNodes).forEach(recycler.collect);
    // }
  },
  // 一个方法，用于将节点名称转换为大写形式。
  normalizeName: memoize((name: string) => name.toUpperCase()),
} as {
  nodes: Record<string, HTMLElement[]>
  collect: (node: HTMLElement) => void
  create: (nodeName: string) => HTMLElement
  clean: (node: HTMLElement) => void
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
  create(ctor: any) {
    let name: string = ctor.name
    let list = componentRecycler.components[name]
    if (list && list.length) {
      return list.splice(0, 1)[0]
    }
    return new ctor()
  },
} as {
  components: Record<string, Component[]>
  collect: (component: Component) => void
  create: (ctor: Component) => Component
}

/** @private Append children to a Node.
 *	Uses a Document Fragment to batch when appending 2 or more children
 * 这是 preact 中的一个函数，用于将一个包含多个子节点的数组添加到指定的父节点中。它接受两个参数：parent 表示要添加子节点的父节点，children 表示要添加的子节点数组。
 */
function appendChildren(parent: HTMLElement, children: any[]): void {
  // 如果 children 数组的长度小于等于 2，则直接将子节点添加到父节点中。
  let len = children.length
  if (len <= 2) {
    parent.appendChild(children[0])
    if (len === 2) parent.appendChild(children[1])
    return
  }

  // 如果 children 数组的长度大于 2，则创建一个文档片段（DocumentFragment），将所有子节点添加到文档片段中，最后将文档片段添加到父节点中。这样做可以减少 DOM 操作的次数，提高性能。
  let frag = document.createDocumentFragment()
  for (let i = 0; i < len; i++) frag.appendChild(children[i])
  parent.appendChild(frag)
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
function setAccessor(node: HTMLElement, name: string, value: any, old: any) {
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
  // @ts-ignore
  old: any
) {
  if (name.substring(0, 2) === 'on') {
    let type = name.substring(2).toLowerCase(),
      // 节点设置 _listeners 存储 type: value
      l =
        (node as HTMLElement & { _listeners: Record<any, any> })._listeners ||
        ((node as HTMLElement & { _listeners: Record<any, any> })._listeners =
          {})
    if (!l[type]) node.addEventListener(type, eventProxy)
    l[type] = value
    // @TODO automatically remove proxy event listener when no handlers are left
    return
  }

  let type = typeof value
  if (value === null) {
    node.removeAttribute(name)
  } else if (type !== 'function' && type !== 'object') {
    node.setAttribute(name, value)
  }
}

/** @private Proxy an event to hooked event handlers */
function eventProxy(e: Event) {
  // console.log('eventProxy', e, this, this._listeners)
  // 通过类型读取节点存储的 _listeners
  // @ts-ignore
  let l = this._listeners
  let fn = l[normalizeEventType(e.type)]
  // @ts-ignore
  if (fn) return fn.call(this, hook(hooks, 'event', e) || e)
}

/** @private @function Normalize an event type/name to lowercase */
let normalizeEventType = memoize((type: string) => type.toLowerCase())

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

/**
* getNodeProps 是 preact 中的一个函数，用于从 VNode 中获取组件的 props 属性。
它接受一个 vnode 参数，表示要获取 props 的 VNode 对象。它会将 vnode 的 attributes 属性浅拷贝到一个新的对象中，并将 children 和 text 属性分别赋值给 props 对象的 children 和 _content 属性。最后返回这个新的 props 对象。
 */
/** @private Reconstruct `props` from a VNode */
function getNodeProps(vnode: VNode) {
  let props = extend({}, vnode.attributes as Record<string, any>)
  if (vnode.children) {
    props.children = vnode.children
  }
  if ((vnode as any).text) {
    props._content = (vnode as any).text
  }
  return props
}

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
 * 这行代码定义了一个名为jsToCss的函数，它用于将JavaScript风格的CSS属性名转换为CSS风格的属性名。
 * 具体来说，它使用正则表达式将大写字母前面添加一个短横线，并将所有字母转换为小写。例如，将backgroundColor转换为background-color。

  * 这个函数使用了memoize函数，它是一个高阶函数，用于缓存函数的计算结果。具体来说，它接受一个函数作为参数，并返回一个新的函数。新的函数会在第一次调用时计算结果，并将结果缓存起来。如果后续再次调用该函数，并且参数相同，则直接返回缓存的结果，而不是重新计算。
  * 例如，如果我们调用jsToCss('backgroundColor')，则返回'background-color'。如果我们再次调用jsToCss('backgroundColor')，则直接返回缓存的结果，而不是重新计算。
 */

/** @private @function Convert a JavaScript camel-case CSS property name to a CSS property name */
let jsToCss = memoize((s: string) => s.replace(/([A-Z])/, '-$1').toLowerCase())

/** @private Copy own-properties from `props` onto `obj`. Returns `obj`. */
function extend(obj: Record<string, any>, props: Record<string, any>) {
  for (let i in props)
    if (props.hasOwnProperty(i)) {
      obj[i] = props[i]
    }
  return obj
}

// 导出
export { options, hooks, rerender }
export default { options, hooks, render, rerender, h, Component }
