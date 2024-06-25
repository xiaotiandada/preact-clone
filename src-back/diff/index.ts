import { ContainerNode, VNode } from 'preact'
import { EMPTY_OBJ } from '../constants'
import { isArray } from '../util'
import { diffChildren } from './children'
import { diffProps, setProperty } from './props'
import { Fragment } from '../create-element'
import { diffChildren as diffChildrenPreact } from '../../node_modules/preact/src/diff/children'

function diffElementNodes(
  dom,
  newVNode,
  oldVNode,
  globalContext,
  isSvg,
  excessDomChildren,
  commitQueue,
  isHydrating,
  refQueue
) {
  let oldProps = oldVNode?.props || {}
  let newProps = newVNode?.props || {}
  let nodeType = newVNode.type
  let i = 0

  console.log(
    'diffElementNodes',
    dom,
    newVNode,
    oldVNode,
    globalContext,
    isSvg,
    excessDomChildren,
    commitQueue,
    isHydrating,
    refQueue
  )

  // Tracks entering and exiting SVG namespace when descending through the tree.
  if (nodeType === 'svg') isSvg = true

  if (dom == null) {
    if (nodeType === null) {
      // @ts-ignore createTextNode returns Text, we expect PreactElement
      return document.createTextNode(newProps)
    }

    if (isSvg) {
      dom = document.createElementNS(
        'http://www.w3.org/2000/svg',
        // @ts-ignore We know `newVNode.type` is a string
        nodeType
      )
    } else {
      dom = document.createElement(nodeType)
    }

    // we created a new parent, so none of the previously attached children can be reused:
    excessDomChildren = null
    // we are creating a new node, so we can assume this is a new subtree (in case we are hydrating), this deopts the hydrate
    isHydrating = false
  }

  if (nodeType === null) {
    //
  } else {
    //

    oldProps = oldVNode?.props || EMPTY_OBJ

    let oldHtml = oldProps.dangerouslySetInnerHTML
    let newHtml = newProps.dangerouslySetInnerHTML

    if (!isHydrating) {
      //
    }

    diffProps(dom, newProps, oldProps, isSvg, isHydrating)

    // If the new vnode didn't have dangerouslySetInnerHTML, diff its children
    if (newHtml) {
      //
    } else {
      i = newVNode.props.children
      diffChildrenPreact(
        dom,
        isArray(i) ? i : [i],
        newVNode,
        oldVNode,
        globalContext,
        isSvg && nodeType !== 'foreignObject',
        excessDomChildren,
        commitQueue,
        excessDomChildren ? excessDomChildren[0] : oldVNode?._children,
        isHydrating,
        refQueue
      )
    }

    // Remove children that are not part of any vnode.
    if (excessDomChildren != null) {
      //
    }
  }

  return dom
}

/**
 * 这是一个用于比较新旧虚拟节点的方法。它接收多个参数，包括父节点的 DOM 元素、新的虚拟节点、旧的虚拟节点等等。
 * 它会根据新旧虚拟节点的类型，分别调用不同的比较方法，如 diffElementNodes、diffChildren 等等。
 * 在比较过程中，它会根据需要更新虚拟节点的 _dom 属性、_children 属性等等，并将需要执行的操作添加到 commitQueue 中。
 * 如果比较过程中出现错误，它会将新的虚拟节点的 _original 属性设置为 null，并将其 _dom 属性设置为旧的虚拟节点的 _dom 属性，以便在后续的处理中进行回退。
 * @param parentDom
 * @param newVNode
 * @param oldVNode
 * @param globalContext
 * @param isSvg
 * @param excessDomChildren
 * @param commitQueue
 * @param oldDom
 * @param isHydrating
 * @param refQueue
 * @returns
 */
export function diff(
  parentDom: ContainerNode,
  newVNode: VNode,
  oldVNode: VNode,
  globalContext: any,
  isSvg: boolean,
  excessDomChildren: any,
  commitQueue: any[],
  oldDom,
  isHydrating: boolean,
  refQueue: any[]
) {
  console.log(
    'diff',
    parentDom,
    newVNode,
    oldVNode,
    globalContext,
    isSvg,
    excessDomChildren,
    commitQueue,
    oldDom,
    isHydrating,
    refQueue
  )

  let tmp,
    newType = newVNode?.type

  console.log('diff newType', newType, newVNode, newVNode?.type)

  // When passing through createElement it assigns the object
  // constructor as undefined. This to prevent JSON-injection.
  if (newVNode.constructor !== undefined) return null

  // If the previous diff bailed out, resume creating/hydrating.
  // @TODO: oldVNode._hydrating
  if (oldVNode?._hydrating != null) {
    //
  }

  // 如果是 function，那么就是组件或者 Fragment
  // label https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/label
  outer: if (typeof newType === 'function') {
    //
    try {
      let c, isNew, oldProps, oldState, snapshot, clearProcessingException
      let newProps = newVNode.props

      // Necessary for createContext api. Setting this property will pass
      // the context value as `this.context` just for this component.
      // tmp = newType.contextType

      console.log('outer function')

      // Get component and set it to `c`
      if (oldVNode?._component) {
        // c = newVNode._component = oldVNode._component
      } else {
        //
      }

      // c.context = null
      // c.props = newProps
      // c._parentDom = parentDom
      // c._force = false

      console.log('diffChildren', c)

      /**
       * 这段代码的作用是判断 tmp 是否为顶层的 Fragment 组件，并将其子节点赋值给 renderResult 变量。
       * 如果 tmp 不是 Fragment 组件，那么直接将其赋值给 renderResult 变量。
       * 这个判断的目的是为了处理 Fragment 组件的情况，因为 Fragment 组件本身不会被渲染到 DOM 中，而是将其子节点渲染到 DOM 中。
       * 因此，如果 tmp 是顶层的 Fragment 组件，那么需要将其子节点作为 renderResult，否则直接将 tmp 作为 renderResult。
       */
      let isTopLevelFragment =
        tmp != null && tmp.type === Fragment && tmp.key == null
      let renderResult = isTopLevelFragment ? tmp.props.children : tmp
      diffChildrenPreact(
        parentDom,
        isArray(renderResult) ? renderResult : [renderResult],
        newVNode,
        oldVNode,
        globalContext,
        isSvg,
        excessDomChildren,
        commitQueue,
        oldDom,
        isHydrating,
        refQueue
      )
    } catch (error) {
      console.log('error', error)
    }
  } else if (false) {
    console.log('2')
  } else {
    console.log('3')
    newVNode._dom = diffElementNodes(
      // @TODO: oldVNode._dom
      oldVNode?._dom,
      newVNode,
      oldVNode,
      globalContext,
      isSvg,
      excessDomChildren,
      commitQueue,
      isHydrating,
      refQueue
    )
  }
}

export function commitRoot(commitQueue, root, refQueue) {
  console.log('commitRoot', commitQueue, root, refQueue)
}
