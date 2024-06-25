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

let togger = true

// 定义一个组件
class HelloWorld extends preact.Component {
  getDefaultProps() {
    return {
      propsValue: 'hello world',
    }
  }

  getInitialState() {
    return {
      stateValue: 'hello world',
    }
  }

  initialize() {
    console.log('initialize Component')
  }

  componentWillReceiveProps() {
    console.log('componentWillReceiveProps')
  }

  componentWillUpdate() {
    console.log('componentWillUpdate')
  }

  componentDidUpdate() {
    console.log('componentDidUpdate')
  }

  componentWillUnmount() {
    console.log('componentWillUnmount')
  }

  componentDidUnmount() {
    console.log('componentDidUnmount')
  }

  render(props, state) {
    return preact.h(
      'h1',
      {
        'data-test': 'test',
        style: {
          color: 'red',
        },
        onClick: () => {
          togger = !togger
          console.log('togger clicked', togger, this)
          this.setState({
            stateValue: '1',
          })
        },
      },
      state?.stateValue
    )
  }
}

class Counter extends preact.Component {
  getDefaultProps() {
    return {}
  }

  getInitialState() {
    return {
      count: 0,
    }
  }

  render(props, state) {
    return preact.h(
      'div',
      {
        style: {
          fontSize: '20px',
        },
      },
      preact.h('div', null, state.count),
      preact.h(
        'button',
        {
          onClick: () => {
            this.setState({
              count: state.count + 1,
            })
          },
        },
        'Increase'
      ),
      preact.h(
        'button',
        {
          onClick: () => {
            this.setState({
              count: state.count - 1,
            })
          },
        },
        'Decrease'
      ),
      preact.h(
        'button',
        {
          onClick: () => {
            this.setState({
              count: 0,
            })
          },
        },
        'Reset'
      ),
      preact.h(HelloWorld)
    )
  }
}

// 渲染组件到DOM中
// preact.render(preact.h(HelloWorld), rootElement!)
preact.render(preact.h(Counter), rootElement!)

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
