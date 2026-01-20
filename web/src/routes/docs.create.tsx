import { createFileRoute, Link } from '@tanstack/react-router'
import { DocsLayout, CodeBlock, InfoBox } from '../components/DocsLayout'

export const Route = createFileRoute('/docs/create')({
  component: CreateSkill,
})

const toc = [
  { id: 'quick-start', title: 'Quick start', level: 2 },
  { id: 'using-the-cli', title: 'Using the CLI', level: 3 },
  { id: 'manual-creation', title: 'Manual creation', level: 3 },
  { id: 'writing-effective-skills', title: 'Writing effective skills', level: 2 },
  { id: 'structure', title: 'Structure your content', level: 3 },
  { id: 'be-specific', title: 'Be specific', level: 3 },
  { id: 'include-examples', title: 'Include examples', level: 3 },
  { id: 'advanced-features', title: 'Advanced features', level: 2 },
  { id: 'scripts', title: 'Adding scripts', level: 3 },
  { id: 'references', title: 'Reference files', level: 3 },
  { id: 'testing', title: 'Testing your skill', level: 2 },
  { id: 'publishing', title: 'Publishing', level: 2 },
]

function CreateSkill() {
  return (
    <DocsLayout
      title="Create Skills"
      description="Build custom skills to enhance AI coding assistants with specialized knowledge."
      toc={toc}
    >
      <h2 id="quick-start">Quick start</h2>
      <p>
        Creating a skill is straightforward—it's just a directory with a <code>SKILL.md</code> file.
        You can use the CLI wizard or create one manually.
      </p>

      <h3 id="using-the-cli">Using the CLI</h3>
      <p>The fastest way to create a skill:</p>

      <CodeBlock language="bash">{`npx ralphy-skills create

# Interactive prompts:
? Skill name: my-team-standards
? Description: Our team's coding standards and conventions
? Category: general
? Tags (comma-separated): standards, conventions, team
? Author: Your Name

✅ Created skill at: .agent/skills/my-team-standards/`}</CodeBlock>

      <h3 id="manual-creation">Manual creation</h3>
      <p>Or create the structure yourself:</p>

      <CodeBlock language="bash">{`# Create the directory
mkdir -p .agent/skills/my-skill

# Create SKILL.md
cat > .agent/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: A brief description of what this skill does and when to use it.
---

# My Skill

Instructions for the AI agent...
EOF`}</CodeBlock>

      <h2 id="writing-effective-skills">Writing effective skills</h2>
      <p>
        The quality of your skill depends on how clearly you communicate instructions to the AI.
        Here are best practices:
      </p>

      <h3 id="structure">Structure your content</h3>
      <p>
        Organize with clear headings so the AI can quickly find relevant sections:
      </p>

      <CodeBlock language="markdown" filename="SKILL.md">{`# React Component Standards

## Component Structure
How to organize component files...

## Naming Conventions  
Patterns for naming components, hooks, and files...

## State Management
When to use different state solutions...

## Testing Requirements
What tests are expected for each component...

## Common Patterns
Reusable patterns and examples...`}</CodeBlock>

      <h3 id="be-specific">Be specific</h3>
      <p>
        Vague instructions lead to inconsistent results. Be explicit:
      </p>

      <div className="grid grid-cols-2 gap-4 my-4">
        <div>
          <p className="text-sm font-medium text-green-700 mb-2">✅ Specific</p>
          <CodeBlock language="markdown">{`Use functional components with TypeScript.
Keep components under 200 lines.
Extract custom hooks when logic is 
reused in 2+ components.`}</CodeBlock>
        </div>
        <div>
          <p className="text-sm font-medium text-red-700 mb-2">❌ Vague</p>
          <CodeBlock language="markdown">{`Write clean code.
Keep things simple.
Follow best practices.`}</CodeBlock>
        </div>
      </div>

      <h3 id="include-examples">Include examples</h3>
      <p>
        Show concrete before/after examples:
      </p>

      <CodeBlock language="markdown" filename="SKILL.md">{`## Example: Component with Hooks

### Before (anti-pattern)
\`\`\`tsx
// ❌ Complex logic mixed with rendering
function UserProfile({ userId }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(r => r.json())
      .then(setUser)
      .finally(() => setLoading(false))
  }, [userId])
  
  if (loading) return <Spinner />
  return <div>{user.name}</div>
}
\`\`\`

### After (recommended)
\`\`\`tsx
// ✅ Logic extracted to custom hook
function UserProfile({ userId }) {
  const { user, loading } = useUser(userId)
  
  if (loading) return <Spinner />
  return <div>{user.name}</div>
}

// Custom hook in separate file
function useUser(userId: string) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // ... fetch logic
  return { user, loading }
}
\`\`\``}</CodeBlock>

      <h2 id="advanced-features">Advanced features</h2>

      <h3 id="scripts">Adding scripts</h3>
      <p>
        Include executable scripts for automation:
      </p>

      <CodeBlock language="bash" filename="scripts/setup.sh">{`#!/bin/bash
# Create project structure
mkdir -p src/{components,hooks,utils}
mkdir -p tests/{unit,integration}

echo "✅ Project structure created"`}</CodeBlock>

      <p>Reference scripts in your <code>SKILL.md</code>:</p>

      <CodeBlock language="markdown">{`## Setup

Run the setup script to create the project structure:

\`\`\`bash
./scripts/setup.sh
\`\`\``}</CodeBlock>

      <InfoBox type="warning" title="Script Permissions">
        Remember to make scripts executable: <code>chmod +x scripts/*.sh</code>
      </InfoBox>

      <h3 id="references">Reference files</h3>
      <p>
        Store API documentation, examples, and templates in the <code>references/</code> directory:
      </p>

      <CodeBlock language="text">{`my-skill/
├── SKILL.md
├── references/
│   ├── api-cheatsheet.md
│   ├── component-template.tsx
│   └── test-template.test.tsx`}</CodeBlock>

      <p>Reference them in your skill:</p>

      <CodeBlock language="markdown">{`When creating new components, use the template in 
\`references/component-template.tsx\` as a starting point.`}</CodeBlock>

      <h2 id="testing">Testing your skill</h2>
      <p>
        Before publishing, validate your skill:
      </p>

      <CodeBlock language="bash">{`# Validate format and structure
npx ralphy-skills validate ./my-skill

# Output:
✅ Skill validation passed!
Quality score: 92/100

Checks:
  ✓ SKILL.md exists
  ✓ Valid frontmatter
  ✓ Name matches directory
  ✓ Description is descriptive
  ✓ Body content present
  ⚠ Consider adding examples/`}</CodeBlock>

      <InfoBox type="tip" title="Quality Score">
        Aim for 80+ quality score. Add examples, use clear headings,
        and include specific code snippets to improve your score.
      </InfoBox>

      <h2 id="publishing">Publishing</h2>
      <p>
        Share your skill with the community:
      </p>

      <ol>
        <li>
          <strong>Host on GitHub</strong> – Create a public repo with your skill
        </li>
        <li>
          <strong>Add marketplace.json</strong> – Include metadata for the registry
        </li>
        <li>
          <strong>Submit</strong> – Use our <Link to="/submit" className="text-blue-600 hover:underline">Submit Skill</Link> page
        </li>
      </ol>

      <CodeBlock language="json" filename="marketplace.json">{`{
  "id": "my-team-standards",
  "name": "My Team Standards",
  "description": "Our team's coding standards and conventions",
  "version": "1.0.0",
  "author": "Your Name",
  "category": "general",
  "tags": ["standards", "conventions"],
  "url": "https://github.com/you/my-skill"
}`}</CodeBlock>

      <p>
        Once submitted, your skill will be available for anyone to install:
      </p>

      <CodeBlock language="bash">{`npx ralphy-skills install my-team-standards`}</CodeBlock>
    </DocsLayout>
  )
}
