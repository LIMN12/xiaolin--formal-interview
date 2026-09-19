// campus-hub 应用层（任务1/2/3）
// 职责：
// 1) 按 来源/类型/质量/状态 多维筛选与搜索
// 2) 卡片化渲染，来源与类型一眼可辨
// 3) 对广告/可疑信息给出风险提示（任务3详情弹层给出五维评估卡）
// 4) 收藏状态用 localStorage 保留（刷新后仍在）
// 5) 合并官方 26 条 + 学生自主发布，统一进入列表（任务2）

(function () {
  'use strict';

  const Data = window.CampusData;
  const { SOURCES, TYPES, QUALITIES, STATUS_LABELS } = Data;
  const O = Data.PUBLISH_OPTIONS;
  const Assess = window.CampusAssess;

  // 合并列表：官方 26 条 + 用户发布
  function getAll() { return Data.getAllActivities(); }

  // ---------- 状态 ----------
  const state = {
    source: 'all',        // all | official | student | mine
    type: 'all',          // all | 类型 key
    quality: 'all',       // all | complete | partial | suspicious
    keyword: '',
    favs: loadFavs(),     // 已收藏 id 集合
    applied: loadApplied(), // 已申请加入的组队 id 集合
    expanded: new Set(),  // 本次会话已展开的风险卡 id
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

  function loadApplied() {
    try {
      return new Set(JSON.parse(localStorage.getItem('campushub_applied') || '[]'));
    } catch (e) {
      return new Set();
    }
  }

  function saveApplied() {
    localStorage.setItem('campushub_applied', JSON.stringify([...state.applied]));
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---------- 统计 ----------
  function renderStats(filtered) {
    const all = getAll();
    const official = all.filter((a) => a.source === 'official').length;
    const student = all.filter((a) => a.source === 'student').length;
    const mine = all.filter((a) => a.userPublished).length;
    const risk = all.filter((a) => a.quality === 'suspicious').length;
    els.stats.innerHTML = `
      <div class="stat"><span class="dot" style="background:var(--primary)"></span>官方 <span class="num">${official}</span></div>
      <div class="stat"><span class="dot" style="background:var(--student)"></span>学生自发 <span class="num">${student}</span></div>
      <div class="stat"><span class="dot" style="background:#7c3aed"></span>我发布的 <span class="num">${mine}</span></div>
      <div class="stat"><span class="dot" style="background:var(--risk)"></span>风险提示 <span class="num">${risk}</span></div>
      <div class="stat">当前结果 <span class="num">${filtered.length}</span></div>
    `;
  }

  // ---------- 筛选 ----------
  function filterList() {
    const kw = state.keyword.trim().toLowerCase();
    return getAll().filter((a) => {
      if (state.source === 'mine') { if (!a.userPublished) return false; }
      else if (state.source !== 'all' && a.source !== state.source) return false;
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
    const type = TYPES[a.type] || { label: a.type };
    const q = QUALITIES[a.quality];
    const st = STATUS_LABELS[a.status] || { label: '', tone: 'muted' };
    const isRisk = a.quality === 'suspicious' || a.type === 'ad';
    const faved = state.favs.has(a.id);

    // 广告治理：风险/广告/被举报≥2 → 默认折叠
    const reports = Data.reportCount(a.id);
    const collapsed = (a.quality === 'suspicious' || a.type === 'ad' || reports >= 2) && !state.expanded.has(a.id);

    if (collapsed) {
      return `
        <article class="card risk-collapse" data-id="${a.id}">
          <button class="collapse-banner" data-act="expand" data-id="${a.id}">
            <span class="cb-icon">⚠</span>
            <span class="cb-text">
              <strong>${escapeHtml(a.title)}</strong>
              <span class="cb-sub">疑似广告/推广${reports ? ` · 被举报 ${reports} 次` : ''} · 已折叠，点击展开</span>
            </span>
          </button>
        </article>`;
    }

    const linkHint = a.links && a.links.length
      ? `<span class="link-hint">关联编号：${a.links.join('、')}</span>`
      : '';

    const mineBadge = a.userPublished
      ? `<span class="badge mine"><span class="dot"></span>我发布的</span>`
      : '';

    // 组队事务：偏好条 + 申请加入
    const isTeaming = a.type === 'teaming' && a.prefs;
    const applied = state.applied.has(a.id);
    const teamBlock = isTeaming ? (() => {
      const p = a.prefs;
      const lvl = O.levels.find((x) => x.v === p.level);
      const levelTxt = lvl ? lvl.t : '不限';
      return `
        <div class="prefs">
          <div class="prefs-bars">
            <div class="pref-bar"><span class="pk">队伍人数</span><span class="pv">${p.teamSize} 人</span><span class="pbar"><span style="width:${(p.teamSize / 8) * 100}%"></span></span></div>
            <div class="pref-bar"><span class="pk">每周投入</span><span class="pv">${p.weeklyHours} h</span><span class="pbar"><span style="width:${(p.weeklyHours / 20) * 100}%"></span></span></div>
          </div>
          ${p.roles && p.roles.length ? `<div class="pref-row"><span class="pk">招募角色</span>${p.roles.map((r) => `<span class="pref-tag">${escapeHtml(r)}</span>`).join('')}</div>` : ''}
          ${p.skills && p.skills.length ? `<div class="pref-row"><span class="pk">技能方向</span>${p.skills.map((r) => `<span class="pref-tag">${escapeHtml(r)}</span>`).join('')}</div>` : ''}
          ${p.times && p.times.length ? `<div class="pref-row"><span class="pk">时间段</span>${p.times.map((r) => `<span class="pref-tag">${escapeHtml(r)}</span>`).join('')}</div>` : ''}
          <div class="pref-row"><span class="pk">基础</span><span class="pref-tag">${escapeHtml(levelTxt)}</span></div>
        </div>`;
    })() : '';

    const applyBtn = isTeaming
      ? (applied
        ? `<button class="btn small applied" disabled>已申请</button>`
        : `<button class="btn small primary" data-act="apply" data-id="${a.id}">申请加入</button>`)
      : '';

    return `
      <article class="card ${isRisk ? 'is-risk' : ''} ${a.userPublished ? 'is-mine' : ''} ${isTeaming ? 'is-teaming' : ''}" data-id="${a.id}">
        <div class="card-head">
          <span class="badge ${a.source}"><span class="dot"></span>${src.label}</span>
          ${mineBadge}
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
        ${teamBlock}
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
            ${applyBtn}
            ${a.userPublished ? `<button class="icon-btn" data-act="del" data-id="${a.id}" title="删除" aria-label="删除">✕</button>` : ''}
            ${!a.userPublished ? `<button class="icon-btn" data-act="report" data-id="${a.id}" title="举报广告" aria-label="举报">!</button>` : ''}
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
    const a = getAll().find((x) => x.id === id);
    if (!a) return;
    const src = SOURCES[a.source];
    const type = TYPES[a.type];
    const q = QUALITIES[a.quality];
    const st = STATUS_LABELS[a.status] || { label: '', tone: 'muted' };
    const assessHtml = Assess ? Assess.renderAssessment(a) : '';

    els.modalBody.innerHTML = `
      <h2>${escapeHtml(a.title)}</h2>
      <div class="modal-id">编号 №${a.id}</div>
      <div class="modal-badges">
        <span class="badge ${a.source}"><span class="dot"></span>${src.label}</span>
        ${a.userPublished ? '<span class="badge mine"><span class="dot"></span>我发布的</span>' : ''}
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
          ${a.contact ? `<div class="info-row"><span class="k">联系</span><span class="v">${escapeHtml(a.contact)}</span></div>` : ''}
          ${a.qualityNote ? `<div class="info-row"><span class="k">提示</span><span class="v">${escapeHtml(a.qualityNote)}</span></div>` : ''}
          ${a.links ? `<div class="info-row"><span class="k">关联</span><span class="v">编号 ${a.links.join('、')}</span></div>` : ''}
        </div>
        ${assessHtml}
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
      const act = btn.dataset.act;
      if (act === 'fav') {
        if (state.favs.has(id)) state.favs.delete(id);
        else state.favs.add(id);
        saveFavs();
        render();
      } else if (act === 'del') {
        deleteUserItem(id);
      } else if (act === 'detail') {
        openDetail(id);
      } else if (act === 'expand') {
        state.expanded.add(id);
        render();
      } else if (act === 'apply') {
        state.applied.add(id);
        saveApplied();
        render();
        const a = getAll().find((x) => x.id === id);
        if (a) {
          const tip = a.contact ? `已申请加入「${a.title}」，请联系发起人：${a.contact}` : `已申请加入「${a.title}」，请在详情中联系发起人。`;
          alert(tip);
        }
      } else if (act === 'report') {
        reportItem(id);
      }
    });
  }

  // 删除用户自己发布的信息
  function deleteUserItem(id) {
    const list = Data.loadUserPublished().filter((x) => x.id !== id);
    Data.saveUserPublished(list);
    if (state.favs.has(id)) { state.favs.delete(id); saveFavs(); }
    if (state.applied.has(id)) { state.applied.delete(id); saveApplied(); }
    render();
  }

  // 举报广告（任务3 广告治理）
  function reportItem(id) {
    const map = Data.loadReports();
    map[id] = (map[id] || 0) + 1;
    Data.saveReports(map);
    const n = map[id];
    const a = getAll().find((x) => x.id === id);
    if (a && a.type === 'ad' && n === 1) {
      alert(`已举报「${a.title}」（第 ${n} 次）。该信息将被折叠展示。`);
    } else if (n >= 2) {
      alert(`已举报「${a.title}」（累计 ${n} 次）。已触发折叠治理。`);
    } else {
      alert(`已举报「${a.title}」（第 ${n} 次）。累计达 2 次将自动折叠。`);
    }
    render();
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
  function refresh() { render(); }

  function init() {
    // 来源标签计数
    const all = getAll();
    const counts = {
      all: all.length,
      official: all.filter((a) => a.source === 'official').length,
      student: all.filter((a) => a.source === 'student').length,
      mine: all.filter((a) => a.userPublished).length,
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

    // 暴露 API 供 publish.js 调用
    window.CampusApp = { refresh, openDetail };
  }

  document.addEventListener('DOMContentLoaded', init);
})();
