# EcoChic Demo

EcoChic 是一个 AI 驱动的美妆消费决策 demo，覆盖产品库、评论摘要、成分风险、ESG 价值观和版本对比。

## 运行方式


```bash
python3 -m http.server 8000
```

然后打开 `http://localhost:8000`。此模式没有后端，AI 会自动使用 mock 数据。

本地 AI API 演示：

```bash
cp .env.example .env
```

在 `.env` 中填入 `DEEPSEEK_API_KEY`、`DASHSCOPE_API_KEY`（或兼容旧名 `QWEN_API_KEY`）或 `GEMINI_API_KEY` 之一，然后运行：

```bash
npm start
```

打开 `http://localhost:4173`。不要把 `.env` 或 API key 提交到前端代码。

## 移动端部署演示

GitHub Pages 链接适合手机现场展示静态版本：

```text
https://annie-025.github.io/Ecochic/
```

手机演示推荐路径：

```text
#list → 搜索「防晒」或「烟酰胺」
#versions?compare=粉底液
#versions?compare=防晒
#detail?id=13
```

如果需要手机端演示真实 API，请部署到 Vercel 或 Netlify 这类支持 serverless 函数的平台。GitHub Pages 只能托管静态文件，不能安全保存 API key，因此线上 Pages 会自动 mock。

### Vercel 真实 API 部署

1. 将本仓库导入 Vercel。
2. Framework 选择 Other，Build Command 留空，Output Directory 留空。
3. 在 Project Settings → Environment Variables 添加：
   - `DEEPSEEK_API_KEY`
   - 可选：`DEEPSEEK_MODEL=deepseek-chat`
   - 可选备用：`DASHSCOPE_API_KEY` 或 `GEMINI_API_KEY`
4. 重新部署 Production。
5. 手机打开 Vercel 生成的域名，进入产品详情页点击 AI 演示。

`vercel.json` 已将 `/api/analyze` 指向 `api/analyze.js`，前端不会接触任何 API key。

## API 说明

前端只调用 `./api/analyze`，不会保存任何 API key。真实模型调用在 `api/analyze.js` 中完成，可直接用于 Vercel/Netlify 等 serverless 环境。

模型优先级：

1. DeepSeek：读取 `DEEPSEEK_API_KEY`
2. 通义千问/Qwen：读取 `DASHSCOPE_API_KEY`，也兼容 `QWEN_API_KEY`
3. Gemini：读取 `GEMINI_API_KEY`
4. Mock：没有 key 或接口失败时自动回退

GitHub Pages 没有后端函数，因此线上静态页会自动 mock；现场如需展示真实 AI，使用本地 `npm start` 或部署到支持 serverless 的平台并配置环境变量。

### DeepSeek 真实 API 演示

1. 在 DeepSeek 控制台创建 API key。
2. 复制 `.env.example` 为 `.env`，填入 `DEEPSEEK_API_KEY`。
3. 运行 `npm start`，打开 `http://localhost:4173`。
4. 点击产品详情页的 AI 演示按钮；如果 key 可用，弹窗会显示真实模型 provider，否则自动 mock。

通义千问/Qwen 可填写 `DASHSCOPE_API_KEY`；Gemini 可填写 `GEMINI_API_KEY`。不要把 `.env` 上传到 GitHub。

## 路演演示路径

1. 首页：打开页面，介绍「比价、评论、ESG、成分」四个能力。
2. 产品库：进入 `#list`，演示搜索「烟酰胺」「防晒」「雅诗兰黛」，再切换分类和 ESG 排序。
3. 产品详情：进入任一产品，展示三平台比价、AI 评论总结、ESG 四维说明、成分风险提示。
4. AI 模块：点击右上角 AI 状态或详情页 AI 演示，展示无 key 自动 mock、有 key 走 DeepSeek/Qwen/Gemini 的设计。
5. 价值观测试：进入 `#test`，完成问答后回到详情页，展示用户关注维度高亮。
6. 版本对比：进入 `#versions`，展示色号/版本选择和跨品牌比较；重点演示 `#versions?compare=粉底液`、`#versions?compare=防晒`、`#versions?compare=眼霜`、`#versions?compare=唇釉`。
