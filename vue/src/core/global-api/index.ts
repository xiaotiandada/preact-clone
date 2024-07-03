import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from 'shared/constants'
import builtInComponents from '../components/index'
import { observe } from 'core/observer/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'
import type { GlobalAPI } from 'types/global-api'



// 该函数用于初始化全局API，接收一个GlobalAPI类型的Vue对象作为参数。主要功能包括：

// 配置Vue.config对象，通过Object.defineProperty定义getter和setter，其中setter在开发环境下会给出警告，不推荐替换Vue.config对象，而是设置其个别字段。

// 暴露一些实用方法，如Vue.util.warn、Vue.util.extend等，这些方法不是公共API的一部分，使用时需谨慎。

// 定义Vue.set、Vue.delete和Vue.nextTick方法，用于响应式地修改数据和延迟执行回调。

// 提供Vue.observable方法，用于创建可观察对象。

// 初始化Vue.options对象，包括组件、指令、过滤器等的选项，并设置_base属性指向Vue自身，用于Weex的多实例场景。

// 调用initUse、initMixin、initExtend和initAssetRegisters函数，进一步初始化Vue的各种特性。
export function initGlobalAPI(Vue: GlobalAPI) {
  // config
  const configDef: Record<string, any> = {}
  configDef.get = () => config
  if (__DEV__) {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  // 2.6 explicit observable API
  Vue.observable = <T>(obj: T): T => {
    observe(obj)
    return obj
  }

  Vue.options = Object.create(null)
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue

  extend(Vue.options.components, builtInComponents)

  initUse(Vue)
  initMixin(Vue)
  initExtend(Vue)
  initAssetRegisters(Vue)
}
