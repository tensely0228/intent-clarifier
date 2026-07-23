const trackingParameterPattern = /^(?:utm_.+|_hsenc|_hsmi|dclid|fbclid|gclid|igshid|mc_cid|mc_eid|msclkid|ref|source|vero_id|yclid)$/i
const absoluteUrlPattern = /\bhttps?:\/\/[^\s<>"'`()\[\]{}]+/gi
const markdownDestinationPatterns = [
  /!?\[[^\]]*]\(\s*(?:<([^>]+)>|([^\s)]+))/g,
  /^\s*\[[^\]]+]:\s*(?:<([^>]+)>|(\S+))/gm,
  /(?:href|src)\s*=\s*["']([^"']+)["']/gi
]

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

  for (const destination of destinations) {
    if (!destination || destination.startsWith('#')) continue
    if (/^(?:data|javascript|vbscript):/i.test(destination)) {
      failures.push(`${source} contains an unsafe URL scheme: ${destination}`)
      continue
    }
    if (destination.startsWith('//')) {
      failures.push(`${source} contains a protocol-relative URL: ${destination}`)
      continue
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(destination) && !/^https?:/i.test(destination)) {
      failures.push(`${source} contains an unsupported URL scheme: ${destination}`)
      continue
    }
    if (/^https?:/i.test(destination)) absoluteUrls.add(destination)
  }

  for (const url of absoluteUrls) {
    failures.push(...validateAbsoluteUrl(url, { allowedHosts, label: `${source} URL` }))
  }

  return [...new Set(failures)]
}
