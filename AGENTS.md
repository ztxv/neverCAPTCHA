# NeverCAPTCHA project

This is the standalone GitHub/Vercel edition of NeverCAPTCHA. It is a static website, with no ChatGPT sign-in, Google CAPTCHA API, database, framework, or package dependencies. Use this repository for future app changes. Deploy to Vercel when deployment is requested; do not reconnect it to ChatGPT Sites unless the user asks.

- Edit browser code in `src/` and bundled assets in `public/`.
- `npm run dev` serves the editable source and assets locally.
- `npm run check` verifies JavaScript syntax, asset links, all photos, and the endless-round invariant.
- `npm run build` generates `dist/`; `npm run preview` serves that output.
- Keep source images unchanged and retain credits and third-party license files.
- Preserve the intentional failure loop: verification never succeeds, and dynamic rounds always retain at least one target.
- Do not edit generated `dist/` files or commit hosting credentials.
