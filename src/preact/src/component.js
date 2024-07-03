import { assign } from './util';
import { diff, commitRoot } from './diff/index';
import options from './options';
import { Fragment } from './create-element';
import { MODE_HYDRATE } from './constants';

/**
 * Base Component class. Provides `setState()` and `forceUpdate()`, which
 * trigger rendering
 * @param {object} props The initial component props
 * @param {object} context The initial context from parent components'
 * getChildContext
 */
export function BaseComponent(props, context) {
	this.props = props;
	this.context = context;
}

/**
 * Update component state and schedule a re-render.
 * @this {Component}
 * @param {object | ((s: object, p: object) => object)} update A hash of state
 * properties to update with new values or a function that given the current
 * state and props returns a new partial state
 * @param {() => void} [callback] A function to be called once component state is
 * updated
 该函数是React组件的setState方法的实现。它用于更新组件的状态对象，并根据新的状态重新渲染组件。

首先，它会检查是否有 _nextState 属性且其值不等于当前状态，如果有，则直接使用 _nextState，否则创建一个新对象并赋值为当前状态的浅拷贝。

接着，如果传入的 update 参数是函数，则使用该函数更新状态。这个函数会接收当前状态和props作为参数，返回一个新的状态对象。

如果 update 参数是对象，则直接将其属性合并到之前创建或获取的状态对象中。

如果 update 参数为null或undefined，则直接返回，不进行更新。

如果组件有 _vnode 属性（表示组件已经渲染过），则将 callback 函数（如果有）添加到 _stateCallbacks 数组中，并调用 enqueueRender 方法来安排组件重新渲染。

总之，setState 方法用于更新组件的状态，并根据新的状态重新渲染组件。它支持传入一个状态对象或一个更新函数来更新状态。在更新过程中，会自动处理状态的合并，并在必要时安排组件重新渲染。
 */
BaseComponent.prototype.setState = function (update, callback) {
	// only clone state when copying to nextState the first time.
	let s;
	if (this._nextState != null && this._nextState !== this.state) {
		s = this._nextState;
	} else {
		s = this._nextState = assign({}, this.state);
	}

	if (typeof update == 'function') {
		// Some libraries like `immer` mark the current state as readonly,
		// preventing us from mutating it, so we need to clone it. See #2716
		update = update(assign({}, s), this.props);
	}

	if (update) {
		assign(s, update);
	}

	// Skip update if updater function returned null
	if (update == null) return;

	if (this._vnode) {
		if (callback) {
			this._stateCallbacks.push(callback);
		}
		enqueueRender(this);
	}
};

/**
 * Immediately perform a synchronous re-render of the component
 * @this {Component}
 * @param {() => void} [callback] A function to be called after component is
 * re-rendered
 该函数是React组件的forceUpdate方法的实现，功能是立即同步地强制重新渲染组件，跳过shouldComponentUpdate的检查。

作用对象检查：首先检查组件是否有 _vnode 属性，这表明组件已经被渲染过至少一次。如果没有，说明组件还未渲染，则不执行后续操作。

设置渲染模式：将组件的 _force 属性设置为 true。这是为了标记此次渲染请求来源于forceUpdate调用，以此区分于其他触发渲染的途径。这样做可以确保在强制更新过程中不会调用shouldComponentUpdate方法，因为forceUpdate应直接导致渲染而不论组件的更新条件。

回调处理：如果提供了 callback 参数，将其添加到 _renderCallbacks 数组中。这个回调函数会在组件重新渲染完成后被调用。

触发渲染：最后，调用 enqueueRender(this) 方法来安排组件立即进行重新渲染。这将绕过React的常规渲染调度机制，确保组件即使在不应该更新的情况下也能强制执行渲染。

总结，forceUpdate 方法允许开发者强制性地重新渲染一个组件，忽略React的默认优化机制（如shouldComponentUpdate），并支持在渲染后执行自定义的回调逻辑。
 */
BaseComponent.prototype.forceUpdate = function (callback) {
	if (this._vnode) {
		// Set render mode so that we can differentiate where the render request
		// is coming from. We need this because forceUpdate should never call
		// shouldComponentUpdate
		this._force = true;
		if (callback) this._renderCallbacks.push(callback);
		enqueueRender(this);
	}
};

/**
 * Accepts `props` and `state`, and returns a new Virtual DOM tree to build.
 * Virtual DOM is generally constructed via [JSX](http://jasonformat.com/wtf-is-jsx).
 * @param {object} props Props (eg: JSX attributes) received from parent
 * element/component
 * @param {object} state The component's current state
 * @param {object} context Context object, as returned by the nearest
 * ancestor's `getChildContext()`
 * @returns {ComponentChildren | void}
 */
BaseComponent.prototype.render = Fragment;

/**
 * @param {VNode} vnode
 * @param {number | null} [childIndex]
 该函数名为getDomSibling，其目的是从给定的虚拟节点(VNode)的子节点中寻找第一个已渲染的真实DOM节点，或者根据提供的childIndex从指定索引开始搜索其后的兄弟节点中的第一个已渲染DOM节点。如果未找到，则沿着虚拟节点的父辈继续向上查找。以下是详细的步骤说明：

基础情况处理：如果childIndex为null，则从当前vnode的下一个兄弟节点开始搜索。通过调用自身并将childIndex设置为当前节点在其父节点中的索引加1来实现这一逻辑。

循环查找子节点：当childIndex有具体值时，遍历vnode的_children数组。对于每个子节点，检查：

子节点是否存在（非null）。
子节点是否已关联真实DOM（_dom属性非null）。 若两个条件均满足，则返回该子节点对应的DOM元素。
回溯至父节点：如果遍历完当前节点的所有子节点仍未找到已渲染的DOM节点，函数会“回退”到当前节点的父节点（若存在）。只有当当前vnode不是代表DOM元素（即它的类型是一个函数，意味着它是一个组件VNode而非原生DOM元素）时，才会进行这一步回溯。

终止条件：当无法再向上回溯（即到达了代表实际DOM元素的VNode，其type不是一个函数），函数返回null，表示没有找到匹配的DOM节点。

综上所述，getDomSibling函数是一种递归遍历虚拟DOM树的策略，旨在高效地定位与给定虚拟节点相关的下一个DOM节点，无论是在其直接子节点中还是通过父辈链路上的兄弟节点。
 */
export function getDomSibling(vnode, childIndex) {
	if (childIndex == null) {
		// Use childIndex==null as a signal to resume the search from the vnode's sibling
		return vnode._parent
			? getDomSibling(vnode._parent, vnode._index + 1)
			: null;
	}

	let sibling;
	for (; childIndex < vnode._children.length; childIndex++) {
		sibling = vnode._children[childIndex];

		if (sibling != null && sibling._dom != null) {
			// Since updateParentDomPointers keeps _dom pointer correct,
			// we can rely on _dom to tell us if this subtree contains a
			// rendered DOM node, and what the first rendered DOM node is
			return sibling._dom;
		}
	}

	// If we get here, we have not found a DOM node in this vnode's children.
	// We must resume from this vnode's sibling (in it's parent _children array)
	// Only climb up and search the parent if we aren't searching through a DOM
	// VNode (meaning we reached the DOM parent of the original vnode that began
	// the search)
	return typeof vnode.type == 'function' ? getDomSibling(vnode) : null;
}

/**
 * Trigger in-place re-rendering of a component.
 * @param {Component} component The component to rerender
 这个函数renderComponent用于就地重新渲染一个React-like组件。以下是函数的步骤解释：

获取旧的VNode和DOM节点：首先，它保存了组件当前的虚拟节点_vnode和对应的DOM节点_dom。

创建新的VNode：如果组件有_parentDom（表示它已经存在于DOM中），它创建了一个与旧VNode几乎相同的副本newVNode，并增加了一个_original属性的值，这可能是用于追踪更新次数或其他内部状态。

VNode生命周期钩子：如果存在options.vnode回调，调用它以执行用户定义的VNode处理。

虚拟DOM差异比较（diff）：使用diff函数进行新旧VNode之间的差异比较，这个过程会生成一个更新队列commitQueue用于后续的DOM操作，以及一个refQueue用于处理引用（refs）。

恢复VNode的原始值：在diff之后，恢复newVNode的_original属性值，这可能是为了保持一致性。

更新组件的子VNode列表：将新VNode替换旧VNode在父组件的子VNode列表中的位置。

提交更新：调用commitRoot来执行commitQueue中的DOM更新操作，并处理refQueue中的引用更新。

更新父节点的DOM指针：如果新生成的DOM节点与旧的不相同，调用updateParentDomPointers来更新父节点的DOM引用，确保数据结构与实际DOM保持同步。

整个过程的核心是diff函数，它负责找出最小的DOM变更以更新UI，而commitRoot则负责实际执行这些变更。这个函数模拟了React的更新流程，但请注意，这可能是一个自定义的实现，而不是React库本身的代码。
 */
function renderComponent(component) {
	let oldVNode = component._vnode,
		oldDom = oldVNode._dom,
		commitQueue = [],
		refQueue = [];

	if (component._parentDom) {
		const newVNode = assign({}, oldVNode);
		newVNode._original = oldVNode._original + 1;
		if (options.vnode) options.vnode(newVNode);

		diff(
			component._parentDom,
			newVNode,
			oldVNode,
			component._globalContext,
			component._parentDom.namespaceURI,
			oldVNode._flags & MODE_HYDRATE ? [oldDom] : null,
			commitQueue,
			oldDom == null ? getDomSibling(oldVNode) : oldDom,
			!!(oldVNode._flags & MODE_HYDRATE),
			refQueue
		);

		newVNode._original = oldVNode._original;
		newVNode._parent._children[newVNode._index] = newVNode;
		commitRoot(commitQueue, newVNode, refQueue);

		if (newVNode._dom != oldDom) {
			updateParentDomPointers(newVNode);
		}
	}
}

/**
 * @param {VNode} vnode
 该函数updateParentDomPointers的作用是更新虚拟节点(VNode)与其组件的父级DOM指针。当组件重新渲染或更新导致DOM结构变化时，此函数帮助维护虚拟DOM树中父节点对子节点实际DOM的引用。以下是详细步骤：

参数与初始条件检查：函数接受一个VNode作为参数。它首先检查这个节点是否具有父节点（_parent）且该父节点关联着一个组件（_component）。如果条件不满足，则直接结束函数。

重置父节点与组件的DOM引用：对于符合条件的节点，将父节点的_dom属性和组件实例的base属性都设为null。这一步是为了准备更新这些引用到最新的子节点DOM上。

查找第一个渲染的子节点DOM：遍历当前节点的所有子节点_children，寻找第一个具有非空_dom属性的子节点，即已渲染到DOM的第一个子节点。一旦找到，就将找到的子节点的_dom赋值给父节点的_dom和组件实例的base。这样就更新了父节点指向实际DOM的引用。

递归更新：在找到并更新了父节点的DOM引用后，函数递归地调用自身，传入当前节点的父节点vnode._parent作为参数。这一递归调用确保了整个父节点链路上的DOM引用都会被正确更新，直到达到不再满足初始条件的节点为止。

总之，updateParentDomPointers函数通过递归遍历VNode树，确保组件与其最近的渲染DOM子节点保持正确的引用关系，这对于管理组件状态、事件委托以及后续的DOM操作至关重要。
 */
function updateParentDomPointers(vnode) {
	if ((vnode = vnode._parent) != null && vnode._component != null) {
		vnode._dom = vnode._component.base = null;
		for (let i = 0; i < vnode._children.length; i++) {
			let child = vnode._children[i];
			if (child != null && child._dom != null) {
				vnode._dom = vnode._component.base = child._dom;
				break;
			}
		}

		return updateParentDomPointers(vnode);
	}
}

// 这段代码定义了一个渲染队列管理机制，用于异步批量处理组件的重渲染请求，以提高性能和用户体验。下面是各部分的详细解释：
// ...
// 这段代码通过异步批量处理和深度优先的策略，高效地管理组件的重渲染请求。它设计了异步调度逻辑以优化性能，避免频繁的DOM操作，并通过深度排序确保组件树的正确渲染顺序。

/**
 * The render queue
 * @type {Array<Component>}
 * 
 * 类型为Array<Component>，用来存储待重渲染的组件实例。
 */
let rerenderQueue = [];

/*
 * The value of `Component.debounce` must asynchronously invoke the passed in callback. It is
 * important that contributors to Preact can consistently reason about what calls to `setState`, etc.
 * do, and when their effects will be applied. See the links below for some further reading on designing
 * asynchronous APIs.
 * * [Designing APIs for Asynchrony](https://blog.izs.me/2013/08/designing-apis-for-asynchrony)
 * * [Callbacks synchronous and asynchronous](https://blog.ometer.com/2011/07/24/callbacks-synchronous-and-asynchronous/)
 */

let prevDebounce;

// 定义了一个异步执行的函数引用defer，如果环境支持Promise，则利用Promise.resolve().then()实现异步延后执行；否则使用setTimeout作为备选方案。
const defer =
	typeof Promise == 'function'
		? Promise.prototype.then.bind(Promise.resolve())
		: setTimeout;

/**
 * Enqueue a rerender of a component
 * @param {Component} c The component to rerender
 * 
 功能：将组件加入重渲染队列并根据需要计划执行渲染任务。
参数：c是要重渲染的组件实例。
逻辑：
首次检查组件是否已标记为脏（_dirty），若未标记则标记并加入队列。
如果队列长度发生变化或debounceRendering选项被修改，则计划执行process函数（异步）。
使用prevDebounce跟踪前一次的debounceRendering选项，确保仅在必要时调整渲染调度策略。
 */
export function enqueueRender(c) {
	if (
		(!c._dirty &&
			(c._dirty = true) &&
			rerenderQueue.push(c) &&
			!process._rerenderCount++) ||
		prevDebounce !== options.debounceRendering
	) {
		prevDebounce = options.debounceRendering;
		(prevDebounce || defer)(process);
	}
}

/**
 * @param {Component} a
 * @param {Component} b
 * 
 * 功能：提供一个排序函数，用于根据组件的虚拟节点深度（_vnode._depth）对组件进行排序。这有助于维持渲染顺序，确保子组件在父组件之前渲染。
 */
const depthSort = (a, b) => a._vnode._depth - b._vnode._depth;

/** Flush the render queue by rerendering all queued components */
// 功能：执行渲染队列中的所有组件重渲染任务。
// 逻辑：
// 先按深度对队列进行排序。
// 遍历队列，对每个组件：
// 检查组件是否仍标记为脏，如果是则执行renderComponent(c)进行重渲染。
// 如果重渲染过程中队列长度增加（可能是因为新组件被加入队列），再次排序以维持正确的渲染顺序。
// 最后，清零_rerenderCount，这是一个内部计数器，用于控制不必要的process调用。

function process() {
	let c;
	rerenderQueue.sort(depthSort);
	// Don't update `renderCount` yet. Keep its value non-zero to prevent unnecessary
	// process() calls from getting scheduled while `queue` is still being consumed.
	while ((c = rerenderQueue.shift())) {
		if (c._dirty) {
			let renderQueueLength = rerenderQueue.length;
			renderComponent(c);
			if (rerenderQueue.length > renderQueueLength) {
				// When i.e. rerendering a provider additional new items can be injected, we want to
				// keep the order from top to bottom with those new items so we can handle them in a
				// single pass
				rerenderQueue.sort(depthSort);
			}
		}
	}
	process._rerenderCount = 0;
}

process._rerenderCount = 0;
