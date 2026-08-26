import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/index.js";

const ENV = {
  ORIGIN_BASE_URL: "https://flux-origin.example.com",
  CF_ACCESS_CLIENT_ID: "client-id",
  CF_ACCESS_CLIENT_SECRET: "client-secret",
};

test("rejects paths outside the API and demo", async () => {
  const response = await worker.fetch(
    new Request("https://demo.example.com/anything"),
    ENV,
  );
  assert.equal(response.status, 404);
});

test("does not expose the removed edit API", async () => {
  const response = await worker.fetch(
    new Request("https://demo.example.com/api/edit", { method: "POST" }),
    ENV,
  );
  assert.equal(response.status, 404);
});

test("forwards the mounted demo with the Access Service Token", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  let forwarded;
  globalThis.fetch = async (url, init) => {
    forwarded = { url: url.toString(), init };
    return new Response(
      '<script>window.gradio_config={"root":"https://flux-origin.example.com/demo"}</script>',
      {
      status: 200,
      headers: { "content-type": "text/html" },
      },
    );
  };

  const response = await worker.fetch(
    new Request("https://demo.example.com/demo/?view=compare"),
    ENV,
  );

  assert.equal(
    forwarded.url,
    "https://flux-origin.example.com/demo/?view=compare",
  );
  assert.equal(forwarded.init.method, "GET");
  assert.equal(
    forwarded.init.headers.get("CF-Access-Client-Id"),
    ENV.CF_ACCESS_CLIENT_ID,
  );
  assert.equal(
    forwarded.init.headers.get("CF-Access-Client-Secret"),
    ENV.CF_ACCESS_CLIENT_SECRET,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/html");
  assert.match(
    await response.text(),
    /"root":"https:\/\/demo\.example\.com\/demo"/,
  );
});

test("rewrites the private origin in Gradio config responses", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({
      root: "https://flux-origin.example.com/demo",
      api_prefix: "/gradio_api",
    });

  const response = await worker.fetch(
    new Request("https://demo.example.com/demo/config"),
    ENV,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    root: "https://demo.example.com/demo",
    api_prefix: "/gradio_api",
  });
});

test("streams rewritten Gradio SSE before the origin closes", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const encoder = new TextEncoder();
  let originController;
  globalThis.fetch = async () =>
    new Response(
      new ReadableStream({
        start(controller) {
          originController = controller;
          controller.enqueue(
            encoder.encode(
              'data: {"url":"https://flux-origin.example.com/demo/file.png"}\n\n' +
                "padding-padding-padding-padding-padding-padding",
            ),
          );
        },
      }),
      { headers: { "content-type": "text/event-stream" } },
    );

  const response = await worker.fetch(
    new Request("https://demo.example.com/demo/gradio_api/queue/data"),
    ENV,
  );
  const reader = response.body.getReader();
  const firstChunk = await reader.read();

  assert.equal(firstChunk.done, false);
  assert.match(
    new TextDecoder().decode(firstChunk.value),
    /https:\/\/demo\.example\.com\/demo\/file\.png/,
  );
  assert.equal(response.headers.get("cache-control"), "no-store");

  originController.close();
  await reader.cancel();
});

test("only accepts POST", async () => {
  const response = await worker.fetch(
    new Request("https://demo.example.com/api/generate"),
    ENV,
  );
  assert.equal(response.status, 405);
});

test("fails closed when a Service Token secret is missing", async () => {
  const originalError = console.error;
  console.error = () => {};
  const response = await worker.fetch(
    new Request("https://demo.example.com/api/generate", { method: "POST" }),
    { ORIGIN_BASE_URL: ENV.ORIGIN_BASE_URL },
  );
  console.error = originalError;
  assert.equal(response.status, 500);
});

test("forwards generate with the Access Service Token", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  let forwarded;
  globalThis.fetch = async (url, init) => {
    forwarded = { url: url.toString(), init };
    return new Response("png", {
      status: 200,
      headers: {
        "content-type": "image/png",
        "x-image-width": "512",
        "x-private-origin-header": "must-not-leak",
      },
    });
  };

  const response = await worker.fetch(
    new Request("https://demo.example.com/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "a cat" }),
    }),
    ENV,
  );

  assert.equal(forwarded.url, "https://flux-origin.example.com/generate");
  assert.equal(
    forwarded.init.headers.get("CF-Access-Client-Id"),
    ENV.CF_ACCESS_CLIENT_ID,
  );
  assert.equal(
    forwarded.init.headers.get("CF-Access-Client-Secret"),
    ENV.CF_ACCESS_CLIENT_SECRET,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.equal(response.headers.get("x-image-width"), "512");
  assert.equal(response.headers.get("x-private-origin-header"), null);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("forwards multipart evaluation and returns JSON", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  let forwarded;
  globalThis.fetch = async (url, init) => {
    forwarded = { url: url.toString(), init };
    return Response.json({
      score: 87,
      comment: "정답이 그림 밖으로 자기소개하러 나올 기세예요!",
    });
  };

  const form = new FormData();
  form.set("prompt", "우산을 든 공룡");
  form.set("image", new Blob(["image"]), "doodle.png");
  const response = await worker.fetch(
    new Request("https://demo.example.com/api/evaluate", {
      method: "POST",
      body: form,
    }),
    ENV,
  );

  assert.equal(forwarded.url, "https://flux-origin.example.com/evaluate");
  assert.equal(forwarded.init.headers.get("accept"), "application/json");
  assert.equal(response.headers.get("content-type"), "application/json");
  assert.deepEqual(await response.json(), {
    score: 87,
    comment: "정답이 그림 밖으로 자기소개하러 나올 기세예요!",
  });
});
