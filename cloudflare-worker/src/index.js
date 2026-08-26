const API_ROUTES = new Map([
  ["/api/generate", "/generate"],
  ["/api/evaluate", "/evaluate"],
]);

const RESPONSE_HEADERS = [
  "content-type",
  "content-disposition",
  "x-image-width",
  "x-image-height",
];

function requireEnvironment(env) {
  const required = [
    "ORIGIN_BASE_URL",
    "CF_ACCESS_CLIENT_ID",
    "CF_ACCESS_CLIENT_SECRET",
  ];
  const missing = required.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing Worker configuration: ${missing.join(", ")}`);
  }
}

function textResponse(message, status) {
  return new Response(message, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function rewriteTextStream(stream, search, replacement) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let pending = "";

  return stream.pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        pending += decoder.decode(chunk, { stream: true });
        pending = pending.replaceAll(search, replacement);

        const retainedLength = Math.min(search.length - 1, pending.length);
        const emitLength = pending.length - retainedLength;
        if (emitLength > 0) {
          controller.enqueue(encoder.encode(pending.slice(0, emitLength)));
          pending = pending.slice(emitLength);
        }
      },
      flush(controller) {
        pending += decoder.decode();
        pending = pending.replaceAll(search, replacement);
        if (pending) {
          controller.enqueue(encoder.encode(pending));
        }
      },
    }),
  );
}

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    const apiOriginPath = API_ROUTES.get(requestUrl.pathname);
    const isDemoPath =
      requestUrl.pathname === "/demo" || requestUrl.pathname.startsWith("/demo/");

    if (!apiOriginPath && !isDemoPath) {
      return textResponse("Not found", 404);
    }
    if (apiOriginPath && request.method !== "POST") {
      return textResponse("Method not allowed", 405);
    }

    try {
      requireEnvironment(env);
    } catch (error) {
      console.error(error.message);
      return textResponse("Proxy is not configured", 500);
    }

    const upstreamPath = apiOriginPath || `${requestUrl.pathname}${requestUrl.search}`;
    const upstreamUrl = new URL(upstreamPath, env.ORIGIN_BASE_URL);
    const upstreamHeaders = isDemoPath
      ? new Headers(request.headers)
      : new Headers();
    if (apiOriginPath) {
      const contentType = request.headers.get("content-type");
      if (contentType) {
        upstreamHeaders.set("content-type", contentType);
      }
      upstreamHeaders.set(
        "accept",
        apiOriginPath === "/evaluate" ? "application/json" : "image/png",
      );
    }
    upstreamHeaders.set("CF-Access-Client-Id", env.CF_ACCESS_CLIENT_ID);
    upstreamHeaders.set("CF-Access-Client-Secret", env.CF_ACCESS_CLIENT_SECRET);

    let upstream;
    try {
      upstream = await fetch(upstreamUrl, {
        method: request.method,
        headers: upstreamHeaders,
        body:
          request.method === "GET" || request.method === "HEAD"
            ? undefined
            : request.body,
        redirect: "manual",
      });
    } catch (error) {
      console.error("Origin request failed", error);
      return textResponse("Image service is unavailable", 502);
    }

    if (isDemoPath) {
      const demoHeaders = new Headers(upstream.headers);
      demoHeaders.set("cache-control", "no-store");
      const location = demoHeaders.get("location");
      if (location) {
        demoHeaders.set(
          "location",
          location.replace(env.ORIGIN_BASE_URL, requestUrl.origin),
        );
      }

      const contentType = demoHeaders.get("content-type") || "";
      const privateDemoRoot = `${env.ORIGIN_BASE_URL}/demo`;
      const publicDemoRoot = `${requestUrl.origin}/demo`;
      if (contentType.includes("text/event-stream") && upstream.body) {
        demoHeaders.delete("content-length");
        return new Response(
          rewriteTextStream(upstream.body, privateDemoRoot, publicDemoRoot),
          {
            status: upstream.status,
            headers: demoHeaders,
          },
        );
      }

      if (
        contentType.includes("text/html") ||
        contentType.includes("application/json")
      ) {
        demoHeaders.delete("content-length");
        const body = (await upstream.text()).replaceAll(
          privateDemoRoot,
          publicDemoRoot,
        );
        return new Response(body, {
          status: upstream.status,
          headers: demoHeaders,
        });
      }

      return new Response(upstream.body, {
        status: upstream.status,
        headers: demoHeaders,
      });
    }

    const responseHeaders = new Headers({
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    });
    for (const name of RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) {
        responseHeaders.set(name, value);
      }
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  },
};
