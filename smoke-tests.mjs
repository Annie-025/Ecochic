import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const text = (file) => readFile(new URL(file, import.meta.url), "utf8");

const products = JSON.parse(await text("./products.json"));
const script = await text("./script.js");
const index = await text("./index.html");
const api = await text("./api/analyze.js");
const envExample = await text("./.env.example");
const versions = JSON.parse(await text("./versions.json"));
const css = await text("./style.css");
const readme = await text("./README.md");
const packageJson = JSON.parse(await text("./package.json"));
const vercel = JSON.parse(await text("./vercel.json"));

assert.equal(Array.isArray(products), true, "products.json must be an array");
assert.equal(products.length >= 16, true, "demo should contain at least 16 products after SKU expansion");

for (const product of products) {
  for (const field of [
    "comment_summary",
    "comment_positive",
    "comment_negative",
    "ingredients",
    "risk_ingredients",
    "esg",
  ]) {
    assert.ok(product[field] !== undefined, `${product.name} missing ${field}`);
  }
  assert.equal(Array.isArray(product.comment_positive), true, `${product.name} comment_positive must be an array`);
  assert.equal(Array.isArray(product.comment_negative), true, `${product.name} comment_negative must be an array`);
  assert.equal(Array.isArray(product.ingredients), true, `${product.name} ingredients must be an array`);
  assert.equal(Array.isArray(product.risk_ingredients), true, `${product.name} risk_ingredients must be an array`);

  for (const key of ["score", "gender", "animal", "environment", "labor"]) {
    assert.ok(product.esg?.[key] !== undefined, `${product.name} esg missing ${key}`);
  }
}

assert.equal(
  (script.match(/<div class="section-label">✦ 全部产品<\/div>/g) || []).length,
  1,
  "product list section header should be rendered only once",
);

assert.match(index, /mobile-menu-toggle/, "mobile navigation toggle must exist");
assert.match(index, /mobile-bottom-nav/, "mobile bottom navigation must exist");
assert.match(index, /theme-color/, "mobile browser theme color must be configured");
assert.match(index, /ai-client\.js/, "AI client module must be loaded before app script");
assert.match(css, /safe-area-inset-bottom/, "mobile layout should respect safe area");
assert.match(css, /@media \(max-width: 430px\)/, "small phone breakpoint should exist");
assert.match(css, /\.mobile-bottom-nav/, "mobile bottom nav styles should exist");
assert.match(api, /DEEPSEEK_API_KEY/, "AI backend should support DeepSeek");
assert.match(api, /DASHSCOPE_API_KEY/, "AI backend should support DashScope/Qwen");
assert.match(api, /GEMINI_API_KEY/, "AI backend should support Gemini");
assert.match(envExample, /DEEPSEEK_API_KEY=/, ".env.example should document DeepSeek key");
assert.match(envExample, /DASHSCOPE_API_KEY=/, ".env.example should document DashScope key");
assert.doesNotMatch(index + script, /(?:DEEPSEEK|DASHSCOPE|QWEN|GEMINI)_API_KEY\s*=/, "front-end must not contain API key assignments");
assert.doesNotMatch(script, /演示模式|当前模式|调用示例|fetch\("\.\/api\/analyze"|本地 mock 回退|API key/, "user-facing UI should not expose demo/API implementation wording");
assert.doesNotMatch(index + script, /AI 智能分析 · 演示|运行演示/, "home page should feel like an app, not a demo explainer");
assert.match(script, /今日智能推荐/, "home should include app-style smart recommendations");
assert.match(script, /快速决策/, "home should include quick decision cards");
assert.match(script, /热门对比/, "home should include comparison shortcuts");
assert.match(script, /version-detail-hero/, "version detail should include product visual hero");
assert.match(script, /version-swatch-card/, "version detail should render swatch cards");
assert.match(script, /swatchForVersion/, "version detail should map versions to swatch colors");
assert.match(script, /icon-price/, "home feature icons should use refined CSS icon markup");
assert.doesNotMatch(script, /feature-icon sky">¥|feature-icon ai">AI|feature-icon mint">ESG|feature-icon blush">INCI/, "home icons should not be bare text labels");
assert.equal(vercel.rewrites?.[0]?.source, "/api/analyze", "Vercel should route API requests");
assert.equal(vercel.rewrites?.[0]?.destination, "/api/analyze.js", "Vercel should route to serverless function");
assert.equal(packageJson.scripts.dev, "node local-server.js", "package should expose dev script for API demo");
assert.match(readme, /Vercel/, "README should include Vercel deployment guidance");
assert.match(readme, /DEEPSEEK_API_KEY/, "README should explain DeepSeek key setup");

for (const versionProduct of versions) {
  assert.ok(versionProduct.comparison, `${versionProduct.product_name} missing comparison data`);
  assert.ok(versionProduct.comparison.price_band, `${versionProduct.product_name} missing comparison price_band`);
  assert.equal(
    Array.isArray(versionProduct.comparison.sources) && versionProduct.comparison.sources.length > 0,
    true,
    `${versionProduct.product_name} missing comparison sources`,
  );
  for (const source of versionProduct.comparison.sources) {
    assert.match(source.url || "", /^https?:\/\//, `${versionProduct.product_name} source URL must be absolute`);
  }
}

for (const id of [11, 12, 13, 14, 15, 16]) {
  const product = products.find((item) => item.id === id);
  assert.ok(product, `new product ${id} should exist`);
  assert.match(product.image || "", /^\.\/pics\/\d+\.(jpe?g|png)$/i, `new product ${id} should use local product photo`);
}

console.log("Smoke tests passed");
