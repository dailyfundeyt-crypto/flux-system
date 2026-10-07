# AGENTS.md

This project follows the **Connect Premium Harness** (`.cursor/rules/CONNECT-PREMIUM.mdc`). Read it before UI or feature work.

## Essentials
- **Look:** dark, minimal, xAI/Grok-premium. Near-black bg, glass panels with hairline borders, sky (`#38bdf8`) + violet (`#8b5cf6`) accents, frosted menus, visible focus glow. Use design tokens – no raw hex in components. Dark is default; light only if a toggle exists.
- **Copy:** UI text in German, "du"-form, short. Code and commits in English.
- **Signed out:** show a landing page with "Mit Google fortfahren", never an empty app.
- **Mobile:** swipe between main sections, no bottom tab bar, settings/company switch behind the avatar, bottom sheets, 44px touch targets.
- **Motion:** 120–320ms ease-out, opacity/transform only, respect `prefers-reduced-motion`.
- **Code:** TypeScript strict, no `any`, small components + hooks, reuse existing libs, validate input, explicit errors.

## Rules
1. Read existing code first. Never invent APIs, env vars, packages or DB fields.
2. Back up (git branch/commit) before risky edits. No force-push, `reset --hard` or destructive DB ops without approval.
3. Ship complete: loading/empty/error states, no placeholders, no dead buttons.
4. Test what you ship: typecheck, lint, tests, check desktop 1440px + mobile 390px + keyboard. Report only what you actually verified.
