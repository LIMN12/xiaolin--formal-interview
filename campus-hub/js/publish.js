// publish.js —— 学生自主发布 + 发起组队（任务2）
// 职责：
// 1) 发布活动表单：学生可发布一般活动，带类型分类标签
// 2) 发起组队（核心）：生成一个"新的组队事务"，设置偏好条（滑块+标签），
//    该事务进入主列表、带"组队"标记，别人可点"申请加入"——
//    本质是"创建新事务"，不是从已有信息里筛选。
// 3) 内容存 localStorage，进入主列表正常使用流程

(function () {
  'use strict';

  const D = window.CampusData;
  const O = D.PUBLISH_OPTIONS;
  let App = null; // 由 app.js 注入

  // ---------- 通用 ----------
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function $(id) { return document.getElementById(id); }

  function openModal(maskId) { $(maskId).classList.add('open'); }
  function closeModal(maskId) { $(maskId).classList.remove('open'); }

  // 生成多选标签 chips
  function chips(name, options, selected = []) {
    return options
      .map((o) => {
        const val = typeof o === 'string' ? o : o.v;
        const txt = typeof o === 'string' ? o : o.t;
        const on = selected.includes(val) ? ' on' : '';
        return `<button type="button" class="chip${on}" data-group="${name}" data-val="${escapeHtml(val)}">${escapeHtml(txt)}</button>`;
      })
      .join('');
  }

  function selectedChips(container, name) {
    return Array.from(container.querySelectorAll(`.chip[data-group="${name}"].on`))
      .map((b) => b.dataset.val);
  }

  function bindChips(container) {
    container.addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (!b) return;
      b.classList.toggle('on');
    });
  }

  // 绑定滑块实时显示数值
  function bindRange(rangeId, labelId) {
    const r = $(rangeId), l = $(labelId);
    if (!r || !l) return;
    const sync = () => { l.textContent = r.value; };
    r.addEventListener('input', sync);
    sync();
  }

  // ============== 发布活动（一般活动） ==============
  function renderPublishForm() {
    const body = $('publishBody');
    const typeOpts = Object.values(D.TYPES)
      .filter((t) => t.key !== 'ad' && t.key !== 'supplement' && t.key !== 'teaming')
      .map((t) => `<option value="${t.key}">${t.label}</option>`)
      .join('');

    body.innerHTML = `
      <h2>发布活动</h2>
      <div class="form-hint">发布一般校园活动（讲座/约球/学习小组等），默认归类为"学生自发"，进入主列表。如需找队友，请用"发起组队"。</div>
      <div class="form-grid">
        <label class="frow full">
          <span class="flabel">标题 *</span>
          <input class="finput" id="pTitle" type="text" placeholder="如：周末羽毛球约球" />
        </label>
        <label class="frow">
          <span class="flabel">类型 *</span>
          <select class="finput" id="pType">${typeOpts}</select>
        </label>
        <label class="frow">
          <span class="flabel">时间</span>
          <input class="finput" id="pTime" type="text" placeholder="如：9月21日19:00" />
        </label>
        <label class="frow">
          <span class="flabel">报名/截止</span>
          <input class="finput" id="pDeadline" type="text" placeholder="如：满员即止" />
        </label>
        <label class="frow">
          <span class="flabel">地点</span>
          <input class="finput" id="pPlace" type="text" placeholder="如：操场 / 线上" />
        </label>
        <label class="frow">
          <span class="flabel">面向对象</span>
          <input class="finput" id="pAudience" type="text" placeholder="如：全校学生" />
        </label>
        <label class="frow full">
          <span class="flabel">说明/要求</span>
          <textarea class="finput tarea" id="pReq" placeholder="人数、费用、其他要求"></textarea>
        </label>
        <label class="frow full">
          <span class="flabel">联系方式（建议公开渠道，勿填私人微信）</span>
          <input class="finput" id="pContact" type="text" placeholder="如：扫码进群 / 留言" />
        </label>
      </div>
      <div class="form-actions">
        <button class="btn" id="pCancel">取消</button>
        <button class="btn primary" id="pSubmit">发布</button>
      </div>
      <div class="form-msg" id="pMsg"></div>
    `;

    $('pCancel').onclick = () => closeModal('publishMask');
    $('pSubmit').onclick = handlePublish;
  }

  function handlePublish() {
    const msg = $('pMsg');
    msg.textContent = ''; msg.className = 'form-msg';
    const title = $('pTitle').value.trim();
    if (!title) { msg.textContent = '请填写标题。'; msg.classList.add('err'); return; }

    const contact = $('pContact').value.trim();
    if (/私人微信|加微信|购买链接|代购|兼职日结/.test(contact)) {
      msg.textContent = '联系方式疑似推广/引流，请改为公开渠道（如群二维码、留言）。';
      msg.classList.add('err'); return;
    }

    const list = D.loadUserPublished();
    const id = 'U' + String(Date.now()).slice(-6);
    const filled = [$('pTime').value, $('pPlace').value, $('pDeadline').value, $('pAudience').value].filter(Boolean).length;
    const item = {
      id, title, source: 'student', type: $('pType').value,
      time: $('pTime').value.trim() || '未注明',
      deadline: $('pDeadline').value.trim() || '未注明',
      place: $('pPlace').value.trim() || '未注明',
      audience: $('pAudience').value.trim() || '未注明',
      requirement: $('pReq').value.trim() || '未注明',
      contact,
      raw: [title, $('pTime').value, $('pPlace').value, $('pAudience').value, $('pReq').value].filter(Boolean).join('；'),
      quality: filled >= 4 ? 'complete' : 'partial',
      qualityNote: filled >= 4 ? '学生自主发布，关键字段较完整。' : '学生自主发布，部分字段缺失，建议核实后参与。',
      status: 'signing',
    };
    list.push(item);
    D.saveUserPublished(list);

    msg.textContent = '发布成功，已加入主列表（可在"我发布的"查看）。';
    msg.classList.add('ok');
    if (App && App.refresh) App.refresh();
    setTimeout(() => closeModal('publishMask'), 800);
  }

  // ============== 发起组队（生成新事务 + 偏好条） ==============
  function renderTeamForm() {
    const body = $('matchBody');
    body.innerHTML = `
      <h2>发起组队</h2>
      <div class="form-hint">生成一条新的组队事务，设置偏好条后进入主列表，带"组队"标记，别人看到后可点"申请加入"你。这是创建新事务，不是从已有信息筛选。</div>
      <div class="form-grid">
        <label class="frow full">
          <span class="flabel">组队标题 *</span>
          <input class="finput" id="tTitle" type="text" placeholder="如：周末做前端项目，找2位队友" />
        </label>
        <label class="frow full">
          <span class="flabel">方向 / 简介</span>
          <textarea class="finput tarea" id="tDesc" placeholder="要做什么、目标、分工等"></textarea>
        </label>
        <label class="frow">
          <span class="flabel">计划开始时间</span>
          <input class="finput" id="tTime" type="text" placeholder="如：9月25日开始" />
        </label>
        <label class="frow">
          <span class="flabel">报名/截止</span>
          <input class="finput" id="tDeadline" type="text" placeholder="如：满员即止" />
        </label>
      </div>

      <div class="form-section">
        <div class="fs-title">偏好条 <small>（作为该组队帖的招募条件展示）</small></div>

        <div class="range-row">
          <div class="range-item">
            <div class="range-head"><span>队伍人数</span><span class="range-val" id="teamSizeVal">3</span><span class="range-unit">人</span></div>
            <input type="range" min="1" max="8" value="3" class="slider" id="teamSize" />
          </div>
          <div class="range-item">
            <div class="range-head"><span>每周投入</span><span class="range-val" id="weeklyHoursVal">4</span><span class="range-unit">小时</span></div>
            <input type="range" min="1" max="20" value="4" class="slider" id="weeklyHours" />
          </div>
        </div>

        <div class="fs-sub">需招募角色</div>
        <div class="chip-row" id="tRoles">${chips('troles', O.roles)}</div>
        <div class="fs-sub">技能 / 方向</div>
        <div class="chip-row" id="tSkills">${chips('tskills', O.skills)}</div>
        <div class="fs-sub">时间段</div>
        <div class="chip-row" id="tTimes">${chips('ttimes', O.times)}</div>
        <div class="fs-sub">基础要求</div>
        <div class="chip-row" id="tLevel">${chips('tlevel', O.levels)}</div>
      </div>

      <label class="frow full" style="margin-top:14px">
        <span class="flabel">联系方式（建议公开渠道，勿填私人微信）</span>
        <input class="finput" id="tContact" type="text" placeholder="如：扫码进群 / 留言" />
      </label>

      <div class="form-actions">
        <button class="btn" id="tCancel">取消</button>
        <button class="btn primary" id="tSubmit">发起组队</button>
      </div>
      <div class="form-msg" id="tMsg"></div>
    `;

    bindRange('teamSize', 'teamSizeVal');
    bindRange('weeklyHours', 'weeklyHoursVal');
    bindChips($('tRoles'));
    bindChips($('tSkills'));
    bindChips($('tTimes'));
    bindChips($('tLevel'));

    $('tCancel').onclick = () => closeModal('matchMask');
    $('tSubmit').onclick = handleTeam;
  }

  function handleTeam() {
    const msg = $('tMsg');
    msg.textContent = ''; msg.className = 'form-msg';
    const title = $('tTitle').value.trim();
    if (!title) { msg.textContent = '请填写组队标题。'; msg.classList.add('err'); return; }

    const contact = $('tContact').value.trim();
    if (/私人微信|加微信|购买链接|代购|兼职日结/.test(contact)) {
      msg.textContent = '联系方式疑似推广/引流，请改为公开渠道。';
      msg.classList.add('err'); return;
    }

    const body = $('matchBody');
    const roles = selectedChips(body, 'troles');
    const skills = selectedChips(body, 'tskills');
    const times = selectedChips(body, 'ttimes');
    const level = selectedChips(body, 'tlevel')[0] || 'all';
    const teamSize = parseInt($('teamSize').value, 10);
    const weeklyHours = parseInt($('weeklyHours').value, 10);

    const prefs = { teamSize, weeklyHours, roles, skills, times, level };

    const list = D.loadUserPublished();
    const id = 'T' + String(Date.now()).slice(-6);
    const item = {
      id, title, source: 'student', type: 'teaming',
      time: $('tTime').value.trim() || '未注明',
      deadline: $('tDeadline').value.trim() || '满员即止',
      place: '见简介/协商',
      audience: `${teamSize}人队 · ${O.levels.find((x) => x.v === level).t}`,
      requirement: $('tDesc').value.trim() || '见简介',
      contact,
      prefs,
      raw: [title, $('tDesc').value, `队伍${teamSize}人`, `周投入${weeklyHours}h`, roles.join('/'), skills.join('/')].filter(Boolean).join('；'),
      quality: 'complete',
      qualityNote: '组队事务，偏好条已设置，可被其他同学申请加入。',
      status: 'signing',
    };
    list.push(item);
    D.saveUserPublished(list);

    msg.textContent = '组队事务已创建，进入主列表，等待队友申请加入。';
    msg.classList.add('ok');
    if (App && App.refresh) App.refresh();
    setTimeout(() => closeModal('matchMask'), 900);
  }

  // ============== 入口 ==============
  function init() {
    App = window.CampusApp || { refresh() {}, openDetail() {} };
    $('publishBtn').addEventListener('click', () => { renderPublishForm(); openModal('publishMask'); });
    $('teamBtn').addEventListener('click', () => { renderTeamForm(); openModal('matchMask'); });
    $('publishMask').addEventListener('click', (e) => { if (e.target === $('publishMask')) closeModal('publishMask'); });
    $('matchMask').addEventListener('click', (e) => { if (e.target === $('matchMask')) closeModal('matchMask'); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeModal('publishMask'); closeModal('matchMask'); }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
