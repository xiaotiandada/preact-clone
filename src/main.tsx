import { render } from 'preact'
import { render as renderClone } from './index.ts'
import { App } from './app.tsx'
// import './index.css'

console.log('app', <App />)

// render(<App />, document.getElementById('app')!)
render(<div>hello world</div>, document.getElementById('app')!)
// renderClone(<App />, document.getElementById('root')!)
renderClone(<div>hello world</div>, document.getElementById('root')!)
// renderClone('hello world', document.getElementById('root')!)
