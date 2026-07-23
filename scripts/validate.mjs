import { lstat, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import yaml from 'js-yaml'

import { scanMarkdownUrls, validateAbsoluteUrl } from './url-policy.mjs'

const root = path.resolve(import.meta.dirname, '..')
const failures = []
const repositoryUrl = 'https://github.com/tensely0228/intent-clarifier'
const canonicalPrompt = 'Use $intent-clarifier to clarify my request and answer it directly with minimal questions.'
const trustedMarkdownHosts = new Set(['agentskills.io', 'github.com', 'img.shields.io'])

function check(condition, message) {
  if (!condition) failures.push(message)
}

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8')
}

async function collectFiles(directory, relative = '') {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue
    const absolutePath = path.join(directory, entry.name)
    const relativePath = path.join(relative, entry.name)
    const stat = await lstat(absolutePath)
    check(!stat.isSymbolicLink(), `Symbolic links are not allowed: ${relativePath}`)
    if (stat.isDirectory()) files.push(...await collectFiles(absolutePath, relativePath))
    else files.push(relativePath)
  }
  return files
}

const requiredFiles = [
  '.codex-plugin/plugin.json',
  '.github/dependabot.yml',
  '.github/workflows/validate.yml',
  'README.md',
  'README.zh-CN.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'LICENSE',
  'evals/cases.yaml',
  'package-lock.json',
  'package.json',
  'scripts/url-policy.mjs',
  'scripts/validate.mjs',
  'skills/intent-clarifier/SKILL.md',
  'skills/intent-clarifier/agents/openai.yaml',
  'skills/intent-clarifier/references/self-inquiry.md',
  'skills/intent-clarifier/references/examples.md',
  'tests/url-policy.test.mjs'
]

const allFiles = await collectFiles(root)
for (const file of requiredFiles) check(allFiles.includes(file), `Missing required file: ${file}`)

const packageManifest = JSON.parse(await read('package.json'))
const packageLock = JSON.parse(await read('package-lock.json'))
check(packageManifest.name === 'intent-clarifier', 'Package name must be intent-clarifier')
check(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageManifest.version), 'Package version must use semantic versioning')
check(packageManifest.private === true, 'Package must stay private to prevent accidental npm publication')
check(packageManifest.license === 'MIT', 'Package license must be MIT')
check(/^\^\d+\.\d+\.\d+$/.test(packageManifest.devDependencies?.['js-yaml']), 'js-yaml must use a compatible version range')
check(packageLock.version === packageManifest.version, 'Package manifest and lockfile versions must match')
check(packageLock.packages?.['']?.version === packageManifest.version, 'Lockfile root package version must match package.json')
check(packageLock.packages?.['']?.devDependencies?.['js-yaml'] === packageManifest.devDependencies?.['js-yaml'], 'Lockfile dependency range must match package.json')

const plugin = JSON.parse(await read('.codex-plugin/plugin.json'))
check(plugin.name === 'intent-clarifier', 'Plugin name must be intent-clarifier')
check(plugin.version === packageManifest.version, 'Plugin and package versions must match')
check(plugin.skills === './skills/', 'Plugin skills path must be ./skills/')
check(plugin.license === 'MIT', 'Plugin license must be MIT')
for (const runtimeKey of ['apps', 'connectors', 'hooks', 'mcpServers']) {
  check(!(runtimeKey in plugin), `Instruction-only plugin must not declare ${runtimeKey}`)
}
for (const [field, value] of [
  ['homepage', plugin.homepage],
  ['repository', plugin.repository],
  ['interface.websiteURL', plugin.interface?.websiteURL]
]) {
  check(value === repositoryUrl, `Plugin ${field} must point to the canonical repository`)
  failures.push(...validateAbsoluteUrl(value, {
    allowedHosts: new Set(['github.com']),
    label: `Plugin ${field}`
  }))
}
check(Array.isArray(plugin.interface?.defaultPrompt) && plugin.interface.defaultPrompt.length === 1, 'Plugin must define one presentation prompt')
check(plugin.interface?.defaultPrompt?.[0] === canonicalPrompt, 'Plugin presentation prompt must match the canonical prompt')

const issueConfig = yaml.load(await read('.github/ISSUE_TEMPLATE/config.yml'))
const securityContact = issueConfig.contact_links?.find(link => link.name === 'Security report')
check(issueConfig.blank_issues_enabled === false, 'Blank issues must stay disabled')
check(securityContact?.url === `${repositoryUrl}/security/advisories/new`, 'Security contact must use GitHub private vulnerability reporting')

const dependabot = yaml.load(await read('.github/dependabot.yml'))
check(dependabot.version === 2, 'Dependabot configuration must use version 2')
for (const ecosystem of ['github-actions', 'npm']) {
  const update = dependabot.updates?.find(item => item['package-ecosystem'] === ecosystem)
  check(Boolean(update), `Dependabot must monitor ${ecosystem}`)
  check(update?.directory === '/', `Dependabot ${ecosystem} directory must be /`)
  check(update?.schedule?.interval === 'weekly', `Dependabot ${ecosystem} updates must run weekly`)
}

const skillText = await read('skills/intent-clarifier/SKILL.md')
const frontmatterMatch = skillText.match(/^---\n([\s\S]*?)\n---\n/)
check(Boolean(frontmatterMatch), 'SKILL.md must start with YAML frontmatter')
if (frontmatterMatch) {
  const frontmatter = yaml.load(frontmatterMatch[1])
  check(frontmatter.name === 'intent-clarifier', 'Skill name must match its directory')
  check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(frontmatter.name), 'Skill name must use lowercase kebab-case')
  check(typeof frontmatter.description === 'string' && frontmatter.description.length <= 1024, 'Skill description must be 1-1024 characters')
  check(frontmatter.license === 'MIT', 'Skill license must be MIT')
  check(frontmatter.metadata?.version === plugin.version, 'Skill and plugin versions must match')
}
check(skillText.split('\n').length < 500, 'SKILL.md must stay under 500 lines')
check(skillText.includes('## Activation boundary'), 'SKILL.md must define its activation boundary')
check(skillText.includes('## Workflow'), 'SKILL.md must define its workflow')
check(skillText.includes('## Output'), 'SKILL.md must define its output contract')
check(skillText.includes('## Guardrails'), 'SKILL.md must define its guardrails')
for (const safeguard of ['explicit invocation', 'untrusted task data', 'hidden chain-of-thought']) {
  check(skillText.toLowerCase().includes(safeguard), `SKILL.md must cover ${safeguard}`)
}

const openaiMetadata = yaml.load(await read('skills/intent-clarifier/agents/openai.yaml'))
check(openaiMetadata.interface?.display_name === 'Intent Clarifier', 'OpenAI display name is missing')
check(openaiMetadata.interface?.default_prompt === canonicalPrompt, 'OpenAI presentation prompt must match the canonical prompt')
check(openaiMetadata.policy?.allow_implicit_invocation === false, 'Skill must require explicit invocation')

const evalDocument = yaml.load(await read('evals/cases.yaml'))
check(Array.isArray(evalDocument.cases), 'Eval document must contain a cases array')
check(evalDocument.metadata?.data_policy === 'synthetic-only', 'Eval data policy must be synthetic-only')
const cases = Array.isArray(evalDocument.cases) ? evalDocument.cases : []
const ids = new Set()
let positiveCases = 0
let negativeCases = 0
const localeCounts = {
  positive: new Map(),
  negative: new Map()
}
for (const testCase of cases) {
  check(typeof testCase.id === 'string' && testCase.id.length > 0, 'Every eval case needs an id')
  check(!ids.has(testCase.id), `Duplicate eval id: ${testCase.id}`)
  ids.add(testCase.id)
  check(typeof testCase.prompt === 'string' && testCase.prompt.length > 0, `Eval ${testCase.id} needs a prompt`)
  check(typeof testCase.should_trigger === 'boolean', `Eval ${testCase.id} needs should_trigger`)
  check(['en', 'zh-CN'].includes(testCase.locale), `Eval ${testCase.id} must use a supported locale`)
  const polarity = testCase.should_trigger ? 'positive' : 'negative'
  if (testCase.should_trigger) positiveCases += 1
  else negativeCases += 1
  localeCounts[polarity].set(testCase.locale, (localeCounts[polarity].get(testCase.locale) ?? 0) + 1)
  const expectations = testCase.expectations
  check(Number.isInteger(expectations?.max_questions) && expectations.max_questions >= 0 && expectations.max_questions <= 1, `Eval ${testCase.id} max_questions must be 0 or 1`)
  check(Array.isArray(expectations?.required_behaviors) && expectations.required_behaviors.length > 0, `Eval ${testCase.id} needs required behaviors`)
  check(Array.isArray(expectations?.forbidden_behaviors) && expectations.forbidden_behaviors.length > 0, `Eval ${testCase.id} needs forbidden behaviors`)
  check(expectations?.required_behaviors?.every(item => typeof item === 'string'), `Eval ${testCase.id} required behaviors must be strings`)
  check(expectations?.forbidden_behaviors?.every(item => typeof item === 'string'), `Eval ${testCase.id} forbidden behaviors must be strings`)
  if (!testCase.should_trigger) check(expectations?.max_questions === 0, `Non-trigger eval ${testCase.id} must not ask questions`)
}
check(positiveCases >= 12, 'At least twelve positive trigger cases are required')
check(negativeCases >= 12, 'At least twelve negative trigger cases are required')
for (const polarity of ['positive', 'negative']) {
  for (const locale of ['en', 'zh-CN']) {
    check((localeCounts[polarity].get(locale) ?? 0) >= 4, `At least four ${polarity} ${locale} evals are required`)
  }
}
for (const requiredId of [
  'accessibility-accommodation',
  'caregiving-tradeoff',
  'explicit-prompt-injection',
  'implicit-host-fallback',
  'quoted-prompt-injection',
  'volunteer-scope-conflict'
]) {
  check(ids.has(requiredId), `Missing boundary eval: ${requiredId}`)
}

const forbiddenExtensions = new Set(['.zip', '.tar', '.gz', '.dmg', '.exe', '.pem', '.key'])
const sensitivePatterns = [
  { name: 'macOS user path', pattern: /\/Users\/[^/\s]+/ },
  { name: 'Windows user path', pattern: /[A-Za-z]:\\Users\\[^\\\s]+/ },
  { name: 'private key', pattern: new RegExp('-----BEGIN ' + '(?:RSA |EC |OPENSSH )?' + 'PRIVATE KEY-----') },
  { name: 'credential-like assignment', pattern: /\b(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\b\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{16,}/i },
  { name: 'GitHub token', pattern: /\b(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,})\b/ },
  { name: 'provider-style secret', pattern: /\bsk-[A-Za-z0-9_-]{16,}/ }
]

for (const file of allFiles) {
  check(!forbiddenExtensions.has(path.extname(file).toLowerCase()), `Forbidden release artifact: ${file}`)
  const absolutePath = path.join(root, file)
  const stat = await lstat(absolutePath)
  if (stat.size > 1_000_000) {
    failures.push(`Unexpected file larger than 1 MB: ${file}`)
    continue
  }
  const content = await readFile(absolutePath, 'utf8')
  for (const { name, pattern } of sensitivePatterns) {
    check(!pattern.test(content), `Potential ${name} found in ${file}`)
  }
  if (path.extname(file).toLowerCase() === '.md') {
    failures.push(...scanMarkdownUrls(content, {
      allowedHosts: trustedMarkdownHosts,
      source: file
    }))
  }
}

if (failures.length > 0) {
  console.error('Validation failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Validation passed: ${allFiles.length} files, ${cases.length} eval cases (${positiveCases} positive, ${negativeCases} negative).`)
