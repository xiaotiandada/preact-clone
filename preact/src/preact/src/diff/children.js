import { diff, unmount, applyRef } from './index';
import { createVNode, Fragment } from '../create-element';
import { EMPTY_OBJ, EMPTY_ARR, INSERT_VNODE, MATCHED } from '../constants';
import { isArray } from '../util';
import { getDomSibling } from '../component';

/**
 * Diff the children of a virtual node
 * @param {PreactElement} parentDom The DOM element whose children are being
 * diffed
 * @param {ComponentChildren[]} renderResult
 * @param {VNode} newParentVNode The new virtual node whose children should be
 * diff'ed against oldParentVNode
 * @param {VNode} oldParentVNode The old virtual node whose children should be
 * diff'ed against newParentVNode
 * @param {object} globalContext The current context object - modified by
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
 * 
 该函数diffChildren是Preact框架中用于比较并更新一组子虚拟节点（children）与它们对应的DOM元素。它是虚拟DOM（VDOM）差异算法的一部分，确保用户界面能够高效地响应状态变化。以下是该函数的主要职责和逻辑流程：

函数目的
对比子节点：对新虚拟节点树(renderResult)与旧虚拟节点树(oldChildren)进行逐个对比，找出差异。
DOM更新：基于差异，仅对必要的部分更新DOM，包括添加、移动或删除DOM元素。
组件生命周期：处理组件的引用（ref）更新，以及组件内部的DOM操作。
优化重排：通过调整DOM操作顺序，减少页面重排和重绘，提升性能。
参数说明
parentDom: 父DOM元素，子节点将被插入或更新于此。
renderResult: 表示新虚拟节点树的数组，即需要渲染的子节点列表。
newParentVNode, oldParentVNode: 分别表示新的和旧的父虚拟节点。
globalContext, namespace, excessDomChildren, commitQueue, oldDom, isHydrating, refQueue等参数，为辅助信息，帮助处理上下文、命名空间、多余的DOM子元素、组件更新队列、hydration状态、以及引用队列等。
核心逻辑
构造新子节点数组：通过constructNewChildrenArray函数为新父虚拟节点构建带有索引信息的子节点数组，便于后续匹配。
遍历新子节点：按顺序遍历新虚拟节点列表，对于每个子节点：
确定其在旧子节点列表中的匹配项（如果有）。
调用diff函数递归地比较当前子节点与其匹配的旧子节点，并更新DOM。
处理组件的引用更新，将新引用推入refQueue以便稍后处理。
调整DOM结构，根据需要插入或移动节点。
清理与更新：在每个子节点处理后，清除临时的_nextDom属性，并重置差异标识符。
父节点的_nextDom更新：最后，更新父虚拟节点的_nextDom属性，为下一次迭代准备。
特别注意
hydration：在hydration模式下，该函数会跳过某些不必要的DOM操作，充分利用服务器渲染的DOM结构。
优化策略：通过复用现有DOM元素、减少不必要的DOM操作，以及对组件和Fragment的特殊处理，该函数旨在提高渲染性能。
引用管理：确保组件的引用在更新前后得到正确处理，这对于触发外部副作用（如回调函数）至关重要。
 */
export function diffChildren(
	parentDom,
	renderResult,
	newParentVNode,
	oldParentVNode,
	globalContext,
	namespace,
	excessDomChildren,
	commitQueue,
	oldDom,
	isHydrating,
	refQueue
) {
	debugger;
	console.log('diffChildren', parentDom, renderResult, newParentVNode, oldParentVNode)

	let i,
		/** @type {VNode} */
		oldVNode,
		/** @type {VNode} */
		childVNode,
		/** @type {PreactElement} */
		newDom,
		/** @type {PreactElement} */
		firstChildDom;

	// This is a compression of oldParentVNode!=null && oldParentVNode != EMPTY_OBJ && oldParentVNode._children || EMPTY_ARR
	// as EMPTY_OBJ._children should be `undefined`.
	/** @type {VNode[]} */
	let oldChildren = (oldParentVNode && oldParentVNode._children) || EMPTY_ARR;

	let newChildrenLength = renderResult.length;

	// 构造新子节点数组：通过constructNewChildrenArray函数为新父虚拟节点构建带有索引信息的子节点数组，便于后续匹配。
	newParentVNode._nextDom = oldDom;
	constructNewChildrenArray(newParentVNode, renderResult, oldChildren);
	oldDom = newParentVNode._nextDom;

	for (i = 0; i < newChildrenLength; i++) {
		childVNode = newParentVNode._children[i];
		if (
			childVNode == null ||
			typeof childVNode == 'boolean' ||
			typeof childVNode == 'function'
		) {
			continue;
		}

		// At this point, constructNewChildrenArray has assigned _index to be the
		// matchingIndex for this VNode's oldVNode (or -1 if there is no oldVNode).
		if (childVNode._index === -1) {
			oldVNode = EMPTY_OBJ;
		} else {
			oldVNode = oldChildren[childVNode._index] || EMPTY_OBJ;
		}

		// Update childVNode._index to its final index
		childVNode._index = i;

		// Morph the old element into the new one, but don't append it to the dom yet
		diff(
			parentDom,
			childVNode,
			oldVNode,
			globalContext,
			namespace,
			excessDomChildren,
			commitQueue,
			oldDom,
			isHydrating,
			refQueue
		);

		// Adjust DOM nodes
		newDom = childVNode._dom;
		if (childVNode.ref && oldVNode.ref != childVNode.ref) {
			if (oldVNode.ref) {
				applyRef(oldVNode.ref, null, childVNode);
			}
			refQueue.push(
				childVNode.ref,
				childVNode._component || newDom,
				childVNode
			);
		}

		// 目的：记录第一个新创建的子DOM节点，用于后续更新父节点的起始DOM位置。
		// 条件：当firstChildDom尚未被赋值且当前处理的子节点newDom存在时。

		if (firstChildDom == null && newDom != null) {
			firstChildDom = newDom;
		}

// 		条件1：childVNode._flags包含INSERT_VNODE标志，意味着此节点需要被插入。
// 条件2：旧节点和新节点的子节点完全相同，这可能是在处理Fragment或类似的特殊节点结构。
// 逻辑：如果当前节点需要插入或特殊处理，首先检查oldDom是否有效且新节点为原生DOM类型且不在parentDom中，此时通过getDomSibling调整oldDom的位置。然后，使用insert函数处理节点的插入或移动操作，并更新oldDom为插入后的新位置。
		if (
			childVNode._flags & INSERT_VNODE ||
			oldVNode._children === childVNode._children
		) {
			if (
				oldDom &&
				typeof childVNode.type == 'string' &&
				// @ts-expect-error olDom should be present on a DOM node
				!parentDom.contains(oldDom)
			) {
				oldDom = getDomSibling(oldVNode);
			}
			oldDom = insert(childVNode, oldDom, parentDom);
		} else if (
// 			条件：当前子节点是函数组件或返回类似Fragment的VNode，并且已知下一个DOM位置。
// 逻辑：直接将oldDom设置为childVNode._nextDom，以便继续从该组件或Fragment的下一个兄弟节点开始差异比较。
			typeof childVNode.type == 'function' &&
			childVNode._nextDom !== undefined
		) {
			// Since Fragments or components that return Fragment like VNodes can
			// contain multiple DOM nodes as the same level, continue the diff from
			// the sibling of last DOM child of this child VNode
			oldDom = childVNode._nextDom;
		} else if (newDom) {
			// 条件：没有插入或特殊处理的需求，且当前节点有对应的DOM。
// 逻辑：简单地将oldDom设置为当前新DOM节点的下一个兄弟节点，为下一个节点的比较做准备。
			oldDom = newDom.nextSibling;
		}

		// 清理：立即将childVNode._nextDom设为undefined，因为其值已用于计算或已无后续用途，避免内存泄漏和不必要的引用。
// 状态重置：通过位运算清除了childVNode._flags中的INSERT_VNODE和MATCHED标志，这些标志在本次比较中已经处理完毕，重置它们可以避免影响后续的比较过程。

		// Eagerly cleanup _nextDom. We don't need to persist the value because it
		// is only used by `diffChildren` to determine where to resume the diff
		// after diffing Components and Fragments. Once we store it the nextDOM
		// local var, we can clean up the property. Also prevents us hanging on to
		// DOM nodes that may have been unmounted.
		childVNode._nextDom = undefined;

		// Unset diffing flags
		childVNode._flags &= ~(INSERT_VNODE | MATCHED);
	}

	// TODO: With new child diffing algo, consider alt ways to diff Fragments.
	// Such as dropping oldDom and moving fragments in place
	//
	// Because the newParentVNode is Fragment-like, we need to set it's
	// _nextDom property to the nextSibling of its last child DOM node.
	//
	// `oldDom` contains the correct value here because if the last child
	// is a Fragment-like, then oldDom has already been set to that child's _nextDom.
	// If the last child is a DOM VNode, then oldDom will be set to that DOM
	// node's nextSibling.
	newParentVNode._nextDom = oldDom;
	newParentVNode._dom = firstChildDom;
}

/**
 * @param {VNode} newParentVNode
 * @param {ComponentChildren[]} renderResult
 * @param {VNode[]} oldChildren
 * 
 * 
 该函数constructNewChildrenArray的作用是根据新的虚拟节点列表renderResult和旧的虚拟节点列表oldChildren，构建一个新的子节点数组_children附加到newParentVNode上，并为每个子节点分配合适的索引（_index）、标记位（_flags）和深度（_depth），以准备后续的DOM更新。它还处理了节点的复用、插入、移除等逻辑，确保DOM树的最小化变更。下面是函数的关键步骤和逻辑：

初始化：设置新节点数组_children为空数组，并获取新旧节点列表的长度。

遍历新节点列表：对每个新节点执行以下操作：

类型检查与标准化：根据新节点的类型（字符串、数字、数组、已有VNode等），标准化为VNode对象，可能涉及克隆已有VNode以避免共享状态。
匹配旧节点：使用findMatchingIndex函数尝试在旧节点列表中找到与当前新节点匹配的旧节点，基于键值或位置。
标记位与索引设置：根据匹配结果，为新节点设置_index（暂存匹配索引）和_flags（如插入、匹配等标记）。
处理未匹配的旧节点：若新节点为null且旧节点存在且未匹配，则卸载对应的旧节点及其DOM。
计算偏斜（Skew）：根据新旧节点的相对位置调整偏斜值，以处理节点的插入、移动或删除情况。
挂载状态判断：根据旧节点是否存在或是否处于挂起状态来判断新节点是否正在挂载，并据此设置插入标记。
处理剩余的旧节点：遍历旧节点列表，对于那些没有被匹配（_flags & MATCHED为0）的节点，执行卸载操作，从DOM中移除这些节点。

深度与父节点设置：为每个新节点设置_parent（指向newParentVNode）和_depth（父节点深度+1），以维护VNode的层级关系。

函数的核心在于通过复杂的匹配和偏斜计算，高效地确定新旧节点之间的映射关系，从而最小化DOM操作，提高渲染性能。它体现了Preact框架在虚拟DOM管理上的优化策略，特别是对于节点的复用、插入和删除逻辑的处理。
 */
function constructNewChildrenArray(newParentVNode, renderResult, oldChildren) {
	/** @type {number} */
	let i;
	/** @type {VNode} */
	let childVNode;
	/** @type {VNode} */
	let oldVNode;

	// 初始化：设置新节点数组_children为空数组，并获取新旧节点列表的长度。
	const newChildrenLength = renderResult.length;
	let oldChildrenLength = oldChildren.length,
		remainingOldChildren = oldChildrenLength;

	let skew = 0;

	newParentVNode._children = [];
	for (i = 0; i < newChildrenLength; i++) {
		// @ts-expect-error We are reusing the childVNode variable to hold both the
		// pre and post normalized childVNode
		childVNode = renderResult[i];

		if (
			childVNode == null ||
			typeof childVNode == 'boolean' ||
			typeof childVNode == 'function'
		) {
			childVNode = newParentVNode._children[i] = null;
		}
		// If this newVNode is being reused (e.g. <div>{reuse}{reuse}</div>) in the same diff,
		// or we are rendering a component (e.g. setState) copy the oldVNodes so it can have
		// it's own DOM & etc. pointers
		else if (
			typeof childVNode == 'string' ||
			typeof childVNode == 'number' ||
			// eslint-disable-next-line valid-typeof
			typeof childVNode == 'bigint' ||
			childVNode.constructor == String
		) {
			childVNode = newParentVNode._children[i] = createVNode(
				null,
				childVNode,
				null,
				null,
				null
			);
		} else if (isArray(childVNode)) {
			childVNode = newParentVNode._children[i] = createVNode(
				Fragment,
				{ children: childVNode },
				null,
				null,
				null
			);
		} else if (childVNode.constructor === undefined && childVNode._depth > 0) {
			// VNode is already in use, clone it. This can happen in the following
			// scenario:
			//   const reuse = <div />
			//   <div>{reuse}<span />{reuse}</div>
			childVNode = newParentVNode._children[i] = createVNode(
				childVNode.type,
				childVNode.props,
				childVNode.key,
				childVNode.ref ? childVNode.ref : null,
				childVNode._original
			);
		} else {
			childVNode = newParentVNode._children[i] = childVNode;
		}

		const skewedIndex = i + skew;

		// Handle unmounting null placeholders, i.e. VNode => null in unkeyed children
		if (childVNode == null) {
			oldVNode = oldChildren[skewedIndex];
			if (
				oldVNode &&
				oldVNode.key == null &&
				oldVNode._dom &&
				(oldVNode._flags & MATCHED) === 0
			) {
				if (oldVNode._dom == newParentVNode._nextDom) {
					newParentVNode._nextDom = getDomSibling(oldVNode);
				}

				unmount(oldVNode, oldVNode, false);

				// Explicitly nullify this position in oldChildren instead of just
				// setting `_match=true` to prevent other routines (e.g.
				// `findMatchingIndex` or `getDomSibling`) from thinking VNodes or DOM
				// nodes in this position are still available to be used in diffing when
				// they have actually already been unmounted. For example, by only
				// setting `_match=true` here, the unmounting loop later would attempt
				// to unmount this VNode again seeing `_match==true`.  Further,
				// getDomSibling doesn't know about _match and so would incorrectly
				// assume DOM nodes in this subtree are mounted and usable.
				oldChildren[skewedIndex] = null;
				remainingOldChildren--;
			}
			continue;
		}

		childVNode._parent = newParentVNode;
		childVNode._depth = newParentVNode._depth + 1;

		const matchingIndex = findMatchingIndex(
			childVNode,
			oldChildren,
			skewedIndex,
			remainingOldChildren
		);

		// Temporarily store the matchingIndex on the _index property so we can pull
		// out the oldVNode in diffChildren. We'll override this to the VNode's
		// final index after using this property to get the oldVNode
		childVNode._index = matchingIndex;

		oldVNode = null;
		if (matchingIndex !== -1) {
			oldVNode = oldChildren[matchingIndex];
			remainingOldChildren--;
			if (oldVNode) {
				oldVNode._flags |= MATCHED;
			}
		}

		// Here, we define isMounting for the purposes of the skew diffing
		// algorithm. Nodes that are unsuspending are considered mounting and we detect
		// this by checking if oldVNode._original === null
		const isMounting = oldVNode == null || oldVNode._original === null;

		if (isMounting) {
			if (matchingIndex == -1) {
				skew--;
			}

			// If we are mounting a DOM VNode, mark it for insertion
			if (typeof childVNode.type != 'function') {
				childVNode._flags |= INSERT_VNODE;
			}
		} else if (matchingIndex !== skewedIndex) {
			if (matchingIndex == skewedIndex - 1) {
				skew = matchingIndex - skewedIndex;
			} else if (matchingIndex == skewedIndex + 1) {
				skew++;
			} else if (matchingIndex > skewedIndex) {
				// Our matched DOM-node is further in the list of children than
				// where it's at now.

				// When the remaining old children is bigger than the new-children
				// minus our skewed index we know we are dealing with a shrinking list
				// we have to increase our skew with the matchedIndex - the skewed index
				if (remainingOldChildren > newChildrenLength - skewedIndex) {
					skew += matchingIndex - skewedIndex;
				} else {
					// If we have matched all the children just decrease the skew
					skew--;
				}
			} else if (matchingIndex < skewedIndex) {
				// When our new position is in front of our old position than we increase the skew
				skew++;
			}

			// Move this VNode's DOM if the original index (matchingIndex) doesn't
			// match the new skew index (i + new skew)
			if (matchingIndex !== i + skew) {
				childVNode._flags |= INSERT_VNODE;
			}
		}
	}

	// Remove remaining oldChildren if there are any. Loop forwards so that as we
	// unmount DOM from the beginning of the oldChildren, we can adjust oldDom to
	// point to the next child, which needs to be the first DOM node that won't be
	// unmounted.
	if (remainingOldChildren) {
		for (i = 0; i < oldChildrenLength; i++) {
			oldVNode = oldChildren[i];
			if (oldVNode != null && (oldVNode._flags & MATCHED) === 0) {
				if (oldVNode._dom == newParentVNode._nextDom) {
					newParentVNode._nextDom = getDomSibling(oldVNode);
				}

				unmount(oldVNode, oldVNode);
			}
		}
	}
}

/**
 * @param {VNode} parentVNode
 * @param {PreactElement} oldDom
 * @param {PreactElement} parentDom
 * @returns {PreactElement}
 * 
 该函数insert的主要作用是递归地将虚拟节点（parentVNode）及其子节点插入到实际的DOM树中，并确保正确处理挂载点（oldDom）和父节点（parentDom）。以下是函数的具体行为和流程：

处理函数组件：

如果parentVNode表示的是一个函数组件，函数会进入循环遍历该组件的子节点（_children）。
对于每一个非空子节点，它会更新子节点的_parent属性指向当前的parentVNode，然后递归调用insert函数自身来插入子节点。这意味着函数能够递归处理整个组件树的挂载。
在所有子节点处理完后，返回最新的oldDom，即最后一个子节点插入后的下一个兄弟节点。
处理普通节点：

当parentVNode不是函数组件时，函数检查parentVNode的DOM节点（_dom）是否与提供的挂载点（oldDom）不同。
如果不同，使用insertBefore方法将parentVNode的DOM节点插入到parentDom中oldDom之前的位置，然后更新oldDom为刚刚插入的parentVNode._dom。
接着，通过循环寻找下一个兄弟节点作为新的oldDom，但会跳过类型为8的节点（通常是注释节点），直到找到一个非注释类型的节点或者达到null。
返回值：最终，函数返回更新后的oldDom，这将成为下一次插入操作的参考点，使得插入操作能沿着DOM树正确进行。

总结来说，insert函数实现了将虚拟DOM节点转换为真实DOM节点并插入到指定父节点下的逻辑，同时处理了函数组件的特殊情况，确保了整个组件树的递归插入，并且在插入过程中更新了相关节点的父子关系和挂载点信息。
 */
function insert(parentVNode, oldDom, parentDom) {
	// Note: VNodes in nested suspended trees may be missing _children.

	if (typeof parentVNode.type == 'function') {
		let children = parentVNode._children;
		for (let i = 0; children && i < children.length; i++) {
			if (children[i]) {
				// If we enter this code path on sCU bailout, where we copy
				// oldVNode._children to newVNode._children, we need to update the old
				// children's _parent pointer to point to the newVNode (parentVNode
				// here).
				children[i]._parent = parentVNode;
				oldDom = insert(children[i], oldDom, parentDom);
			}
		}

		return oldDom;
	} else if (parentVNode._dom != oldDom) {
		parentDom.insertBefore(parentVNode._dom, oldDom || null);
		oldDom = parentVNode._dom;
	}

	do {
		oldDom = oldDom && oldDom.nextSibling;
	} while (oldDom != null && oldDom.nodeType === 8);

	return oldDom;
}

/**
 * Flatten and loop through the children of a virtual node
 * @param {ComponentChildren} children The unflattened children of a virtual
 * node
 * @returns {VNode[]}
 * 
 * 
 该函数toChildArray的作用是将一个嵌套的虚拟节点（VNode）子元素集合扁平化为一个一维的VNode数组。这对于处理像React或Preact这类库中的children属性非常有用，其中children可以是任意组合的元素、数组或文本节点。函数接收两个参数：

children：输入的虚拟节点的子元素集合，它可以是单个VNode、数组（可能包含更多嵌套数组或VNode）、null、undefined、或布尔值。
out：一个可选的输出数组，用于收集扁平化后的VNode。默认情况下，如果未提供，函数内部会初始化一个空数组。
函数的逻辑如下：

首先，检查children是否为null、undefined，或者是一个布尔值。如果是，直接忽略，不做任何处理（这部分逻辑实际上是个空块，可能是一个留待实现的占位符或者是逻辑简化导致的）。

然后，如果children是一个数组，使用Array.prototype.some方法遍历它。some方法会在至少有一个元素使得提供的测试函数返回true时立即停止遍历。这里，测试函数实际上是一个回调，递归调用toChildArray并将结果累加到out数组中。注意，尽管使用了some，但由于内部没有返回true的条件，这个循环会遍历整个数组。

最后，如果children既不是数组也不是上述的特殊值，它被视为单个VNode，直接将其添加到out数组中。

函数最后返回填充了所有扁平化子节点的out数组。这样，无论原始children的嵌套结构如何复杂，最终都能得到一个易于遍历和处理的一维VNode数组。
 */
export function toChildArray(children, out) {
	out = out || [];
	if (children == null || typeof children == 'boolean') {
	} else if (isArray(children)) {
		children.some(child => {
			toChildArray(child, out);
		});
	} else {
		out.push(children);
	}
	return out;
}

/**
 * @param {VNode} childVNode
 * @param {VNode[]} oldChildren
 * @param {number} skewedIndex
 * @param {number} remainingOldChildren
 * @returns {number}
 该函数findMatchingIndex的作用是在给定的旧子节点数组oldChildren中查找与新子节点childVNode相匹配的旧子节点的索引。匹配基于节点的键（key）和类型（type），并且假设新子节点已经按照某种顺序排列，而旧子节点数组可能需要前后搜索来找到匹配项。函数接收四个参数：

childVNode: 新的虚拟节点（VNode）。
oldChildren: 包含旧虚拟节点的数组。
skewedIndex: 偏斜索引，即新子节点在旧子节点数组中预期的大致位置。
remainingOldChildren: 旧子节点数组中尚未匹配的新子节点数。
函数的逻辑步骤如下：

初始化变量：提取新节点的键和类型，并初始化搜索指针x和y，分别向左（前）和向右（后）搜索。

直接匹配检查：首先检查位于skewedIndex的旧节点是否与新节点匹配（基于键和类型），且尚未在本次比较中被标记为匹配（MATCHED标志）。如果匹配，直接返回索引。

确定是否需要搜索：基于当前节点是否已被匹配以及剩余未匹配的旧子节点数量，决定是否需要向前或向后搜索。

双向搜索：如果需要搜索，则在数组中双向进行。一边递减x向左寻找，另一边递增y向右寻找，直到搜索范围超出数组边界。在搜索过程中，如果发现满足匹配条件的节点（键和类型相同且未标记为已匹配），则返回该节点的索引。

未找到匹配：如果完成搜索仍未找到匹配项，返回-1，表示没有找到匹配的旧节点。

此函数是虚拟DOM diff算法的一部分，用于高效地定位和匹配新旧虚拟节点，以便进行最小化的DOM操作，如移动、更新或创建新节点。通过利用键和类型作为匹配依据，并结合偏斜索引减少搜索范围，提高了算法效率。
 */
function findMatchingIndex(
	childVNode,
	oldChildren,
	skewedIndex,
	remainingOldChildren
) {
	const key = childVNode.key;
	const type = childVNode.type;
	let x = skewedIndex - 1;
	let y = skewedIndex + 1;
	let oldVNode = oldChildren[skewedIndex];

	// We only need to perform a search if there are more children
	// (remainingOldChildren) to search. However, if the oldVNode we just looked
	// at skewedIndex was not already used in this diff, then there must be at
	// least 1 other (so greater than 1) remainingOldChildren to attempt to match
	// against. So the following condition checks that ensuring
	// remainingOldChildren > 1 if the oldVNode is not already used/matched. Else
	// if the oldVNode was null or matched, then there could needs to be at least
	// 1 (aka `remainingOldChildren > 0`) children to find and compare against.
	let shouldSearch =
		remainingOldChildren >
		(oldVNode != null && (oldVNode._flags & MATCHED) === 0 ? 1 : 0);

	if (
		oldVNode === null ||
		(oldVNode &&
			key == oldVNode.key &&
			type === oldVNode.type &&
			(oldVNode._flags & MATCHED) === 0)
	) {
		return skewedIndex;
	} else if (shouldSearch) {
		while (x >= 0 || y < oldChildren.length) {
			if (x >= 0) {
				oldVNode = oldChildren[x];
				if (
					oldVNode &&
					(oldVNode._flags & MATCHED) === 0 &&
					key == oldVNode.key &&
					type === oldVNode.type
				) {
					return x;
				}
				x--;
			}

			if (y < oldChildren.length) {
				oldVNode = oldChildren[y];
				if (
					oldVNode &&
					(oldVNode._flags & MATCHED) === 0 &&
					key == oldVNode.key &&
					type === oldVNode.type
				) {
					return y;
				}
				y++;
			}
		}
	}

	return -1;
}
