-- Repair seeded work identifiers, including databases populated before this correction.
DELETE FROM external_ids AS e USING works AS w, (VALUES
  ('a-study-in-scarlet', '244'),
  ('the-mystery-of-marie-rog-t', '2148'),
  ('the-purloined-letter', '2149'),
  ('the-gold-bug', '2150'),
  ('813', '4023'),
  ('the-circular-study', '14838'),
  ('from-the-earth-to-the-moon', '83'),
  ('around-the-moon', '83'),
  ('the-warlord-of-mars', '78'),
  ('meditations-on-first-philosophy', '59'),
  ('discourse-on-the-method', '59'),
  ('the-black-tulip', '1064'),
  ('michael-strogoff', '1028'),
  ('the-masque-of-the-red-death', '1064'),
  ('the-pit-and-the-pendulum', '2148'),
  ('the-tell-tale-heart', '2149'),
  ('the-black-cat', '2150'),
  ('the-professor', '1028'),
  ('the-history-of-the-conquest-of-mexico', '2445'),
  ('the-tale-of-peter-rabbit', '14838'),
  ('at-the-back-of-the-north-wind', '244'),
  ('the-ring-and-the-book', '4023'),
  ('the-celebrated-jumping-frog', '78'),
  ('letters-on-england', '2445')
) AS old(slug, external_id)
WHERE w.slug = old.slug AND e.entity_id = w.id AND e.entity_type = 'work'
  AND e.source = 'gutenberg' AND e.external_id = old.external_id;
--> statement-breakpoint
INSERT INTO external_ids (entity_type, entity_id, source, external_id)
SELECT 'work', w.id, 'gutenberg', corrected.external_id FROM works AS w JOIN (VALUES
  ('813', '34758'),
  ('a-study-in-scarlet', '244'),
  ('at-the-back-of-the-north-wind', '225'),
  ('the-circular-study', '18761'),
  ('the-tale-of-peter-rabbit', '14838'),
  ('from-the-earth-to-the-moon', '8986'),
  ('around-the-moon', '16457'),
  ('the-warlord-of-mars', '68'),
  ('discourse-on-the-method', '59'),
  ('the-black-tulip', '965'),
  ('the-masque-of-the-red-death', '1064'),
  ('michael-strogoff', '8987'),
  ('the-professor', '1028'),
  ('letters-on-england', '2445')
) AS corrected(slug, external_id) ON corrected.slug = w.slug
ON CONFLICT (source, external_id) DO NOTHING;
