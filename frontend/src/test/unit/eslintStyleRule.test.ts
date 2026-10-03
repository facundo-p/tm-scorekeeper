import { describe, it, expect } from 'vitest'
import { ESLint } from 'eslint'

const eslint = new ESLint({ cwd: process.cwd() })

async function styleErrors(code: string) {
  const [result] = await eslint.lintText(code, { filePath: 'src/__lint_probe__.tsx' })
  return result.messages.filter((m) => m.ruleId === 'no-restricted-syntax')
}

describe('regla D-09 (sin estilos inline)', () => {
  it('rechaza un objeto de estilos', async () => {
    const errors = await styleErrors("export const A = () => <div style={{ color: 'red' }} />\n")
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('D-09')
  })

  it('acepta style={cssVars(...)}', async () => {
    const code = "import { cssVars } from '@/domain/cssVars'\nexport const A = () => <div style={cssVars({ w: '1%' })} />\n"
    expect(await styleErrors(code)).toHaveLength(0)
  })

  it('rechaza un spread literal con style', async () => {
    expect(await styleErrors("export const A = () => <div {...{ style: { color: 'red' } }} />\n")).toHaveLength(1)
  })

  it('rechaza otra función o una variable', async () => {
    const code = "const s = {}\nconst f = () => s\nexport const A = () => <><div style={s} /><div style={f()} /></>\n"
    expect(await styleErrors(code)).toHaveLength(2)
  })
})
