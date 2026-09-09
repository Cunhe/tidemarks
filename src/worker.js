const KEY = "tidemarks:data";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function authorized(request, env) {
  const header = request.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "");
  return Boolean(env.ADMIN_TOKEN) && token === env.ADMIN_TOKEN;
}

async function handleBookmarks(request, env) {
  if (!env.BOOKMARKS) {
    return json({ error: "未绑定 KV：请在 Worker 设置中绑定 BOOKMARKS" }, 501);
  }

  if (request.method === "GET") {
    const raw = await env.BOOKMARKS.get(KEY);
    if (!raw) return json({ error: "云端还没有数据，先点「云推送」" }, 404);
    return new Response(raw, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  if (request.method === "PUT") {
    if (!env.ADMIN_TOKEN) return json({ error: "未配置环境变量 ADMIN_TOKEN" }, 501);
    if (!authorized(request, env)) return json({ error: "未授权" }, 401);
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "JSON 无效" }, 400);
    }
    if (!body || !Array.isArray(body.categories)) {
      return json({ error: "数据需包含 categories 数组" }, 400);
    }
    body.updatedAt = new Date().toISOString();
    await env.BOOKMARKS.put(KEY, JSON.stringify(body));
    return json({ ok: true, updatedAt: body.updatedAt });
  }

  return json({ error: "方法不允许" }, 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/bookmarks" || url.pathname === "/api/bookmarks/") {
      return handleBookmarks(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
