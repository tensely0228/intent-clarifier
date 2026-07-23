import assert from 'node:assert/strict'
import test from 'node:test'

import { scanMarkdownUrls, validateAbsoluteUrl } from '../scripts/url-policy.mjs'

const allowedHosts = new Set(['agentskills.io', 'github.com', 'img.shields.io'])

test('accepts trusted HTTPS URLs without tracking data', () => {
  assert.deepEqual(validateAbsoluteUrl(
    'https://github.com/tensely0228/intent-clarifier',
    { allowedHosts, label: 'repository' }
  ), [])
})

test('rejects insecure, credentialed, tracked, and untrusted URLs', () => {
  const urls = [
    'http://github.com/tensely0228/intent-clarifier',
    'https://user:secret@github.com/tensely0228/intent-clarifier',
    'https://github.com/tensely0228/intent-clarifier?utm_source=test',
    'https://example.invalid/intent-clarifier'
  ]
  const failures = urls.flatMap(url => validateAbsoluteUrl(url, {
    allowedHosts,
    label: 'test URL'
  }))

  assert.ok(failures.some(message => message.includes('HTTPS')))
  assert.ok(failures.some(message => message.includes('embedded credentials')))
  assert.ok(failures.some(message => message.includes('tracking parameter')))
  assert.ok(failures.some(message => message.includes('untrusted host')))
})

test('rejects active and protocol-relative Markdown destinations', () => {
  const markdown = [
    '[unsafe](javascript:alert(1))',
    '[ambiguous](//example.invalid/path)'
  ].join('\n')
  const failures = scanMarkdownUrls(markdown, { allowedHosts, source: 'fixture.md' })

  assert.ok(failures.some(message => message.includes('unsafe URL scheme')))
  assert.ok(failures.some(message => message.includes('protocol-relative URL')))
})

test('scans plain URLs as well as Markdown links', () => {
  const markdown = 'Clone https://github.com/tensely0228/intent-clarifier.git and continue.'
  assert.deepEqual(scanMarkdownUrls(markdown, { allowedHosts, source: 'fixture.md' }), [])
})
