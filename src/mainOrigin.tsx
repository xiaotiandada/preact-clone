import preact, { render, VNode, Component, h } from './preactOrigin'

const rootElement = document.getElementById('rootOrigin')

// 定义一个组件
class HelloWorld extends preact.Component {
  render() {
    return preact.h('h1', null, 'Hello, World!')
  }
}

// 渲染组件到DOM中
preact.render(preact.h(HelloWorld), rootElement!)
