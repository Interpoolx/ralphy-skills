import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { getInstalledSkillsMetadata } from '../utils/registry';

interface SyncOptions {
    yes?: boolean;
    output?: string;
}

/**
 * Implementation of the 'sync' command.
 * Updates AGENTS.md with installed skills.
 */
export async function syncAgents(options: SyncOptions): Promise<void> {
    const skills = getInstalledSkillsMetadata();
    const outputPath = path.resolve(options.output || 'AGENTS.md');

    let agentsContent = '';
    if (fs.existsSync(outputPath)) {
        agentsContent = fs.readFileSync(outputPath, 'utf8');
    }

    const skillsTable = generateSkillsBlock(skills);

    const startMarker = '<!-- SKILLS_TABLE_START -->';
    const endMarker = '<!-- SKILLS_TABLE_END -->';

    let newContent: string;
    if (agentsContent.includes(startMarker) && agentsContent.includes(endMarker)) {
        // Replace existing block
        const before = agentsContent.split(startMarker)[0];
        const after = agentsContent.split(endMarker)[1];
        newContent = before + startMarker + '\n' + skillsTable + '\n' + endMarker + after;
    } else {
        // Append new block or wrap in skills_system
        const section = `<skills_system priority="1">\n\n## Available Skills\n\n${startMarker}\n${skillsTable}\n${endMarker}\n\n</skills_system>`;
        newContent = agentsContent + '\n' + section;
    }

    fs.writeFileSync(outputPath, newContent.trim() + '\n');
    console.log(chalk.green(`\n✅ Updated skills section to ${path.basename(outputPath)} (${skills.length} skill(s))`));
}

function generateSkillsBlock(skills: any[]): string {
    return `<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke: \`npx ralphy-skills read <skill-name>\` (run in your shell)
  - For multiple: \`npx ralphy-skills read skill-one,skill-two\`
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

${skills.map(s => `
<skill>
<name>${s.name}</name>
<description>${s.description}</description>
<location>${s.source.toLowerCase()}</location>
</skill>`).join('\n')}

</available_skills>`;
}
