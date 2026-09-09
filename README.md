# TideMarks — Cloudflare Workers 个人书签起始页

演示：[tidemarks.aged-union-0107.workers.dev](https://tidemarks.aged-union-0107.workers.dev)　·　仓库：[Cunhe/tidemarks](https://github.com/Cunhe/tidemarks)　·　[000666.best](https://000666.best)

> TideMarks 是一个轻量、无厂商绑定的个人云书签起始页。
>
> 它不是一个我要去运营的服务。
> 它只是一个我自己想用起来舒服的东西。
>
> 它不要求用户注册账号，也不依赖特定浏览器或设备。
> 书签默认保存在本地，需要时通过 Cloudflare KV 在不同设备之间同步。
>
> 没有后台，没有管理负担。
> 打开网页，就能使用。

本地优先。Cloudflare Workers 承载页面。KV 只在你需要跨设备时出现。

## 它是什么

- 分类卡片、实时时钟、本地搜索
- 输入框按 Enter：唯一匹配则直达，否则 Google 搜索
- 快捷键 `/` 聚焦搜索
- 亮 / 暗主题
- 编辑模式：增删改分类与书签
- JSON 导入导出、一键恢复默认
- 可选云拉取 / 云推送（Worker `/api/bookmarks` + KV）

零构建。`npx wrangler deploy` 即可上线。

## 书签模板 `data/bookmarks.json`

默认书签、导出、导入、KV 同步，都用同一套 JSON。没有 `bookmark.js`。个性化请改这个文件，或在页面上导出后再导入。导入必须带 `categories`。

```json
{
  "version": 1,
  "title": "潮迹 TideMarks",
  "subtitle": "海风起处，书签成岸",
  "updatedAt": "2026-09-09T00:00:00.000Z",
  "categories": [
    {
      "id": "create",
      "name": "创作工坊",
      "icon": "✒️",
      "links": [
        {
          "id": "suno",
          "name": "Suno",
          "url": "https://suno.com",
          "desc": "AI 作曲与小样"
        }
      ]
    }
  ]
}
```

| 字段 | 位置 | 必填 | 说明 |
|---|---|---|---|
| `version` | 根 | 建议 | 模板版本，目前为 `1` |
| `title` | 根 | 否 | 页眉标题 |
| `subtitle` | 根 | 否 | 页眉副标题 |
| `updatedAt` | 根 | 否 | ISO 时间，保存时会自动刷新 |
| `categories` | 根 | 是 | 分类数组，导入时必须有 |
| `categories[].id` | 分类 | 是 | 稳定 id |
| `categories[].name` | 分类 | 是 | 分类名 |
| `categories[].icon` | 分类 | 否 | emoji 或短符号 |
| `categories[].links` | 分类 | 是 | 该书签列表 |
| `links[].id` | 书签 | 是 | 稳定 id |
| `links[].name` | 书签 | 是 | 显示名 |
| `links[].url` | 书签 | 是 | 完整网址，建议带 `https://` |
| `links[].desc` | 书签 | 否 | 一行备注 |

两种改法：

1. 直接改 `data/bookmarks.json`，再部署。
2. 页面导出 → 按模板改 → 再导入。

本机若已有 localStorage 数据，改仓库文件不会自动覆盖。需要覆盖时点「重置」。

## 部署到 Cloudflare Workers

1. Settings → Deploy command = `npx wrangler deploy`，Build command 留空。
2. `wrangler.toml` 的 `name` 必须和 Worker 项目名一致（默认 `tidemarks`）。
3. 绑定 Git 后 push `main`，或点 Retry deployment。

成功后访问 `https://tidemarks.<账号>.workers.dev`。

演示站：https://tidemarks.aged-union-0107.workers.dev

本地预览：

```bash
python3 -m http.server 8788
# 或
npx wrangler dev
```

## 可选：KV 云同步

Worker Settings → Bindings 添加 KV，变量名必须是 `BOOKMARKS`。  
Variables 添加 `ADMIN_TOKEN`。保存后重新部署一次。

未绑定 KV 时，页面仍可单独使用。

## 许可

MIT
