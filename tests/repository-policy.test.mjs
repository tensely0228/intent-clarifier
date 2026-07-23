import assert from 'node:assert/strict'
import test from 'node:test'

import { findUnexpectedFiles, toLogicalPath } from '../scripts/repository-policy.mjs'

test('normalizes Windows separators for logical repository paths', () => {
  assert.equal(toLogicalPath('.github\\workflows\\validate.yml'), '.github/workflows/validate.yml')
})

test('accepts allowlisted files after cross-platform normalization', () => {
  assert.deepEqual(findUnexpectedFiles([
    '.github\\workflows\\validate.yml',
    'skills\\intent-clarifier\\SKILL.md'
  ]), [])
})

test('rejects executable or otherwise unreviewed repository files', () => {
  assert.deepEqual(findUnexpectedFiles([
    'skills/intent-clarifier/SKILL.md',
    'skills/intent-clarifier/install.sh',
    'dist/plugin.exe'
  ]), [
    'skills/intent-clarifier/install.sh',
    'dist/plugin.exe'
  ])
})
