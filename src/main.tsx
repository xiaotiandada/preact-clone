// import { render } from 'preact'
// import { render as renderClone } from './index'
// import { App } from './app.tsx'
// import './index.css'
import preact, { render, VNode, Component, h } from './preact'
// import { render, VNode } from './preactOrigin'

const rootElement = document.getElementById('root')

// console.log('app', <App />)

// render(<App />, document.getElementById('app')!)
// render(<div>hello world</div>, document.getElementById('app')!)
// render(
//   <div id="test" className="box" data-test="test" style="color: red;">
//     hello world
//   </div>,
//   document.getElementById('app')!
// )
// renderClone(<App />, document.getElementById('root')!)
// renderClone(
//   <div id="test" className="box" data-test="test" style="color: red;">
//     hello world
//   </div>,
//   document.getElementById('root')!
// )
// renderClone('hello world', document.getElementById('root')!)

// renderOrigin2(
//   <div id="test" className="box" data-test="test" style="color: red;">
//     hello world
//   </div>,
//   document.getElementById('root')!
// )

// const app = (
//   <div id="test" className="box" data-test="test" style="color: red;">
//     hello world
//   </div>
// )

// console.log('app', app)

// render(
//   new VNode(
//     'div',
//     {
//       style: 'color: red;',
//       'data-test': 'hello world',
//       id: 'test',
//       className: 'test',
//       onClick: () => {
//         alert('hello world')
//       },
//     },
//     [new VNode('span', undefined, ['hello world'])]
//   ),
//   document.getElementById('root')
// )

// 定义一个组件
class HelloWorld extends preact.Component {
  render() {
    return preact.h(
      'h1',
      {
        'data-test': 'test',
        style: {
          color: 'red',
        },
      },
      'Hello, World!'
    )
  }
}

// 渲染组件到DOM中
preact.render(preact.h(HelloWorld), rootElement!)

// 渲染组件到DOM中
// preact.render(
//   preact.h(
//     'h1',
//     {
//       id: 'test',
//       // className: 'test',
//       className: {
//         a: '1',
//         b: '2',
//         c: false,
//         d: true,
//       },
//       'data-test': 'hello world',
//       // style: 'color: red;',
//       style: {
//         color: 'green',
//         backgroundColor: 'gray',
//         fontSize: 20,
//       },
//       onClick: () => {
//         console.log('event clicked')
//       },
//     },
//     undefined,
//     null,
//     `Hello, World!`
//   ),
//   rootElement!
// )
