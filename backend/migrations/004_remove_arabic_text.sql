-- Day 15: remove the Arabic text that older versions stored next to the English text.
-- Descriptions used to be saved as "English text / Arabic text". Only the English part is kept.
-- Safe to run more than once: rows without Arabic letters are not touched.

-- Goals: "Build user interfaces / بناء واجهات" becomes "Build user interfaces"
UPDATE goals
SET description = NULLIF(btrim(regexp_replace(description, '\s*/\s*[\u0600-\u06FF].*$', '')), '')
WHERE description ~ '[\u0600-\u06FF]';

-- Skills: same rule
UPDATE skills
SET description = NULLIF(btrim(regexp_replace(description, '\s*/\s*[\u0600-\u06FF].*$', '')), '')
WHERE description ~ '[\u0600-\u06FF]';

-- A description that was written only in Arabic has no English part, so it is cleared
UPDATE goals SET description = NULL WHERE description ~ '[\u0600-\u06FF]';
UPDATE skills SET description = NULL WHERE description ~ '[\u0600-\u06FF]';