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
  let oldProps = oldVNode.props
  let newProps = newVNode.props
  let nodeType = newVNode.type

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

  if (dom == null) {
    if (nodeType === null) {
      // @ts-ignore createTextNode returns Text, we expect PreactElement
      return document.createTextNode(newProps)
    }

    if (false) {
      dom = document.createElementNS(
        'http://www.w3.org/2000/svg',
        // @ts-ignore We know `newVNode.type` is a string
        nodeType
      )
    } else {
      dom = document.createElement(nodeType)
      dom.innerText = 'hi'
    }
  }

  return dom
}

export function diff(
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
    newType = newVNode.type

  // label https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/label
  outer: if (typeof newType === 'function') {
  } else if (false) {
    console.log('2')
  } else {
    console.log('3')
    newVNode._dom = diffElementNodes(
      oldVNode._dom,
      newVNode,
      oldVNode,
      globalContext,
      isSvg,
      excessDomChildren,
      commitQueue,
      isHydrating,
      refQueue
    )

    parentDom.appendChild(newVNode._dom)
  }
}

export function commitRoot(commitQueue, root, refQueue) {
  console.log('commitRoot', commitQueue, root, refQueue)
}
