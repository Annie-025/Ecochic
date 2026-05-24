import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const text = (file) => readFile(new URL(file, import.meta.url), "utf8");

const products = JSON.parse(await text("./products.json"));
const script = await text("./script.js");
const index = await text("./index.html");
const api = await text("./api/analyze.js");
const envExample = await text("./.env.example");
const versions = JSON.parse(await text("./versions.json"));

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
assert.match(index, /ai-client\.js/, "AI client module must be loaded before app script");
assert.match(api, /DEEPSEEK_API_KEY/, "AI backend should support DeepSeek");
assert.match(api, /DASHSCOPE_API_KEY/, "AI backend should support DashScope/Qwen");
assert.match(api, /GEMINI_API_KEY/, "AI backend should support Gemini");
assert.match(envExample, /DEEPSEEK_API_KEY=/, ".env.example should document DeepSeek key");
assert.match(envExample, /DASHSCOPE_API_KEY=/, ".env.example should document DashScope key");
assert.doesNotMatch(index + script, /(?:DEEPSEEK|DASHSCOPE|QWEN|GEMINI)_API_KEY\s*=/, "front-end must not contain API key assignments");

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
  assert.match(product.image || "", /^\.\/pics\/\d+\.svg$/, `new product ${id} should use local SVG visual`);
}

console.log("Smoke tests passed");
