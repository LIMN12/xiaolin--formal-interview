// campus-hub 应用层（任务1：分类展示 + 质量提示）
// 职责：
// 1) 按 来源/类型/质量/状态 多维筛选与搜索
// 2) 卡片化渲染，来源与类型一眼可辨
// 3) 对广告/可疑信息给出风险提示
// 4) 收藏状态用 localStorage 保留（刷新后仍在）

(function () {
  'use strict';

  const { SOURCES, TYPES, QUALITIES, STATUS_LABELS, ACTIVITIES } = window.CampusData;

  // ---------- 状态 ----------
  const state = {
    source: 'all',        // all | official | student
    type: 'all',          // all | 类型 key
    quality: 'all',       // all | complete | partial | suspicious
    keyword: '',
    favs: loadFavs(),     // 已收藏 id 集合
  };

  // ---------- DOM ----------
  const els = {
    stats: document.getElementById('stats'),
    sourceTabs: document.getElementById('sourceTabs'),
    typeSelect: document.getElementById('typeSelect'),
    qualitySelect: document.getElementById('qualitySelect'),
    search: document.getElementById('search'),
    resetBtn: document.getElementById('resetBtn'),
    grid: document.getElementById('grid'),
    modalMask: document.getElementById('modalMask'),
    modalBody: document.getElementById('modalBody'),
  };

  // ---------- 工具函数 ----------
  function loadFavs() {
    try {
      return new Set(JSON.parse(localStorage.getItem('campushub_favs') || '[]'));
    } catch (e) {
      return new Set();
    }
  }

  function saveFavs() {
    localStorage.setItem('campushub_favs', JSON.stringify([...state.favs]));
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---------- 统计 ----------
  function renderStats(list) {
    const official = ACTIVITIES.filter((a) => a.source === 'official').length;
    const student = ACTIVITIES.filter((a) => a.source === 'student').length;
    const risk = ACTIVITIES.filter((a) => a.quality === 'suspicious').length;
    els.stats.innerHTML = `
      <div class="stat"><span class="dot" style="background:var(--primary)"></span>官方 <span class="num">${official}</span></div>
      <div class="stat"><span class="dot" style="background:var(--student)"></span>学生自发 <span class="num">${student}</span></div>
      <div class="stat"><span class="dot" style="background:var(--risk)"></span>风险提示 <span class="num">${risk}</span></div>
      <div class="stat">当前结果 <span class="num">${list.length}</span></div>
    `;
  }

  // ---------- 筛选 ----------
  function filterList() {
    const kw = state.keyword.trim().toLowerCase();
    return ACTIVITIES.filter((a) => {
      if (state.source !== 'all' && a.source !== state.source) return false;
      if (state.type !== 'all' && a.type !== state.type) return false;
      if (state.quality !== 'all' && a.quality !== state.quality) return false;
      if (kw) {
        const hay = (a.title + ' ' + a.raw + ' ' + (a.warning || '')).toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }

  // ---------- 渲染 ----------
  function qualityClass(q) {
    if (q === 'complete') return 'quality-ok';
    if (q === 'partial') return 'quality-warn';
    return 'quality-risk';
  }

  function renderCard(a) {
    const src = SOURCES[a.source];
    const type = TYPES[a.type];
    const q = QUALITIES[a.quality];
    const st = STATUS_LABELS[a.status] || { label: '', tone: 'muted' };
    const isRisk = a.quality === 'suspicious';
    const faved = state.favs.has(a.id);

    const linkHint = a.links && a.links.length
      ? `<span class="link-hint">关联编号：${a.links.join('、')}</span>`
      : '';

    return `
      <article class="card ${isRisk ? 'is-risk' : ''}" data-id="${a.id}">
        <div class="card-head">
          <span class="badge ${a.source}"><span class="dot"></span>${src.label}</span>
          <span class="badge type">${type.label}</span>
          <span class="badge ${qualityClass(a.quality)}">${q.label}</span>
          <span class="status ${st.tone}">${st.label}</span>
        </div>
        <h3 class="card-title">${escapeHtml(a.title)} <span class="card-id">№${a.id}</span></h3>
        <div class="info-list">
          <div class="info-row"><span class="k">时间</span><span class="v">${escapeHtml(a.time)}</span></div>
          <div class="info-row"><span class="k">报名</span><span class="v">${escapeHtml(a.deadline)}</span></div>
          <div class="info-row"><span class="k">地点</span><span class="v">${escapeHtml(a.place)}</span></div>
          <div class="info-row"><span class="k">对象</span><span class="v">${escapeHtml(a.audience)}</span></div>
        </div>
        ${isRisk && a.warning ? `
          <div class="warning-box">
            <strong>风险提示</strong>${escapeHtml(a.warning)}
          </div>` : ''}
        ${!isRisk && a.qualityNote ? `
          <div class="warning-box" style="background:var(--warn-soft);border-color:var(--warn);color:#92400e">
            <strong>信息提示</strong>${escapeHtml(a.qualityNote)}
          </div>` : ''}
        <div class="card-foot">
          ${linkHint || '<span></span>'}
          <div class="card-actions">
            <button class="icon-btn ${faved ? 'faved' : ''}" data-act="fav" data-id="${a.id}" title="收藏" aria-label="收藏">${faved ? '★' : '☆'}</button>
            <button class="icon-btn" data-act="detail" data-id="${a.id}" title="详情" aria-label="查看详情">≡</button>
          </div>
        </div>
      </article>`;
  }

  function render() {
    const list = filterList();
    renderStats(list);
    if (list.length === 0) {
      els.grid.innerHTML = `
        <div class="empty">
          <div class="big">∅</div>
          <div>没有符合当前筛选条件的信息</div>
          <div style="margin-top:8px">试着重置筛选或更换关键词</div>
        </div>`;
      return;
    }
    els.grid.innerHTML = list.map(renderCard).join('');
  }

  // ---------- 详情弹层 ----------
  function openDetail(id) {
    const a = ACTIVITIES.find((x) => x.id === id);
    if (!a) return;
    const src = SOURCES[a.source];
    const type = TYPES[a.type];
    const q = QUALITIES[a.quality];
    const st = STATUS_LABELS[a.status] || { label: '', tone: 'muted' };

    els.modalBody.innerHTML = `
      <h2>${escapeHtml(a.title)}</h2>
      <div class="modal-id">编号 №${a.id}</div>
      <div class="modal-badges">
        <span class="badge ${a.source}"><span class="dot"></span>${src.label}</span>
        <span class="badge type">${type.label}</span>
        <span class="badge ${qualityClass(a.quality)}">${q.label}</span>
        <span class="status ${st.tone}">${st.label}</span>
      </div>
      <div class="modal-body">
        <div class="info-list">
          <div class="info-row"><span class="k">时间</span><span class="v">${escapeHtml(a.time)}</span></div>
          <div class="info-row"><span class="k">报名</span><span class="v">${escapeHtml(a.deadline)}</span></div>
          <div class="info-row"><span class="k">地点</span><span class="v">${escapeHtml(a.place)}</span></div>
          <div class="info-row"><span class="k">对象</span><span class="v">${escapeHtml(a.audience)}</span></div>
          <div class="info-row"><span class="k">要求</span><span class="v">${escapeHtml(a.requirement)}</span></div>
          ${a.qualityNote ? `<div class="info-row"><span class="k">提示</span><span class="v">${escapeHtml(a.qualityNote)}</span></div>` : ''}
          ${a.links ? `<div class="info-row"><span class="k">关联</span><span class="v">编号 ${a.links.join('、')}</span></div>` : ''}
        </div>
        ${a.warning ? `
          <div class="warning-box" style="margin-top:12px">
            <strong>风险提示</strong>${escapeHtml(a.warning)}
          </div>` : ''}
        <div class="raw">
          <span class="label">原始信息</span>${escapeHtml(a.raw)}
        </div>
      </div>
      <button class="btn modal-close" id="modalCloseBtn">关闭</button>
    `;
    els.modalMask.classList.add('open');
    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  }

  function closeModal() {
    els.modalMask.classList.remove('open');
  }

  // ---------- 事件 ----------
  function bindSourceTabs() {
    els.sourceTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab');
      if (!btn) return;
      els.sourceTabs.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      btn.classList.add('active');
      state.source = btn.dataset.source;
      render();
    });
  }

  function bindFilters() {
    els.typeSelect.addEventListener('change', (e) => {
      state.type = e.target.value;
      render();
    });
    els.qualitySelect.addEventListener('change', (e) => {
      state.quality = e.target.value;
      render();
    });

    let searchTimer = null;
    els.search.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.keyword = e.target.value;
        render();
      }, 150);
    });

    els.resetBtn.addEventListener('click', () => {
      state.source = 'all';
      state.type = 'all';
      state.quality = 'all';
      state.keyword = '';
      els.sourceTabs.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      els.sourceTabs.querySelector('.tab[data-source="all"]').classList.add('active');
      els.typeSelect.value = 'all';
      els.qualitySelect.value = 'all';
      els.search.value = '';
      render();
    });
  }

  function bindGrid() {
    els.grid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.act === 'fav') {
        if (state.favs.has(id)) state.favs.delete(id);
        else state.favs.add(id);
        saveFavs();
        render();
      } else if (btn.dataset.act === 'detail') {
        openDetail(id);
      }
    });
  }

  function bindModal() {
    els.modalMask.addEventListener('click', (e) => {
      if (e.target === els.modalMask) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  // ---------- 初始化 ----------
  function init() {
    // 来源标签计数
    const counts = {
      all: ACTIVITIES.length,
      official: ACTIVITIES.filter((a) => a.source === 'official').length,
      student: ACTIVITIES.filter((a) => a.source === 'student').length,
    };
    els.sourceTabs.querySelectorAll('.tab').forEach((t) => {
      const c = counts[t.dataset.source];
      if (c !== undefined) t.querySelector('.count').textContent = c;
    });

    bindSourceTabs();
    bindFilters();
    bindGrid();
    bindModal();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
