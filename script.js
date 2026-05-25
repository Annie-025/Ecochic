/**
 * EcoChic — AI 美妆消费决策助手
 * 重构版 · 参考欧莱雅官网风格 · 马卡龙绿蓝主题
 */

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');

  /* ─── Storage Keys ─── */
  const SK = {
    values:  'ec_values_v2',
    history: 'ec_history_v2',
    bottles: 'ec_bottles_v2',
  };

  /* ─── State ─── */
  let products  = [];
  let sortMode  = 'default';
  let activeFilter = 'all';
  let searchQuery = '';

  /* ─── Test questions ─── */
  const QUESTIONS = [
    { q: '购买美妆时，您是否优先考虑品牌的环保承诺？',
      opts: ['非常在意，环保是首选', '有所考量，但不是第一因素', '偶尔关注', '不太在意'],
      w: [100, 65, 30, 0], dim: 'environment' },
    { q: '品牌是否进行动物实验，会影响您的购买决策吗？',
      opts: ['一定不买进行动物实验的品牌', '希望选择不做动物实验的', '无所谓', '从未考虑过'],
      w: [100, 65, 25, 0], dim: 'animal' },
    { q: '您是否关注品牌在性别平等方面的表现？',
      opts: ['非常关注，会主动了解', '有一定关注', '偶尔了解', '不影响决策'],
      w: [100, 65, 30, 0], dim: 'equality' },
    { q: '成分安全对您来说有多重要？',
      opts: ['最重要的因素，一定查成分', '很重要，通常会看', '一般，偶尔查', '不太会主动查'],
      w: [100, 70, 35, 0], dim: 'ingredient' },
    { q: '您对品牌供应链透明度的关注度？',
      opts: ['非常关注供应链公平', '有一定关注', '了解不多', '不影响选择'],
      w: [100, 65, 30, 0], dim: 'labor' },
  ];

  /* ─── Category icons ─── */
  const CAT_ICONS = {
    '粉底液': '🪞', '口红': '💄', '精华': '✨', '眼霜': '👁️',
    '眼影': '🎨', '唇釉': '💋', '防晒': '☀️'
  };

  function stars(n) {
    const full = Math.floor(n);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  const PRODUCT_IMAGE_EXT = {
    1: 'jpeg', 2: 'png', 3: 'jpg', 4: 'jpeg', 5: 'png',
    6: 'jpeg', 7: 'jpg', 8: 'jpeg', 9: 'jpg', 10: 'jpeg',
    11: 'jpeg', 12: 'jpeg', 13: 'jpg', 14: 'jpg', 15: 'jpeg', 16: 'jpeg'
  };

  function normalizeImagePath(path) {
    if (!path) return '';
    return path.replace(/^\/?pics\//, './pics/').replace(/^\//, './');
  }

  function getProductImage(id) {
    const ext = PRODUCT_IMAGE_EXT[id] || 'jpeg';
    return `./pics/${id}.${ext}`;
  }

  function formatSources(sources = []) {
    return sources.map((source, index) => `
      <a class="compare-source-link" href="${source.url}" target="_blank" rel="noopener">
        ${index + 1}. ${source.label} · ${source.type || 'source'} · ${source.as_of || '演示数据'}
      </a>
    `).join('');
  }

  const SWATCH_COLORS = {
    '1C': ['#f2d3bd', '#f7e1cf'],
    '1W1': ['#efd0aa', '#f6dfc3'],
    '1W2': ['#d9aa78', '#efd0aa'],
    '2C2': ['#d7a487', '#e7c4ab'],
    '3W2': ['#a8794c', '#c89662'],
    '196': ['#a63a2b', '#d05a3d'],
    '277': ['#b87577', '#d59a97'],
    '888': ['#d96735', '#f19861'],
    '507': ['#a96170', '#d38a96'],
    mild: ['#c98f9b', '#e4b5bd'],
    aroused: ['#a92655', '#d64d78'],
    deep: ['#651f34', '#9a3450'],
    forbidden: ['#7f1838', '#b52f57'],
    overtake: ['#c8733a', '#e5a06b'],
    speak: ['#9a6a68', '#c89791'],
    anyhow: ['#7b7670', '#aaa29a'],
    gloro: ['#b18443', '#e2c06a'],
    wx01: ['#8d6443', '#c6a37d'],
    wx02: ['#bd7d83', '#e4b1b4'],
    wx03: ['#8aa6d8', '#c4b5e6'],
    wx04: ['#7d3528', '#b85d45'],
    '112': ['#eac8aa', '#f7ddc6'],
    '120': ['#dfb789', '#f1d1a8'],
    '220': ['#c99263', '#e0b483'],
    '015': ['#f0d5c0', '#f8e5d6'],
    '420': ['#d3a070', '#e8c198'],
    '425': ['#b98054', '#d0a06e'],
    rubywoo: ['#9f071f', '#df1234'],
    allfired: ['#c41852', '#f05a82'],
    chili: ['#a64025', '#d0633a'],
  };

  function swatchForVersion(version = {}, category = '') {
    const id = String(version.version_id || '').toLowerCase();
    const exact = SWATCH_COLORS[version.version_id] || SWATCH_COLORS[id];
    if (exact) return `linear-gradient(135deg, ${exact[0]}, ${exact[1]})`;

    const text = `${version.name || ''} ${version.color || ''}`.toLowerCase();
    if (/红|ruby|chili|莓|酒/.test(text)) return 'linear-gradient(135deg, #8f1d35, #d84a63)';
    if (/粉|玫瑰|豆沙/.test(text)) return 'linear-gradient(135deg, #b66c7b, #e0a8b3)';
    if (/橘|暖|枫叶/.test(text)) return 'linear-gradient(135deg, #bd6233, #ec9d62)';
    if (/棕|大地|沙|小麦|自然/.test(text)) return 'linear-gradient(135deg, #9d704a, #d2a679)';
    if (/白|象牙|瓷/.test(text)) return 'linear-gradient(135deg, #efd5bd, #fbebdc)';
    if (/蓝|偏光/.test(text)) return 'linear-gradient(135deg, #8aa6d8, #c8b6e8)';
    if (/金|香槟/.test(text)) return 'linear-gradient(135deg, #ad843b, #e4c76d)';
    if (/眼霜|乳霜|cream|防晒|spf|精华|serum|红色瓶身/.test(text) || !/粉底|口红|唇釉|眼影/.test(category)) {
      return 'linear-gradient(135deg, #f8f5ef, #dfeee9 50%, #b8d6ef)';
    }
    return 'linear-gradient(135deg, #d8c5b4, #f3e8db)';
  }

  function compareSummary(category, rows) {
    if (rows.length < 2) return `${category} 当前暂无足够竞品样本，可先浏览产品详情。`;

    const cheapest = [...rows].sort((a,b) => minPrice(a.product) - minPrice(b.product))[0];
    const highestRated = [...rows].sort((a,b) => b.product.avg_rating - a.product.avg_rating)[0];
    const highestEsg = [...rows].sort((a,b) => (b.product.esg?.score || 0) - (a.product.esg?.score || 0))[0];
    return `预算优先看 ${cheapest.brand}，口碑评分优先看 ${highestRated.brand}，ESG 价值观优先看 ${highestEsg.brand}。结合肤质和场景，重点比较价格带、核心卖点与风险提示。`;
  }

  function minPrice(p) {
    return Math.min(p.price_taobao, p.price_jd, p.price_douyin);
  }

  /* ─── Load products.json ─── */
  async function loadProducts() {
    try {
      const r = await fetch('./products.json');
      if (!r.ok) throw new Error('fetch failed');
      const raw = await r.json();
      products = raw.map(p => ({
        ...p,
        image: normalizeImagePath(p.image) || getProductImage(p.id)
      }));
    } catch {
      console.warn('Using built-in product data');
      products = BUILTIN_PRODUCTS;
    }
  }

  /* ─── Load versions.json ─── */
  let productVersions = [];
  async function loadVersions() {
    try {
      const r = await fetch('./versions.json');
      if (!r.ok) throw new Error('fetch failed');
      productVersions = await r.json();
      if (!Array.isArray(productVersions) || productVersions.length === 0) {
        throw new Error('empty versions data');
      }
    } catch {
      console.warn('Using built-in version data');
      productVersions = BUILTIN_VERSIONS;
    }
  }

  function setSearchQuery(value) {
    searchQuery = value.toLowerCase().trim();
    const headerInput = document.getElementById('product-search');
    const listInput = document.getElementById('list-search');
    if (headerInput && headerInput.value !== value) headerInput.value = value;
    if (listInput && listInput.value !== value) listInput.value = value;
    renderList();
  }

  window.setSearchQuery = setSearchQuery;

  /* ─── Route ─── */
  function route() {
    const hash = location.hash || '#home';
    window.scrollTo({ top: 0, behavior: 'instant' });
    // highlight nav
    ['home','list','test','profile','versions'].forEach(id => {
      const el = document.getElementById(`nav-${id}`);
      if (el) el.classList.toggle('active', hash.startsWith(`#${id}`));
      document.querySelectorAll(`[data-nav="${id}"]`).forEach(navLink => {
        navLink.classList.toggle('active', hash.startsWith(`#${id}`));
      });
    });

    if (hash === '#home' || hash === '' || hash === '#') return renderHome();
    if (hash === '#list') return renderList();
    if (hash === '#test') return renderTest();
    if (hash === '#versions') return renderVersionsList();
    if (hash.startsWith('#versions?id=')) {
      const id = parseInt(hash.split('=')[1]);
      return renderVersionDetail(id);
    }
    if (hash === '#versions-guide') return renderVersionGuide();
    if (hash.startsWith('#versions?compare=')) {
      const category = decodeURIComponent(hash.split('compare=')[1]);
      return renderVersionCompare(category);
    }
    if (hash.startsWith('#detail?id=')) {
      const id = parseInt(hash.split('=')[1]);
      return renderDetail(id);
    }
    if (hash === '#profile') return renderProfile();
    app.innerHTML = '<div class="section"><p style="color:var(--slate)">页面未找到</p></div>';
  }

  window.addEventListener('hashchange', route);

  const searchInput = document.getElementById('product-search');
  if (searchInput) {
    searchInput.addEventListener('input', (event) => setSearchQuery(event.target.value));
    searchInput.addEventListener('focus', () => {
      if (location.hash !== '#list') location.hash = '#list';
    });
  }

  const nav = document.querySelector('.header-nav');
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menuToggle.classList.toggle('open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        nav.classList.remove('open');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const aiBadge = document.querySelector('.header-ai-badge');
  if (aiBadge) aiBadge.addEventListener('click', () => showAIModal());

  function escapeAttr(value) {
    return String(value || '').replace(/"/g, '&quot;');
  }

  /* ══════════════════════════════════════════════════════
     HOME PAGE
  ══════════════════════════════════════════════════════ */
  function renderHome() {
    const topProducts = [...products].sort((a,b) => b.avg_rating - a.avg_rating).slice(0,4);
    const featuredProduct = topProducts[0] || products[0];
    const fp = featuredProduct;
    const fpMin = fp ? minPrice(fp) : 0;
    const recommendationCards = [
      {
        label: '高评分优先',
        tag: '口碑最稳',
        product: [...products].sort((a,b) => b.avg_rating - a.avg_rating)[0],
        reason: '适合想减少踩雷、优先看综合口碑的人。',
      },
      {
        label: 'ESG 高分',
        tag: '价值观匹配',
        product: [...products].sort((a,b) => (b.esg?.score || 0) - (a.esg?.score || 0))[0],
        reason: '适合关注环保、动物福利和品牌责任的人。',
      },
      {
        label: '低价优先',
        tag: '预算友好',
        product: [...products].sort((a,b) => minPrice(a) - minPrice(b))[0],
        reason: '适合先控制预算，再比较功效和风险的人。',
      },
    ].filter(item => item.product);
    const decisionCards = [
      { icon:'¥', title:'预算优先', desc:'先看最低价、优惠和同类平替。', href:'#list' },
      { icon:'敏', title:'敏感肌优先', desc:'优先避开酒精、香精和争议成分。', href:'#versions?compare=%E9%98%B2%E6%99%92' },
      { icon:'成', title:'成分党优先', desc:'把功效成分、风险成分放在一起看。', href:'#list' },
      { icon:'ESG', title:'价值观优先', desc:'按动物福利、环保与供应链表现筛选。', href:'#test' },
    ];
    const compareShortcuts = [
      { category:'粉底液', desc:'平价控油 vs 高端持妆' },
      { category:'防晒', desc:'敏感肌通勤 vs 户外防水' },
      { category:'精华', desc:'焕肤、维稳与抗氧化' },
    ];

    app.innerHTML = `
      <!-- ── HERO ── -->
      <section class="hero">
        <div class="hero-grid">
          <div>
            <div class="hero-eyebrow fade-up fade-up-1">
              ✦ &nbsp;Ecochic团队荣誉出品
            </div>
            <h1 class="fade-up fade-up-2">
              美妆决策，<br><em>一分钟</em>做到极致
            </h1>
            <p class="hero-desc fade-up fade-up-3">
              AI 驱动的比价 · 评论分析 · ESG 透明 · 成分安全<br>
              帮助你找到「价格合适 + 品质可靠 + 价值观匹配」的美妆产品
            </p>
            <div class="hero-actions fade-up fade-up-4">
              <a class="btn btn-primary" href="#list">浏览产品库 →</a>
              <a class="btn btn-secondary" href="#test">价值观测试</a>
            </div>
            <div class="hero-stats fade-up fade-up-4">
              <div>
                <div class="hero-stat-num">${products.length}+</div>
                <div class="hero-stat-label">精选 SKU</div>
              </div>
              <div>
                <div class="hero-stat-num">3</div>
                <div class="hero-stat-label">平台实时比价</div>
              </div>
              <div>
                <div class="hero-stat-num">AI</div>
                <div class="hero-stat-label">评论智能总结</div>
              </div>
              <div>
                <div class="hero-stat-num">ESG</div>
                <div class="hero-stat-label">品牌价值观透明</div>
              </div>
            </div>
          </div>

          ${fp ? `
          <!-- AI Panel -->
          <div class="hero-panel fade-up fade-up-3">
            <div class="hero-panel-header">
              <span class="hero-panel-title">今日智能推荐</span>
              <span class="status-chip"><span class="ai-dot-live" style="width:5px;height:5px;"></span> 已开启</span>
            </div>
            <div class="panel-brand">${fp.brand}</div>
            <div class="panel-product-name">${fp.name}</div>
            <div class="panel-scores">
              <div class="panel-score-row">
                <span class="panel-score-label">评分指数</span>
                <div class="panel-score-bar"><div class="panel-score-fill" style="width:${(fp.avg_rating/5)*100}%"></div></div>
                <span class="panel-score-num">${fp.avg_rating}</span>
              </div>
              <div class="panel-score-row">
                <span class="panel-score-label">ESG 评级</span>
                <div class="panel-score-bar"><div class="panel-score-fill" style="width:${fp.esg?.score || 75}%"></div></div>
                <span class="panel-score-num">${fp.esg?.score || 75}</span>
              </div>
              <div class="panel-score-row">
                <span class="panel-score-label">成分安全</span>
                <div class="panel-score-bar"><div class="panel-score-fill" style="width:${fp.risk_ingredients?.[0]==='无'?92:60}%"></div></div>
                <span class="panel-score-num">${fp.risk_ingredients?.[0]==='无'?'A+':'B'}</span>
              </div>
            </div>
            <div class="panel-tags">
              ${(fp.comment_positive||[]).map(t=>`<span class="panel-tag good">✓ ${t}</span>`).join('')}
              ${(fp.comment_negative||[]).map(t=>`<span class="panel-tag warn">⚠ ${t}</span>`).join('')}
            </div>
            <div class="panel-price-row">
              <div>
                <div class="panel-price-platform">最低比价 · 抖音</div>
                <div class="panel-price-val">¥${fp.price_douyin}</div>
                <div class="panel-price-best">💡 比淘宝省 ¥${fp.price_taobao - fp.price_douyin}</div>
              </div>
              <a href="#detail?id=${fp.id}" class="btn btn-ai" style="font-size:0.75rem;padding:0.55rem 1.1rem;">
                查看详情 →
              </a>
            </div>
          </div>
          ` : ''}
        </div>
      </section>

      <!-- ── FEATURES ── -->
      <div class="section">
        <div class="section-label">✦ 核心功能</div>
        <div class="section-title">四大 AI 能力，重构决策链路</div>
        <p class="section-subtitle">从比价到成分，从口碑到价值观，EcoChic 将分散在多个平台的信息整合于一处</p>
        <div class="features-grid mt-3">
          <div class="feature-card" onclick="location.hash='#list'">
            <div class="feature-icon sky icon-price"><span></span><b></b><i></i></div>
            <div class="feature-title">多平台比价</div>
            <p class="feature-desc">一键对比淘宝、京东、抖音三平台实时价格，叠加优惠券最低价秒出。</p>
            <span class="feature-arrow">→</span>
          </div>
          <div class="feature-card" onclick="showAIDemo()">
            <div class="feature-icon ai icon-ai"><span></span><b></b><i></i></div>
            <div class="feature-title">智能购买建议</div>
            <p class="feature-desc">把口碑、价格、成分和 ESG 放到同一个建议里，快速判断是否适合你。</p>
            <span class="feature-arrow">→</span>
          </div>
          <div class="feature-card" onclick="location.hash='#test'">
            <div class="feature-icon mint icon-esg"><span></span><b></b></div>
            <div class="feature-title">ESG 价值观对齐</div>
            <p class="feature-desc">根据你的价值观偏好，高亮品牌在动物福利、环保、平等维度的真实表现。</p>
            <span class="feature-arrow">→</span>
          </div>
          <div class="feature-card" onclick="location.hash='#list'">
            <div class="feature-icon blush icon-ingredient"><span></span><b></b><i></i></div>
            <div class="feature-title">成分安全分析</div>
            <p class="feature-desc">逐项解析成分表，标注风险成分并给出安全等级，敏感肌友好指引。</p>
            <span class="feature-arrow">→</span>
          </div>
        </div>
      </div>

      <!-- ── HOT PRODUCTS ── -->
      <div class="section" style="padding-top:0;">
        <div class="section-label">✦ 热门榜单</div>
        <div class="section-title">本周精选好物</div>
        <div class="products-grid mt-3">
          ${topProducts.map(p => productCard(p)).join('')}
        </div>
        <div style="text-align:center;margin-top:2rem;">
          <a href="#list" class="btn btn-secondary">查看全部 ${products.length} 款产品 →</a>
        </div>
      </div>

      <!-- ── APP DECISION MODULES ── -->
      <div class="section" style="padding-top:0;">
        <div class="section-label">✦ 智能决策</div>
        <div class="section-title">今天可以这样选</div>
        <p class="section-subtitle">从预算、肤质、成分和价值观出发，直接进入最适合你的决策路径。</p>

        <div class="mini-section-title mt-3">今日智能推荐</div>
        <div class="home-recommend-grid mt-3">
          ${recommendationCards.map(item => `
            <a class="home-recommend-card" href="#detail?id=${item.product.id}">
              <div class="home-recommend-top">
                <span>${item.label}</span>
                <strong>${item.tag}</strong>
              </div>
              <div class="home-recommend-main">
                <img src="${item.product.image}" alt="${item.product.brand} ${item.product.name}" loading="lazy">
                <div>
                  <div class="home-recommend-brand">${item.product.brand}</div>
                  <div class="home-recommend-name">${item.product.name}</div>
                  <div class="home-recommend-reason">${item.reason}</div>
                </div>
              </div>
              <div class="home-recommend-meta">
                <span>★ ${item.product.avg_rating}</span>
                <span>ESG ${item.product.esg?.score || '-'}</span>
                <span class="home-recommend-price">¥${minPrice(item.product)}</span>
              </div>
            </a>
          `).join('')}
        </div>

        <div class="home-decision-layout mt-3">
          <div>
            <div class="mini-section-title">快速决策</div>
            <div class="decision-grid">
              ${decisionCards.map(card => `
                <a class="decision-card" href="${card.href}">
                  <span class="decision-icon">${card.icon}</span>
                  <span>
                    <strong>${card.title}</strong>
                    <em>${card.desc}</em>
                  </span>
                </a>
              `).join('')}
            </div>
          </div>
          <div>
            <div class="mini-section-title">热门对比</div>
            <div class="compare-shortcut-grid">
              ${compareShortcuts.map(item => `
                <a class="compare-shortcut" href="#versions?compare=${encodeURIComponent(item.category)}">
                  <strong>${item.category}</strong>
                  <span>${item.desc}</span>
                  <b>查看对比 →</b>
                </a>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════
     PRODUCT LIST
  ══════════════════════════════════════════════════════ */
  function renderList() {
    const cats = ['all', ...new Set(products.map(p=>p.category))];

    let filtered = activeFilter === 'all' ? [...products] : products.filter(p => p.category === activeFilter);

    if (sortMode === 'price-asc') filtered.sort((a,b)=>minPrice(a)-minPrice(b));
    else if (sortMode === 'price-desc') filtered.sort((a,b)=>minPrice(b)-minPrice(a));
    else if (sortMode === 'rating') filtered.sort((a,b)=>b.avg_rating-a.avg_rating);
    else if (sortMode === 'esg') filtered.sort((a,b)=>(b.esg?.score||0)-(a.esg?.score||0));

    if (searchQuery) {
      filtered = filtered.filter(p => {
        const q = searchQuery;
        const brand = (p.brand || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        const ingredients = Array.isArray(p.ingredients) ? p.ingredients.join(' ').toLowerCase() : '';
        const comments = [p.comment_summary, ...(p.comment_positive || []), ...(p.comment_negative || []), ...(p.risk_ingredients || [])].join(' ').toLowerCase();
        return brand.includes(q) || name.includes(q) || ingredients.includes(q) || comments.includes(q);
      });
    }

    const sectionTitle = searchQuery ? `搜索结果：${searchQuery}` : '美妆产品库';

    app.innerHTML = `
      <div class="section">
        <div class="section-label">✦ 全部产品</div>
        <div class="section-title">${sectionTitle}</div>
        <p class="section-subtitle">搜索、筛选、排序合在同一处，从关键词到候选清单更顺手。</p>

        <div class="list-search-panel mt-3">
          <input id="list-search" type="search" placeholder="搜索产品、品牌、成分、评论关键词" value="${escapeAttr(searchQuery)}">
          ${searchQuery ? `<button class="search-clear" onclick="clearSearch()">清除</button>` : ''}
        </div>

        <div class="sort-bar mt-3">
          <span class="sort-label">排序</span>
          <button class="sort-btn ${sortMode==='default'?'active':''}" onclick="setSort('default')">默认</button>
          <button class="sort-btn ${sortMode==='price-asc'?'active':''}" onclick="setSort('price-asc')">价格 ↑</button>
          <button class="sort-btn ${sortMode==='price-desc'?'active':''}" onclick="setSort('price-desc')">价格 ↓</button>
          <button class="sort-btn ${sortMode==='rating'?'active':''}" onclick="setSort('rating')">评分 ★</button>
          <button class="sort-btn ${sortMode==='esg'?'active':''}" onclick="setSort('esg')">ESG 优先</button>
          <div class="filter-chips">
            ${cats.map(c=>`
              <button class="filter-chip ${activeFilter===c?'active':''}" onclick="setFilter('${c}')">
                ${c==='all' ? '全部' : (CAT_ICONS[c]||'')+' '+c}
              </button>
            `).join('')}
          </div>
        </div>

        <div style="font-size:0.82rem;color:var(--slate);margin-bottom:1.25rem;">
          共找到 <strong>${filtered.length}</strong> 款产品
        </div>

        ${filtered.length > 0
          ? `<div class="products-grid">${filtered.map(p=>productCard(p)).join('')}</div>`
          : `<div class="empty-state"><div class="empty-state-icon">🔍</div><p>没有找到匹配产品，试试品牌、功效或成分关键词</p></div>`
        }
      </div>
    `;

    const listSearch = document.getElementById('list-search');
    if (listSearch) {
      listSearch.addEventListener('input', (event) => setSearchQuery(event.target.value));
      listSearch.focus({ preventScroll: true });
    }
  }

  window.setSort = (mode) => { sortMode = mode; renderList(); };
  window.setFilter = (f) => { activeFilter = f; renderList(); };
  window.clearSearch = () => setSearchQuery('');

  /* ─── Product card helper ─── */
  function productCard(p) {
    const mp = minPrice(p);
    return `
      <div class="product-card" onclick="location.hash='#detail?id=${p.id}'">
        <div class="product-img-wrap">
          <img src="${p.image}" alt="${p.name}">
          ${p.esg?.score >= 80 ? `<div class="product-esg-badge">ESG ${p.esg.score}</div>` : ''}
        </div>
        <div class="product-body">
          <div class="product-brand">${p.brand}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-price-row">
            <span class="product-price">¥${mp}</span>
            <span class="product-price-sub">起</span>
          </div>
          <div class="product-rating">
            <span class="stars">${stars(p.avg_rating)}</span>
            <span class="rating-num">${p.avg_rating}</span>
          </div>
          <div class="product-comment-preview">${p.comment_summary || ''}</div>
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════
     DETAIL PAGE
  ══════════════════════════════════════════════════════ */
  function renderDetail(id) {
    const p = products.find(x => x.id === id);
    if (!p) {
      app.innerHTML = `<div class="section"><p>产品未找到</p></div>`;
      return;
    }

    // save history
    const hist = JSON.parse(localStorage.getItem(SK.history)||'[]');
    localStorage.setItem(SK.history, JSON.stringify([id, ...hist.filter(h=>h!==id)].slice(0,5)));

    const values = JSON.parse(localStorage.getItem(SK.values)||'null');
    const bestPlatform = p.price_douyin <= p.price_taobao && p.price_douyin <= p.price_jd ? 'douyin'
                        : p.price_taobao <= p.price_jd ? 'taobao' : 'jd';
    const esgScore = p.esg?.score || 0;
    const esgPct = `${esgScore * 3.6}deg`;
    const hasRisk = p.risk_ingredients && p.risk_ingredients[0] !== '无';

    app.innerHTML = `
      <div class="section">
        <a href="#list" class="back-link">← 返回产品库</a>

        <!-- Detail hero -->
        <div class="detail-hero">
          <img class="detail-img" src="${p.image}" alt="${p.name}">
          <div>
            <div class="detail-brand">${p.brand} · ${p.category}</div>
            <h1 class="detail-name">${p.name}</h1>
            <div class="detail-rating">
              <span class="stars" style="font-size:1rem;">${stars(p.avg_rating)}</span>
              <span style="font-size:0.9rem;color:var(--slate);font-weight:500;">${p.avg_rating} 分</span>
            </div>
            <div class="detail-price-big">¥${minPrice(p)}</div>
            <div class="detail-price-label">三平台最低价 · 含优惠券后更低</div>
            <div class="detail-quick-tags mt-2">
              ${(p.comment_positive||[]).map(t=>`<span class="quick-tag highlight">✓ ${t}</span>`).join('')}
              ${(p.comment_negative||[]).map(t=>`<span class="quick-tag">✗ ${t}</span>`).join('')}
            </div>
            ${p.esg?.score >= 80 ? `
              <div style="margin-top:1rem;display:flex;align-items:center;gap:0.5rem;font-size:0.82rem;color:var(--mint-dark);">
                🌿 <strong>ESG 高分品牌</strong> · 综合评级 ${p.esg.score} / 100
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Price comparison -->
        <div class="section-card">
          <div class="section-card-title">💰 多平台比价</div>
          <div class="price-compare-grid">
            ${[
              { key:'taobao', label:'📱 淘宝 / 天猫', price: p.price_taobao },
              { key:'jd',     label:'📦 京东',        price: p.price_jd },
              { key:'douyin', label:'🎵 抖音',         price: p.price_douyin },
            ].map(pl => `
              <div class="price-platform-card ${bestPlatform===pl.key?'best':''}">
                <div class="price-platform-name">${pl.label}</div>
                <div class="price-platform-price">¥${pl.price}</div>
                ${bestPlatform===pl.key ? `<div><span class="price-best-badge">最低价</span></div>` : ''}
                ${p.coupon_info ? `<div><span class="price-coupon">🎫 ${p.coupon_info}</span></div>` : ''}
                <button class="price-buy-btn" onclick="alert('正在为你打开${pl.label}购买页')">去购买</button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- AI Review Summary -->
        <div class="ai-module">
          <div class="ai-module-header">
            <div>
              <div class="ai-module-title">🤖 智能购买建议</div>
              <div class="ai-module-subtitle">基于口碑、成分与价格生成建议</div>
            </div>
            <span class="demo-badge" onclick="showProductAI(${p.id})">
              生成智能建议
            </span>
          </div>
          <div class="ai-thinking">
            <span>AI 正在分析用户评论</span>
            <span class="ai-thinking-dots"><span></span><span></span><span></span></span>
          </div>
          <div class="ai-summary-text">
            「${p.comment_summary || '暂无评论总结'}」
          </div>
          <div class="ai-verdict-grid">
            <div class="ai-verdict-card pos">
              <div class="ai-verdict-label pos">✓ 好评 TOP3</div>
              <ul class="ai-verdict-list">
                ${(p.comment_positive||[]).map(c=>`<li>${c}</li>`).join('')}
              </ul>
            </div>
            <div class="ai-verdict-card neg">
              <div class="ai-verdict-label neg">✗ 差评 TOP3</div>
              <ul class="ai-verdict-list">
                ${(p.comment_negative||[]).map(c=>`<li>${c}</li>`).join('')}
              </ul>
            </div>
          </div>
          <div class="ai-insight-row">
            <span class="ai-insight-icon">📊</span>
            <span class="ai-insight-text">AI 综合判断：该产品<strong> ${p.avg_rating >= 4.8 ? '口碑优秀，强烈推荐' : p.avg_rating >= 4.6 ? '整体评价良好' : '评价一般，请结合自身情况'}</strong>
              ${hasRisk ? '，但含有潜在风险成分，敏感肌请谨慎' : '，成分安全等级良好'}。</span>
          </div>
        </div>

        <!-- ESG -->
        <div class="section-card">
          <div class="section-card-title">🌿 ESG 品牌价值观</div>
          <div class="esg-score-banner">
            <div class="esg-score-circle"
                 data-score="${esgScore}"
                 style="--pct:${esgScore * 3.6}deg;background:conic-gradient(var(--mint-dark) ${esgScore * 3.6}deg, var(--border) 0);">
              <div style="position:absolute;inset:6px;background:var(--white);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:700;color:var(--charcoal);">${esgScore}</div>
            </div>
            <div>
              <div class="esg-score-title">${esgScore >= 85 ? '🏆 ESG 优秀品牌' : esgScore >= 75 ? '✅ ESG 良好品牌' : '📋 ESG 一般水平'}</div>
              <div class="esg-score-desc">综合动物福利、环保承诺、性别平等、供应链公平四个维度综合评分</div>
            </div>
          </div>
          <div class="esg-grid">
            ${[
              { icon:'👩‍💼', label:'性别平等', val: p.esg?.gender, key:'equality' },
              { icon:'🐰', label:'动物福利', val: p.esg?.animal, key:'animal' },
              { icon:'🌍', label:'环境可持续', val: p.esg?.environment, key:'environment' },
              { icon:'🤝', label:'供应链公平', val: p.esg?.labor, key:'labor' },
            ].map(item => `
              <div class="esg-item ${values && values[item.key] > 50 ? 'highlighted' : ''}">
                <div class="esg-item-label">${item.icon} ${item.label}${values && values[item.key] > 50 ? ' <span style="font-size:0.65rem;background:var(--mint-dark);color:#fff;padding:0.1rem 0.4rem;border-radius:10px;">您关注</span>' : ''}</div>
                <div class="esg-item-value">${item.val || '暂无数据'}</div>
              </div>
            `).join('')}
          </div>
          <div class="esg-source">📄 数据来源：品牌公开报告 / 第三方认证机构 · 如有疑问可通过官方渠道核实</div>
        </div>

        <!-- Ingredient Analysis -->
        <div class="ai-module">
          <div class="ai-module-header">
            <div>
              <div class="ai-module-title">🔬 AI 成分安全分析</div>
              <div class="ai-module-subtitle">逐项成分解析 · 风险标注 · 肌肤适配建议</div>
            </div>
        <span class="demo-badge">成分已分析</span>
          </div>
          <div style="margin-bottom:1rem;">
            <div style="font-size:0.72rem;color:rgba(255,255,255,0.4);letter-spacing:0.1em;text-transform:uppercase;font-family:var(--font-mono);margin-bottom:0.75rem;">主要成分</div>
            <div class="ingredient-chips">
              ${(p.ingredients||[]).map((ing,i) => `
                <span class="ingredient-chip ${i < 2 ? 'star' : ''}" style="background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.15);color:rgba(255,255,255,0.75);">${ing}</span>
              `).join('')}
            </div>
          </div>
          ${hasRisk ? `
            <div style="background:rgba(255,100,100,0.1);border:1px solid rgba(255,100,100,0.3);border-radius:var(--r-md);padding:1rem;margin-bottom:1rem;">
              <div style="font-size:0.72rem;color:#FF7070;letter-spacing:0.1em;text-transform:uppercase;font-family:var(--font-mono);margin-bottom:0.65rem;">⚠ 风险成分提示</div>
              <div class="ingredient-chips">
                ${p.risk_ingredients.map(r=>`<span style="padding:0.35rem 0.9rem;border-radius:var(--r-pill);font-size:0.8rem;background:rgba(255,100,100,0.15);border:1px solid rgba(255,100,100,0.4);color:#FF7070;">${r}</span>`).join('')}
              </div>
            </div>
          ` : `
            <div class="ai-insight-row" style="margin-bottom:1rem;">
              <span class="ai-insight-icon">✅</span>
              <span class="ai-insight-text"><strong>成分安全等级：A+</strong> · 未检测到已知高风险成分，适合日常使用</span>
            </div>
          `}
          <div class="ai-insight-row">
            <span class="ai-insight-icon">🤖</span>
            <span class="ai-insight-text">AI 成分总结：<strong>${p.esg?.animal?.includes('无') ? '无动物成分' : '含动物源成分'}</strong> · 
              <strong>${hasRisk ? '含潜在风险成分，请结合肤质判断' : '成分配方温和，大多数肤质适用'}</strong></span>
          </div>
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════
     VALUE TEST
  ══════════════════════════════════════════════════════ */
  let testIdx = 0;
  let testScores = {};

  function renderTest() {
    const saved = localStorage.getItem(SK.values);
    if (saved) {
      renderTestResult(JSON.parse(saved));
      return;
    }
    testIdx = 0;
    testScores = { environment:0, animal:0, equality:0, ingredient:0, labor:0 };
    renderQuestion();
  }

  function renderQuestion() {
    if (testIdx >= QUESTIONS.length) {
      // normalize
      const result = {};
      QUESTIONS.forEach(q => { result[q.dim] = Math.round(testScores[q.dim]); });
      localStorage.setItem(SK.values, JSON.stringify(result));
      renderTestResult(result);
      return;
    }
    const q = QUESTIONS[testIdx];
    const pct = Math.round((testIdx / QUESTIONS.length) * 100);

    app.innerHTML = `
      <div class="section">
        <div class="test-wrap">
          <div class="test-progress">
            <span class="test-progress-text">问题 ${testIdx+1} / ${QUESTIONS.length}</span>
            <div class="test-progress-bar"><div class="test-progress-fill" style="width:${pct}%"></div></div>
          </div>
          <div class="test-question fade-up">${q.q}</div>
          <div class="test-options">
            ${q.opts.map((opt, i) => `
              <button class="test-option fade-up fade-up-${i+1}" onclick="answerTest(${q.w[i]}, '${q.dim}')">${opt}</button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  window.answerTest = (weight, dim) => {
    testScores[dim] = weight;
    testIdx++;
    renderQuestion();
  };

  function renderTestResult(values) {
    const dims = [
      { key:'environment', icon:'🌿', label:'环保意识', cls:'env' },
      { key:'animal',      icon:'🐾', label:'动物福利', cls:'animal' },
      { key:'equality',    icon:'⚖️',  label:'性别平等', cls:'equal' },
      { key:'ingredient',  icon:'🔬', label:'成分关注', cls:'env' },
      { key:'labor',       icon:'🤝', label:'供应链公平', cls:'equal' },
    ];

    const topValues = dims.filter(d => (values[d.key]||0) >= 65);
    // Find recommended products based on ESG score if user cares
    const recProducts = [...products]
      .sort((a,b) => (b.esg?.score||0) - (a.esg?.score||0))
      .slice(0,3);

    app.innerHTML = `
      <div class="section">
        <div class="section-label">✦ 价值观测试</div>
        <div class="section-title">您的消费价值观画像</div>

        <div class="test-result-card mt-3">
          <h3 style="margin-bottom:1.5rem;font-size:1rem;color:var(--slate);font-weight:500;">基于您的回答，EcoChic 为您生成了以下价值观画像</h3>
          ${dims.map(d => `
            <div class="value-score-row">
              <span class="value-icon">${d.icon}</span>
              <span class="value-label">${d.label}</span>
              <div class="value-bar"><div class="value-fill ${d.cls}" style="width:${values[d.key]||0}%"></div></div>
              <span class="value-pct">${values[d.key]||0}%</span>
            </div>
          `).join('')}

          ${topValues.length > 0 ? `
            <div style="margin-top:1.5rem;padding:1.25rem;background:var(--mint-light);border-radius:var(--r-md);border:1px solid var(--mint);">
              <div style="font-size:0.82rem;font-weight:600;color:var(--mint-dark);margin-bottom:0.5rem;">
                ✦ 您最关注：${topValues.map(d=>d.icon+' '+d.label).join('、')}
              </div>
              <div style="font-size:0.82rem;color:var(--graphite);">
                EcoChic 将在产品详情页中为您<strong>高亮标注</strong>这些维度的品牌信息，帮助您快速找到价值观匹配的产品。
              </div>
            </div>
          ` : ''}

          <div style="display:flex;gap:1rem;margin-top:1.5rem;flex-wrap:wrap;">
            <a href="#list" class="btn btn-primary">查看为我推荐的产品 →</a>
            <button class="btn btn-secondary" onclick="resetTest()">重新测试</button>
          </div>
        </div>

        <div class="section-label mt-3">✦ 基于价值观推荐</div>
        <div class="section-title" style="font-size:1.4rem;">ESG 优先好物</div>
        <div class="products-grid mt-2">
          ${recProducts.map(p => productCard(p)).join('')}
        </div>
      </div>
    `;
  }

  window.resetTest = () => {
    localStorage.removeItem(SK.values);
    testIdx = 0;
    testScores = {};
    renderQuestion();
  };

  /* ══════════════════════════════════════════════════════
     PROFILE
  ══════════════════════════════════════════════════════ */
  function renderProfile() {
    const values = JSON.parse(localStorage.getItem(SK.values)||'null');
    const hist = JSON.parse(localStorage.getItem(SK.history)||'[]');
    let bottles = JSON.parse(localStorage.getItem(SK.bottles)||'null');
    if (!bottles) {
      bottles = [
        { name:'珀莱雅双抗精华', date:'2026-04-15', comment:'去黄效果非常明显，会回购！' },
        { name:'雅诗兰黛DW持妆粉底液', date:'2026-03-20', comment:'油皮救星，一整天不脱妆' },
      ];
      localStorage.setItem(SK.bottles, JSON.stringify(bottles));
    }

    const histProducts = hist.map(id => products.find(p=>p.id===id)).filter(Boolean);

    app.innerHTML = `
      <div class="section">
        <div class="section-label">✦ 个人中心</div>
        <div class="section-title">我的美妆档案</div>

        <div class="profile-grid mt-3">
          <!-- Left sidebar -->
          <div>
            <div class="profile-card mb-2">
              <div class="profile-avatar">💄</div>
              <div class="profile-name">EcoChic 用户</div>
              <div class="profile-tag">${values ? '已完成价值观测试' : '未完成价值观测试'}</div>

              ${values ? `
                <div style="margin-top:1.25rem;padding-top:1.25rem;border-top:1px solid var(--border);">
                  <div style="font-size:0.78rem;color:var(--slate);margin-bottom:0.75rem;">价值观画像</div>
                  ${Object.entries(values).slice(0,3).map(([k,v])=>`
                    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem;">
                      <div style="font-size:0.78rem;color:var(--slate);width:72px;">${
                        k==='environment'?'🌿 环保':k==='animal'?'🐾 动物':k==='equality'?'⚖️ 平等':k==='ingredient'?'🔬 成分':'🤝 供应链'
                      }</div>
                      <div style="flex:1;height:6px;background:var(--border);border-radius:10px;overflow:hidden;">
                        <div style="height:100%;width:${v}%;background:var(--grad-deep);border-radius:10px;"></div>
                      </div>
                      <div style="font-size:0.72rem;color:var(--slate);width:30px;text-align:right;">${v}%</div>
                    </div>
                  `).join('')}
                  <a href="#test" style="font-size:0.8rem;color:var(--mint-dark);text-decoration:none;">重新测试 →</a>
                </div>
              ` : `
                <a href="#test" class="btn btn-primary" style="display:block;text-align:center;margin-top:1rem;">开始价值观测试 →</a>
              `}
            </div>

            <!-- History -->
            <div class="profile-card">
              <div style="font-size:0.9rem;font-weight:600;color:var(--charcoal);margin-bottom:1rem;">🕐 最近浏览</div>
              ${histProducts.length > 0 ? histProducts.map(p=>`
                <a href="#detail?id=${p.id}" class="history-item">
                  <div style="font-size:1.2rem;">${CAT_ICONS[p.category]||'💄'}</div>
                  <div>
                    <div class="history-product-name">${p.name}</div>
                    <div class="history-product-brand">${p.brand} · ¥${minPrice(p)}</div>
                  </div>
                </a>
              `).join('') : `<div class="empty-state" style="padding:1.5rem 0;"><p>暂无浏览记录</p></div>`}
            </div>
          </div>

          <!-- Right: Bottles -->
          <div>
            <div class="profile-card">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;">
                <div style="font-size:0.9rem;font-weight:600;color:var(--charcoal);">🧴 空瓶打卡</div>
                <button onclick="addBottle()" style="padding:0.4rem 1rem;font-size:0.8rem;background:var(--mint-dark);">+ 模拟打卡</button>
              </div>
              <p style="font-size:0.82rem;color:var(--slate);margin-bottom:1.25rem;line-height:1.6;">
                空瓶打卡不仅记录您的使用感受，也为品牌提供真实的长期评价数据——这是 EcoChic B 端服务的核心价值。
              </p>
              ${bottles.map(b=>`
                <div class="bottle-item">
                  <div class="bottle-icon">🧴</div>
                  <div>
                    <div class="bottle-name">${b.name}</div>
                    <div class="bottle-date">${b.date}</div>
                    <div class="bottle-comment">${b.comment}</div>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- AI insight for profile -->
            <div class="ai-module mt-2">
              <div class="ai-module-header">
                <div>
                  <div class="ai-module-title">🤖 AI 个性化洞察</div>
                  <div class="ai-module-subtitle">基于您的浏览与价值观数据</div>
                </div>
              </div>
              <div class="ai-summary-text">
                ${histProducts.length > 0
                  ? `「根据您最近的浏览记录，您对 <strong style="color:var(--ai-teal)">${[...new Set(histProducts.map(p=>p.category))].join('、')}</strong> 品类有较高兴趣。AI 为您推荐关注 ESG 评级 80+ 的同类产品，可在产品列表中选择"ESG 优先"排序。」`
                  : `「完成价值观测试后，AI 将为您生成个性化的产品推荐报告，匹配您最关注的品牌价值维度。」`
                }
              </div>
              <div class="ai-insight-row">
                <span class="ai-insight-icon">💡</span>
                <span class="ai-insight-text">空瓶打卡 <strong>× ${bottles.length} 件</strong> · 您的数据正在为品牌提供真实的长期使用反馈</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  window.addBottle = () => {
    const bottles = JSON.parse(localStorage.getItem(SK.bottles)||'[]');
    const rp = products[Math.floor(Math.random()*products.length)];
    const comments = ['用完了，效果真的不错！', '会继续回购，值得推荐', '性价比超高，已经第三瓶了', '肤质明显改善，推荐给同肤质的朋友'];
    bottles.unshift({
      name: rp.name,
      date: new Date().toLocaleDateString('zh-CN'),
      comment: comments[Math.floor(Math.random()*comments.length)],
    });
    localStorage.setItem(SK.bottles, JSON.stringify(bottles.slice(0,10)));
    renderProfile();
  };

  /* ══════════════════════════════════════════════════════
     SMART ADVICE MODAL
  ══════════════════════════════════════════════════════ */
  async function showAIModal(product = null) {
    const modal = document.getElementById('ai-modal');
    const body = document.getElementById('modal-body');
    document.getElementById('modal-title').innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:0.5rem;">
        <span style="width:8px;height:8px;background:var(--ai-teal);border-radius:50%;animation:live-pulse 1.8s infinite;"></span>
        EcoChic 智能建议
      </span>`;
    body.innerHTML = `
      <p style="color:var(--slate);font-size:0.9rem;line-height:1.7;margin-bottom:1rem;">
        正在整理口碑、成分、价格和价值观信息，为你生成更好判断的购买建议。
      </p>
      <div class="ai-thinking" style="background:var(--ai-bg);border-radius:var(--r-md);">
        <span>EcoChic 正在生成建议</span>
        <span class="ai-thinking-dots"><span></span><span></span><span></span></span>
      </div>
    `;
    modal.classList.add('active');
    modal.querySelector('.modal-close').onclick = () => modal.classList.remove('active');
    modal.onclick = (e) => { if(e.target===modal) modal.classList.remove('active'); };

    const target = product || products[0] || null;
    const result = await window.EcoChicAI.analyze({
      task: 'summarize_product_decision',
      product: target,
    });

    const technicalPattern = /API|key|Mock|mock|接口|DeepSeek|Gemini|Qwen|DASHSCOPE|GitHub|Pages|serverless|后端|402/i;
    const cleanResultBullets = (result.bullets || []).filter(item => !technicalPattern.test(item));
    const positiveBullets = [
      ...cleanResultBullets.filter(item => /好评|推荐|优势|适合|信号/.test(item)),
      ...(target?.comment_positive || []).map(item => `用户反馈：${item}`),
    ].slice(0, 3);
    const reminderBullets = [
      ...cleanResultBullets.filter(item => /风险|提醒|谨慎|复核|建议/.test(item)),
      ...(target?.comment_negative || []).map(item => `购买前留意：${item}`),
      ...(target?.risk_ingredients || []).filter(item => item !== '无').map(item => `成分提醒：${item}`),
    ].slice(0, 3);
    const safePositives = positiveBullets.length ? positiveBullets : ['综合评分和用户反馈较稳定，适合进入候选清单。'];
    const safeReminders = reminderBullets.length ? reminderBullets : ['建议结合肤质、使用场景和当天价格做最终选择。'];

    body.innerHTML = `
      <div class="ai-advice-panel">
        <div class="ai-advice-label">购买建议</div>
        <div class="ai-advice-title">${result.title || `${target?.name || '当前产品'} 智能购买建议`}</div>
        <div class="ai-advice-summary">${result.summary || `${target?.name || '这款产品'}整体口碑稳定，建议结合价格、肤质和成分偏好判断是否适合。`}</div>
      </div>
      <div class="ai-verdict-grid" style="margin-bottom:1rem;">
        <div class="ai-verdict-card pos">
          <div class="ai-verdict-label pos">推荐理由</div>
          <ul class="ai-verdict-list">
            ${safePositives.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
        <div class="ai-verdict-card neg">
          <div class="ai-verdict-label neg">购买前提醒</div>
          <ul class="ai-verdict-list">
            ${safeReminders.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      </div>
      <div class="ai-insight-row">
        <span class="ai-insight-icon">💡</span>
        <span class="ai-insight-text">建议先加入候选清单，再与同品类产品对比价格带、肤感和风险提示。</span>
      </div>
    `;
  }

  window.showAIModal = showAIModal;
  window.showAIDemo = showAIModal;
  window.showProductAI = (id) => showAIModal(products.find(p => p.id === id));

  /* ══════════════════════════════════════════════════════
     BUILT-IN PRODUCT DATA
  ══════════════════════════════════════════════════════ */
  const BUILTIN_PRODUCTS = [
    { id:1, name:'DW持妆粉底液', brand:'雅诗兰黛', category:'粉底液', price_taobao:420, price_jd:435, price_douyin:399, coupon_info:'满400减30', avg_rating:4.8, comment_summary:'好评：遮瑕力强，持妆一整天不脱妆，油皮亲妈；差评：质地偏干，干皮慎选，色号难选', comment_positive:['遮瑕效果好','持妆久','控油不错'], comment_negative:['偏干','妆感厚重','色号难选'], esg:{score:85,gender:'女性高管比例45%，签署联合国妇女赋权原则',animal:'不做动物实验，获Leaping Bunny认证',environment:'包装可回收，2030年碳中和目标',labor:'供应链审计通过，无童工争议'}, ingredients:['水','环五聚二甲基硅氧烷','二氧化钛','云母'], risk_ingredients:['无'] },
    { id:2, name:'菁纯唇膏', brand:'兰蔻', category:'口红', price_taobao:320, price_jd:335, price_douyin:298, coupon_info:'满299减20', avg_rating:4.7, comment_summary:'好评：滋润度好，颜色高级，包装有质感；差评：沾杯，价格偏高，持久度一般', comment_positive:['滋润','颜色好看','包装高级'], comment_negative:['沾杯','贵','持久度一般'], esg:{score:78,gender:'女性高管比例38%',animal:'不做动物实验',environment:'包装部分可回收',labor:'供应链审计中'}, ingredients:['羊毛脂','蜂蜡','着色剂'], risk_ingredients:['羊毛脂（部分过敏）'] },
    { id:3, name:'神仙水精华液', brand:'SK-II', category:'精华', price_taobao:1590, price_jd:1650, price_douyin:1499, coupon_info:'满1500减100', avg_rating:4.9, comment_summary:'好评：改善肤质明显，提亮肤色，控油平衡；差评：价格昂贵，口水味重，敏感肌慎用', comment_positive:['提亮肤色','改善肤质','控油'], comment_negative:['贵','口水味','敏感肌不适'], esg:{score:70,gender:'女性高管比例35%',animal:'部分原料涉及动物实验（中国专柜版）',environment:'包装可回收',labor:'供应链审计通过'}, ingredients:['半乳糖酵母样菌发酵产物滤液','丁二醇','戊二醇'], risk_ingredients:['无'] },
    { id:4, name:'同心锁口红', brand:'花西子', category:'口红', price_taobao:219, price_jd:229, price_douyin:199, coupon_info:'满199减10', avg_rating:4.6, comment_summary:'好评：包装精美有文化感，膏体质地顺滑，雕花精致；差评：容易掉色，略显唇纹', comment_positive:['包装精美','雕花精致','顺滑'], comment_negative:['易掉色','显唇纹'], esg:{score:82,gender:'女性高管比例50%',animal:'不做动物实验',environment:'替换装设计，减少包装浪费',labor:'供应链公开'}, ingredients:['蜂蜡','植物油','着色剂'], risk_ingredients:['无'] },
    { id:5, name:'双抗精华', brand:'珀莱雅', category:'精华', price_taobao:239, price_jd:249, price_douyin:219, coupon_info:'满200减20', avg_rating:4.8, comment_summary:'好评：抗氧化效果好，去黄提亮，性价比高；差评：质地略粘，部分人过敏', comment_positive:['去黄提亮','抗氧化','性价比高'], comment_negative:['质地粘','部分过敏'], esg:{score:88,gender:'女性高管比例48%',animal:'不做动物实验',environment:'可替换包装，减塑计划',labor:'供应链审计通过'}, ingredients:['麦角硫因','虾青素','烟酰胺'], risk_ingredients:['烟酰胺（不耐受可能）'] },
    { id:6, name:'超绒感柔雾唇釉', brand:'NARS', category:'唇釉', price_taobao:280, price_jd:290, price_douyin:269, coupon_info:'满269减10', avg_rating:4.7, comment_summary:'好评：丝绒哑光质地，不拔干，颜色饱和；差评：沾杯，难卸除', comment_positive:['丝绒质地','不拔干','颜色饱和'], comment_negative:['沾杯','难卸'], esg:{score:72,gender:'女性高管比例40%',animal:'不做动物实验',environment:'包装可回收',labor:'供应链审计通过'}, ingredients:['聚二甲基硅氧烷','云母','着色剂'], risk_ingredients:['无'] },
    { id:7, name:'紫熨斗眼霜', brand:'欧莱雅', category:'眼霜', price_taobao:279, price_jd:289, price_douyin:259, coupon_info:'满259减15', avg_rating:4.7, comment_summary:'好评：淡化细纹有效，保湿不油腻，性价比高；差评：搓泥，辣眼睛', comment_positive:['淡化细纹','保湿','性价比'], comment_negative:['搓泥','辣眼睛'], esg:{score:75,gender:'女性高管比例42%',animal:'部分产品动物实验（法规要求）',environment:'包装可回收',labor:'供应链审计通过'}, ingredients:['玻色因','玻尿酸','咖啡因'], risk_ingredients:['无'] },
    { id:8, name:'九宫格眼影盘', brand:'3CE', category:'眼影', price_taobao:230, price_jd:239, price_douyin:199, coupon_info:'满199减10', avg_rating:4.8, comment_summary:'好评：粉质细腻，颜色日常百搭，显色度适中；差评：飞粉，持久度一般', comment_positive:['粉质细腻','颜色百搭','显色适中'], comment_negative:['飞粉','持久一般'], esg:{score:68,gender:'女性高管比例36%',animal:'不做动物实验',environment:'包装未明确',labor:'供应链审计中'}, ingredients:['云母','二氧化钛','着色剂'], risk_ingredients:['无'] },
    { id:9, name:'小金瓶防晒', brand:'安热沙', category:'防晒', price_taobao:248, price_jd:258, price_douyin:228, coupon_info:'满228减10', avg_rating:4.7, comment_summary:'好评：防晒力强，防水防汗，适合户外；差评：酒精味重，拔干，难卸', comment_positive:['防晒强','防水','户外适用'], comment_negative:['酒精味','拔干','难卸'], esg:{score:65,gender:'女性高管比例34%',animal:'部分原料动物实验',environment:'包装可回收，但防晒剂对环境有争议',labor:'供应链审计通过'}, ingredients:['氧化锌','甲氧基肉桂酸乙基己酯','酒精'], risk_ingredients:['酒精','部分防晒剂争议'] },
    { id:10, name:'动物眼影盘', brand:'完美日记', category:'眼影', price_taobao:129, price_jd:139, price_douyin:119, coupon_info:'满119减5', avg_rating:4.6, comment_summary:'好评：配色丰富，显色度高，价格亲民；差评：飞粉严重，持久度差，包装质感一般', comment_positive:['配色丰富','显色度高','便宜'], comment_negative:['飞粉严重','持久差','包装质感差'], esg:{score:70,gender:'女性高管比例44%',animal:'不做动物实验',environment:'动物保护主题，但包装塑料较多',labor:'供应链审计中'}, ingredients:['云母','滑石粉','着色剂'], risk_ingredients:['滑石粉（部分担忧）'] },
  ];

  const BUILTIN_VERSIONS = [
    {
      product_id: 1,
      product_name: '雅诗兰黛DW持妆粉底液',
      brand: '雅诗兰黛',
      category: '粉底液',
      versions: [
        { version_id: '1C', name: '#1C Cool Ivory', color: '冷调象牙白', '适合肤色': '冷白皮', 特点: '偏粉调，最白色号', price_diff: 0 },
        { version_id: '1W1', name: '#1W1 Bone', color: '暖调自然白', '适合肤色': '暖白皮', 特点: '亚洲最白色号', price_diff: 0 },
        { version_id: '1W2', name: '#1W2 Sand', color: '暖调自然色', '适合肤色': '自然肤色', 特点: '遮瑕力最强', price_diff: 0 },
        { version_id: '2C2', name: '#2C2 Ecru', color: '自然偏粉', '适合肤色': '黄一白', 特点: '偏粉调', price_diff: 0 },
        { version_id: '3W2', name: '#3W2 Cashew', color: '暖调小麦色', '适合肤色': '黄二白', 特点: '遮瑕好，稍暗', price_diff: 0 }
      ]
    },
    {
      product_id: 2,
      product_name: '兰蔻菁纯唇膏',
      brand: '兰蔻',
      category: '口红',
      versions: [
        { version_id: '196', name: '#196 枫叶红', color: '复古枫叶红', '适合肤色': '所有肤色', 特点: '经典热门色，显白', price_diff: 0 },
        { version_id: '277', name: '#277 玫瑰茶', color: '玫瑰茶色', '适合肤色': '白皮/黄一白', 特点: '日常百搭', price_diff: 0 },
        { version_id: '888', name: '#888 落日橘', color: '元气橘色', '适合肤色': '所有肤色', 特点: '元气活泼', price_diff: 0 },
        { version_id: '507', name: '#507 玫瑰豆沙', color: '玫瑰豆沙', '适合肤色': '所有肤色', 特点: '温柔日常', price_diff: 0 }
      ]
    },
    {
      product_id: 6,
      product_name: 'NARS超绒感柔雾唇釉',
      brand: 'NARS',
      category: '唇釉',
      versions: [
        { version_id: 'mild', name: '温柔色', color: '裸粉玫瑰', '适合肤色': '白皮/日常', 特点: '温柔日常', price_diff: 0 },
        { version_id: 'aroused', name: '刺激色', color: '树莓红', '适合肤色': '所有肤色', 特点: '显白高级', price_diff: 0 },
        { version_id: 'deep', name: '深刻色', color: '酒红玫瑰', '适合肤色': '所有肤色', 特点: '复古优雅', price_diff: 0 },
        { version_id: 'forbidden', name: '禁忌色', color: '浆果红', '适合肤色': '所有肤色', 特点: '气场全开', price_diff: 0 }
      ]
    },
    {
      product_id: 8,
      product_name: '3CE九宫格眼影盘',
      brand: '3CE',
      category: '眼影',
      versions: [
        { version_id: 'overtake', name: 'overtake 落日橘', color: '暖橘色调', '适合肤色': '所有肤色', 特点: '最热门，百搭', price_diff: 0 },
        { version_id: 'speak', name: 'speak 烟熏粉', color: '烟熏玫瑰', '适合肤色': '白皮/黄一白', 特点: '温柔日常', price_diff: 0 },
        { version_id: 'anyhow', name: 'anyhow 水泥灰', color: '中性灰调', '适合肤色': '所有肤色', 特点: '欧美风，个性', price_diff: 0 },
        { version_id: 'gloro', name: 'gloro 金香槟', color: '金棕色', '适合肤色': '所有肤色', 特点: '闪片好看', price_diff: 20 }
      ]
    },
    {
      product_id: 10,
      product_name: '完美日记动物眼影盘',
      brand: '完美日记',
      category: '眼影',
      versions: [
        { version_id: 'wx01', name: '探险家01 斑驳', color: '大地色系', '适合肤色': '所有肤色', 特点: '新手友好', price_diff: 0 },
        { version_id: 'wx02', name: '探险家02 熵粉', color: '粉棕色调', '适合肤色': '白皮/黄一白', 特点: '粉色系', price_diff: 0 },
        { version_id: 'wx03', name: '探险家03 冰闪', color: '蓝色偏光', '适合肤色': '所有肤色', 特点: '偏光独特', price_diff: 0 },
        { version_id: 'wx04', name: '探险家04 红棕', color: '红棕色系', '适合肤色': '所有肤色', 特点: '秋冬必备', price_diff: 0 }
      ]
    }
  ];

  /* ══════════════════════════════════════════════════════
     VERSION COMPARISON
  ══════════════════════════════════════════════════════ */
  function renderVersionsList() {
    const comparableCounts = productVersions.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
    app.innerHTML = `
      <div class="section">
        <div class="section-label">✦ 产品版本对比</div>
        <div class="section-title">选择产品查看版本差异</div>
        <p class="section-subtitle">按产品查看可选色号与肤色建议</p>
        <div class="versions-grid">
          ${productVersions.map(pv => `
            <a href="#versions?id=${pv.product_id}" class="version-card">
              <div class="version-card-left">
                <img src="${getProductImage(pv.product_id)}" alt="${pv.product_name}">
                <div class="version-card-info">
                  <div class="version-card-name">${pv.product_name}</div>
                  <div class="version-card-meta">${pv.brand} · ${pv.category}</div>
                  <div class="version-card-tag">${pv.versions.length} 个版本</div>
                  ${comparableCounts[pv.category] >= 2 ? `<div class="version-card-tag compare-ready">可跨品牌对比</div>` : ''}
                </div>
              </div>
              <div class="version-card-right">
                ${pv.versions.map(v => `
                  <div class="version-row">
                    <span class="version-id">${v.version_id}</span>
                    <span class="version-text">${v.name} · ${v.color}</span>
                  </div>
                `).join('')}
              </div>
            </a>
          `).join('')}
        </div>
        <div style="margin-top:2rem;text-align:center;">
          <a href="#versions-guide" class="btn btn-secondary">版本选择指南 →</a>
        </div>
      </div>
    `;
  }

  function renderVersionDetail(id) {
    const pv = productVersions.find(pv => pv.product_id === id);
    if (!pv) {
      app.innerHTML = '<div class="section"><p>未找到产品版本</p></div>';
      return;
    }
    const product = products.find(p => p.id === pv.product_id) || {};
    const productImage = product.image || getProductImage(pv.product_id);
    app.innerHTML = `
      <div class="section">
        <a href="#versions" class="back-link">← 返回版本对比</a>
        <div class="version-detail-hero">
          <div class="version-detail-image">
            <img src="${productImage}" alt="${pv.product_name}" onerror="this.src='${getProductImage(pv.product_id)}'">
          </div>
          <div class="version-detail-copy">
            <div class="section-label">✦ ${pv.brand} · ${pv.category}</div>
            <div class="section-title">${pv.product_name}</div>
            <p class="section-subtitle">共 ${pv.versions.length} 个版本，结合色卡、肤色建议和购买风险快速选择。</p>
            ${pv.comparison ? `
              <div class="version-detail-position">
                <span>决策定位</span>
                <strong>${pv.comparison.positioning}</strong>
                <p>${pv.comparison.best_for}</p>
              </div>
              <div class="compare-mini-tags">
                ${(pv.comparison.claims || []).map(item => `<span>${item}</span>`).join('')}
                ${(pv.comparison.risk_flags || []).slice(0, 2).map(item => `<span class="risk">${item}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>

        <div class="version-swatch-grid">
          ${pv.versions.map(v => `
            <div class="version-swatch-card">
              <div class="version-swatch" style="--swatch:${swatchForVersion(v, pv.category)};">
                <span></span>
              </div>
              <div class="version-swatch-info">
                <div class="version-swatch-id">${v.version_id}</div>
                <div class="version-swatch-name">${v.name}</div>
                <div class="version-swatch-color">${v.color}</div>
                <div class="version-swatch-meta">
                  <span>${v.适合肤色}</span>
                  <span>${v.特点}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:2rem;text-align:center;">
          <a href="#versions?compare=${encodeURIComponent(pv.category)}" class="btn btn-primary">跨品牌对比 →</a>
        </div>
      </div>
    `;
  }

  function renderVersionGuide() {
    app.innerHTML = `
      <div class="section">
        <a href="#versions" class="back-link">← 返回版本对比</a>
        <div class="section-label">✦ 版本选择指南</div>
        <div class="section-title">根据肤质选择</div>
        <table class="compare-table" style="margin-top:1.5rem;">
          <thead>
            <tr><th>肤质</th><th>推荐色号</th><th>注意事项</th></tr>
          </thead>
          <tbody>
            <tr><td>冷白皮</td><td>1C、N196</td><td>选择偏粉调</td></tr>
            <tr><td>暖白皮</td><td>1W1、277</td><td>选择偏黄调</td></tr>
            <tr><td>黄一白</td><td>1W2、507</td><td>百搭色系</td></tr>
            <tr><td>黄二白</td><td>3W2、888</td><td>避免粉色</td></tr>
            <tr><td>小麦色</td><td>深色系</td><td>选择饱和色</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  function renderVersionCompare(category) {
    const categoryProducts = productVersions.filter(pv => pv.category === category);
    const rows = categoryProducts.map(pv => ({
      ...pv,
      product: products.find(p => p.id === pv.product_id) || {},
      comparison: pv.comparison || {}
    }));
    app.innerHTML = `
      <div class="section">
        <a href="#versions" class="back-link">← 返回版本对比</a>
        <div class="section-label">✦ 跨品牌对比</div>
        <div class="section-title">${category} 版本对比</div>
        <p class="section-subtitle">在原有版本/色号信息基础上，补充价格、定位、适合人群、成分风险和 ESG 说明，适合现场快速讲清楚「为什么选它」。</p>

        ${rows.length < 2 ? `
          <div class="empty-state">
            <div class="empty-state-icon">↔</div>
            <p>${category} 暂无足够跨品牌样本，请先查看产品库或等待后续补充。</p>
          </div>
        ` : `
          <div class="compare-insight-card mt-3">
            <div class="compare-insight-label">AI 决策摘要</div>
            <div class="compare-insight-text">${compareSummary(category, rows)}</div>
          </div>

          <div class="compare-board mt-3">
            ${rows.map(row => `
              <article class="compare-product-card">
                <div class="compare-product-head">
                  <img src="${row.product.image || getProductImage(row.product_id)}" alt="${row.product_name}">
                  <div>
                    <div class="compare-brand">${row.brand}</div>
                    <h3>${row.product_name}</h3>
                    <div class="compare-price">${row.comparison.price_band || `¥${minPrice(row.product)}`}</div>
                  </div>
                </div>
                <div class="compare-position">${row.comparison.positioning || '产品定位待补充'}</div>
                <div class="compare-mini-tags">
                  ${(row.comparison.claims || []).map(item => `<span>${item}</span>`).join('')}
                </div>
                <dl class="compare-facts">
                  <div><dt>适合</dt><dd>${row.comparison.best_for || '暂无数据'}</dd></div>
                  <div><dt>慎选</dt><dd>${row.comparison.not_for || '暂无数据'}</dd></div>
                  <div><dt>成分</dt><dd>${row.comparison.formula_notes || '暂无数据'}</dd></div>
                  <div><dt>ESG</dt><dd>${row.comparison.esg_brief || '暂无数据'}</dd></div>
                </dl>
                <div class="compare-risk-row">
                  ${(row.comparison.risk_flags || []).map(item => `<span>${item}</span>`).join('')}
                </div>
                <div class="compare-version-row">
                  ${row.versions.map(v => `<span>${v.name} · ${v.适合肤色}</span>`).join('')}
                </div>
              </article>
            `).join('')}
          </div>

          <div class="compare-table-wrap mt-3">
            <table class="compare-table">
              <thead>
                <tr>
                  <th>品牌/产品</th>
                  <th>价格带</th>
                  <th>定位</th>
                  <th>适合人群</th>
                  <th>风险提示</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(row => `
                  <tr>
                    <td><strong>${row.brand}</strong><br><span>${row.product_name}</span></td>
                    <td>${row.comparison.price_band || '-'}</td>
                    <td>${row.comparison.positioning || '-'}</td>
                    <td>${row.comparison.best_for || '-'}</td>
                    <td>${(row.comparison.risk_flags || []).join('、') || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="compare-sources">
            <div class="compare-sources-title">资料来源</div>
            ${rows.map(row => `
              <div class="compare-source-group">
                <strong>${row.product_name}</strong>
                ${formatSources(row.comparison.sources || [])}
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  /* ── init ── */
  loadProducts().then(() => {
    loadVersions().then(() => {
      BUILTIN_PRODUCTS.forEach(bp => {
        bp.image = getProductImage(bp.id);
      });
      route();
    });
  });
});
