import { createFileRoute } from '@tanstack/react-router'
import { DocsLayout, CodeBlock, InfoBox, FieldTable } from '../components/DocsLayout'

export const Route = createFileRoute('/docs/specification')({
  component: Specification,
})

const toc = [
  { id: 'directory-structure', title: 'Directory structure', level: 2 },
  { id: 'skill-md-format', title: 'SKILL.md format', level: 2 },
  { id: 'frontmatter', title: 'Frontmatter (required)', level: 3 },
  { id: 'name-field', title: 'name field', level: 4 },
  { id: 'description-field', title: 'description field', level: 4 },
  { id: 'license-field', title: 'license field', level: 4 },
  { id: 'metadata-field', title: 'metadata field', level: 4 },
  { id: 'body-content', title: 'Body content', level: 3 },
  { id: 'optional-directories', title: 'Optional directories', level: 2 },
  { id: 'scripts', title: 'scripts/', level: 3 },
  { id: 'references', title: 'references/', level: 3 },
  { id: 'assets', title: 'assets/', level: 3 },
  { id: 'validation', title: 'Validation', level: 2 },
]

function Specification() {
  return (
    <DocsLayout
      title="Specification"
      description="The complete format specification for Agent Skills."
      toc={toc}
    >
      <h2 id="directory-structure">Directory structure</h2>
      <p>
        A skill is a directory containing a <code>SKILL.md</code> file. This is the only required file.
      </p>

      <CodeBlock language="text" filename="Basic structure">{`skill-name/
└── SKILL.md        # Required`}</CodeBlock>

      <p>Skills can include additional directories for supplementary content:</p>

      <CodeBlock language="text" filename="Complete structure">{`skill-name/
├── SKILL.md        # Required - main skill definition
├── scripts/        # Optional - executable scripts
├── references/     # Optional - reference documentation
└── assets/         # Optional - images, data files`}</CodeBlock>

      <h2 id="skill-md-format">SKILL.md format</h2>
      <p>
        The <code>SKILL.md</code> file uses YAML frontmatter followed by Markdown content.
        The frontmatter defines metadata, while the body contains the skill instructions.
      </p>

      <h3 id="frontmatter">Frontmatter (required)</h3>
      <p>The frontmatter section starts and ends with <code>---</code> and contains YAML fields:</p>

      <CodeBlock language="yaml" filename="SKILL.md">{`---
name: pdf-processing
description: Extract text and tables from PDF files, fill forms, merge documents.
license: Apache-2.0
metadata:
  author: example-org
  version: "1.0"
---

# PDF Processing

Instructions for the AI agent...`}</CodeBlock>

      <FieldTable fields={[
        { name: 'name', type: 'string', required: true, description: 'Unique skill identifier (1-64 chars, lowercase, hyphens only)' },
        { name: 'description', type: 'string', required: true, description: 'What the skill does and when to use it (1-1024 chars)' },
        { name: 'license', type: 'string', required: false, description: 'License applied to the skill (e.g., MIT, Apache-2.0)' },
        { name: 'compatibility', type: 'string', required: false, description: 'Environment requirements (1-500 chars)' },
        { name: 'metadata', type: 'object', required: false, description: 'Custom key-value pairs for additional properties' },
      ]} />

      <h4 id="name-field">name field</h4>
      <p>The <code>name</code> field must follow these rules:</p>
      <ul>
        <li>1-64 characters</li>
        <li>Lowercase alphanumeric characters and hyphens only (<code>a-z</code>, <code>0-9</code>, <code>-</code>)</li>
        <li>Cannot start or end with a hyphen</li>
        <li>Cannot contain consecutive hyphens (<code>--</code>)</li>
        <li>Must match the parent directory name</li>
      </ul>

      <div className="grid grid-cols-2 gap-4 my-4">
        <div>
          <p className="text-sm font-medium text-green-700 mb-2">✅ Valid names</p>
          <CodeBlock language="yaml">{`name: pdf-processing
name: data-analysis
name: code-review`}</CodeBlock>
        </div>
        <div>
          <p className="text-sm font-medium text-red-700 mb-2">❌ Invalid names</p>
          <CodeBlock language="yaml">{`name: PDF-Processing  # uppercase
name: -pdf            # starts with hyphen
name: pdf--processing # consecutive hyphens`}</CodeBlock>
        </div>
      </div>

      <h4 id="description-field">description field</h4>
      <p>The <code>description</code> field should:</p>
      <ul>
        <li>Be 1-1024 characters</li>
        <li>Describe both what the skill does AND when to use it</li>
        <li>Include keywords that help agents match tasks to skills</li>
      </ul>

      <div className="grid grid-cols-2 gap-4 my-4">
        <div>
          <p className="text-sm font-medium text-green-700 mb-2">✅ Good description</p>
          <CodeBlock language="yaml">{`description: Extracts text and tables from PDF 
files, fills PDF forms, and merges multiple 
PDFs. Use when working with PDF documents 
or when the user mentions PDFs, forms, or 
document extraction.`}</CodeBlock>
        </div>
        <div>
          <p className="text-sm font-medium text-red-700 mb-2">❌ Poor description</p>
          <CodeBlock language="yaml">{`description: Helps with PDFs.`}</CodeBlock>
        </div>
      </div>

      <h4 id="license-field">license field</h4>
      <p>
        Specifies the license applied to the skill. Keep it short—either the license name
        or a reference to a bundled license file.
      </p>
      <CodeBlock language="yaml">{`license: MIT
# or
license: Proprietary. See LICENSE.txt for complete terms.`}</CodeBlock>

      <h4 id="metadata-field">metadata field</h4>
      <p>
        A map of custom key-value pairs for additional properties not defined in the spec.
        Use unique key names to avoid conflicts.
      </p>
      <CodeBlock language="yaml">{`metadata:
  author: example-org
  version: "1.0"
  category: document-processing
  tags: ["pdf", "extraction", "forms"]`}</CodeBlock>

      <h3 id="body-content">Body content</h3>
      <p>
        After the frontmatter, include Markdown content with instructions for the AI agent.
        The body should contain:
      </p>
      <ul>
        <li>Step-by-step instructions</li>
        <li>Examples of inputs and expected outputs</li>
        <li>Common edge cases and how to handle them</li>
        <li>Code snippets and templates</li>
      </ul>

      <CodeBlock language="markdown" filename="SKILL.md body example">{`# PDF Processing

You are an expert at working with PDF documents.

## Extracting Text

When extracting text from PDFs:
1. Use \`pdftotext\` for simple text extraction
2. Use \`tabula\` or \`camelot\` for table extraction
3. Handle multi-column layouts by detecting column boundaries

## Example

Input: "Extract all tables from report.pdf"
Output: Generate CSV files for each detected table.

## Edge Cases

- Scanned PDFs: Use OCR with \`tesseract\`
- Password-protected: Prompt user for password`}</CodeBlock>

      <h2 id="optional-directories">Optional directories</h2>
      <p>Skills can include additional directories for supplementary content:</p>

      <h3 id="scripts">scripts/</h3>
      <p>
        Executable scripts that the agent can run. Include a shebang and make executable.
      </p>
      <CodeBlock language="bash" filename="scripts/extract-pdf.sh">{`#!/bin/bash
# Extract text from PDF
pdftotext "$1" -`}</CodeBlock>

      <InfoBox type="warning" title="Security Note">
        Scripts should be run in sandboxed environments. Always validate inputs and
        ask for user confirmation before executing potentially dangerous operations.
      </InfoBox>

      <h3 id="references">references/</h3>
      <p>
        Reference documentation, API specs, or other materials the agent can consult.
      </p>
      <CodeBlock language="text">{`references/
├── api-docs.md
├── examples.json
└── error-codes.md`}</CodeBlock>

      <h3 id="assets">assets/</h3>
      <p>
        Static files like images, templates, or data files the skill might need.
      </p>
      <CodeBlock language="text">{`assets/
├── logo.png
├── template.docx
└── sample-data.csv`}</CodeBlock>

      <h2 id="validation">Validation</h2>
      <p>
        Use the Ralphy Skills CLI to validate your skill before publishing:
      </p>

      <CodeBlock language="bash">{`npx ralphy-skills validate ./my-skill

# Output:
✅ Skill validation passed!
Quality score: 95/100

Checks:
  ✓ SKILL.md exists
  ✓ Valid frontmatter (name, description)
  ✓ Name matches directory
  ✓ Description is descriptive (50+ chars)
  ✓ Body content present (100+ chars)`}</CodeBlock>

      <InfoBox type="tip" title="Pro Tip">
        Use <code>--strict</code> mode for publishing to enforce all recommended fields:
        <br />
        <code>npx ralphy-skills validate ./my-skill --strict</code>
      </InfoBox>
    </DocsLayout>
  )
}
