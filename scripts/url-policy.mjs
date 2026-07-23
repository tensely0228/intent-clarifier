const trackingParameterPattern = /^(?:utm_.+|_hsenc|_hsmi|dclid|fbclid|gclid|igshid|mc_cid|mc_eid|msclkid|ref|source|vero_id|yclid)$/i
const absoluteUrlPattern = /\bhttps?:\/\/[^\s<>"'`()\[\]{}]+/gi
const markdownDestinationPatterns = [
  /!?\[[^\]]*]\(\s*(?:<([^>]+)>|([^\s)]+))/g,
  /^\s*\[[^\]]+]:\s*(?:<([^>]+)>|(\S+))/gm,
  /(?:href|src)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi,
  /<([a-z][a-z0-9+.-]*:[^>\s]+)>/gi
]

const namedHtmlEntities = new Map([
  ['amp', '&'],
  ['apos', "'"],
  ['colon', ':'],
  ['gt', '>'],
  ['lt', '<'],
  ['quot', '"']
])

function decodeHtmlEntities(value) {
  return value.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));?/gi, (entity, decimal, hexadecimal, named) => {
    const codePoint = decimal
      ? Number.parseInt(decimal, 10)
      : hexadecimal
        ? Number.parseInt(hexadecimal, 16)
        : null
    if (codePoint !== null) {
      return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : entity
    }
    return namedHtmlEntities.get(named.toLowerCase()) ?? entity
  })
}

function normalizeDestination(value) {
  return decodeHtmlEntities(value).trim()
}

export function validateAbsoluteUrl(value, { allowedHosts, label = 'URL' }) {
  const failures = []
  let parsed

  try {
    parsed = new URL(value)
  } catch {
    return [`${label} is invalid: ${value}`]
  }

  if (parsed.protocol !== 'https:') failures.push(`${label} must use HTTPS: ${value}`)
  if (parsed.username || parsed.password) failures.push(`${label} must not contain embedded credentials: ${value}`)
  if (!allowedHosts.has(parsed.hostname.toLowerCase())) failures.push(`${label} uses an untrusted host: ${parsed.hostname}`)

  for (const key of parsed.searchParams.keys()) {
    if (trackingParameterPattern.test(key)) {
      failures.push(`${label} contains tracking parameter "${key}": ${value}`)
    }
  }

  return failures
}

export function scanMarkdownUrls(markdown, { allowedHosts, source }) {
  const failures = []
  const absoluteUrls = new Set(markdown.match(absoluteUrlPattern) ?? [])
  const destinations = new Set()

  for (const pattern of markdownDestinationPatterns) {
    for (const match of markdown.matchAll(pattern)) {
      destinations.add(match.slice(1).find(Boolean)?.trim())
    }
  }

  for (const rawDestination of destinations) {
    if (!rawDestination) continue
    const destination = normalizeDestination(rawDestination)
    const compactDestination = destination.replace(/[\u0000-\u0020]+/g, '')
    if (!destination || destination.startsWith('#')) continue
    if (/^(?:data|javascript|vbscript):/i.test(compactDestination)) {
      failures.push(`${source} contains an unsafe URL scheme: ${rawDestination}`)
      continue
    }
    if (destination.startsWith('//')) {
      failures.push(`${source} contains a protocol-relative URL: ${rawDestination}`)
      continue
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(compactDestination) && !/^https?:/i.test(compactDestination)) {
      failures.push(`${source} contains an unsupported URL scheme: ${rawDestination}`)
      continue
    }
    if (/^https?:/i.test(compactDestination)) absoluteUrls.add(compactDestination)
  }

  for (const url of absoluteUrls) {
    failures.push(...validateAbsoluteUrl(url, { allowedHosts, label: `${source} URL` }))
  }

  return [...new Set(failures)]
}
