import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'
import type { GlobalAPI } from 'types/global-api'


// 这段代码定义了一个名为Vue的构造函数，用于创建Vue实例。函数体内部通过this._init(options)初始化实例，其中options是传入的配置对象。
// Vue构造函数还通过引入其他文件中的mixins来扩展Vue的功能，包括初始化、状态管理、事件处理、生命周期和渲染等。最后，将Vue导出为默认的模块，类型声明为GlobalAPI。
// 在开发环境下，如果Vue构造函数没有使用new关键字调用，会发出警告。
function Vue(options) {
  if (__DEV__ && !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

//@ts-expect-error Vue has function type
initMixin(Vue)
//@ts-expect-error Vue has function type
stateMixin(Vue)
//@ts-expect-error Vue has function type
eventsMixin(Vue)
//@ts-expect-error Vue has function type
lifecycleMixin(Vue)
//@ts-expect-error Vue has function type
renderMixin(Vue)

export default Vue as unknown as GlobalAPI
