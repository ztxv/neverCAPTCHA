# Deployment

NeverCAPTCHA builds to a plain static folder (`dist/`). It needs no server runtime, database, environment variables, or API keys.

## Vercel (recommended)

1. Open [vercel.com/new](https://vercel.com/new) and connect your GitHub account.
2. Import the `neverCAPTCHA` repository. Leave **Root Directory** as the repository root (not `src` or `public`).
3. Click **Deploy**. The included [`vercel.json`](../vercel.json) applies these settings automatically:

| Setting | Value |
| --- | --- |
| Framework preset | Other |
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | skipped (no dependencies) |
| Environment variables | none |

Every push to `main` then redeploys production, and pull requests get preview URLs.

If visitors are asked to sign in to Vercel, turn off **Deployment Protection** for production in the project settings. That is a hosting setting, not part of the app.

### Vercel CLI

```sh
npx vercel          # preview deployment
npx vercel --prod   # production deployment
```

## Any other static host

```sh
npm run build
```

Upload the contents of `dist/` to Netlify, Cloudflare Pages, GitHub Pages, S3, or any web server. All asset paths are relative, so the site also works from a subdirectory.

## Verifying a build locally

```sh
npm run check     # syntax, photos, asset links, endless-round invariant
npm run build
npm run preview   # serves dist/ on http://localhost:5173
```

Set a different port with `PORT=8080 npm run preview` or `npm run preview -- --port 8080`.

## References

- [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json)
- [Adding locally hosted code to GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
