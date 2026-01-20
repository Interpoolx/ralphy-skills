export const MARKETPLACE_URL = 'https://raw.githubusercontent.com/Interpoolx/ralphy-skills/refs/heads/main/marketplace.json'

// D1 Database API
export const API_URL = import.meta.env.PROD
    ? 'https://ralphy-skills-api.rajeshkumarlawyer007.workers.dev'
    : 'http://localhost:8787'
