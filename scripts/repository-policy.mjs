export const allowedRepositoryFiles = new Set([
  '.codex-plugin/plugin.json',
  '.gitattributes',
  '.github/ISSUE_TEMPLATE/behavior-report.yml',
  '.github/ISSUE_TEMPLATE/config.yml',
  '.github/dependabot.yml',
  '.github/pull_request_template.md',
  '.github/workflows/validate.yml',
  '.gitignore',
  'CONTRIBUTING.md',
  'LICENSE',
  'README.md',
  'README.zh-CN.md',
  'SECURITY.md',
  'evals/cases.yaml',
  'package-lock.json',
  'package.json',
  'scripts/repository-policy.mjs',
  'scripts/url-policy.mjs',
  'scripts/validate.mjs',
  'skills/intent-clarifier/SKILL.md',
  'skills/intent-clarifier/agents/openai.yaml',
  'skills/intent-clarifier/references/examples.md',
  'skills/intent-clarifier/references/self-inquiry.md',
  'tests/repository-policy.test.mjs',
  'tests/url-policy.test.mjs'
])

export function toLogicalPath(relativePath) {
  return relativePath.replaceAll('\\', '/')
}

export function findUnexpectedFiles(files) {
  return files
    .map(toLogicalPath)
    .filter(file => !allowedRepositoryFiles.has(file))
}
