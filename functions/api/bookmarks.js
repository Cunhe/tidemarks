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

function requireAdmin(request, env) {
  if (!env.ADMIN_TOKEN) {
    return json({ error: "未配置环境变量 ADMIN_TOKEN" }, 501);
  }
  if (!authorized(request, env)) {
    return json({ error: "ADMIN_TOKEN 不正确" }, 401);
  }
  return null;
}

export async function onRequestGet({ request, env }) {
  if (!env.BOOKMARKS) {
    return json({ error: "未绑定 KV" }, 501);
  }
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  const raw = await env.BOOKMARKS.get(KEY);
  if (!raw) return json({ error: "云端还没有数据，先点「云推送」" }, 404);
  return new Response(raw, {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function onRequestPut({ request, env }) {
  if (!env.BOOKMARKS) {
    return json({ error: "未绑定 KV" }, 501);
  }
  const denied = requireAdmin(request, env);
  if (denied) return denied;
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
