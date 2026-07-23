import { lstat, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import yaml from 'js-yaml'

const root = path.resolve(import.meta.dirname, '..')
const skillRoot = path.join(root, 'skills', 'intent-clarifier')
const failures = []

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
  'README.md',
  'README.zh-CN.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'LICENSE',
  'evals/cases.yaml',
  'skills/intent-clarifier/SKILL.md',
  'skills/intent-clarifier/agents/openai.yaml',
  'skills/intent-clarifier/references/self-inquiry.md',
  'skills/intent-clarifier/references/examples.md'
]

const allFiles = await collectFiles(root)
for (const file of requiredFiles) check(allFiles.includes(file), `Missing required file: ${file}`)

const plugin = JSON.parse(await read('.codex-plugin/plugin.json'))
check(plugin.name === 'intent-clarifier', 'Plugin name must be intent-clarifier')
check(plugin.version === '0.1.0', 'Plugin version must be 0.1.0')
check(plugin.skills === './skills/', 'Plugin skills path must be ./skills/')
check(plugin.license === 'MIT', 'Plugin license must be MIT')
for (const runtimeKey of ['mcpServers', 'apps', 'hooks']) {
  check(!(runtimeKey in plugin), `Instruction-only plugin must not declare ${runtimeKey}`)
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
check(skillText.includes('## Workflow'), 'SKILL.md must define its workflow')
check(skillText.includes('## Output'), 'SKILL.md must define its output contract')

const openaiMetadata = yaml.load(await read('skills/intent-clarifier/agents/openai.yaml'))
check(openaiMetadata.interface?.display_name === 'Intent Clarifier', 'OpenAI display name is missing')
check(typeof openaiMetadata.interface?.default_prompt === 'string', 'OpenAI default prompt is missing')
check(openaiMetadata.policy?.allow_implicit_invocation === false, 'Initial release must require explicit invocation')

const evalDocument = yaml.load(await read('evals/cases.yaml'))
check(Array.isArray(evalDocument.cases), 'Eval document must contain a cases array')
const cases = Array.isArray(evalDocument.cases) ? evalDocument.cases : []
const ids = new Set()
let positiveCases = 0
let negativeCases = 0
for (const testCase of cases) {
  check(typeof testCase.id === 'string' && testCase.id.length > 0, 'Every eval case needs an id')
  check(!ids.has(testCase.id), `Duplicate eval id: ${testCase.id}`)
  ids.add(testCase.id)
  check(typeof testCase.prompt === 'string' && testCase.prompt.length > 0, `Eval ${testCase.id} needs a prompt`)
  check(typeof testCase.should_trigger === 'boolean', `Eval ${testCase.id} needs should_trigger`)
  if (testCase.should_trigger) positiveCases += 1
  else negativeCases += 1
  const expectations = testCase.expectations
  check(Number.isInteger(expectations?.max_questions) && expectations.max_questions >= 0 && expectations.max_questions <= 1, `Eval ${testCase.id} max_questions must be 0 or 1`)
  check(Array.isArray(expectations?.required_behaviors) && expectations.required_behaviors.length > 0, `Eval ${testCase.id} needs required behaviors`)
  check(Array.isArray(expectations?.forbidden_behaviors) && expectations.forbidden_behaviors.length > 0, `Eval ${testCase.id} needs forbidden behaviors`)
}
check(positiveCases >= 6, 'At least six positive trigger cases are required')
check(negativeCases >= 6, 'At least six negative trigger cases are required')

const forbiddenExtensions = new Set(['.zip', '.tar', '.gz', '.dmg', '.exe', '.pem', '.key'])
const sensitivePatterns = [
  { name: 'macOS user path', pattern: /\/Users\/[^/\s]+/ },
  { name: 'Windows user path', pattern: /[A-Za-z]:\\Users\\[^\\\s]+/ },
  { name: 'private key', pattern: new RegExp('-----BEGIN ' + '(?:RSA |EC |OPENSSH )?' + 'PRIVATE KEY-----') },
  { name: 'credential-like assignment', pattern: /\b(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\b\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{16,}/i },
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
}

if (failures.length > 0) {
  console.error('Validation failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Validation passed: ${allFiles.length} files, ${cases.length} eval cases (${positiveCases} positive, ${negativeCases} negative).`)
