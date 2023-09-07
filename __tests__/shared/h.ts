import { describe, expect, test } from '@jest/globals'
import { h, VNode } from '../../src/preact'

describe('file function', () => {
  test('should return a VNode', () => {
    let r
    // @ts-ignore
    expect(() => (r = h('foo', undefined, []))).not.toThrow()
    expect(r).toBeInstanceOf(VNode)
    // console.log('r', r)
    expect(r).toHaveProperty('nodeName', 'foo')
    expect(r).toHaveProperty('attributes', undefined)
    expect(r).toHaveProperty('children', [])
  })

  test('should perserve raw attributes', () => {
    let attrs = { foo: 'bar', baz: 10, func: () => {} },
      r = h('foo', attrs)
    expect(r).toHaveProperty('attributes', attrs)
  })
  test('should support element children', () => {
    //
  })

  test('should support element children', () => {
    //
  })

  test('should support text children', () => {
    //
  })

  test('should merge adjacent text children', () => {
    //
  })
})
