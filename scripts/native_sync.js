const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG_PATH = 'api/wrangler.toml';
const DB_NAME = 'ralphy-skills-db';
const BATCH_SIZE = 50; // Rows per batch (Reduced to avoid SQLITE_TOOBIG)

// Base tables to sync (Order matters for foreign keys)
// FTS tables are excluded as they are populated by triggers
const TABLES = ['categories', 'skills', 'installs'];

function run(command, options = {}) {
    try {
        // Increase buffer for large JSON outputs (50MB)
        return execSync(command, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, ...options });
    } catch (error) {
        // Return output even on error if available, or throw
        if (error.stdout) return error.stdout.toString();
        throw error;
    }
}

function getDbName() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
            const match = content.match(/database_name\s*=\s*"([^"]+)"/);
            if (match && match[1]) return match[1];
        }
    } catch (e) { }
    return DB_NAME;
}

function fetchTableData(db, table, isLocal) {
    const flag = isLocal ? '--local' : '--remote';
    const query = `SELECT * FROM ${table}`;
    console.log(`   Detailed fetch: ${table} (${isLocal ? 'local' : 'remote'})...`);

    // Use --json to get structured data
    const cmd = `npx wrangler d1 execute ${db} ${flag} --command="${query}" --json -c ${CONFIG_PATH}`;
    const output = run(cmd);

    try {
        const json = JSON.parse(output);
        // Wrangler returns [ { results: [...], success: true, ... } ]
        if (Array.isArray(json) && json[0] && json[0].results) {
            return json[0].results;
        }
    } catch (e) {
        console.error(`   Error parsing JSON for table ${table}:`, e.message);
    }
    return [];
}

function generateInsertSql(table, rows) {
    if (!rows || rows.length === 0) return null;

    // Collect all columns from the first row
    const columns = Object.keys(rows[0]);
    const escape = (val) => {
        if (val === null) return 'NULL';
        if (typeof val === 'number') return val;
        // Escape single quotes by doubling them
        return `'${String(val).replace(/'/g, "''")}'`;
    };

    const values = rows.map(row => {
        return `(${columns.map(col => escape(row[col])).join(', ')})`;
    });

    // SQLite generic INSERT OR REPLACE
    return `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES ${values.join(', ')};`;
}

function sync(direction) {
    const db = getDbName();
    console.log(`\n🔄 Starting FTS-Safe Sync: ${direction.toUpperCase()} (${db})\n`);

    const sourceIsLocal = direction === 'push';

    // 1. Fetch Data
    console.log('1. Fetching data from SOURCE...');
    const allSql = [];

    for (const table of TABLES) {
        const rows = fetchTableData(db, table, sourceIsLocal);
        console.log(`   - ${table}: ${rows.length} rows`);

        // Chunk generation to avoid huge SQL commands
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const chunk = rows.slice(i, i + BATCH_SIZE);
            const sql = generateInsertSql(table, chunk);
            if (sql) allSql.push(sql);
        }
    }

    if (allSql.length === 0) {
        console.log('   No data to sync.');
        return;
    }

    // 2. Execute on Target
    console.log(`\n2. Applying ${allSql.length} batches to TARGET...`);
    const tempFile = `temp_sync_${Date.now()}.sql`;

    // Write all SQL to a file
    fs.writeFileSync(tempFile, allSql.join('\n\n'));

    // Execute file
    const targetFlag = sourceIsLocal ? '--remote' : '--local';
    try {
        run(`npx wrangler d1 execute ${db} ${targetFlag} --file="${tempFile}" -c ${CONFIG_PATH}`);
        console.log('\n✅ Sync Complete!');
    } catch (e) {
        console.error('\n❌ Execution failed.');
        console.error(e.message);
    } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
}

const action = process.argv[2];
if (['push', 'pull'].includes(action)) {
    sync(action);
} else {
    console.log('Usage: node scripts/native_sync.js [push|pull]');
}
