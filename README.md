# 潮迹 TideMarks

部署在 **Cloudflare Workers** 上的个人书签起始页。本地优先，KV 可选。

- 演示站点：https://tidemarks.aged-union-0107.workers.dev
- 仓库：https://github.com/Cunhe/tidemarks
- 站点：https://000666.best

海风玻璃拟态界面。零构建，`npx wrangler deploy` 即可上线。

## 功能

- 分类卡片书签、实时时钟、本地搜索
- 输入框按 Enter：唯一匹配则直达，否则 Google 搜索
- 快捷键 `/` 聚焦搜索
- 亮 / 暗主题
- 编辑模式：增删改分类与书签
- JSON 导入导出、一键恢复默认
- 可选云拉取 / 云推送（Worker `/api/bookmarks` + KV）

## 演示

线上预览：

**https://tidemarks.aged-union-0107.workers.dev**

页脚文案：`TideMarks · Cloudflare Workers · 000666.best`

## 书签模板 `data/bookmarks.json`

默认书签、导出文件、导入文件，都用同一套 JSON 结构。仓库里没有 `bookmark.js`，个性化请改 `data/bookmarks.json`，或在页面上导出 / 导入。

导入时必须符合下面模板，缺少 `categories` 会被拒绝。

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

字段说明：

| 字段 | 位置 | 必填 | 说明 |
|---|---|---|---|
| `version` | 根 | 建议 | 模板版本，目前为 `1` |
| `title` | 根 | 否 | 页眉标题 |
| `subtitle` | 根 | 否 | 页眉副标题 |
| `updatedAt` | 根 | 否 | ISO 时间，保存时会自动刷新 |
| `categories` | 根 | 是 | 分类数组，导入时必须有 |
| `categories[].id` | 分类 | 是 | 稳定 id，例如 `create` |
| `categories[].name` | 分类 | 是 | 分类名 |
| `categories[].icon` | 分类 | 否 | emoji 或短符号 |
| `categories[].links` | 分类 | 是 | 该书签列表 |
| `links[].id` | 书签 | 是 | 稳定 id |
| `links[].name` | 书签 | 是 | 显示名 |
| `links[].url` | 书签 | 是 | 完整网址，建议带 `https://` |
| `links[].desc` | 书签 | 否 | 一行备注 |

自行个性化两种方式：

1. 直接改仓库里的 `data/bookmarks.json`，再部署。这是站点默认书签。
2. 打开页面 → 导出 JSON → 按模板改 → 再导入。导入文件也必须是上面这套结构。

最小可导入示例：

```json
{
  "version": 1,
  "title": "我的起始页",
  "subtitle": "自定义书签",
  "categories": [
    {
      "id": "daily",
      "name": "常用",
      "icon": "✦",
      "links": [
        {
          "id": "mail",
          "name": "邮箱",
          "url": "https://mail.google.com",
          "desc": "收信"
        }
      ]
    }
  ]
}
```

注意：页面会先读浏览器 localStorage。若本机已有旧数据，改仓库 JSON 不会自动覆盖。需要覆盖时点页面上的「重置」。

## 最快部署（Workers Git）

控制台若执行 `npx wrangler deploy`：

1. Cloudflare 项目 Settings：Deploy command = `npx wrangler deploy`，Build command 留空。
2. `wrangler.toml` 的 `name` 必须和 Cloudflare 项目名一致（默认 `tidemarks`）。
3. 重试部署或再 push 一次 `main`。

成功后访问 `https://tidemarks.<账号>.workers.dev`。本仓库演示站：

https://tidemarks.aged-union-0107.workers.dev

## 本地预览

```bash
python3 -m http.server 8788
# 或
npx wrangler dev
```

## 可选：KV 云同步

Worker Settings → Bindings 添加 KV，变量名必须是 `BOOKMARKS`；Variables 添加 `ADMIN_TOKEN`。保存后重新部署一次。

- 云拉取：读 KV 里的同一份 JSON 模板
- 云推送：把当前浏览器里的书签按同一模板写入 KV

## 许可

MIT
