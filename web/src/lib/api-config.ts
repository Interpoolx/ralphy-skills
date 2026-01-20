// API Configuration for Admin Panel
// Toggle between development and production APIs

export const API_CONFIGS = {
    development: {
        label: 'Local Development',
        url: 'http://localhost:8787',
        description: 'Local Wrangler dev server'
    },
    production: {
        label: 'Production',
        url: 'https://ralphy-skills-api.workers.dev', // Update this after deployment
        description: 'Cloudflare Workers production'
    }
}

// Get saved API URL from localStorage or default to development
export function getApiUrl(): string {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('admin_api_url') || API_CONFIGS.development.url
    }
    return API_CONFIGS.development.url
}

// Save API URL to localStorage
export function setApiUrl(url: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('admin_api_url', url)
    }
}
