-- Fix foreign key constraint names on role_lore table.
-- The table was renamed from role_context_packs to role_lore,
-- but the FK constraints kept the old names. PostgREST uses
-- constraint names for relationship discovery, so mismatched
-- names break nested selects like roles -> role_lore.

ALTER TABLE role_lore
  RENAME CONSTRAINT role_context_packs_role_id_fkey
  TO role_lore_role_id_fkey;

ALTER TABLE role_lore
  RENAME CONSTRAINT role_context_packs_context_pack_id_fkey
  TO role_lore_lore_id_fkey;
