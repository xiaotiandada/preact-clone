import { describe, expect, test } from '@jest/globals'

import {
  default as preact,
  h,
  render,
  Component,
  hooks,
  options,
} from '../../src/preact'

describe('preact', () => {
  test('should be available as a default export', () => {
    expect(preact).toBeDefined()
    expect(preact).toMatchObject({
      h,
      render,
      Component,
      hooks,
      options,
    })
  })

  test('should be available as named exports', () => {
    expect(h).toBeInstanceOf(Function)
    expect(render).toBeInstanceOf(Function)
    expect(Component).toBeInstanceOf(Function)
    expect(hooks).toBeInstanceOf(Object)
    expect(options).toBeInstanceOf(Object)
  })
})
