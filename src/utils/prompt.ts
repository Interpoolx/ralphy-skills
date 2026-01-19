// Type declaration for dynamic inquirer import
declare function require(name: string): any;

export async function promptUser(questions: any[]): Promise<any> {
    // Use require for runtime import to avoid TypeScript module resolution issues
    const inquirer = require('inquirer');
    return inquirer.prompt(questions);
}
