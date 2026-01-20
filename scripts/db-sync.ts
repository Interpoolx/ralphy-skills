/**
 * scripts/db-sync.ts
 * Utility to sync schema and data between local and remote D1 databases.
 */

import { execSync } from 'child_process';

const DB_NAME = "ralphy-skills-db";

export function syncSchema(remote = false) {
    console.log(`Syncing schema to ${remote ? 'remote' : 'local'}...`);
    const command = remote
        ? `npx wrangler d1 migrations apply ${DB_NAME} --remote`
        : `npx wrangler d1 migrations apply ${DB_NAME} --local`;

    try {
        execSync(command, { stdio: 'inherit' });
        console.log('✅ Schema sync complete.');
    } catch (error) {
        console.error('❌ Schema sync failed.');
    }
}

export function pushData(sqlFile: string, remote = false) {
    console.log(`Pushing data from ${sqlFile} to ${remote ? 'remote' : 'local'}...`);
    const command = remote
        ? `npx wrangler d1 execute ${DB_NAME} --remote --file=${sqlFile}`
        : `npx wrangler d1 execute ${DB_NAME} --local --file=${sqlFile}`;

    try {
        execSync(command, { stdio: 'inherit' });
        console.log('✅ Data push complete.');
    } catch (error) {
        console.error('❌ Data push failed.');
    }
}

// Example usage:
// if (process.argv.includes('--schema')) syncSchema(process.argv.includes('--remote'));
console.log('DB Sync Utility Ready.');
