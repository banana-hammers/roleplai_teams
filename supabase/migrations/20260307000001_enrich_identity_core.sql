-- Enrich identity_cores with writing style, cognitive style, and refinement tracking
ALTER TABLE identity_cores ADD COLUMN style_profile JSONB DEFAULT '{}';
ALTER TABLE identity_cores ADD COLUMN cognitive_style JSONB DEFAULT '{}';
ALTER TABLE identity_cores ADD COLUMN writing_samples TEXT[] DEFAULT '{}';
ALTER TABLE identity_cores ADD COLUMN refinement_log JSONB DEFAULT '[]';
