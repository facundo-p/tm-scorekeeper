import { describe, it, expect } from 'vitest'
import * as app from '@/fx/planet/shaders'
// @ts-expect-error: módulo JS del mockup, sin tipos
import * as mockup from '../../../../docs/redesign/mockup/js/fx/planet-shaders.js'

describe('shaders del planeta', () => {
  it.each(['VERT', 'BAKE_FRAG', 'RENDER_FRAG'] as const)('%s is identical to the mockup (no drift)', (name) => {
    expect(app[name]).toBe(mockup[name])
  })
})
