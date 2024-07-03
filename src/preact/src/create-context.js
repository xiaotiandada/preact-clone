import { enqueueRender } from './component';

export let i = 0;

// 该函数createContext用于创建一个新的上下文(Context)对象，它是React中用于跨组件传递数据的一种方式，无需通过中间组件逐层传递props。上下文包含一个Provider组件和一个Consumer组件，允许组件树中任何层级的组件订阅和消费共享的状态。以下是该函数的详细解析：

// 初始化变量：首先，定义了全局变量i用于生成唯一的contextId，每次调用createContext时自动递增。

// 创建上下文对象：创建一个对象context，其中包含：

// _id: 上下文的唯一标识符。
// _defaultValue: 上下文的默认值，当组件没有被Provider包裹时使用。
// Consumer: 函数组件，用于消费上下文。接收props，并通过props.children访问到被传递的函数，该函数会被调用并传入当前上下文的值。
// Provider: 函数组件，用于提供上下文。内部管理着订阅该上下文的组件列表（subs），并监听value的变化以通知订阅者更新。
// Provider组件逻辑：

// 初始化上下文管理逻辑：首次渲染时，为Provider组件添加一些生命周期方法和辅助函数，如getChildContext用于向下传递上下文，componentWillUnmount清理订阅者列表，shouldComponentUpdate检测value变化以触发更新。
// 订阅管理：sub函数用于注册订阅者（即消费上下文的组件），并在组件卸载时移除订阅。
// 更新逻辑：当Provider的value变化时，遍历订阅者列表并使用enqueueRender安排它们的重渲染。
// 暴露上下文对象：最后，通过特殊属性_contextRef和contextType将上下文对象自身暴露给开发工具和Consumer组件，以便于调试和自动类型推断。

// 总结，createContext函数创建了一个包含Provider和Consumer的上下文系统，使得组件可以在不直接传递props的情况下共享数据，同时实现了动态更新逻辑和开发工具的兼容性支持。
export function createContext(defaultValue, contextId) {
	contextId = '__cC' + i++;

	const context = {
		_id: contextId,
		_defaultValue: defaultValue,
		/** @type {FunctionComponent} */
		Consumer(props, contextValue) {
			// return props.children(
			// 	context[contextId] ? context[contextId].props.value : defaultValue
			// );
			return props.children(contextValue);
		},
		/** @type {FunctionComponent} */
		Provider(props) {
			if (!this.getChildContext) {
				/** @type {Component[] | null} */
				let subs = [];
				let ctx = {};
				ctx[contextId] = this;

				this.getChildContext = () => ctx;

				this.componentWillUnmount = () => {
					subs = null;
				};

				this.shouldComponentUpdate = function (_props) {
					if (this.props.value !== _props.value) {
						subs.some(c => {
							c._force = true;
							enqueueRender(c);
						});
					}
				};

				this.sub = c => {
					subs.push(c);
					let old = c.componentWillUnmount;
					c.componentWillUnmount = () => {
						if (subs) {
							subs.splice(subs.indexOf(c), 1);
						}
						if (old) old.call(c);
					};
				};
			}

			return props.children;
		}
	};

	// Devtools needs access to the context object when it
	// encounters a Provider. This is necessary to support
	// setting `displayName` on the context object instead
	// of on the component itself. See:
	// https://reactjs.org/docs/context.html#contextdisplayname

	return (context.Provider._contextRef = context.Consumer.contextType =
		context);
}
