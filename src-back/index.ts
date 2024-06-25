export { render, hydrate } from './render';
// h 是因为它允许您编写原始 Preact（Without JSX），也因为它最初受到 HyperScript 👇 的启发。
export {
  createElement,
  createElement as h,
  Fragment,
  createRef,
  isValidElement
} from './create-element';
export { Component } from './component';
export { cloneElement } from './clone-element';
export { createContext } from './create-context';
export { toChildArray } from './diff/children';
export { default as options } from './options';
