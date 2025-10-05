import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: false,
  allConfig: false
})

export default [
  ...compat.config({
    extends: ['standard'],
    env: {
      browser: true,
      es2021: true
    },
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: 'module'
    },
    rules: {}
  })
]
