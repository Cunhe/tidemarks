# 潮迹 TideMarks

部署在 **Cloudflare Workers（静态资源）** 上的个人书签起始页，也兼容 Pages。

仓库：https://github.com/Cunhe/tidemarks

海风玻璃拟态界面，本地优先存储，可选 Cloudflare KV 跨设备同步。零构建，`npx wrangler deploy` 即可上线。

## 功能

- 分类卡片书签、实时时钟、本地搜索
- 输入框按 Enter：唯一匹配则直达，否则 Google 搜索
- 快捷键 `/` 聚焦搜索
- 亮 / 暗主题
- 编辑模式：增删改分类与书签
- JSON 导入导出、一键恢复默认
- 可选云拉取 / 云推送（Worker `/api/bookmarks` + KV）

## 最快部署（Workers Git）

控制台若执行 `npx wrangler deploy`：

1. Cloudflare 项目 Settings：Deploy command = `npx wrangler deploy`，Build command 留空。
2. `wrangler.toml` 的 `name` 必须和 Cloudflare 项目名一致（默认 `tidemarks`）。
3. 重试部署或再 push 一次 `main`。

成功后访问 `https://tidemarks.<账号>.workers.dev`。

## 本地预览

```bash
python3 -m http.server 8788
# 或
npx wrangler dev
```

## 可选：KV 云同步

Worker Settings → Bindings 添加 KV，变量名 `BOOKMARKS`；Variables 添加 `ADMIN_TOKEN`。

## 许可

MIT
