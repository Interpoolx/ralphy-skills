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
    tags: string | string[]
    source?: string
    author?: string | Author
    version: string
    license?: string
    requirements?: string[]
    compatible_agents?: string[]
    keywords?: string[]
    downloads?: number
    rating?: number
    reviews?: number
    githubUrl: string
    githubOwner?: string
    githubRepo?: string
    githubStars?: number
    githubForks?: number
    installCount?: number
    compatibility?: string
    namespace?: string
    platform?: string
    stars?: number
    isVerified?: number | boolean
    isFeatured?: number | boolean
    created_at?: string
    updated_at?: string
    createdAt?: string
    updatedAt?: string
    indexedAt?: string
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
