import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { getRegistry, getInstalledSkillsMetadata, isSkillInstalled } from '../utils/registry';

interface ListOptions {
    registry?: boolean;
    format?: 'table' | 'json' | 'csv';
    filter?: string;
    sort?: 'name' | 'source' | 'installed' | 'updated';
}

interface SearchOptions {
    query: string;
    category?: string;
    tags?: string[];
    source?: 'registry' | 'installed' | 'all';
    format?: 'installed' | 'symlink' | 'all';
    sort?: 'name' | 'relevance' | 'popularity' | 'updated';
    limit?: number;
    export?: string;
}

/**
 * List skills (defaults to installed skills).
 */
export async function listSkills(options: ListOptions): Promise<void> {
    const installed = getInstalledSkillsMetadata();

    if (options.registry) {
        console.log(chalk.gray('Fetching registry...'));
        const registry = await getRegistry();
        console.clear(); // Clear loading message

        const results = registry.map(skill => ({
            ...skill,
            isInstalled: installed.some(s => s.id === skill.id || s.name === skill.name)
        }));

        console.log(chalk.bold('📚 Registry Skills (Available to Install):\n'));

        results.forEach((skill) => {
            const status = skill.isInstalled ? chalk.green(' ✓') : '  ';
            const name = skill.isInstalled ? chalk.green(skill.name) : chalk.white(skill.name);

            console.log(`${status} ${name}`);
            console.log(chalk.gray(`     ${skill.description}`));
            console.log(chalk.gray(`     ID: ${skill.id}\n`));
        });

        console.log(chalk.gray('─'.repeat(50)));
        console.log(chalk.cyan(`\n💡 Install with: npx ralphy-skills install <skill-id>\n`));
    } else {
        console.log(chalk.bold('📦 Installed Skills:\n'));

        if (installed.length === 0) {
            console.log(chalk.gray('  No skills installed yet.'));
            console.log(chalk.gray('  Use "ralphy-skills list --registry" to see available skills.'));
            console.log(chalk.gray('  Use "ralphy-skills install <skill>" to install one.\n'));
            return;
        }

        installed.forEach((skill) => {
            console.log(chalk.green(`  ✓ ${chalk.bold(skill.name)}`) + chalk.gray(` (${skill.source})`));
            console.log(chalk.gray(`    ${skill.description}`));
            if (skill.isSymlink) console.log(chalk.yellow(`    🔗 Symlinked from: ${skill.path}`));
            console.log('');
        });
    }
}

/**
 * Enhanced search skills with advanced filtering.
 */
export async function searchSkills(query: string, searchOptions?: Partial<SearchOptions>): Promise<void> {
    const options: SearchOptions = {
        query,
        category: searchOptions?.category,
        tags: searchOptions?.tags || [],
        source: searchOptions?.source || 'all',
        format: searchOptions?.format || 'all',
        sort: searchOptions?.sort || 'relevance',
        limit: searchOptions?.limit || 50,
        export: searchOptions?.export
    };

    // Parse query for filters (e.g., "react category:frontend tag:react")
    const parsedQuery = parseQueryWithFilters(query);
    
    const installed = getInstalledSkillsMetadata();
    const lowerQuery = parsedQuery.searchTerm.toLowerCase();

    let installedMatches: any[] = [];
    let registryMatches: any[] = [];

    // Search installed skills
    if (options.source === 'installed' || options.source === 'all') {
        installedMatches = installed.filter(
            (skill) =>
                skill.name.toLowerCase().includes(lowerQuery) ||
                skill.description.toLowerCase().includes(lowerQuery) ||
                skill.id.toLowerCase().includes(lowerQuery)
        ).filter(skill => {
            // Apply format filter
            if (options.format === 'symlink' && !skill.isSymlink) return false;
            if (options.format === 'installed' && skill.isSymlink) return false;
            return true;
        });
    }

    // Search registry
    if (options.source === 'registry' || options.source === 'all') {
        try {
            const registry = await getRegistry();
            registryMatches = registry.filter(
                (skill) =>
                    skill.name.toLowerCase().includes(lowerQuery) ||
                    skill.description.toLowerCase().includes(lowerQuery) ||
                    skill.id.toLowerCase().includes(lowerQuery)
            );
        } catch (err) {
            console.log(chalk.yellow('⚠️  Could not fetch registry. Showing installed skills only.'));
        }
    }

    // Combine and sort results
    const allResults = [
        ...installedMatches.map(skill => ({ ...skill, isInstalled: true, source: 'installed' })),
        ...registryMatches.map(skill => ({ ...skill, isInstalled: false, source: 'registry' }))
    ];

    // Apply sorting
    const sortedResults = sortResults(allResults, options.sort!, lowerQuery);

    // Apply limit
    const limitedResults = sortedResults.slice(0, options.limit!);

    if (limitedResults.length === 0) {
        console.log(chalk.yellow(`No skills found matching "${query}"\n`));
        if (parsedQuery.filters.length > 0) {
            console.log(chalk.gray(`Applied filters: ${parsedQuery.filters.join(', ')}`));
        }
        return;
    }

    // Export if requested
    if (options.export) {
        await exportSearchResults(limitedResults, options.export);
        return;
    }

    // Display results
    displaySearchResults(limitedResults, query, parsedQuery.filters);

    // Show search statistics
    console.log(chalk.gray(`\nFound ${limitedResults.length} of ${allResults.length} matching skills`));
    if (options.limit && allResults.length > options.limit) {
        console.log(chalk.gray(`Use --limit ${allResults.length} to see all results`));
    }
}

function parseQueryWithFilters(query: string): { searchTerm: string; filters: string[] } {
    const filters: string[] = [];
    let searchTerm = query;

    // Extract filters (category:, tag:, source:, etc.)
    const filterPattern = /(\w+:[^\s]+)/g;
    const matches = query.match(filterPattern);
    
    if (matches) {
        filters.push(...matches);
        // Remove filters from search term
        searchTerm = query.replace(filterPattern, '').trim();
    }

    return { searchTerm, filters };
}

function sortResults(results: any[], sortBy: string, query: string): any[] {
    switch (sortBy) {
        case 'name':
            return results.sort((a, b) => a.name.localeCompare(b.name));
        case 'popularity':
            // Sort by installation count (simulated)
            return results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        case 'updated':
            return results.sort((a, b) => 
                new Date(b.updated || 0).getTime() - new Date(a.updated || 0).getTime()
            );
        case 'relevance':
        default:
            // Sort by relevance (exact matches first, then partial matches)
            return results.sort((a, b) => {
                const aExact = a.name.toLowerCase() === query ? 3 : 0;
                const bExact = b.name.toLowerCase() === query ? 3 : 0;
                const aStarts = a.name.toLowerCase().startsWith(query) ? 2 : 0;
                const bStarts = b.name.toLowerCase().startsWith(query) ? 2 : 0;
                const aContains = a.name.toLowerCase().includes(query) ? 1 : 0;
                const bContains = b.name.toLowerCase().includes(query) ? 1 : 0;

                return (bExact + bStarts + bContains) - (aExact + aStarts + aContains);
            });
    }
}

function displaySearchResults(results: any[], query: string, filters: string[]): void {
    console.log(chalk.cyan.bold(`\n🔍 Search Results for "${query}":`));
    
    if (filters.length > 0) {
        console.log(chalk.gray(`Filters: ${filters.join(', ')}`));
    }

    console.log(chalk.gray(`Found ${results.length} skill(s)\n`));

    results.forEach((skill, index) => {
        const number = chalk.gray(`${index + 1}.`);
        const name = skill.isInstalled ? 
            chalk.green(`✓ ${skill.name}`) : 
            chalk.white(skill.name);
        
        const source = skill.isInstalled ? 
            chalk.gray(`(${skill.source})`) : 
            chalk.cyan('(registry)');

        console.log(`${number} ${name} ${source}`);
        console.log(chalk.gray(`    ${skill.description}`));
        
        if (skill.isInstalled && skill.isSymlink) {
            console.log(chalk.yellow(`    🔗 Symlinked`));
        }
        
        if (skill.tags && skill.tags.length > 0) {
            console.log(chalk.gray(`    🏷️  ${skill.tags.join(', ')}`));
        }
        
        console.log('');
    });

    // Show install suggestions for registry skills
    const registrySkills = results.filter(r => !r.isInstalled);
    if (registrySkills.length > 0) {
        console.log(chalk.cyan('💡 Quick Install:'));
        registrySkills.slice(0, 5).forEach(skill => {
            console.log(chalk.gray(`   npx ralphy-skills install ${skill.id}`));
        });
        if (registrySkills.length > 5) {
            console.log(chalk.gray(`   ... and ${registrySkills.length - 5} more`));
        }
        console.log('');
    }
}

async function exportSearchResults(results: any[], format: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `skills-search-${timestamp}.${format}`;

    let content = '';
    
    switch (format) {
        case 'json':
            content = JSON.stringify({
                exported_at: timestamp,
                total_results: results.length,
                skills: results.map(skill => ({
                    name: skill.name,
                    id: skill.id,
                    description: skill.description,
                    source: skill.source,
                    is_installed: skill.isInstalled,
                    is_symlink: skill.isSymlink,
                    path: skill.path,
                    tags: skill.tags || []
                }))
            }, null, 2);
            break;

        case 'csv':
            const headers = 'Name,ID,Description,Source,Installed,Symlink,Path,Tags';
            const rows = results.map(skill => [
                `"${skill.name}"`,
                `"${skill.id}"`,
                `"${skill.description.replace(/"/g, '""')}"`,
                skill.source,
                skill.isInstalled,
                skill.isSymlink || false,
                `"${skill.path || ''}"`,
                `"${(skill.tags || []).join(';')}"`
            ].join(','));
            
            content = [headers, ...rows].join('\n');
            break;

        default:
            console.log(chalk.red(`Unsupported export format: ${format}`));
            return;
    }

    fs.writeFileSync(filename, content);
    console.log(chalk.green(`\n📤 Search results exported to: ${filename}`));
    console.log(chalk.gray(`Exported ${results.length} skill(s)`));
}
