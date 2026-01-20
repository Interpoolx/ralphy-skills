const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Resolve path to wrangler.toml
const wranglerPath = path.join(__dirname, '../api/wrangler.toml');

if (!fs.existsSync(wranglerPath)) {
    console.error(`❌ Error: wrangler.toml not found at ${wranglerPath}`);
    process.exit(1);
}

// 2. Parse wrangler.toml for database_name
const content = fs.readFileSync(wranglerPath, 'utf-8');
const dbNameMatch = content.match(/database_name\s*=\s*"([^"]+)"/);

if (!dbNameMatch) {
    console.error('❌ Error: Could not find database_name in wrangler.toml');
    process.exit(1);
}

const dbName = dbNameMatch[1];
const commandArgs = process.argv.slice(2);

// Construct the command base
let finalArgs = ['d1'];

// Handle custom "backup" and "restore" subcommands to simplify package.json
const firstArg = commandArgs[0];

if (firstArg === 'backup') {
    const isRemote = commandArgs.includes('--remote');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const type = isRemote ? 'remote' : 'local';
    const outputDir = path.join(__dirname, '../backups');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = `backups/${type}-${timestamp}.sql`;
    const flag = isRemote ? '--remote' : '--local';

    console.log(`📦 Triggering ${type} backup to: ${outputPath}`);
    const cmd = `npx wrangler d1 -c backend/wrangler.toml export ${dbName} ${flag} --output=${outputPath}`;
    runCommand(cmd);
    process.exit(0);
}

if (firstArg === 'restore') {
    const isRemote = commandArgs.includes('--remote');
    const filePath = commandArgs.find(arg => arg.endsWith('.sql'));

    if (!filePath) {
        console.error('❌ Error: Please specify a .sql file to restore.');
        process.exit(1);
    }

    const flag = isRemote ? '--remote' : '--local';
    console.log(`🔄 Restoring ${filePath} to ${isRemote ? 'remote' : 'local'} database...`);
    const cmd = `npx wrangler d1 -c backend/wrangler.toml execute ${dbName} ${flag} --file=${filePath}`;
    runCommand(cmd);
    process.exit(0);
}

// 3. Regular D1 Command Proxy logic
const subcommands = {
    'migrations': ['list', 'apply'],
    'execute': [],
    'info': [],
    'export': []
};

// Add config path if not provided
if (!commandArgs.includes('-c') && !commandArgs.includes('--config')) {
    finalArgs.push('-c', 'backend/wrangler.toml');
}

let injectPos = -1;
for (let i = 0; i < commandArgs.length; i++) {
    const arg = commandArgs[i];
    if (subcommands[arg]) {
        if (subcommands[arg].length > 0 && subcommands[arg].includes(commandArgs[i + 1])) {
            injectPos = i + 2;
        } else {
            injectPos = i + 1;
        }
        break;
    }
}

let finalCommandArgs;
if (injectPos !== -1) {
    const argsBefore = commandArgs.slice(0, injectPos);
    const argsAfter = commandArgs.slice(injectPos);
    finalCommandArgs = [...argsBefore, dbName, ...argsAfter];
} else {
    // If no D1 subcommand found, just append the dbName at the end (fallback)
    finalCommandArgs = [...commandArgs, dbName];
}

const cmd = `npx wrangler ${finalArgs.join(' ')} ${finalCommandArgs.join(' ')}`;
runCommand(cmd);

function runCommand(cmd) {
    console.log(`🚀 Running: ${cmd}`);
    try {
        execSync(cmd, { stdio: 'inherit' });
    } catch (e) {
        process.exit(e.status || 1);
    }
}
