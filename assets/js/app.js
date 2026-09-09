const STORAGE_KEY = "tidemarks.v1";
const THEME_KEY = "tidemarks.theme";
const STATE = {
  data: null,
  editing: false,
  query: "",
  modal: null,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function hostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function favicon(url) {
  const host = hostname(url);
  return host ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64` : "";
}

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1800);
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocal(data) {
  data.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function loadSeed() {
  const res = await fetch("./data/bookmarks.json", { cache: "no-store" });
  if (!res.ok) throw new Error("无法读取默认书签");
  return res.json();
}

async function boot() {
  const theme = localStorage.getItem(THEME_KEY) || "dark";
  document.documentElement.dataset.theme = theme;

  STATE.data = loadLocal() || (await loadSeed());
  render();
  tick();
  setInterval(tick, 1000);
  bind();
}

function tick() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  $("#clock").textContent = `${hh}:${mm}`;
  $("#date").textContent = now.toLocaleDateString("zh-CN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function filteredCategories() {
  const q = STATE.query.trim().toLowerCase();
  if (!q) return STATE.data.categories;
  return STATE.data.categories
    .map((cat) => ({
      ...cat,
      links: cat.links.filter((link) =>
        [link.name, link.url, link.desc, cat.name].join(" ").toLowerCase().includes(q)
      ),
    }))
    .filter((cat) => cat.links.length);
}

function render() {
  $("#title").textContent = STATE.data.title || "潮迹 TideMarks";
  $("#subtitle").textContent = STATE.data.subtitle || "海风起处，书签成岸";
  document.body.classList.toggle("editing", STATE.editing);
  $("#editBtn").textContent = STATE.editing ? "完成" : "编辑";

  const root = $("#cats");
  const cats = filteredCategories();
  if (!cats.length) {
    root.innerHTML = `<div class="empty">没有匹配的书签。试试别的词，或按 Enter 用搜索引擎查找。</div>`;
    return;
  }

  root.innerHTML = cats
    .map(
      (cat) => `
      <section class="cat" data-cat="${cat.id}">
        <div class="cat-head">
          <div class="cat-title"><span>${cat.icon || "•"}</span>${escapeHtml(cat.name)}</div>
          <div class="count">${cat.links.length} 个站点
            <span class="edit-tools">
              <button class="btn tiny" data-act="add-link" data-cat="${cat.id}">+ 书签</button>
              <button class="btn tiny" data-act="rename-cat" data-cat="${cat.id}">改名</button>
              <button class="btn tiny" data-act="del-cat" data-cat="${cat.id}">删分类</button>
            </span>
          </div>
        </div>
        <div class="grid">
          ${cat.links
            .map((link) => {
              const icon = favicon(link.url);
              const initial = escapeHtml(link.name).slice(0, 1);
              return `
              <a class="card" href="${escapeAttr(link.url)}" target="_blank" rel="noopener" data-id="${link.id}">
                ${icon ? `<img src="${icon}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">` : ""}
                <div class="fallback" ${icon ? 'style="display:none"' : ""}>${initial}</div>
                <div class="meta">
                  <div class="name">${escapeHtml(link.name)}</div>
                  <div class="desc">${escapeHtml(link.desc || hostname(link.url))}</div>
                </div>
              </a>`;
            })
            .join("")}
        </div>
      </section>`
    )
    .join("");

  if (STATE.editing) {
    $$(".card").forEach((card) => {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        const id = card.dataset.id;
        const found = findLink(id);
        if (found) openLinkModal(found.cat.id, found.link);
      });
    });
  }
}

function findLink(id) {
  for (const cat of STATE.data.categories) {
    const link = cat.links.find((l) => l.id === id);
    if (link) return { cat, link };
  }
  return null;
}

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&")
    .replaceAll("<", "<")
    .replaceAll(">", ">")
    .replaceAll('"', """);
}

function escapeAttr(s = "") {
  return escapeHtml(s);
}

function bind() {
  $("#q").addEventListener("input", (e) => {
    STATE.query = e.target.value;
    render();
  });
  $("#q").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = STATE.query.trim();
      const visible = filteredCategories().flatMap((c) => c.links);
      if (visible.length === 1) {
        window.open(visible[0].url, "_blank", "noopener");
        return;
      }
      if (q) window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank", "noopener");
    }
  });

  $("#themeBtn").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
  });

  $("#editBtn").addEventListener("click", () => {
    STATE.editing = !STATE.editing;
    render();
  });

  $("#addCatBtn").addEventListener("click", () => {
    const name = prompt("新分类名称", "未命名");
    if (!name) return;
    STATE.data.categories.push({ id: uid("cat"), name, icon: "✦", links: [] });
    persist();
    render();
  });

  $("#exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(STATE.data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tidemarks-bookmarks.json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("已导出 JSON");
  });

  $("#importBtn").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      if (!json.categories) throw new Error("格式不对");
      STATE.data = json;
      persist();
      render();
      toast("导入成功");
    } catch {
      toast("导入失败，请检查 JSON");
    }
    e.target.value = "";
  });

  $("#resetBtn").addEventListener("click", async () => {
    if (!confirm("恢复为仓库默认书签？当前本地修改会覆盖。")) return;
    STATE.data = await loadSeed();
    persist();
    render();
    toast("已恢复默认");
  });

  $("#cloudPull").addEventListener("click", pullCloud);
  $("#cloudPush").addEventListener("click", pushCloud);

  $("#cats").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    const catId = btn.dataset.cat;
    const cat = STATE.data.categories.find((c) => c.id === catId);
    if (!cat) return;
    if (act === "add-link") openLinkModal(catId);
    if (act === "rename-cat") {
      const name = prompt("分类名称", cat.name);
      if (!name) return;
      cat.name = name;
      persist();
      render();
    }
    if (act === "del-cat") {
      if (!confirm(`删除分类「${cat.name}」？`)) return;
      STATE.data.categories = STATE.data.categories.filter((c) => c.id !== catId);
      persist();
      render();
    }
  });

  $("#modalCancel").addEventListener("click", closeModal);
  $("#modalSave").addEventListener("click", saveModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== $("#q")) {
      e.preventDefault();
      $("#q").focus();
    }
    if (e.key === "Escape") closeModal();
  });
}

function persist() {
  saveLocal(STATE.data);
}

function openLinkModal(catId, link) {
  STATE.modal = { catId, linkId: link?.id || null };
  $("#modalTitle").textContent = link ? "编辑书签" : "新增书签";
  $("#fName").value = link?.name || "";
  $("#fUrl").value = link?.url || "";
  $("#fDesc").value = link?.desc || "";
  $("#modalBg").classList.add("show");
  $("#fName").focus();
}

function closeModal() {
  $("#modalBg").classList.remove("show");
  STATE.modal = null;
}

function saveModal() {
  const name = $("#fName").value.trim();
  let url = $("#fUrl").value.trim();
  const desc = $("#fDesc").value.trim();
  if (!name || !url) return toast("名称和网址必填");
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  const cat = STATE.data.categories.find((c) => c.id === STATE.modal.catId);
  if (!cat) return;
  if (STATE.modal.linkId) {
    const link = cat.links.find((l) => l.id === STATE.modal.linkId);
    Object.assign(link, { name, url, desc });
  } else {
    cat.links.push({ id: uid("link"), name, url, desc });
  }
  persist();
  closeModal();
  render();
}

async function pullCloud() {
  try {
    const res = await fetch("/api/bookmarks");
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    if (!json.categories) throw new Error("云端数据为空或格式不对");
    STATE.data = json;
    persist();
    render();
    toast("已从 Cloudflare KV 拉取");
  } catch (err) {
    toast("云端未配置或拉取失败");
    console.warn(err);
  }
}

async function pushCloud() {
  const token = prompt("输入 ADMIN_TOKEN（Cloudflare 环境变量）");
  if (!token) return;
  try {
    const res = await fetch("/api/bookmarks", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(STATE.data),
    });
    if (!res.ok) throw new Error(await res.text());
    toast("已推送到 Cloudflare KV");
  } catch (err) {
    toast("推送失败，检查 Functions / KV / Token");
    console.warn(err);
  }
}

boot().catch((err) => {
  console.error(err);
  $("#cats").innerHTML = `<div class="empty">启动失败：${escapeHtml(err.message)}</div>`;
});
