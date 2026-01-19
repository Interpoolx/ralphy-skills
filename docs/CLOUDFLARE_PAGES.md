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
- `marketplace.json`

## Updating marketplace data

If you update the root `marketplace.json`, also update the website copy:

```bash
cp marketplace.json public/marketplace.json
```

## Local preview

Any static server works:

```bash
npx serve public
```
