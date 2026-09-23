/* =====================================================================
   CampusHub · Showcase 数据层
   从 GitHub 仓库 LIMN12/xiaolin--formal-interview 调取相关事项数据
   策略：实时 fetch GitHub REST API（公开仓库无需 token） → 失败回退快照
   快照同步时间：2026-09-19
   ===================================================================== */

const REPO = { owner: "LIMN12", repo: "xiaolin--formal-interview" };
const API = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}`;

/* ---------- 数据快照（fetch 失败 / file:// 直开时使用） ---------- */
const SNAPSHOT = {
  repo: {
    name: "xiaolin--formal-interview",
    full_name: "LIMN12/xiaolin--formal-interview",
    owner_login: "LIMN12",
    owner_avatar: "https://avatars.githubusercontent.com/u/299127568?v=4",
    owner_profile: "https://github.com/LIMN12",
    description: "校园活动台 CampusHub —— 校园活动信息分类平台",
    created_at: "2026-09-19T06:28:11Z",
    pushed_at: "2026-09-19T07:00:55Z",
    public_repos: 8,
    html_url: "https://github.com/LIMN12/xiaolin--formal-interview",
  },
  commits: [
    { sha: "4eeab74ed3287918247c0fc30b1a0ac0f33b6bbe", short: "4eeab74",
      message: "第二版：活动组队，偏好条设置",
      date: "2026-09-19T07:00:55Z", author: "LIMN12", role: "v2" },
    { sha: "09442f7c7f40e204f1829bafa3021776fa39fa89", short: "09442f7",
      message: "添加 README 与 .gitignore",
      date: "2026-09-19T06:32:40Z", author: "LIMN12", role: "docs" },
    { sha: "1695eb6bc9b2b10840b56289b9517918fd2f586e", short: "1695eb6",
      message: "第一个版本；信息初步分类与质量初步评估",
      date: "2026-09-19T06:28:11Z", author: "LIMN12", role: "v1" },
  ],
  files: [
    { name: ".gitignore", path: ".gitignore", type: "file", size: 301 },
    { name: "README.md", path: "README.md", type: "file", size: 9486 },
    { name: "campus-hub", path: "campus-hub", type: "dir", size: 0 },
  ],
  counts: { commits: 3, files: 3, issues: 0, pulls: 0, releases: 0 },
};

/* ---------- 工具 ---------- */
const fmt = {
  date(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
  },
  time(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
  },
  bytes(n) {
    if (!n) return "—";
    if (n < 1024) return n + " B";
    return (n / 1024).toFixed(1) + " KB";
  },
};

/* ---------- 调取 GitHub 数据 ---------- */
async function loadGitHub() {
  try {
    const [repoR, commitsR, filesR, issuesR, pullsR, releasesR] = await Promise.all([
      fetch(API).then(r => r.json()),
      fetch(API + "/commits?per_page=20").then(r => r.json()),
      fetch(API + "/contents/").then(r => r.json()),
      fetch(API + "/issues?state=all&per_page=30").then(r => r.json()),
      fetch(API + "/pulls?state=all&per_page=30").then(r => r.json()),
      fetch(API + "/releases?per_page=20").then(r => r.json()),
    ]);
    // GitHub REST 的 issues 端点会包含 PR，过滤掉 pull_request 字段
    const pureIssues = Array.isArray(issuesR) ? issuesR.filter(i => !i.pull_request) : [];
    return {
      repo: {
        name: repoR.name, full_name: repoR.full_name,
        owner_login: repoR.owner.login,
        owner_avatar: repoR.owner.avatar_url,
        owner_profile: repoR.owner.html_url,
        description: repoR.description || "校园活动台 CampusHub",
        created_at: repoR.created_at, pushed_at: repoR.pushed_at,
        public_repos: repoR.owner.public_repos || 8,
        html_url: repoR.html_url,
      },
      commits: (commitsR || []).map(c => ({
        sha: c.sha, short: c.sha.slice(0, 7),
        message: c.commit.message, date: c.commit.author.date,
        author: c.author ? c.author.login : (c.commit.author.name),
      })),
      files: (filesR || []).map(f => ({ name: f.name, path: f.path, type: f.type, size: f.size || 0 })),
      counts: {
        commits: commitsR.length, files: filesR.length,
        issues: pureIssues.length, pulls: pullsR.length, releases: releasesR.length,
      },
    };
  } catch (e) {
    // file:// 直开或网络受限：回退快照
    console.warn("[showcase] GitHub 实时拉取失败，使用本地快照。", e);
    return SNAPSHOT;
  }
}

/* ---------- SVG 复古插画（替代位图插图） ---------- */
const ILL = {
  // 星形（图3 装饰）
  star: (fill) => `<svg class="ill-star" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 4 L39 24 L60 24 L43 37 L49 58 L32 45 L15 58 L21 37 L4 24 L25 24 Z" fill="${fill}" stroke="#1A0A00" stroke-width="2"/>
    <circle cx="32" cy="30" r="5" fill="#8B2500"/>
  </svg>`,
  // 太阳星（图3 左下）
  sunstar: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    ${Array.from({length:12},(_,i)=>`<rect x="48" y="2" width="4" height="20" fill="#CC5500" transform="rotate(${i*30} 50 50)"/>`).join("")}
    <circle cx="50" cy="50" r="14" fill="#8B2500" stroke="#1A0A00" stroke-width="2"/>
    <circle cx="50" cy="50" r="6" fill="#B8860B"/>
  </svg>`,
  // 条纹色块图（图库用）
  stripeBlock: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <rect width="200" height="120" fill="#8B2500"/>
    <rect y="20" width="200" height="14" fill="#B8860B"/>
    <rect y="44" width="200" height="10" fill="#6B8E23"/>
    <rect y="60" width="200" height="18" fill="#D2B48C"/>
    <rect y="84" width="200" height="12" fill="#191970"/>
    <rect y="100" width="200" height="20" fill="#CC5500"/>
  </svg>`,
  // 小号手剪影（致敬图3 主体）
  trumpeter: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#1A0A00"/>
    <circle cx="70" cy="80" r="22" fill="#B8860B"/>
    <rect x="60" y="100" width="22" height="60" fill="#CC5500"/>
    <rect x="55" y="158" width="32" height="6" fill="#6B8E23"/>
    <path d="M82 95 L150 70 L150 86 L82 110 Z" fill="#DAA520" stroke="#1A0A00" stroke-width="2"/>
    <circle cx="150" cy="78" r="14" fill="#8B2500" stroke="#1A0A00" stroke-width="2"/>
    <rect x="40" y="120" width="10" height="40" fill="#6B8E23"/>
  </svg>`,
  // 复古海报色块（Hero 背景）
  heroField: `<svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs><pattern id="hs" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="1.2" fill="#1A0A00" opacity="0.18"/>
    </pattern></defs>
    <rect width="800" height="600" fill="#1A0A00"/>
    ${Array.from({length:8},(_,i)=>`<rect y="${i*75}" width="800" height="75" fill="${["#8B2500","#6B1F00","#B8860B","#6B8E23","#CC5500","#191970","#1A0A00","#8B2500"][i]}" opacity="0.92"/>`).join("")}
    <rect width="800" height="600" fill="url(#hs)"/>
    <circle cx="640" cy="180" r="90" fill="#DAA520" opacity="0.85"/>
    <circle cx="640" cy="180" r="50" fill="#8B2500"/>
  </svg>`,
};

/* ---------- 校园活动数据（按日期组织，供日历展示） ---------- */
// 来源：campus-hub 26 条题目信息中可提取出明确日期的活动
// 字段：date（月-日）、title、time、type
const EVENTS = [
  { date: "9-18",  title: "编程竞赛直播", time: "19:30（已结束，回放9.20上传）", type: "竞赛" },
  { date: "9-19",  title: "AI应用入门公开课", time: "19:00", type: "讲座" },
  { date: "9-19",  title: "项目经验分享会", time: "15:00—16:30", type: "分享" },
  { date: "9-19",  title: "学习小组首次活动", time: "19:30", type: "学习小组" },
  { date: "9-20",  title: "某活动宣讲", time: "14:30", type: "宣讲" },
  { date: "9-20",  title: "某讲座", time: "19:00", type: "讲座" },
  { date: "9-20",  title: "某工作坊", time: "16:00", type: "工作坊" },
  { date: "9-21",  title: "蓝桥杯训练营首训", time: "19:30", type: "训练营" },
  { date: "9-21",  title: "某团队招募说明会", time: "19:00—20:30", type: "招募" },
  { date: "9-21",  title: "某组队线下活动", time: "19:00—20:30", type: "组队" },
  { date: "9-21",  title: "某社交活动", time: "晚上", type: "交流" },
  { date: "9-21",  title: "某观摩活动", time: "15:00", type: "观摩" },
  { date: "9-22",  title: "创新团队招募截止", time: "18:00", type: "截止" },
  { date: "9-23",  title: "学习小组开班", time: "每周三19:30（共6周）", type: "学习小组" },
  { date: "9-23",  title: "某竞赛创意方案截止", time: "23:59", type: "截止" },
  { date: "9-24",  title: "蓝桥杯报名截止", time: "22:00", type: "截止" },
  { date: "9-27",  title: "志愿服务活动", time: "8:30—17:00", type: "志愿" },
  { date: "9-30",  title: "某竞赛最终作品提交", time: "截止", type: "截止" },
  { date: "10-5",  title: "某竞赛报名截止", time: "23:59", type: "截止" },
  { date: "10-20", title: "某竞赛作品提交", time: "截止", type: "截止" },
];

/* ---------- 渲染：页面1 活动日历（单月大日历 + 悬浮详情 + 持续添加） ---------- */
const CAL = { year: 2026, month: 9 }; // 当前显示月（9=九月）
const STORAGE_KEY = "campushub_custom_events";
let popupCurrentDate = null; // 悬浮框当前选中的日期

// 合并基础活动 + localStorage 自定义活动
function getAllEvents() {
  let custom = [];
  try { custom = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch (e) { custom = []; }
  return [...EVENTS, ...custom];
}

// 保存自定义活动到 localStorage
function saveCustomEvent(ev) {
  let custom = [];
  try { custom = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch (e) { custom = []; }
  custom.push(ev);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
}

// 渲染连续 3 个月日历（中间为当前月，左右各一月）
function renderMonthCalendar() {
  const all = getAllEvents();
  const map = {};
  all.forEach(e => { if (!map[e.date]) map[e.date] = []; map[e.date].push(e); });
  const lvl = n => n === 0 ? "" : n === 1 ? "cal-day--lvl1" : n === 2 ? "cal-day--lvl2" : "cal-day--lvl3";
  const dow = ["S","M","T","W","T","F","S"];
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const y = CAL.year, m = CAL.month; // m: 1-12

  // 月份标签（显示中间月）
  const label = document.querySelector("[data-cal-month]");
  if (label) label.textContent = monthNames[m - 1] + " " + y;

  // 生成连续 3 个月：上一月、当前月、下一月
  const months = [];
  for (let offset = -1; offset <= 1; offset++) {
    let mm = m + offset, yy = y;
    if (mm < 1) { mm = 12; yy--; }
    if (mm > 12) { mm = 1; yy++; }
    months.push({ y: yy, m: mm, focus: offset === 0 });
  }

  const grid = document.querySelector("[data-cal-big]");
  if (!grid) return;

  grid.innerHTML = months.map(mo => {
    const days = new Date(mo.y, mo.m, 0).getDate();
    const firstDay = new Date(mo.y, mo.m - 1, 1).getDay();
    let cells = dow.map(d => `<span class="cal-dow">${d}</span>`).join("");
    for (let i = 0; i < firstDay; i++) cells += `<span class="cal-day cal-day--empty"></span>`;
    for (let day = 1; day <= days; day++) {
      const k = mo.m + "-" + day;
      const list = map[k] || [];
      const n = list.length;
      const dots = n > 0 ? `<span class="cal-day__dots">${list.slice(0,3).map(()=>'<span class="cal-day__dot"></span>').join("")}</span>` : "";
      cells += `<span class="cal-day ${lvl(n)}" data-date="${k}" data-year="${mo.y}">
        <span class="cal-day__num">${day}</span>
        ${dots}
      </span>`;
    }
    return `<div class="cal-month ${mo.focus ? "cal-month--focus" : ""}">
      <div class="cal-month__name">${monthNames[mo.m - 1]} ${mo.y}</div>
      <div class="cal-month__grid">${cells}</div>
    </div>`;
  }).join("");

  // 绑定点击事件
  grid.querySelectorAll(".cal-day:not(.cal-day--empty)").forEach(cell => {
    cell.addEventListener("click", () => showPopup(cell.dataset.date, Number(cell.dataset.year)));
  });
}

// 悬浮显示当天活动（居中 modal）
function showPopup(dateStr, year) {
  const all = getAllEvents();
  const list = all.filter(e => e.date === dateStr);
  const [m, d] = dateStr.split("-").map(Number);
  const y = year || CAL.year;
  const dateObj = new Date(y, m - 1, d);
  const dateLabel = dateObj.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

  document.getElementById("popupDate").textContent = dateLabel;
  const body = document.getElementById("popupBody");
  if (list.length === 0) {
    body.innerHTML = `<div class="cal-popup__empty">当日暂无活动<br>点击下方按钮添加</div>`;
  } else {
    body.innerHTML = list.map(e =>
      `<div class="cal-popup__item">
        <div class="cal-popup__item-title">${e.title}</div>
        <div class="cal-popup__item-meta"><span class="t">${e.type}</span>${e.time}</div>
      </div>`).join("");
  }

  document.getElementById("calPopup").hidden = false;
  popupCurrentDate = dateStr;
}

// 关闭悬浮框
function closePopup() {
  document.getElementById("calPopup").hidden = true;
}

// 添加活动（prompt 输入，写入 localStorage，刷新日历）
function addEventForDate(dateStr) {
  const title = prompt("请输入活动名称：");
  if (!title) return;
  const time = prompt("请输入活动时间（如 19:00 或 全天）：") || "待定";
  const type = prompt("请输入活动类型（如 讲座/志愿/截止）：") || "自定义";
  const ev = { date: dateStr, title, time, type };
  saveCustomEvent(ev);
  closePopup();
  renderMonthCalendar();
  renderEventTimeline();
}

// 活动一览：按日期分组
function renderEventTimeline() {
  const all = getAllEvents();
  const sorted = [...all].sort((a, b) => {
    const [am, ad] = a.date.split("-").map(Number);
    const [bm, bd] = b.date.split("-").map(Number);
    return am - bm || ad - bd;
  });
  const groups = {};
  sorted.forEach(e => { if (!groups[e.date]) groups[e.date] = []; groups[e.date].push(e); });

  const ev = document.querySelector("[data-cal-events]");
  if (!ev) return;
  ev.innerHTML = Object.entries(groups).map(([date, list]) => {
    const [m, day] = date.split("-");
    return `<div class="cal-event">
      <div class="cal-event__date">2026.${String(m).padStart(2,"0")}.${String(day).padStart(2,"0")}</div>
      <div class="cal-event__title">
        ${list.map(e => `<span style="display:inline-block;margin-right:.8rem"><b style="color:var(--gold-bright)">${e.time}</b> ${e.title} <small style="color:var(--cream);opacity:.6">[${e.type}]</small></span>`).join("<br>")}
      </div>
      <div class="cal-event__sha">${list.length} 项</div>
    </div>`;
  }).join("");
}

/* ---------- 渲染：页面1 入口 ---------- */
function renderCalendar(d) {
  const repo = d.repo;
  document.querySelector(".nav__logo b").textContent = repo.owner_login.toUpperCase();

  const allCount = getAllEvents().length;
  const hs = document.querySelector("[data-cal-sub]");
  if (hs) hs.textContent = "校园活动台 CampusHub · 活动日历 2026 · 共 " + allCount + " 项活动";

  // 渲染单月日历
  renderMonthCalendar();

  // 活动一览
  renderEventTimeline();

  // 月份切换
  document.querySelector("[data-prev]")?.addEventListener("click", () => {
    CAL.month--;
    if (CAL.month < 1) { CAL.month = 12; CAL.year--; }
    renderMonthCalendar();
  });
  document.querySelector("[data-next]")?.addEventListener("click", () => {
    CAL.month++;
    if (CAL.month > 12) { CAL.month = 1; CAL.year++; }
    renderMonthCalendar();
  });

  // 悬浮框关闭
  document.getElementById("popupClose")?.addEventListener("click", closePopup);
  // 点击遮罩（非卡片内容）关闭
  document.getElementById("calPopup")?.addEventListener("click", (e) => {
    if (e.target.id === "calPopup") closePopup();
  });
  // ESC 关闭
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePopup();
  });

  // 添加活动
  document.getElementById("popupAdd")?.addEventListener("click", () => {
    if (popupCurrentDate) addEventForDate(popupCurrentDate);
  });
}

/* ---------- 渲染：页面2 积分榜 ---------- */
function renderStandings(d) {
  const repo = d.repo;
  const commits = d.commits;
  const files = d.files;

  document.querySelector(".nav__logo b").textContent = repo.owner_login.toUpperCase();

  // 数据浮卡（仓库统计）
  const sc = document.querySelector("[data-stats]");
  if (sc) {
    sc.innerHTML = `
      <h4>Repo Standings</h4>
      <dl>
        <dt>Commits</dt><dd>${d.counts.commits}</dd>
        <dt>Files</dt><dd>${d.counts.files}</dd>
        <dt>Issues</dt><dd>${d.counts.issues}</dd>
        <dt>Releases</dt><dd>${d.counts.releases}</dd>
      </dl>`;
  }

  // Hero 副标题
  const hs = document.querySelector("[data-hero-sub]");
  if (hs) hs.textContent = repo.description + " · " + repo.full_name;

  // commits 表
  const ct = document.querySelector("[data-commits-table]");
  if (ct) {
    ct.innerHTML = `
      <div class="stab-row stab-row--head">
        <span>Pos</span><span>Commit</span><span>Date</span><span>SHA</span><span>Author</span>
      </div>` + commits.map((c, i) => `
      <div class="stab-row ${i === 0 ? "stab-row--hl" : ""}">
        <span class="stab-row__pos">${String(i + 1).padStart(2, "0")}</span>
        <span class="stab-row__title">${c.message}<small>${c.role || (i === 0 ? "latest" : "history")}</small></span>
        <span class="stab-row__date">${fmt.date(c.date)}</span>
        <span class="stab-row__sha">${c.short}</span>
        <span class="stab-row__author">${c.author}</span>
      </div>`).join("");
  }

  // files 表
  const ft = document.querySelector("[data-files-table]");
  if (ft) {
    ft.innerHTML = `
      <div class="stab-row stab-row--head">
        <span>Pos</span><span>File</span><span>Type</span><span>Size</span><span>Path</span>
      </div>` + files.map((f, i) => `
      <div class="stab-row ${f.name === "README.md" ? "stab-row--hl" : ""}">
        <span class="stab-row__pos">${String(i + 1).padStart(2, "0")}</span>
        <span class="stab-row__title">${f.name}<small>${f.type}</small></span>
        <span class="stab-row__date">${f.type === "dir" ? "DIR" : "FILE"}</span>
        <span class="stab-row__sha">${fmt.bytes(f.size)}</span>
        <span class="stab-row__author">${f.path}</span>
      </div>`).join("");
  }

  // 图库：commits + files 作为复古卡片
  const gl = document.querySelector("[data-gallery]");
  if (gl) {
    const cards = [
      ...commits.map((c, i) => ({
        art: i === 0 ? ILL.sunstar : (i === 1 ? ILL.stripeBlock : ILL.trumpeter),
        title: c.message.split("：")[0].slice(0, 18),
        meta: c.short + " · " + fmt.date(c.date),
      })),
      ...files.map(f => ({
        art: f.type === "dir" ? ILL.star("#6B8E23") : ILL.stripeBlock,
        title: f.name,
        meta: fmt.bytes(f.size),
      })),
    ];
    gl.innerHTML = cards.map(c => `
      <article class="gallery-card">
        <div class="gallery-card__art">${c.art}</div>
        <div class="gallery-card__title">${c.title}</div>
        <div class="gallery-card__meta">${c.meta}</div>
      </article>`).join("");
  }

  // Tab 切换（commits / files）
  document.querySelectorAll("[data-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-tab]").forEach(b => b.classList.remove("tab--active"));
      btn.classList.add("tab--active");
      const target = btn.dataset.tab;
      document.querySelector("[data-commits-table]").style.display = target === "commits" ? "" : "none";
      document.querySelector("[data-files-table]").style.display = target === "files" ? "" : "none";
    });
  });

  // 图库箭头滚动
  const track = document.querySelector("[data-gallery]");
  document.querySelector("[data-gallery-prev]")?.addEventListener("click", () => track.scrollBy({ left: -300, behavior: "smooth" }));
  document.querySelector("[data-gallery-next]")?.addEventListener("click", () => track.scrollBy({ left: 300, behavior: "smooth" }));
}

/* ---------- 启动 ---------- */
window.addEventListener("DOMContentLoaded", async () => {
  const data = await loadGitHub();
  if (document.body.dataset.page === "calendar") renderCalendar(data);
  if (document.body.dataset.page === "standings") renderStandings(data);
});
