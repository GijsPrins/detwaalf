# Changelog

Track notable project changes here.

## Unreleased
- Security follow-up: links must be http(s), contact sender email comes from the account, other users' profiles, participations and the role roster are no longer readable, and the `X-Powered-By` header is removed.
- Added developer operating docs structure.
- Added `/admin/events` for adding many events at once, with optional hints read from the organiser's website.
- Added the quarter marathon (10.55 km) distance, registration links and name-based place lookup to bulk event intake; "Beheer" now opens it.
- Bulk event intake accepts complete event lines (for example from an AI chat or spreadsheet) and offers a copyable AI prompt per province that skips events we already have and asks for at most 10.
