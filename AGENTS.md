# AGENTS.md instructions for /home/tikhong/LLMS

<INSTRUCTIONS>
## Skills
A skill is a set of local instructions stored in a `SKILL.md` file. Use the skills below when user intent matches.

### Available skills
- coding-doc: Locate and route target docs in `coding-doc/`, explain file purpose, and keep docs synchronized with feature changes in `web/`. Use for doc lookup, doc updates, consistency checks, and cross-doc clarification. (file: /home/tikhong/LLMS/skills/coding-doc/SKILL.md)
- frontend: Implement and refine UI in `web/` using frontend consistency and component pattern docs, while keeping architecture and aesthetics consistent. Use for page/component build, restyle, responsive fixes, and UI consistency review. (file: /home/tikhong/LLMS/skills/frontend/SKILL.md)
- dxf-geojson-ops: Execute DXF-to-GeoJSON conversion workflows, tune conversion parameters, validate outputs, and sync map data paths used by frontend. Use for GIS data import/conversion and GeoJSON quality verification tasks. (file: /home/tikhong/LLMS/skills/dxf-geojson-ops/SKILL.md)
- function-update: Implement new/changed product functions end-to-end, including code changes, doc synchronization, and validation evidence. Use when adding new features, extending behavior, or completing verification for function changes. (file: /home/tikhong/LLMS/skills/function-update/SKILL.md)
- pm-business-function-consistency: Align new/changed feature requirements with PM business objectives and role scenarios before and after implementation, using current `web/` capability baseline. Use for business-driven requirement clarification, scope validation, and customer-need consistency checks. (file: /home/tikhong/LLMS/skills/pm-business-function-consistency/SKILL.md)

### How to use skills
- Trigger rules: If user names a skill (with `$SkillName` or plain text) or task clearly matches a skill description, use that skill in the current turn.
- Multiple skills: Use the minimum set that covers the request and run them in a clear order.
- Suggested sequencing:
  - PM-driven feature request: `pm-business-function-consistency` -> `function-update` -> (`frontend` if UI-heavy) -> `coding-doc`
  - New feature in web app: `function-update` -> (`frontend` if UI-heavy) -> `coding-doc`
  - DXF data onboarding: `dxf-geojson-ops` -> `coding-doc`
  - Pure documentation task: `coding-doc`
  - Pure UI consistency task: `frontend`
- Context hygiene: Load only relevant references/files; avoid bulk-loading all docs unless request is broad.
- Fallback: If a skill file is missing or unreadable, state it briefly and continue with best-effort implementation.
</INSTRUCTIONS>
