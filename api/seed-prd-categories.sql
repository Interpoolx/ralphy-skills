INSERT INTO prd_categories (id, name, description, icon) VALUES ('business', 'Business', 'Specifications for business and enterprise applications.', '💼') ON CONFLICT(id) DO NOTHING;
INSERT INTO prd_categories (id, name, description, icon) VALUES ('consumer', 'Consumer', 'Apps for individual users and daily use.', '📱') ON CONFLICT(id) DO NOTHING;
INSERT INTO prd_categories (id, name, description, icon) VALUES ('creative', 'Creative', 'Tools for design, media, and artistic work.', '🎨') ON CONFLICT(id) DO NOTHING;
INSERT INTO prd_categories (id, name, description, icon) VALUES ('developer', 'Developer', 'Infrastructure, APIs, and developer tools.', '💻') ON CONFLICT(id) DO NOTHING;
INSERT INTO prd_categories (id, name, description, icon) VALUES ('education', 'Education', 'Learning platforms and educational software.', '🎓') ON CONFLICT(id) DO NOTHING;
INSERT INTO prd_categories (id, name, description, icon) VALUES ('health', 'Health', 'Healthcare, wellness, and medical apps.', '🏥') ON CONFLICT(id) DO NOTHING;
INSERT INTO prd_categories (id, name, description, icon) VALUES ('productivity', 'Productivity', 'Tools for efficiency and task management.', '⚡') ON CONFLICT(id) DO NOTHING;
INSERT INTO prd_categories (id, name, description, icon) VALUES ('operations', 'Operations', 'Business operations and logistics.', '⚙️') ON CONFLICT(id) DO NOTHING;
INSERT INTO prd_categories (id, name, description, icon) VALUES ('other', 'Other', 'General specifications and other types.', '📦') ON CONFLICT(id) DO NOTHING;
