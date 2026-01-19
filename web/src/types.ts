export interface Author {
    name: string
    github?: string
    email?: string
    url?: string
}

export interface Skill {
    id: string
    name: string
    description: string
    category: string
    tags: string[]
    source: string
    author?: Author
    version: string
    requirements?: string[]
    compatible_agents?: string[]
    keywords?: string[]
    downloads?: number
    rating?: number
    reviews?: number
    created_at?: string
    updated_at?: string
    verified?: boolean
}

export interface MarketplaceData {
    skills: Skill[]
    categories: string[]
    filters?: {
        by_category?: Record<string, number>
        by_agent?: Record<string, number>
        verified_count?: number
        community_count?: number
    }
    metadata?: {
        total_skills: number
        total_downloads: number
        avg_rating: number
    }
}
