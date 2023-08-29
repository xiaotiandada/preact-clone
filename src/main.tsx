// import { render } from 'preact'
// import { render as renderClone } from './index'
// import { App } from './app.tsx'
// import './index.css'
import { render, VNode } from './preact'
// import { render, VNode } from './preactOrigin'

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

render(
  new VNode(
    'div',
    {
      style: 'color: red;',
      'data-test': 'hello world',
      id: 'test',
      className: 'test',
    },
    [new VNode('span', undefined, ['hello world'])]
  ),
  document.getElementById('root')
)
