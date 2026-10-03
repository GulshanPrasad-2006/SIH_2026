# Chat Assistant Update — English/Hindi

- Added an English/Hindi selector in the assistant panel, synchronized with the website language preference.
- Added bilingual greeting, placeholder, response/loading/error messages, and quick-question buttons.
- The assistant sends the selected language to `/chat/query`.
- Backend responses now support English and Hindi for compliance, open violations, reminders/deadlines, grievances, and mine risk score questions.
- Added common Hindi intent phrases for those supported topics.
- Updated service-worker cache key to `khadan-rakshak-shell-v3` so clients can refresh the updated assistant assets.

## Validation
- `node --check` passed for all top-level frontend JavaScript files.
- Python compile check passed for backend application modules.
- Backend automated test suite: 4 passed.
- ZIP archive integrity verified after packaging.

Note: The assistant is a rule-based, database-backed helper for the listed topics, not a general-purpose AI chatbot. Browser/device interaction was not exercised in this environment.
