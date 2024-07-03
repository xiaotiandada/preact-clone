import { options as _options } from 'preact';

/** @type {number} */
let currentIndex;

/** @type {import('./internal').Component} */
let currentComponent;

/** @type {import('./internal').Component} */
let previousComponent;

/** @type {number} */
let currentHook = 0;

/** @type {Array<import('./internal').Component>} */
let afterPaintEffects = [];

// Cast to use internal Options type
const options = /** @type {import('./internal').Options} */ (_options);

let oldBeforeDiff = options._diff;
let oldBeforeRender = options._render;
let oldAfterDiff = options.diffed;
let oldCommit = options._commit;
let oldBeforeUnmount = options.unmount;
let oldRoot = options._root;

const RAF_TIMEOUT = 100;
let prevRaf;

/** @type {(vnode: import('./internal').VNode) => void} */
options._diff = vnode => {
	currentComponent = null;
	if (oldBeforeDiff) oldBeforeDiff(vnode);
};

options._root = (vnode, parentDom) => {
	if (vnode && parentDom._children && parentDom._children._mask) {
		vnode._mask = parentDom._children._mask;
	}

	if (oldRoot) oldRoot(vnode, parentDom);
};

/** @type {(vnode: import('./internal').VNode) => void} */
options._render = vnode => {
	if (oldBeforeRender) oldBeforeRender(vnode);

	currentComponent = vnode._component;
	currentIndex = 0;

	const hooks = currentComponent.__hooks;
	if (hooks) {
		if (previousComponent === currentComponent) {
			hooks._pendingEffects = [];
			currentComponent._renderCallbacks = [];
			hooks._list.forEach(hookItem => {
				if (hookItem._nextValue) {
					hookItem._value = hookItem._nextValue;
				}
				hookItem._pendingArgs = hookItem._nextValue = undefined;
			});
		} else {
			hooks._pendingEffects.forEach(invokeCleanup);
			hooks._pendingEffects.forEach(invokeEffect);
			hooks._pendingEffects = [];
			currentIndex = 0;
		}
	}
	previousComponent = currentComponent;
};

/** @type {(vnode: import('./internal').VNode) => void} */
options.diffed = vnode => {
	if (oldAfterDiff) oldAfterDiff(vnode);

	const c = vnode._component;
	if (c && c.__hooks) {
		if (c.__hooks._pendingEffects.length) afterPaint(afterPaintEffects.push(c));
		c.__hooks._list.forEach(hookItem => {
			if (hookItem._pendingArgs) {
				hookItem._args = hookItem._pendingArgs;
			}
			hookItem._pendingArgs = undefined;
		});
	}
	previousComponent = currentComponent = null;
};

// TODO: Improve typing of commitQueue parameter
/** @type {(vnode: import('./internal').VNode, commitQueue: any) => void} */
options._commit = (vnode, commitQueue) => {
	commitQueue.some(component => {
		try {
			component._renderCallbacks.forEach(invokeCleanup);
			component._renderCallbacks = component._renderCallbacks.filter(cb =>
				cb._value ? invokeEffect(cb) : true
			);
		} catch (e) {
			commitQueue.some(c => {
				if (c._renderCallbacks) c._renderCallbacks = [];
			});
			commitQueue = [];
			options._catchError(e, component._vnode);
		}
	});

	if (oldCommit) oldCommit(vnode, commitQueue);
};

/** @type {(vnode: import('./internal').VNode) => void} */
options.unmount = vnode => {
	if (oldBeforeUnmount) oldBeforeUnmount(vnode);

	const c = vnode._component;
	if (c && c.__hooks) {
		let hasErrored;
		c.__hooks._list.forEach(s => {
			try {
				invokeCleanup(s);
			} catch (e) {
				hasErrored = e;
			}
		});
		c.__hooks = undefined;
		if (hasErrored) options._catchError(hasErrored, c._vnode);
	}
};

// 这些函数是自定义实现的React Hooks，它们模仿了React框架中原生的Hooks API，用于在函数组件中管理状态、副作用以及其他功能。下面是每个函数的简要说明：
// 。。。
// 这些函数内部通过getHookState等方法管理状态，确保在每次组件渲染时能正确地获取和更新相应的Hook状态。它们共同提供了在函数组件中管理状态和副作用的能力，模仿了React的核心Hooks机制。



/**
 * Get a hook's state from the currentComponent
 * @param {number} index The index of the hook to get
 * @param {number} type The index of the hook to get
 * @returns {any}
 */
function getHookState(index, type) {
	if (options._hook) {
		options._hook(currentComponent, index, currentHook || type);
	}
	currentHook = 0;

	// Largely inspired by:
	// * https://github.com/michael-klein/funcy.js/blob/f6be73468e6ec46b0ff5aa3cc4c9baf72a29025a/src/hooks/core_hooks.mjs
	// * https://github.com/michael-klein/funcy.js/blob/650beaa58c43c33a74820a3c98b3c7079cf2e333/src/renderer.mjs
	// Other implementations to look at:
	// * https://codesandbox.io/s/mnox05qp8
	const hooks =
		currentComponent.__hooks ||
		(currentComponent.__hooks = {
			_list: [],
			_pendingEffects: []
		});

	if (index >= hooks._list.length) {
		hooks._list.push({});
	}

	return hooks._list[index];
}

/**
 * @template {unknown} S
 * @param {import('./index').Dispatch<import('./index').StateUpdater<S>>} [initialState]
 * @returns {[S, (state: S) => void]}
 * 
 * 功能: 提供一种在函数组件中添加可变状态的方式。
参数:
initialState: 状态的初始值。
返回值: 一个数组，包含当前状态值和一个用于更新状态的函数。
 */
export function useState(initialState) {
	currentHook = 1;
	return useReducer(invokeOrReturn, initialState);
}

/**
 * @template {unknown} S
 * @template {unknown} A
 * @param {import('./index').Reducer<S, A>} reducer
 * @param {import('./index').Dispatch<import('./index').StateUpdater<S>>} initialState
 * @param {(initialState: any) => void} [init]
 * @returns {[ S, (state: S) => void ]}
 * 
 * 功能: 类似于useState，但使用reducer函数来管理复杂状态逻辑。
参数:
reducer: 用于处理状态更新的函数。
initialState: 初始状态。
init（可选）: 初始化函数。
返回值: 同useState，但更新状态通过dispatch动作。

 */
export function useReducer(reducer, initialState, init) {
	/** @type {import('./internal').ReducerHookState} */
	const hookState = getHookState(currentIndex++, 2);
	hookState._reducer = reducer;
	if (!hookState._component) {
		hookState._value = [
			!init ? invokeOrReturn(undefined, initialState) : init(initialState),

			action => {
				const currentValue = hookState._nextValue
					? hookState._nextValue[0]
					: hookState._value[0];
				const nextValue = hookState._reducer(currentValue, action);

				if (currentValue !== nextValue) {
					hookState._nextValue = [nextValue, hookState._value[1]];
					hookState._component.setState({});
				}
			}
		];

		hookState._component = currentComponent;

		if (!currentComponent._hasScuFromHooks) {
			currentComponent._hasScuFromHooks = true;
			let prevScu = currentComponent.shouldComponentUpdate;
			const prevCWU = currentComponent.componentWillUpdate;

			// If we're dealing with a forced update `shouldComponentUpdate` will
			// not be called. But we use that to update the hook values, so we
			// need to call it.
			currentComponent.componentWillUpdate = function (p, s, c) {
				if (this._force) {
					let tmp = prevScu;
					// Clear to avoid other sCU hooks from being called
					prevScu = undefined;
					updateHookState(p, s, c);
					prevScu = tmp;
				}

				if (prevCWU) prevCWU.call(this, p, s, c);
			};

			// This SCU has the purpose of bailing out after repeated updates
			// to stateful hooks.
			// we store the next value in _nextValue[0] and keep doing that for all
			// state setters, if we have next states and
			// all next states within a component end up being equal to their original state
			// we are safe to bail out for this specific component.
			/**
			 *
			 * @type {import('./internal').Component["shouldComponentUpdate"]}
			 */
			// @ts-ignore - We don't use TS to downtranspile
			// eslint-disable-next-line no-inner-declarations
			function updateHookState(p, s, c) {
				if (!hookState._component.__hooks) return true;

				/** @type {(x: import('./internal').HookState) => x is import('./internal').ReducerHookState} */
				const isStateHook = x => !!x._component;
				const stateHooks =
					hookState._component.__hooks._list.filter(isStateHook);

				const allHooksEmpty = stateHooks.every(x => !x._nextValue);
				// When we have no updated hooks in the component we invoke the previous SCU or
				// traverse the VDOM tree further.
				if (allHooksEmpty) {
					return prevScu ? prevScu.call(this, p, s, c) : true;
				}

				// We check whether we have components with a nextValue set that
				// have values that aren't equal to one another this pushes
				// us to update further down the tree
				let shouldUpdate = false;
				stateHooks.forEach(hookItem => {
					if (hookItem._nextValue) {
						const currentValue = hookItem._value[0];
						hookItem._value = hookItem._nextValue;
						hookItem._nextValue = undefined;
						if (currentValue !== hookItem._value[0]) shouldUpdate = true;
					}
				});

				return shouldUpdate || hookState._component.props !== p
					? prevScu
						? prevScu.call(this, p, s, c)
						: true
					: false;
			}

			currentComponent.shouldComponentUpdate = updateHookState;
		}
	}

	return hookState._nextValue || hookState._value;
}

/**
 * @param {import('./internal').Effect} callback
 * @param {unknown[]} args
 * @returns {void}
 * 
 功能: 在函数组件中执行副作用操作，如数据获取、订阅或者手动改变DOM等。会在组件渲染完成后运行。
参数:
callback: 副作用函数。
args: 依赖项数组，当数组中的值变化时，副作用函数会重新执行。
 */
export function useEffect(callback, args) {
	/** @type {import('./internal').EffectHookState} */
	const state = getHookState(currentIndex++, 3);
	if (!options._skipEffects && argsChanged(state._args, args)) {
		state._value = callback;
		state._pendingArgs = args;

		currentComponent.__hooks._pendingEffects.push(state);
	}
}

/**
 * @param {import('./internal').Effect} callback
 * @param {unknown[]} args
 * @returns {void}
 * 
 功能: 类似于useEffect，但它会在所有DOM变更完成后，且浏览器绘制之前同步执行，适合影响布局的操作。
 */
export function useLayoutEffect(callback, args) {
	/** @type {import('./internal').EffectHookState} */
	const state = getHookState(currentIndex++, 4);
	if (!options._skipEffects && argsChanged(state._args, args)) {
		state._value = callback;
		state._pendingArgs = args;

		currentComponent._renderCallbacks.push(state);
	}
}

/** @type {(initialValue: unknown) => unknown} */
// 功能: 创建一个可变的引用对象，其.current属性可以用来保存任何值，且在组件的整个生命周期内保持不变。
// 参数:
// initialValue: 引用的初始值。

export function useRef(initialValue) {
	currentHook = 5;
	return useMemo(() => ({ current: initialValue }), []);
}

/**
 * @param {object} ref
 * @param {() => object} createHandle
 * @param {unknown[]} args
 * @returns {void}
 * 
 功能: 允许父组件访问并修改子组件的实例（通常是Ref）。这在需要向子组件传递回调或其他可操作对象时非常有用。
参数:
ref: 父组件设置的ref对象。
createHandle: 用于创建要暴露给父组件的实例对象的工厂函数。
args: 依赖项数组，当这些值变化时，createHandle会重新执行。
 */
export function useImperativeHandle(ref, createHandle, args) {
	currentHook = 6;
	useLayoutEffect(
		() => {
			if (typeof ref == 'function') {
				ref(createHandle());
				return () => ref(null);
			} else if (ref) {
				ref.current = createHandle();
				return () => (ref.current = null);
			}
		},
		args == null ? args : args.concat(ref)
	);
}

/**
 * @template {unknown} T
 * @param {() => T} factory
 * @param {unknown[]} args
 * @returns {T}
 * 功能: 记忆化一个计算结果，仅当依赖项数组中的值发生变化时才重新计算。这有助于避免不必要的重复计算，提高性能。
参数:
factory: 产生计算结果的函数。
args: 依赖项数组。
 */
export function useMemo(factory, args) {
	/** @type {import('./internal').MemoHookState<T>} */
	const state = getHookState(currentIndex++, 7);
	if (argsChanged(state._args, args)) {
		state._value = factory();
		state._args = args;
		state._factory = factory;
	}

	return state._value;
}

/**
 * @param {() => void} callback
 * @param {unknown[]} args
 * @returns {() => void}
 * 功能: 类似于useMemo，但专门用于记忆化函数，确保函数引用在依赖项不变时保持稳定，避免不必要的子组件渲染。
参数:
callback: 需要记忆化的函数。
args: 依赖项数组。

 */
export function useCallback(callback, args) {
	currentHook = 8;
	return useMemo(() => callback, args);
}

/**
 * @param {import('./internal').PreactContext} context
 功能: 访问React的Context API中的值。允许组件从上下文中读取数据，而不需要通过props传递。
参数: context - 上下文对象。
 */
export function useContext(context) {
	const provider = currentComponent.context[context._id];
	// We could skip this call here, but than we'd not call
	// `options._hook`. We need to do that in order to make
	// the devtools aware of this hook.
	/** @type {import('./internal').ContextHookState} */
	const state = getHookState(currentIndex++, 9);
	// The devtools needs access to the context object to
	// be able to pull of the default value when no provider
	// is present in the tree.
	state._context = context;
	if (!provider) return context._defaultValue;
	// This is probably not safe to convert to "!"
	if (state._value == null) {
		state._value = true;
		provider.sub(currentComponent);
	}
	return provider.props.value;
}

/**
 * Display a custom label for a custom hook for the devtools panel
 * @type {<T>(value: T, cb?: (value: T) => string | number) => void}
 * 
 * 
 * 功能: 提供给开发者在React DevTools中显示自定义的调试信息，便于理解Hook的用途或状态。
参数:
value: 要显示的值。
formatter（可选）: 用于格式化value的函数。

 */
export function useDebugValue(value, formatter) {
	if (options.useDebugValue) {
		options.useDebugValue(
			formatter ? formatter(value) : /** @type {any}*/ (value)
		);
	}
}

/**
 * @param {(error: unknown, errorInfo: import('preact').ErrorInfo) => void} cb
 * @returns {[unknown, () => void]}
 * 
 * 功能: 创建错误边界，捕获并处理子组件树中抛出的错误，防止应用崩溃，并可以自定义错误处理逻辑。

 */
export function useErrorBoundary(cb) {
	/** @type {import('./internal').ErrorBoundaryHookState} */
	const state = getHookState(currentIndex++, 10);
	const errState = useState();
	state._value = cb;
	if (!currentComponent.componentDidCatch) {
		currentComponent.componentDidCatch = (err, errorInfo) => {
			if (state._value) state._value(err, errorInfo);
			errState[1](err);
		};
	}
	return [
		errState[0],
		() => {
			errState[1](undefined);
		}
	];
}

/** @type {() => string} */
// 功能: 生成一个唯一的ID，通常用于辅助元素的标识，如ARIA属性，确保在多个实例中保持唯一性。

export function useId() {
	/** @type {import('./internal').IdHookState} */
	const state = getHookState(currentIndex++, 11);
	if (!state._value) {
		// Grab either the root node or the nearest async boundary node.
		/** @type {import('./internal.d').VNode} */
		let root = currentComponent._vnode;
		while (root !== null && !root._mask && root._parent !== null) {
			root = root._parent;
		}

		let mask = root._mask || (root._mask = [0, 0]);
		state._value = 'P' + mask[0] + '-' + mask[1]++;
	}

	return state._value;
}

/**
 * After paint effects consumer.
 * 功能: 执行所有挂起的“after paint”效果（例如CSS Paint API的效果）。这通常用于确保某些视觉效果在页面布局和绘制之后应用，以减少布局抖动。注意，此函数未直接导出，可能是内部使用的辅助函数。

此函数负责执行挂起的"after paint"效果，即在浏览器完成一帧渲染后执行一系列副作用（副作用通常来自useEffect等钩子）。它遍历afterPaintEffects队列，对每个组件执行清理（invokeCleanup）和应用新副作用（invokeEffect），最后清空该组件的待处理副作用列表。如果在执行过程中发生错误，则捕获错误并调用全局错误处理器。
 */
function flushAfterPaintEffects() {
	let component;
	while ((component = afterPaintEffects.shift())) {
		if (!component._parentDom || !component.__hooks) continue;
		try {
			component.__hooks._pendingEffects.forEach(invokeCleanup);
			component.__hooks._pendingEffects.forEach(invokeEffect);
			component.__hooks._pendingEffects = [];
		} catch (e) {
			component.__hooks._pendingEffects = [];
			options._catchError(e, component._vnode);
		}
	}
}

let HAS_RAF = typeof requestAnimationFrame == 'function';

/**
 * Schedule a callback to be invoked after the browser has a chance to paint a new frame.
 * Do this by combining requestAnimationFrame (rAF) + setTimeout to invoke a callback after
 * the next browser frame.
 *
 * Also, schedule a timeout in parallel to the the rAF to ensure the callback is invoked
 * even if RAF doesn't fire (for example if the browser tab is not visible)
 *
 * @param {() => void} callback
 * 
 * 安排一个回调函数在浏览器下一帧渲染后执行。它结合requestAnimationFrame（RAF）和setTimeout来确保即使在某些场景下RAF不触发（如标签页非活动状态），回调也能被执行。首先尝试使用RAF，若不支持或失败，则退回到setTimeout。
 * 
 * 这个函数afterNextFrame旨在确保提供的callback函数在浏览器的下一帧渲染完成后执行。它采用了requestAnimationFrame（RAF）和setTimeout的组合策略来达到高度的跨浏览器兼容性和执行时机的精确控制。下面是详细的步骤解释：

定义done函数:

done函数是实际执行清理工作和调用用户提供的callback的函数。它首先清除之前设置的setTimeout（如果存在），然后如果浏览器支持requestAnimationFrame，还会取消之前的RAF请求。最后，通过setTimeout确保callback在当前JS执行栈结束后被调用。这样做是为了避免任何潜在的微观任务队列干扰，确保回调在安全的环境中执行。
设置setTimeout:

初始化一个setTimeout，延迟时间由RAF_TIMEOUT常量定义。这个超时是作为RAF的回退方案，确保即使在某些环境下RAF不可用或未触发（例如浏览器标签页未激活时），callback仍然能在预期的时间后执行。
使用requestAnimationFrame（如果可用）:

检查全局变量HAS_RAF判断当前环境是否支持requestAnimationFrame。如果支持，通过RAF注册done函数。RAF会在浏览器准备绘制下一帧前调用注册的函数，这通常与屏幕刷新率同步，非常适合进行UI相关的更新，能更精确地控制动画和布局的时机。
综上所述，afterNextFrame函数设计得非常灵活和健壮，它确保了无论在何种浏览器环境下，都能在至少一帧渲染后执行指定的回调函数，这对于实现流畅的UI动画、高效的DOM更新以及其他需要精确时序控制的操作非常有用。
 */
function afterNextFrame(callback) {
	const done = () => {
		clearTimeout(timeout);
		if (HAS_RAF) cancelAnimationFrame(raf);
		setTimeout(callback);
	};
	const timeout = setTimeout(done, RAF_TIMEOUT);

	let raf;
	if (HAS_RAF) {
		raf = requestAnimationFrame(done);
	}
}

// Note: if someone used options.debounceRendering = requestAnimationFrame,
// then effects will ALWAYS run on the NEXT frame instead of the current one, incurring a ~16ms delay.
// Perhaps this is not such a big deal.
/**
 * Schedule afterPaintEffects flush after the browser paints
 * @param {number} newQueueLength
 * @returns {void}
 * 根据新的队列长度调度副作用队列的刷新。如果队列长度为1或RAF请求方式改变，它将安排在浏览器绘制后调用flushAfterPaintEffects，确保副作用在页面更新后执行，减少布局重排和闪烁。
 */
function afterPaint(newQueueLength) {
	if (newQueueLength === 1 || prevRaf !== options.requestAnimationFrame) {
		prevRaf = options.requestAnimationFrame;
		(prevRaf || afterNextFrame)(flushAfterPaintEffects);
	}
}

/**
 * @param {import('./internal').HookState} hook
 * @returns {void}
 * 
 * 执行Hook的清理函数（如果有）。清理函数可能引起重新渲染，因此在调用前后维护currentComponent的状态以避免意外的组件状态变动。
 */
function invokeCleanup(hook) {
	// A hook cleanup can introduce a call to render which creates a new root, this will call options.vnode
	// and move the currentComponent away.
	const comp = currentComponent;
	let cleanup = hook._cleanup;
	if (typeof cleanup == 'function') {
		hook._cleanup = undefined;
		cleanup();
	}

	currentComponent = comp;
}

/**
 * Invoke a Hook's effect
 * @param {import('./internal').EffectHookState} hook
 * @returns {void}
 * 调用Hook的副作用函数，并存储其返回的清理函数到Hook状态中。同样，考虑到副作用函数可能触发重新渲染，这里也小心地管理currentComponent的上下文。
 */
function invokeEffect(hook) {
	// A hook call can introduce a call to render which creates a new root, this will call options.vnode
	// and move the currentComponent away.
	const comp = currentComponent;
	hook._cleanup = hook._value();
	currentComponent = comp;
}

/**
 * @param {unknown[]} oldArgs
 * @param {unknown[]} newArgs
 * @returns {boolean}
 * 
 * 比较两个参数数组是否发生变化，用于决定是否需要重新执行依赖于这些参数的副作用函数。

 */
function argsChanged(oldArgs, newArgs) {
	return (
		!oldArgs ||
		oldArgs.length !== newArgs.length ||
		newArgs.some((arg, index) => arg !== oldArgs[index])
	);
}

/**
 * @template Arg
 * @param {Arg} arg
 * @param {(arg: Arg) => any} f
 * @returns {any}
 * 
 * 根据传入的第二个参数类型，决定是调用该函数并传入第一个参数，还是直接返回第二个参数。常用于处理默认值或可选的函数调用逻辑。
 */
function invokeOrReturn(arg, f) {
	return typeof f == 'function' ? f(arg) : f;
}
