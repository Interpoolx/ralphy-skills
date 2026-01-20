import { createFileRoute } from '@tanstack/react-router'
import { DocsLayout, CodeBlock, InfoBox } from '../components/DocsLayout'

export const Route = createFileRoute('/docs/integrate')({
  component: IntegrateSkills,
})

const toc = [
  { id: 'integration-approaches', title: 'Integration approaches', level: 2 },
  { id: 'overview', title: 'Overview', level: 2 },
  { id: 'skill-discovery', title: 'Skill discovery', level: 2 },
  { id: 'loading-metadata', title: 'Loading metadata', level: 2 },
  { id: 'parsing-frontmatter', title: 'Parsing frontmatter', level: 3 },
  { id: 'injecting-into-context', title: 'Injecting into context', level: 3 },
  { id: 'activating-skills', title: 'Activating skills', level: 2 },
  { id: 'security-considerations', title: 'Security considerations', level: 2 },
  { id: 'supported-clients', title: 'Supported clients', level: 2 },
  { id: 'reference-implementation', title: 'Reference implementation', level: 2 },
]

function IntegrateSkills() {
  return (
    <DocsLayout
      title="Integrate skills into your agent"
      description="How to add Agent Skills support to your AI coding agent or tool."
      toc={toc}
    >
      <h2 id="integration-approaches">Integration approaches</h2>
      <p>
        There are two main approaches to integrating skills into your agent:
      </p>
      <ul>
        <li><strong>Direct file reading</strong> – The agent reads <code>SKILL.md</code> directly when needed</li>
        <li><strong>Metadata injection</strong> – Load skill metadata at startup, inject into context</li>
      </ul>

      <InfoBox type="tip" title="Recommended Approach">
        For most agents, metadata injection provides the best balance of performance and flexibility.
        Load skill descriptions at startup, then fetch full content on-demand.
      </InfoBox>

      <h2 id="overview">Overview</h2>
      <p>The typical integration flow:</p>
      <ol>
        <li><strong>Discover</strong> – Find skills in configured directories</li>
        <li><strong>Load metadata</strong> – Parse frontmatter (name, description) at startup</li>
        <li><strong>Match</strong> – Use descriptions to match user tasks to relevant skills</li>
        <li><strong>Activate</strong> – Load full instructions when a skill is needed</li>
        <li><strong>Execute</strong> – Run scripts and access resources as needed</li>
      </ol>

      <h2 id="skill-discovery">Skill discovery</h2>
      <p>
        Walk configured directories looking for <code>SKILL.md</code> files.
        Common locations include:
      </p>

      <CodeBlock language="typescript" filename="Skill directories">{`const skillPaths = [
  // Project-local skills
  './.agent/skills',
  './.claude/skills',
  './.cursor/rules',
  
  // Global skills
  '~/.ralphy/skills',
  '~/.claude/skills',
]

function discoverSkills(paths: string[]): string[] {
  const skills: string[] = []
  
  for (const basePath of paths) {
    if (!fs.existsSync(basePath)) continue
    
    for (const dir of fs.readdirSync(basePath)) {
      const skillPath = path.join(basePath, dir, 'SKILL.md')
      if (fs.existsSync(skillPath)) {
        skills.push(path.join(basePath, dir))
      }
    }
  }
  
  return skills
}`}</CodeBlock>

      <h2 id="loading-metadata">Loading metadata</h2>
      <h3 id="parsing-frontmatter">Parsing frontmatter</h3>
      <p>
        Extract only the YAML frontmatter for fast loading:
      </p>

      <CodeBlock language="typescript" filename="parseMetadata.ts">{`interface SkillMetadata {
  name: string
  description: string
  path: string
}

function parseMetadata(skillPath: string): SkillMetadata {
  const content = fs.readFileSync(
    path.join(skillPath, 'SKILL.md'), 
    'utf-8'
  )
  
  // Extract frontmatter between --- markers
  const match = content.match(/^---\\n([\\s\\S]*?)\\n---/)
  if (!match) throw new Error('Invalid SKILL.md: no frontmatter')
  
  const frontmatter = yaml.parse(match[1])
  
  return {
    name: frontmatter.name,
    description: frontmatter.description,
    path: skillPath
  }
}`}</CodeBlock>

      <h3 id="injecting-into-context">Injecting into context</h3>
      <p>
        Add skill metadata to the agent's system prompt so it knows what skills are available:
      </p>

      <CodeBlock language="xml" filename="System prompt injection">{`<available_skills>
  <skill>
    <name>pdf-processing</name>
    <description>Extracts text and tables from PDF files, 
    fills forms, merges documents.</description>
    <location>/path/to/skills/pdf-processing/SKILL.md</location>
  </skill>
  <skill>
    <name>data-analysis</name>
    <description>Analyzes datasets, generates charts, 
    and creates summary reports.</description>
    <location>/path/to/skills/data-analysis/SKILL.md</location>
  </skill>
</available_skills>

When a user's task matches a skill description, read the 
skill's SKILL.md file to get detailed instructions.`}</CodeBlock>

      <InfoBox type="note" title="Context Window">
        Only inject skill names and descriptions—not full content.
        Load full instructions on-demand to conserve context window space.
      </InfoBox>

      <h2 id="activating-skills">Activating skills</h2>
      <p>
        When the agent determines a skill is relevant, load the full <code>SKILL.md</code> content:
      </p>

      <CodeBlock language="typescript">{`function activateSkill(skillPath: string): string {
  const content = fs.readFileSync(
    path.join(skillPath, 'SKILL.md'),
    'utf-8'
  )
  
  // Remove frontmatter, return body content
  return content.replace(/^---[\\s\\S]*?---\\n/, '')
}`}</CodeBlock>

      <h2 id="security-considerations">Security considerations</h2>
      <p>When integrating skills, consider these security practices:</p>

      <ul>
        <li><strong>Sandboxing</strong> – Run scripts in isolated environments</li>
        <li><strong>Allowlisting</strong> – Only execute scripts from trusted skills</li>
        <li><strong>Confirmation</strong> – Ask users before running dangerous operations</li>
        <li><strong>Logging</strong> – Record all script executions for auditing</li>
      </ul>

      <InfoBox type="warning" title="Script Execution">
        Never execute scripts from untrusted skills without user confirmation.
        Consider using containerization (Docker) for isolation.
      </InfoBox>

      <h2 id="supported-clients">Supported clients</h2>
      <p>
        Ralphy Skills supports 15+ AI coding clients. Each client has its preferred
        skill directory:
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 pr-4">Client</th>
              <th className="text-left py-3 pr-4">Local Path</th>
              <th className="text-left py-3">Global Path</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-gray-100">
                <td className="py-3 pr-4">
                  <span className="mr-2">{client.icon}</span>
                  {client.name}
                </td>
                <td className="py-3 pr-4 font-mono text-xs">{client.local}</td>
                <td className="py-3 font-mono text-xs">{client.global}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="reference-implementation">Reference implementation</h2>
      <p>
        The Ralphy Skills CLI provides a reference implementation for skill integration:
      </p>

      <CodeBlock language="bash">{`# Validate a skill
npx ralphy-skills validate ./my-skill

# Generate available_skills XML for injection
npx ralphy-skills sync --format xml

# Read skill content for activation
npx ralphy-skills read pdf-processing`}</CodeBlock>

      <p>
        See the <a href="https://github.com/Interpoolx/ralphy-skills" className="text-blue-600 hover:underline">
          GitHub repository</a> for the full implementation.
      </p>
    </DocsLayout>
  )
}

const clients = [
  { id: 'claude', name: 'Claude Code', icon: '🧠', local: '.claude/skills', global: '~/.claude/skills' },
  { id: 'cursor', name: 'Cursor', icon: '🖱️', local: '.cursor/rules', global: '~/.cursor/rules' },
  { id: 'copilot', name: 'GitHub Copilot', icon: '🤖', local: '.github/skills', global: '~/.github/skills' },
  { id: 'windsurf', name: 'Windsurf', icon: '🏄', local: '.windsurf/skills', global: '~/.windsurf/skills' },
  { id: 'gemini', name: 'Gemini CLI', icon: '💎', local: '.gemini/skills', global: '~/.gemini/skills' },
  { id: 'aider', name: 'Aider', icon: '🔧', local: '.aider/skills', global: '~/.aider/skills' },
  { id: 'opencode', name: 'OpenCode', icon: '📂', local: '.opencode/skills', global: '~/.opencode/skills' },
  { id: 'codex', name: 'Codex CLI', icon: '🤯', local: '.codex/skills', global: '~/.codex/skills' },
  { id: 'amp', name: 'Amp', icon: '⚡', local: '.amp/skills', global: '~/.amp/skills' },
  { id: 'goose', name: 'Goose', icon: '🪿', local: '.goose/skills', global: '~/.goose/skills' },
  { id: 'letta', name: 'Letta', icon: '🧠', local: '.letta/skills', global: '~/.letta/skills' },
  { id: 'agent', name: 'Universal', icon: '🌐', local: '.agent/skills', global: '~/.ralphy/skills' },
]
