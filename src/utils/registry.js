"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadRegistry = loadRegistry;
exports.findSkill = findSkill;
exports.searchRegistry = searchRegistry;
exports.isSkillInstalled = isSkillInstalled;
exports.getInstalledSkills = getInstalledSkills;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Registry can be loaded from local file or remote URL
const REGISTRY_FILENAME = 'recommended_skills.json';
/**
 * Get the path to the skills registry.
 * First checks local project, then falls back to package location.
 */
function getRegistryPath() {
    // Check if running from within the repo (development)
    const repoPath = path.join(__dirname, '..', '..', '..', REGISTRY_FILENAME);
    if (fs.existsSync(repoPath)) {
        return repoPath;
    }
    // Check parent directory (installed via npm)
    const npmPath = path.join(__dirname, '..', '..', REGISTRY_FILENAME);
    if (fs.existsSync(npmPath)) {
        return npmPath;
    }
    // Fallback: bundled with package
    const bundledPath = path.join(__dirname, '..', 'data', REGISTRY_FILENAME);
    if (fs.existsSync(bundledPath)) {
        return bundledPath;
    }
    throw new Error(`Skills registry not found. Searched: ${repoPath}, ${npmPath}, ${bundledPath}`);
}
/**
 * Load the skills registry from disk.
 */
function loadRegistry() {
    const registryPath = getRegistryPath();
    const content = fs.readFileSync(registryPath, 'utf8');
    return JSON.parse(content);
}
/**
 * Find a skill by ID or name (case-insensitive).
 */
function findSkill(query) {
    const registry = loadRegistry();
    const lowerQuery = query.toLowerCase();
    return registry.find((skill) => skill.id.toLowerCase() === lowerQuery ||
        skill.name.toLowerCase() === lowerQuery ||
        skill.folder_name.toLowerCase() === lowerQuery);
}
/**
 * Search skills by query (matches name or description).
 */
function searchRegistry(query) {
    const registry = loadRegistry();
    const lowerQuery = query.toLowerCase();
    return registry.filter((skill) => skill.name.toLowerCase().includes(lowerQuery) ||
        skill.description.toLowerCase().includes(lowerQuery) ||
        skill.id.toLowerCase().includes(lowerQuery));
}
/**
 * Check if a skill is installed locally.
 */
function isSkillInstalled(skillFolderName, baseDir = '.') {
    const skillPath = path.join(baseDir, '.agent', 'skills', skillFolderName);
    return fs.existsSync(skillPath);
}
/**
 * Get list of installed skill folder names.
 */
function getInstalledSkills(baseDir = '.') {
    const skillsDir = path.join(baseDir, '.agent', 'skills');
    if (!fs.existsSync(skillsDir)) {
        return [];
    }
    return fs.readdirSync(skillsDir).filter((name) => {
        const fullPath = path.join(skillsDir, name);
        return fs.statSync(fullPath).isDirectory();
    });
}
//# sourceMappingURL=registry.js.map