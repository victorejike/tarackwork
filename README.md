<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/27a69610-f5b2-43c8-b2ef-861611183054

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Netlify

- Set build command to `npm run build` and publish directory to `dist`.
- Add the Firebase config values to Netlify environment variables using the keys from `.env.example` (prefix `VITE_`).
- The project includes `netlify.toml` with an SPA redirect so client-side routes route to `index.html`.

Optional local steps:

```
cp .env.example .env.local
# fill in the values, then
npm run build
```
