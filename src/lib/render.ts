import { EMPTY_OBJ } from "./constants";
import { Fragment, createElement } from "./create-element";
import { commitRoot, diff } from './diff/index';

/**
 * Render a Preact virtual node into a DOM element
 * @param {ComponentChild} vnode The virtual node to render
 * @param {PreactElement} parentDom The DOM element to render into
 * @param {PreactElement | object} [replaceNode] Optional: Attempt to re-use an
 * existing DOM tree rooted at `replaceNode`
 */
export function render(vnode, parentDom, replaceNode) {
	vnode = ((replaceNode) || parentDom)._children =
		createElement(Fragment, null, [vnode]);

		console.log('vnode', vnode)


	// List of effects that need to be called after diffing.
	let commitQueue = [],
		refQueue = [];
	diff(
		parentDom,
		// Determine the new vnode tree and store it on the DOM element on
		// our custom `_children` property.
		vnode,
		EMPTY_OBJ,
		EMPTY_OBJ,
		parentDom.namespaceURI,
		null,
		commitQueue,
		replaceNode,
		false,
		refQueue
	);


		// Flush all queued effects
		// commitRoot(commitQueue, vnode, refQueue);
}