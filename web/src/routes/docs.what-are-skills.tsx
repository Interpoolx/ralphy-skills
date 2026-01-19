import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/what-are-skills')({
  component: WhatAreSkills,
})

function WhatAreSkills() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-slate-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/docs" className="text-gray-500 hover:text-blue-600">Docs</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">What are Skills?</span>
          </nav>
        </div>
      </div>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">What are Skills?</h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-600 mb-8">
            Skills are structured, reusable capabilities that enhance AI coding assistants with specialized knowledge and behaviors.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-8">
            <p className="text-blue-800 font-medium">
              Think of skills as "plugins" for your AI coding assistant – they give the AI specialized knowledge about specific frameworks, best practices, or workflows.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">The Problem</h2>
          <p className="text-gray-600 mb-4">
            AI coding assistants are powerful, but they have limitations:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-8">
            <li>They may not know your team's specific coding standards</li>
            <li>They might use outdated patterns for new frameworks</li>
            <li>They can't learn your project-specific conventions</li>
            <li>Different AI tools require different configuration formats</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">The Solution: Skills</h2>
          <p className="text-gray-600 mb-4">
            Skills solve these problems by providing:
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">📚 Specialized Knowledge</h3>
              <p className="text-sm text-gray-600">Best practices, patterns, and guidelines for specific technologies.</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">🎯 Consistent Output</h3>
              <p className="text-sm text-gray-600">Ensure AI follows your team's coding standards every time.</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">🔄 Shareable</h3>
              <p className="text-sm text-gray-600">Share skills across your team or the community.</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">🌐 Universal</h3>
              <p className="text-sm text-gray-600">One skill format works with 15+ AI coding tools.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">How Skills Work</h2>
          <p className="text-gray-600 mb-4">
            A skill is simply a directory containing a <code className="bg-gray-100 px-2 py-1 rounded text-sm">SKILL.md</code> file. This file contains:
          </p>
          <div className="bg-gray-900 text-gray-100 p-6 rounded-lg font-mono text-sm mb-8 overflow-x-auto">
            <pre>{`---
name: React Best Practices
description: Modern React patterns and conventions
category: frontend
tags:
  - react
  - typescript
  - hooks
---

# React Best Practices

## Component Structure
- Use functional components with hooks
- Keep components small and focused
- Extract custom hooks for reusable logic

## State Management
- Use useState for local state
- Use useReducer for complex state
- Consider Zustand or Jotai for global state

... more guidelines ...`}</pre>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Real-World Examples</h2>
          <div className="space-y-4 mb-8">
            <ExampleCard
              title="Frontend Design Skill"
              description="Teaches AI to create production-grade React interfaces with modern patterns, accessibility, and responsive design."
              use="Building UI components and pages"
            />
            <ExampleCard
              title="Testing Skill"
              description="Provides guidance on writing comprehensive tests using Jest, Vitest, and Testing Library."
              use="Writing unit and integration tests"
            />
            <ExampleCard
              title="Code Review Skill"
              description="Helps AI provide thorough, constructive code reviews following industry best practices."
              use="Reviewing pull requests"
            />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Getting Started</h2>
          <p className="text-gray-600 mb-4">
            Ready to use skills? Here's how to get started:
          </p>
          <div className="bg-gray-900 text-gray-100 p-6 rounded-lg font-mono text-sm mb-8">
            <pre>{`# Search for skills
npx ralphy-skills search

# Install a skill
npx ralphy-skills install frontend-design

# See what's installed
npx ralphy-skills list

# Sync to AGENTS.md (for AI to read)
npx ralphy-skills sync`}</pre>
          </div>

          <div className="flex gap-4 mt-12">
            <Link
              to="/docs/specification"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Read the Specification →
            </Link>
            <Link
              to="/skills"
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Browse Skills
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}

function ExampleCard({ title, description, use }: { title: string; description: string; use: string }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
      <p className="text-xs text-gray-500 mt-2">
        <span className="font-medium">Best for:</span> {use}
      </p>
    </div>
  )
}
