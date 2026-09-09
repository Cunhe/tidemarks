# 潮迹 TideMarks

部署在 **Cloudflare Pages** 上的个人书签起始页。

仓库：https://github.com/Cunhe/tidemarks

海风玻璃拟态界面，本地优先存储，可选 Cloudflare KV 跨设备同步。零构建，推送即上线。

## 功能

- 分类卡片书签、实时时钟、本地搜索
- 输入框按 Enter：唯一匹配则直达，否则 Google 搜索
- 快捷键 `/` 聚焦搜索
- 亮 / 暗主题
- 编辑模式：增删改分类与书签
- JSON 导入导出、一键恢复默认
- 可选云拉取 / 云推送（Pages Functions + KV）

## 目录

```
tidemarks/
├── index.html
├── favicon.svg
├── _headers
├── wrangler.toml
├── data/bookmarks.json      # 默认书签，可直接改
├── assets/css/style.css
├── assets/js/app.js
└── functions/api/bookmarks.js   # 可选云同步
```

## 最快部署（推荐）

### 方式 A：连接 GitHub（可持续更新）

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
2. 选中仓库 `Cunhe/tidemarks`，构建设置保持为空：
   - Framework preset: `None`
   - Build command: （留空）
   - Build output directory: `/`
3. **Save and Deploy**。
4. 得到 `https://<项目名>.pages.dev`。可在 **Custom domains** 绑自己的域名。

### 方式 B：直接上传

1. 登录 Cloudflare → Pages → **Upload assets**。
2. 把仓库根目录文件打包上传（保持 `index.html` 在根目录）。
3. 部署完成后即可访问。

## 本地预览

```bash
python3 -m http.server 8788
```

打开 http://127.0.0.1:8788

若要连 Functions / KV：

```bash
npx wrangler pages dev .
```

## 自定义书签

编辑 `data/bookmarks.json`。页面会先读 **localStorage**。若浏览器里已有旧数据，改仓库 JSON 不会自动覆盖。需要覆盖时点页面上的「重置」。

把浏览器设为打开新标签就进这个 Pages 域名，即可当起始页使用。

## 可选：Cloudflare KV 云同步

1. Dashboard → **Workers & Pages** → **KV** → 新建 namespace，例如 `tidemarks-data`。
2. Pages 项目 → **Settings** → **Functions** → **KV namespace bindings**：
   - Variable name: `BOOKMARKS`
   - KV namespace: 刚建的那个
3. 环境变量增加 `ADMIN_TOKEN`（自己的写入口令，不要提交进 Git）。
4. 重新部署。页面点 **云推送** / **云拉取**。

## 许可

MIT
