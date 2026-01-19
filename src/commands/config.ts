import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
import { promptUser } from '../utils/prompt';

export interface ConfigValue {
    defaultScope: 'universal' | 'global' | 'project';
    autoSync: boolean;
    registryUrl: string;
    cacheEnabled: boolean;
    cacheTTL: number; // in hours
    defaultAgent: string;
    confirmPrompts: boolean;
    colorOutput: boolean;
}

const DEFAULT_CONFIG: ConfigValue = {
    defaultScope: 'universal',
    autoSync: false,
    registryUrl: 'https://raw.githubusercontent.com/Interpoolx/ralphy-skills/main/recommended_skills.json',
    cacheEnabled: true,
    cacheTTL: 24,
    defaultAgent: 'auto',
    confirmPrompts: true,
    colorOutput: true
};

function getConfigPath(): string {
    return path.join(os.homedir(), '.ralphy', 'config.json');
}

const prompt = promptUser;

/**
 * Load configuration from disk.
 */
export function loadConfig(): ConfigValue {
    const configPath = getConfigPath();

    if (!fs.existsSync(configPath)) {
        return { ...DEFAULT_CONFIG };
    }

    try {
        const content = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content);
        return { ...DEFAULT_CONFIG, ...config };
    } catch (e) {
        return { ...DEFAULT_CONFIG };
    }
}

/**
 * Save configuration to disk.
 */
export function saveConfig(config: ConfigValue): void {
    const configPath = getConfigPath();
    const configDir = path.dirname(configPath);

    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Get a specific config value.
 */
export function getConfigValue<K extends keyof ConfigValue>(key: K): ConfigValue[K] {
    const config = loadConfig();
    return config[key];
}

/**
 * Set a specific config value.
 */
export function setConfigValue<K extends keyof ConfigValue>(key: K, value: ConfigValue[K]): void {
    const config = loadConfig();
    config[key] = value;
    saveConfig(config);
}

/**
 * Implementation of the 'config' command.
 */
export async function manageConfig(action: string, key?: string, value?: string): Promise<void> {
    switch (action) {
        case 'list':
        case 'get':
            if (key) {
                showConfigValue(key);
            } else {
                showAllConfig();
            }
            break;

        case 'set':
            if (!key || value === undefined) {
                console.log(chalk.red('❌ Usage: npx ralphy-skills config set <key> <value>'));
                showAvailableKeys();
                return;
            }
            await setConfigFromCLI(key, value);
            break;

        case 'unset':
        case 'reset':
            if (key) {
                await resetConfigKey(key);
            } else {
                await resetAllConfig();
            }
            break;

        case 'edit':
            await editConfigInteractive();
            break;

        case 'path':
            console.log(getConfigPath());
            break;

        default:
            console.log(chalk.cyan.bold('\n⚙️  Ralphy Skills Configuration\n'));
            console.log(chalk.bold('Usage:'));
            console.log(chalk.gray('  npx ralphy-skills config list        Show all settings'));
            console.log(chalk.gray('  npx ralphy-skills config get <key>   Get a specific value'));
            console.log(chalk.gray('  npx ralphy-skills config set <k> <v> Set a value'));
            console.log(chalk.gray('  npx ralphy-skills config reset       Reset to defaults'));
            console.log(chalk.gray('  npx ralphy-skills config edit        Interactive editor'));
            console.log(chalk.gray('  npx ralphy-skills config path        Show config file path'));
            console.log('');
            showAvailableKeys();
    }
}

function showAllConfig(): void {
    console.log(chalk.cyan.bold('\n⚙️  Current Configuration\n'));

    const config = loadConfig();
    const configPath = getConfigPath();

    console.log(chalk.gray(`Config file: ${configPath}\n`));

    Object.entries(config).forEach(([key, value]) => {
        const isDefault = JSON.stringify(value) === JSON.stringify(DEFAULT_CONFIG[key as keyof ConfigValue]);
        const defaultLabel = isDefault ? chalk.gray(' (default)') : '';
        console.log(`  ${chalk.bold(key)}: ${chalk.cyan(JSON.stringify(value))}${defaultLabel}`);
    });
    console.log('');
}

function showConfigValue(key: string): void {
    const config = loadConfig();

    if (!(key in config)) {
        console.log(chalk.red(`❌ Unknown config key: ${key}`));
        showAvailableKeys();
        return;
    }

    const value = config[key as keyof ConfigValue];
    console.log(JSON.stringify(value));
}

function showAvailableKeys(): void {
    console.log(chalk.bold('\nAvailable configuration keys:\n'));

    const descriptions: Record<keyof ConfigValue, string> = {
        defaultScope: 'Where to install skills by default (universal|global|project)',
        autoSync: 'Auto-sync AGENTS.md after install/remove (true|false)',
        registryUrl: 'URL of the skills registry',
        cacheEnabled: 'Enable registry caching (true|false)',
        cacheTTL: 'Cache time-to-live in hours (number)',
        defaultAgent: 'Default AI agent for export (auto|cursor|claude|copilot|...)',
        confirmPrompts: 'Show confirmation prompts (true|false)',
        colorOutput: 'Enable colored output (true|false)'
    };

    Object.entries(descriptions).forEach(([key, desc]) => {
        console.log(`  ${chalk.bold(key)}`);
        console.log(chalk.gray(`    ${desc}`));
        console.log(chalk.gray(`    Default: ${JSON.stringify(DEFAULT_CONFIG[key as keyof ConfigValue])}`));
    });
    console.log('');
}

async function setConfigFromCLI(key: string, value: string): Promise<void> {
    const config = loadConfig();

    if (!(key in DEFAULT_CONFIG)) {
        console.log(chalk.red(`❌ Unknown config key: ${key}`));
        showAvailableKeys();
        return;
    }

    // Parse value based on expected type
    let parsedValue: any;
    const expectedType = typeof DEFAULT_CONFIG[key as keyof ConfigValue];

    try {
        switch (expectedType) {
            case 'boolean':
                if (value === 'true') parsedValue = true;
                else if (value === 'false') parsedValue = false;
                else throw new Error('Boolean value must be "true" or "false"');
                break;

            case 'number':
                parsedValue = parseInt(value, 10);
                if (isNaN(parsedValue)) throw new Error('Value must be a number');
                break;

            case 'string':
                parsedValue = value;
                break;

            default:
                parsedValue = JSON.parse(value);
        }
    } catch (e: any) {
        console.log(chalk.red(`❌ Invalid value for ${key}: ${e.message}`));
        return;
    }

    // Validate specific keys
    if (key === 'defaultScope' && !['universal', 'global', 'project'].includes(parsedValue)) {
        console.log(chalk.red('❌ defaultScope must be one of: universal, global, project'));
        return;
    }

    (config as any)[key] = parsedValue;
    saveConfig(config);

    console.log(chalk.green(`✅ Set ${key} = ${JSON.stringify(parsedValue)}`));
}

async function resetConfigKey(key: string): Promise<void> {
    if (!(key in DEFAULT_CONFIG)) {
        console.log(chalk.red(`❌ Unknown config key: ${key}`));
        return;
    }

    const config = loadConfig();
    (config as any)[key] = DEFAULT_CONFIG[key as keyof ConfigValue];
    saveConfig(config);

    console.log(chalk.green(`✅ Reset ${key} to default: ${JSON.stringify(DEFAULT_CONFIG[key as keyof ConfigValue])}`));
}

async function resetAllConfig(): Promise<void> {
    const { confirm } = await prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Reset all configuration to defaults?',
        default: false
    }]);

    if (!confirm) {
        console.log(chalk.yellow('\n❌ Reset cancelled'));
        return;
    }

    saveConfig({ ...DEFAULT_CONFIG });
    console.log(chalk.green('\n✅ Configuration reset to defaults'));
}

async function editConfigInteractive(): Promise<void> {
    const config = loadConfig();

    console.log(chalk.cyan.bold('\n⚙️  Interactive Configuration Editor\n'));

    const { defaultScope } = await prompt([{
        type: 'list',
        name: 'defaultScope',
        message: 'Default installation scope:',
        choices: [
            { name: 'Universal (.agent/skills) - Best for multi-agent', value: 'universal' },
            { name: 'Global (~/.ralphy/skills) - Available everywhere', value: 'global' },
            { name: 'Project (./<agent>/skills) - Project-specific', value: 'project' }
        ],
        default: config.defaultScope
    }]);

    const { autoSync } = await prompt([{
        type: 'confirm',
        name: 'autoSync',
        message: 'Auto-sync AGENTS.md after install/remove?',
        default: config.autoSync
    }]);

    const { confirmPrompts } = await prompt([{
        type: 'confirm',
        name: 'confirmPrompts',
        message: 'Show confirmation prompts?',
        default: config.confirmPrompts
    }]);

    const { cacheTTL } = await prompt([{
        type: 'number',
        name: 'cacheTTL',
        message: 'Registry cache TTL (hours):',
        default: config.cacheTTL
    }]);

    const newConfig: ConfigValue = {
        ...config,
        defaultScope,
        autoSync,
        confirmPrompts,
        cacheTTL
    };

    saveConfig(newConfig);
    console.log(chalk.green('\n✅ Configuration saved'));
    showAllConfig();
}
