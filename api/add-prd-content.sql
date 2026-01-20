-- Add content field to prds table for storing markdown content directly in database
-- This allows Cloudflare Pages deployment without file storage issues

ALTER TABLE prds ADD COLUMN content TEXT DEFAULT '';
