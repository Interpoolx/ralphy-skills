-- Ralphy Skills Registry Database Schema
-- Cloudflare D1 (SQLite)

-- Skills table - main registry
CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    namespace TEXT, -- Package namespace (e.g. @anthropics/claude-code-plugins)
    description TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    tags TEXT, -- JSON array
    author TEXT,
    version TEXT DEFAULT '1.0.0',
    license TEXT,
    github_url TEXT NOT NULL,
    github_owner TEXT,
    github_repo TEXT,
    github_stars INTEGER DEFAULT 0,
    github_forks INTEGER DEFAULT 0,
    install_count INTEGER DEFAULT 0,
    compatibility TEXT,
    import_source TEXT DEFAULT 'manual', -- marketplace, claude-plugins, manual
    platform TEXT DEFAULT 'global', -- global, claude, cursor, codex, copilot
    stars INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    metadata TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    indexed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_verified INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published', -- published, pending, invalid
    submitter_name TEXT,
    submitter_email TEXT
);

-- Full-text search index
CREATE VIRTUAL TABLE IF NOT EXISTS skills_fts USING fts5(
    id,
    name,
    description,
    tags,
    author,
    content='skills',
    content_rowid='rowid'
);

-- Trigger to keep FTS index in sync
CREATE TRIGGER IF NOT EXISTS skills_ai AFTER INSERT ON skills BEGIN
    INSERT INTO skills_fts(rowid, id, name, description, tags, author)
    VALUES (new.rowid, new.id, new.name, new.description, new.tags, new.author);
END;

CREATE TRIGGER IF NOT EXISTS skills_ad AFTER DELETE ON skills BEGIN
    INSERT INTO skills_fts(skills_fts, rowid, id, name, description, tags, author)
    VALUES('delete', old.rowid, old.id, old.name, old.description, old.tags, old.author);
END;

CREATE TRIGGER IF NOT EXISTS skills_au AFTER UPDATE ON skills BEGIN
    INSERT INTO skills_fts(skills_fts, rowid, id, name, description, tags, author)
    VALUES('delete', old.rowid, old.id, old.name, old.description, old.tags, old.author);
    INSERT INTO skills_fts(rowid, id, name, description, tags, author)
    VALUES (new.rowid, new.id, new.name, new.description, new.tags, new.author);
END;

-- Install tracking table
CREATE TABLE IF NOT EXISTS installs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_id TEXT NOT NULL,
    client TEXT DEFAULT 'unknown',
    installed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (skill_id) REFERENCES skills(id)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    skill_count INTEGER DEFAULT 0
);

-- Insert default categories
INSERT OR IGNORE INTO categories (id, name, description, icon) VALUES
    ('frontend', 'Frontend', 'UI/UX, React, Vue, CSS skills', '🎨'),
    ('backend', 'Backend', 'APIs, databases, server skills', '⚙️'),
    ('devops', 'DevOps', 'CI/CD, deployment, infrastructure', '🚀'),
    ('testing', 'Testing', 'Unit, integration, E2E testing', '🧪'),
    ('security', 'Security', 'Security best practices', '🔒'),
    ('ai-ml', 'AI/ML', 'Machine learning and AI skills', '🤖'),
    ('general', 'General', 'General coding practices', '📝'),
    ('mobile', 'Mobile', 'iOS, Android, React Native', '📱'),
    ('data', 'Data', 'Data analysis and pipelines', '📊'),
    ('docs', 'Documentation', 'Writing and documentation', '📚');

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_author ON skills(author);
CREATE INDEX IF NOT EXISTS idx_skills_stars ON skills(github_stars DESC);
CREATE INDEX IF NOT EXISTS idx_skills_installs ON skills(install_count DESC);
CREATE INDEX IF NOT EXISTS idx_skills_featured ON skills(is_featured);
CREATE INDEX IF NOT EXISTS idx_installs_skill ON installs(skill_id);

-- Skill Submissions table
CREATE TABLE IF NOT EXISTS skill_submissions (
    id TEXT PRIMARY KEY,
    github_url TEXT NOT NULL,
    submitter_name TEXT,
    submitter_email TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    review_notes TEXT,
    submitter_ip TEXT,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON skill_submissions(status);

-- PRDs table - PRD/Specs Registry
CREATE TABLE IF NOT EXISTS prds (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'other',
    tags TEXT, -- JSON array
    author TEXT,
    version TEXT DEFAULT '1.0.0',
    file_path TEXT NOT NULL,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    issue_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'published'
);

-- PRD Categories
CREATE TABLE IF NOT EXISTS prd_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    prd_count INTEGER DEFAULT 0
);

-- Insert default PRD categories
INSERT OR IGNORE INTO prd_categories (id, name, description, icon) VALUES
    ('business', 'Business', 'Business applications and enterprise solutions', '💼'),
    ('health', 'Health', 'Healthcare and medical applications', '🏥'),
    ('education', 'Education', 'Learning and educational platforms', '📚'),
    ('productivity', 'Productivity', 'Productivity and workflow tools', '⚡'),
    ('developer', 'Developer', 'Developer tools and technical specs', '💻'),
    ('creative', 'Creative', 'Design and creative applications', '🎨'),
    ('operations', 'Operations', 'Operations and logistics systems', '🔧'),
    ('consumer', 'Consumer', 'Consumer-facing applications', '🛒'),
    ('other', 'Other', 'Miscellaneous specifications', '📋');

-- Indexes for PRD queries
CREATE INDEX IF NOT EXISTS idx_prds_category ON prds(category);
CREATE INDEX IF NOT EXISTS idx_prds_slug ON prds(slug);
CREATE INDEX IF NOT EXISTS idx_prds_views ON prds(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_prds_likes ON prds(like_count DESC);

