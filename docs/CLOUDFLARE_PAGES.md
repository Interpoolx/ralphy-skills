# Deploying the Skills Browser to Cloudflare Pages

This repo includes a static, zero-backend marketplace browser in `public/`.

## Cloudflare Pages settings

- **Framework preset**: None
- **Build command**: *(leave empty)*
- **Build output directory**: `public`

`public/` contains:
- `index.html`
- `app.js`
- `styles.css`

## Single Source of Truth

The marketplace data is fetched from the **root `marketplace.json`** file via GitHub raw URL:
```
https://raw.githubusercontent.com/Interpoolx/ralphy-skills/main/marketplace.json
```

The static web interface (`public/app.js`) automatically:
1. Fetches from GitHub raw URL (single source of truth)
2. Falls back to local `./marketplace.json` for local development

**No duplication needed!** Update only the root `marketplace.json` file.

## Local preview

Any static server works:

```bash
npx serve public
```

For local development with marketplace data, you can optionally copy:
```bash
cp marketplace.json public/marketplace.json
```
But this is not required for production deployment.
