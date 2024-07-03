import { render } from './preact/src/index'
// Must be the first import
import "./preact/debug";
import { render as renderLib } from './lib/index.ts'
import { App } from './app.tsx'
import './index.css'


// render(<App />, document.getElementById('app')!)
render(<h1>hello</h1>, document.getElementById('app')!)

renderLib(<h1>hello</h1>, document.getElementById('main')!, undefined)
