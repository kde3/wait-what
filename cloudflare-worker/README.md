# Z-Image doodle Cloudflare proxy

This Worker is the public website's server-side proxy. It exposes only:

- `POST /api/generate` -> protected origin `POST /generate`
- `POST /api/evaluate` -> protected origin `POST /evaluate`
- `/demo/*` -> protected origin Gradio comparison UI

The Cloudflare Access Service Token stays in Worker Secrets and is never sent
to the browser.

## Cloudflare resources

1. Create a named Cloudflare Tunnel called `flux-doodle-demo`.
2. Run its `cloudflared` connector on the GPU server.
3. Add a published application route such as
   `flux-origin.example.com` -> `http://127.0.0.1:7860`.
4. Create a Cloudflare Access self-hosted application for
   `flux-origin.example.com/*`.
5. Create an Access Service Token and add a `Service Auth` policy that includes
   that token.

## Worker configuration

Replace `ORIGIN_BASE_URL` in `wrangler.jsonc` with the real Tunnel hostname,
then install dependencies and store the two token values as secrets:

```bash
npm install
npx wrangler secret put CF_ACCESS_CLIENT_ID
npx wrangler secret put CF_ACCESS_CLIENT_SECRET
npm run deploy
```

Route this Worker to the public demo website's `/api/*` path. Frontend code can
then use same-origin requests without CORS configuration:

```js
const generated = await fetch("/api/generate", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ prompt, difficulty: "normal" }),
});

const evaluationForm = new FormData();
evaluationForm.set("prompt", targetPrompt);
evaluationForm.set("image", doodleFile);
const evaluation = await fetch("/api/evaluate", {
  method: "POST",
  body: evaluationForm,
});
const { score, comment } = await evaluation.json();
```

`difficulty` accepts `easy`, `normal`, or `hard` and defaults to `normal`.

Do not put either Access Service Token value in source code, `wrangler.jsonc`,
or browser JavaScript.
