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
  const token = header.replace(/^Bearer\s+/i, "").trim();
  return Boolean(env.ADMIN_TOKEN) && token === String(env.ADMIN_TOKEN);
}

async function handleHealth(env) {
  let hasData = false;
  if (env.BOOKMARKS) {
    hasData = Boolean(await env.BOOKMARKS.get(KEY));
  }
  return json({
    ok: true,
    kv: Boolean(env.BOOKMARKS),
    token: Boolean(env.ADMIN_TOKEN),
    hasData,
  });
}

async function handleBookmarks(request, env) {
  if (!env.BOOKMARKS) {
    return json({ error: "未绑定 KV。Worker Settings → Bindings 添加 KV，变量名必须是 BOOKMARKS" }, 501);
  }

  if (request.method === "GET") {
    const raw = await env.BOOKMARKS.get(KEY);
    if (!raw) return json({ error: "云端还是空的，请先点「云推送」", empty: true }, 404);
    return new Response(raw, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  if (request.method === "PUT") {
    if (!env.ADMIN_TOKEN) {
      return json({ error: "未配置 ADMIN_TOKEN。Worker Settings → Variables 增加 ADMIN_TOKEN 后再推送" }, 501);
    }
    if (!authorized(request, env)) {
      return json({ error: "ADMIN_TOKEN 不正确" }, 401);
    }
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
    const path = url.pathname.replace(/\/$/, "") || "/";

    if (path === "/api/health") return handleHealth(env);
    if (path === "/api/bookmarks") return handleBookmarks(request, env);

    if (path.startsWith("/api/")) {
      return json({ error: `没有这个接口：${path}` }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};
