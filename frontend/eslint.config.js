// ESLint 9 (flat config). Reglas del proyecto: .claude/CLAUDE.md y D-09.
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import globals from 'globals'

// D-09: sin estilos inline; solo custom properties con style={cssVars({...})}. Cubre el
// atributo y los spreads literales ({...{ style }}); un objeto armado aparte y pasado por
// spread o createElement no se detecta (límite aceptado, ver DECISIONS.md D-09).
const INLINE_STYLE_MESSAGE = 'Sin estilos inline (D-09): usá clases de CSS o style={cssVars({ ... })} para custom properties.'
const NO_INLINE_STYLE = [
  {
    selector: "JSXAttribute[name.name='style']:not([value.expression.type='CallExpression'][value.expression.callee.name='cssVars'])",
    message: INLINE_STYLE_MESSAGE,
  },
  { selector: "JSXSpreadAttribute > ObjectExpression > Property[key.name='style']", message: INLINE_STYLE_MESSAGE },
]

export default tseslint.config(
  { ignores: ['dist', 'dist-parity', 'node_modules', 'coverage', 'playwright-report', 'test-results'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, jsxA11y.flatConfigs.recommended],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: { ecmaVersion: 2022, globals: { ...globals.browser } },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'no-restricted-syntax': ['error', ...NO_INLINE_STYLE],
      // El foco inicial en el login y en los diálogos es intencional (también en el mockup).
      'jsx-a11y/no-autofocus': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/test/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '*.config.ts'],
    languageOptions: { globals: { ...globals.node, ...globals.vitest } },
  },
)
