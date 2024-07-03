
/**
 * Diff two virtual nodes and apply proper changes to the DOM
 * @param {PreactElement} parentDom The parent of the DOM element
 * @param {VNode} newVNode The new virtual node
 * @param {VNode} oldVNode The old virtual node
 * @param {object} globalContext The current context object. Modified by
 * getChildContext
 * @param {string} namespace Current namespace of the DOM node (HTML, SVG, or MathML)
 * @param {Array<PreactElement>} excessDomChildren
 * @param {Array<Component>} commitQueue List of components which have callbacks
 * to invoke in commitRoot
 * @param {PreactElement} oldDom The current attached DOM element any new dom
 * elements should be placed around. Likely `null` on first render (except when
 * hydrating). Can be a sibling DOM element when diffing Fragments that have
 * siblings. In most cases, it starts out as `oldChildren[0]._dom`.
 * @param {boolean} isHydrating Whether or not we are in hydration
 * @param {any[]} refQueue an array of elements needed to invoke refs
 */
export function diff(
  parentDom,
  newVNode,
  oldVNode,
  globalContext,
  namespace,
  excessDomChildren,
  commitQueue,
  oldDom,
  isHydrating,
  refQueue
) {
  /** @type {any} */
  let tmp,
    newType = newVNode.type;


  newVNode._dom = diffElementNodes(
    oldVNode._dom,
    newVNode,
    oldVNode,
    globalContext,
    namespace,
    excessDomChildren,
    commitQueue,
    isHydrating,
    refQueue
  );

}


/**
 * Diff two virtual nodes representing DOM element
 * @param {PreactElement} dom The DOM element representing the virtual nodes
 * being diffed
 * @param {VNode} newVNode The new virtual node
 * @param {VNode} oldVNode The old virtual node
 * @param {object} globalContext The current context object
 * @param {string} namespace Current namespace of the DOM node (HTML, SVG, or MathML)
 * @param {Array<PreactElement>} excessDomChildren
 * @param {Array<Component>} commitQueue List of components which have callbacks
 * to invoke in commitRoot
 * @param {boolean} isHydrating Whether or not we are in hydration
 * @param {any[]} refQueue an array of elements needed to invoke refs
 * @returns {PreactElement}
 */
function diffElementNodes(
  dom,
  newVNode,
  oldVNode,
  globalContext,
  namespace,
  excessDomChildren,
  commitQueue,
  isHydrating,
  refQueue
) {
  let oldProps = oldVNode.props;
  let newProps = newVNode.props;
  let nodeType = /** @type {string} */ (newVNode.type);
  /** @type {any} */
  let i;
  /** @type {{ __html?: string }} */
  let newHtml;
  /** @type {{ __html?: string }} */
  let oldHtml;
  /** @type {ComponentChildren} */
  let newChildren;
  let value;
  let inputValue;
  let checked;

  // Tracks entering and exiting namespaces when descending through the tree.
  if (nodeType === 'svg') namespace = 'http://www.w3.org/2000/svg';
  else if (nodeType === 'math')
    namespace = 'http://www.w3.org/1998/Math/MathML';
  else if (!namespace) namespace = 'http://www.w3.org/1999/xhtml';


  return dom;
}