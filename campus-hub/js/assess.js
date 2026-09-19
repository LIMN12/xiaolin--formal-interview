// assess.js —— 质量评估引擎（任务3）
// 对每条信息做五维评估：完整度 / 可信度 / 关联度 / 时效性 / 价值度
// 设计原则：
//   好信息 → 给出可评估、可讲解的评分卡（绿）+ 各维度说明
//   差信息/广告 → 给出提示与警告（黄/红），并列出具体风险点
//   题目未提供的信息不编造，缺失项如实标为"缺失"并计入扣分。

(function () {
  'use strict';

  const DIM_DEFS = [
    { key: 'completeness', label: '完整度', desc: '时间/地点/报名/对象/要求是否齐全' },
    { key: 'credibility', label: '可信度', desc: '来源是否明确、有无主办方、是否要求私下联系' },
    { key: 'relevance', label: '关联度', desc: '与校园学习/活动/组队的相关程度' },
    { key: 'timeliness', label: '时效性', desc: '信息是否当前有效、能否参与' },
    { key: 'value', label: '价值度', desc: '对学生的实际价值' },
  ];

  // 判断字段是否"缺失"（含"未注明/未提供/待定"等表述）
  function isMissing(v) {
    if (v === undefined || v === null) return true;
    const s = String(v).trim();
    if (!s) return true;
    return /未注明|未提供|未确定|待.*确认|待定|未注明/.test(s);
  }

  function tone(score) {
    if (score >= 4) return 'good';
    if (score >= 2.8) return 'warn';
    return 'risk';
  }

  // 完整度
  function scoreCompleteness(a) {
    const fields = [
      { name: '时间', val: a.time },
      { name: '地点', val: a.place },
      { name: '报名', val: a.deadline },
      { name: '对象', val: a.audience },
      { name: '要求', val: a.requirement },
    ];
    const missing = fields.filter((f) => isMissing(f.val));
    const got = fields.length - missing.length;
    let score = Math.round((got / fields.length) * 5 * 10) / 10;
    score = Math.max(1, Math.min(5, score));
    let note;
    if (missing.length === 0) {
      note = '时间/地点/报名/对象/要求关键字段齐全，可直接判断是否参与。';
    } else {
      note = `缺失或不明确：${missing.map((m) => m.name).join('、')}。建议向发布方确认后再参与。`;
    }
    return { score, status: tone(score), note };
  }

  // 可信度
  function scoreCredibility(a) {
    let score = 3;
    const notes = [];
    if (a.source === 'official') {
      score = 4.5;
      notes.push('由学院/官方发布，来源明确、可信度较高。');
    } else {
      score = 3;
      notes.push('学生个人发布，建议核实发布者身份与活动细节。');
    }
    if (a.type === 'ad') {
      score = 1;
      notes.push('内容含推广/购买链接或要求私下联系，可信度低。');
    }
    if (/私人微信|加微信|购买链接|商家优惠/.test(a.raw || '')) {
      score = Math.min(score, 1);
      notes.push('要求添加私人微信或正文含购买链接，存在风险。');
    }
    return { score, status: tone(score), note: notes.join('') };
  }

  // 关联度
  function scoreRelevance(a) {
    if (a.type === 'ad') {
      return { score: 1, status: 'risk', note: '内容主要为商品推广/兼职引流，与校园学习活动关联较弱。' };
    }
    return { score: 5, status: 'good', note: '与校园学习、活动、组队等直接相关。' };
  }

  // 时效性
  function scoreTimeliness(a) {
    const map = {
      today: { score: 5, note: '今日进行，当下可参与。' },
      upcoming: { score: 5, note: '即将开始，可及时参与。' },
      signing: { score: 4.5, note: '报名中，时效良好。' },
      longterm: { score: 4, note: '长期招募，时间灵活。' },
      available: { score: 4, note: '资料当前可用。' },
      waitlist: { score: 3, note: '报名已截止但可候补，建议到场尝试。' },
      ended: { score: 2, note: '直播已结束，回放待上传，仅可等回放。' },
      updated: { score: 4, note: '有补充通知，请关注最新安排。' },
      risk: { score: 1, note: '时效信息缺失，无法判断。' },
    };
    const r = map[a.status] || { score: 2, note: '时效状态不明确。' };
    return { score: r.score, status: tone(r.score), note: r.note };
  }

  // 价值度
  function scoreValue(a) {
    const map = {
      training: 5, competition: 5, workshop: 5, lecture: 5, studyGroup: 5,
      recruitment: 4, material: 4, supplement: 4, observation: 4, social: 3.5, ad: 1,
    };
    const score = map[a.type] != null ? map[a.type] : 3;
    let note;
    if (a.type === 'ad') {
      note = '推广类内容，对学生学习与成长价值有限。';
    } else if (['training', 'competition', 'workshop', 'lecture', 'studyGroup'].includes(a.type)) {
      note = '对技能提升、学习交流有直接价值。';
    } else {
      note = '提供参与、交流或资料获取机会，有一定价值。';
    }
    return { score, status: tone(score), note };
  }

  // 综合评估
  function assessActivity(a) {
    const dims = [
      Object.assign({}, DIM_DEFS[0], scoreCompleteness(a)),
      Object.assign({}, DIM_DEFS[1], scoreCredibility(a)),
      Object.assign({}, DIM_DEFS[2], scoreRelevance(a)),
      Object.assign({}, DIM_DEFS[3], scoreTimeliness(a)),
      Object.assign({}, DIM_DEFS[4], scoreValue(a)),
    ];
    const overall = Math.round((dims.reduce((s, d) => s + d.score, 0) / dims.length) * 10) / 10;

    let level, summary;
    if (a.quality === 'suspicious' || a.type === 'ad') {
      level = 'risk';
      summary = '该信息存在明显风险，不建议贸然参与，请仔细阅读下方风险点。';
    } else if (overall >= 4) {
      level = 'good';
      summary = '综合质量良好：来源可靠、信息较完整、与校园强相关，可放心了解与参与。';
    } else if (overall >= 2.8) {
      level = 'warn';
      summary = '质量一般：存在部分缺失或需留意之处，建议确认后再参与。';
    } else {
      level = 'risk';
      summary = '质量较低，参与前请谨慎判断。';
    }
    return { dims, overall, level, summary };
  }

  // 渲染评估卡 HTML（用于详情弹层）
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function stars(score) {
    const full = Math.round(score);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  function renderAssessment(a) {
    const r = assessActivity(a);
    const dimRows = r.dims
      .map((d) => `
        <div class="dim-row">
          <div class="dim-head">
            <span class="dim-label">${d.label}</span>
            <span class="dim-score ${d.status}">${d.score.toFixed(1)} <span class="dim-stars">${stars(d.score)}</span></span>
          </div>
          <div class="dim-note">${escapeHtml(d.note)}</div>
          <div class="dim-bar"><span class="dim-bar-fill ${d.status}" style="width:${(d.score / 5) * 100}%"></span></div>
        </div>`)
      .join('');

    // 风险点列表（仅风险项）
    const riskDims = r.dims.filter((d) => d.status === 'risk');
    const riskBox = (a.quality === 'suspicious' || a.type === 'ad' || riskDims.length)
      ? `<div class="assess-riskbox">
          <strong>提示与警告</strong>
          <ul>
            ${riskDims.map((d) => `<li><b>${d.label}</b>：${escapeHtml(d.note)}</li>`).join('')}
            ${a.warning ? `<li><b>风险说明</b>：${escapeHtml(a.warning)}</li>` : ''}
            ${a.type === 'ad' ? `<li><b>类型</b>：归类为推广/广告，与校园活动关联弱，谨慎对待。</li>` : ''}
          </ul>
        </div>`
      : '';

    return `
      <div class="assess-card ${r.level}">
        <div class="assess-top">
          <div>
            <div class="assess-title">质量评估</div>
            <div class="assess-summary">${escapeHtml(r.summary)}</div>
          </div>
          <div class="assess-overall">
            <div class="assess-score">${r.overall.toFixed(1)}</div>
            <div class="assess-max">/ 5.0</div>
          </div>
        </div>
        <div class="dim-list">${dimRows}</div>
        ${riskBox}
      </div>`;
  }

  window.CampusAssess = { DIM_DEFS, assessActivity, renderAssessment };
})();
