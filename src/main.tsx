import { render } from 'preact'
import { render as renderLib } from './lib/index.ts'
import { App } from './app.tsx'
import './index.css'

render(<App />, document.getElementById('app')!)

renderLib(<h1>heello</h1>, document.getElementById('main')!)
