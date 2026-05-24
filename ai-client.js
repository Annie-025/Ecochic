(function () {
  const DEFAULT_ENDPOINT = "./api/analyze";

  function fallbackAnalysis(payload = {}) {
    const productName = payload.product?.name || "当前产品";
    const positives = payload.product?.comment_positive || ["口碑稳定", "信息透明", "适合日常决策"];
    const negatives = payload.product?.comment_negative || ["需结合肤质", "价格波动", "建议核对官方渠道"];

    return {
      mode: "mock",
      provider: "Mock",
      title: `${productName} AI 决策摘要`,
      summary: `当前为本地 mock 模式：${productName} 的综合口碑较清晰，可重点关注 ${positives.slice(0, 2).join("、")}；购买前建议复核 ${negatives.slice(0, 2).join("、")}。`,
      bullets: [
        `好评信号：${positives.join("、")}`,
        `风险提示：${negatives.join("、")}`,
        "真实 Gemini 调用需要通过本地后端或 serverless 函数注入 API key。",
      ],
    };
  }

  async function analyze(payload = {}, options = {}) {
    const endpoint = options.endpoint || window.ECOCHIC_AI_ENDPOINT || DEFAULT_ENDPOINT;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`AI endpoint returned ${response.status}`);
      const data = await response.json();
      return data?.summary ? data : fallbackAnalysis(payload);
    } catch (error) {
      return {
        ...fallbackAnalysis(payload),
        reason: error.message,
      };
    }
  }

  window.EcoChicAI = { analyze, fallbackAnalysis };
})();
