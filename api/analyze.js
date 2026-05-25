const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const QWEN_MODEL = process.env.QWEN_MODEL || "qwen-turbo";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const PROVIDERS = [
  {
    name: "DeepSeek",
    keyEnv: "DEEPSEEK_API_KEY",
    model: DEEPSEEK_MODEL,
    endpoint: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/chat/completions",
  },
  {
    name: "Qwen",
    keyEnv: "DASHSCOPE_API_KEY",
    legacyKeyEnv: "QWEN_API_KEY",
    model: QWEN_MODEL,
    endpoint: process.env.QWEN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  },
];

function mockResponse(product) {
  const name = product?.name || "当前产品";
  const positives = product?.comment_positive || ["口碑稳定", "信息完整", "适合日常决策"];
  const negatives = product?.comment_negative || ["需结合肤质", "需核对价格", "需关注成分"];

  return {
    mode: "mock",
    provider: "Mock",
    title: `${name} 智能购买建议`,
    summary: `${name} 的综合建议已生成。推荐关注 ${positives.slice(0, 2).join("、")}；下单前建议确认 ${negatives.slice(0, 2).join("、")}。`,
    bullets: [
      `好评关键词：${positives.join("、")}`,
      `风险关键词：${negatives.join("、")}`,
      "建议结合肤质、使用场景和当天价格再做最终选择。",
    ],
  };
}

async function parseBody(req) {
  if (req.body) return typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function buildPrompt(product) {
  return [
    "你是 EcoChic 的美妆消费决策助手。",
    "请用中文输出 JSON，字段为 title、summary、bullets。",
    "summary 限 100 字以内，bullets 为 3 条短句。",
    `产品数据：${JSON.stringify(product)}`,
  ].join("\n");
}

async function callOpenAICompatible(provider, product) {
  const key = process.env[provider.keyEnv] || (provider.legacyKeyEnv ? process.env[provider.legacyKeyEnv] : "");
  if (!key) return null;

  const response = await fetch(provider.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: provider.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "你只输出合法 JSON，不要输出 Markdown。" },
        { role: "user", content: buildPrompt(product) },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) throw new Error(`${provider.name} API returned ${response.status}`);
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(text);

  return {
    mode: "live",
    provider: provider.name,
    title: parsed.title || `${product.name || "产品"} AI 摘要`,
    summary: parsed.summary || `${provider.name} 已返回分析结果。`,
    bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
  };
}

async function callGemini(payload) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const product = payload.product || {};

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildPrompt(product) }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });

  if (!response.ok) throw new Error(`Gemini API returned ${response.status}`);
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const parsed = JSON.parse(text);

  return {
    mode: "live",
    provider: "Gemini",
    title: parsed.title || `${product.name || "产品"} AI 摘要`,
    summary: parsed.summary || "Gemini 已返回分析结果。",
    bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
  };
}

async function analyzeWithAvailableProvider(payload) {
  const product = payload.product || {};
  const errors = [];

  for (const provider of PROVIDERS) {
    try {
      const result = await callOpenAICompatible(provider, product);
      if (result) return result;
    } catch (error) {
      errors.push(`${provider.name}: ${error.message}`);
    }
  }

  try {
    const result = await callGemini(payload);
    if (result) return result;
  } catch (error) {
    errors.push(`Gemini: ${error.message}`);
  }

  return {
    ...mockResponse(product),
    reason: errors.length > 0 ? errors.join("; ") : "No API key configured",
  };
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const payload = await parseBody(req);
    const result = await analyzeWithAvailableProvider(payload);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(result);
  } catch (error) {
    res.status(200).json({
      ...mockResponse(),
      reason: error.message,
    });
  }
}

export { analyzeWithAvailableProvider, callGemini, callOpenAICompatible, mockResponse };
