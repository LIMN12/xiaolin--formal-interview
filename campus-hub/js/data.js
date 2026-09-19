// campus-hub 数据层
// 以 2026-09-19 为时间背景，对题目提供的 26 条校园信息进行结构化与分类标注。
// 分类维度：source（来源）、type（类型）、quality（信息质量）、status（时效状态）、warning（风险提示）
// 所有分类依据题目原文判断，未提供的信息不擅自编造，缺失项以 quality=partial 标注。

const TODAY = '2026-09-19';

// 来源分类
const SOURCES = {
  official: { key: 'official', label: '学院/官方', color: '#2563eb' },
  student: { key: 'student', label: '学生自发', color: '#f59e0b' },
};

// 活动类型分类
const TYPES = {
  training: { key: 'training', label: '训练营' },
  lecture: { key: 'lecture', label: '讲座/分享' },
  recruitment: { key: 'recruitment', label: '团队招募' },
  volunteer: { key: 'volunteer', label: '志愿服务' },
  studyGroup: { key: 'studyGroup', label: '学习小组' },
  competition: { key: 'competition', label: '竞赛' },
  workshop: { key: 'workshop', label: '工作坊' },
  social: { key: 'social', label: '约活动/交流' },
  material: { key: 'material', label: '学习资料' },
  supplement: { key: 'supplement', label: '补充通知' },
  observation: { key: 'observation', label: '观摩' },
  teaming: { key: 'teaming', label: '组队' },
  ad: { key: 'ad', label: '推广/广告' },
};

// 信息质量分级
const QUALITIES = {
  complete: { key: 'complete', label: '信息完整', level: 'ok' },
  partial: { key: 'partial', label: '部分缺失', level: 'warn' },
  suspicious: { key: 'suspicious', label: '风险提示', level: 'risk' },
};

// 26 条原始信息（编号、标题、原文要点）+ 结构化分类标注
const ACTIVITIES = [
  {
    id: '01',
    title: '"蓝桥杯"程序设计校内训练营',
    source: 'official',
    type: 'training',
    time: '9月20日起每周六19:00（见09补充：首训改9月21日19:30）',
    deadline: '9月24日22:00报名截止',
    place: '实验楼A402（补充后）',
    audience: '全校学生，零基础可参加',
    requirement: '报名截止前提交报名',
    quality: 'complete',
    status: 'signing',
    raw: '9月24日22:00报名截止；原计划9月20日起每周六19:00训练；面向全校学生；零基础可参加',
    links: ['09'],
  },
  {
    id: '02',
    title: 'AI应用入门公开课',
    source: 'official',
    type: 'lecture',
    time: '9月19日19:00（今日）',
    deadline: '无需报名',
    place: '计算机学院教学楼',
    audience: '全校学生',
    requirement: '预计90分钟',
    quality: 'complete',
    status: 'today',
    raw: '9月19日19:00；计算机学院教学楼；面向全校学生；无需报名；预计90分钟',
  },
  {
    id: '03',
    title: '大学生创新创业项目团队招募',
    source: 'official',
    type: 'recruitment',
    time: '每周稳定投入4小时以上',
    deadline: '9月22日18:00截止',
    place: '未注明',
    audience: '招募开发、设计、材料成员',
    requirement: '需提交简短自我介绍',
    quality: 'complete',
    status: 'signing',
    raw: '招募开发、设计、材料成员；每周需稳定投入4小时以上；9月22日18:00截止；需提交简短自我介绍',
    links: ['20'],
  },
  {
    id: '04',
    title: '数学建模竞赛经验分享会',
    source: 'official',
    type: 'lecture',
    time: '直播9月18日19:30（已结束）',
    deadline: '回放预计9月20日上传',
    place: '线上直播',
    audience: '不限专业',
    requirement: '关注回放',
    quality: 'partial',
    qualityNote: '直播已结束，回放尚未上传',
    status: 'ended',
    raw: '直播时间为9月18日19:30；不限专业；直播已结束，活动方预计9月20日上传回放',
  },
  {
    id: '05',
    title: '校园公益志愿服务活动',
    source: 'official',
    type: 'volunteer',
    time: '9月27日8:30—17:00，预计服务8小时',
    deadline: '9月20日12:00报名截止',
    place: '需提前到场签到',
    audience: '全校学生',
    requirement: '签到',
    quality: 'complete',
    status: 'signing',
    raw: '活动时间9月27日8:30—17:00；9月20日12:00报名截止；预计服务8小时；需提前到场签到',
  },
  {
    id: '06',
    title: 'Web开发零基础学习小组',
    source: 'official',
    type: 'studyGroup',
    time: '9月23日起每周三19:30，共6周',
    deadline: '报名时间未注明，满员即止',
    place: '未注明',
    audience: '零基础学生，限30人',
    requirement: '满员即止',
    quality: 'partial',
    qualityNote: '报名起止时间未注明',
    status: 'signing',
    raw: '9月23日起每周三19:30开展，共6周；面向零基础学生；限30人；报名时间未注明，满员即止',
  },
  {
    id: '07',
    title: 'AI创新应用挑战赛',
    source: 'official',
    type: 'competition',
    time: '10月20日提交作品',
    deadline: '9月21日18:00前完成校内意向登记',
    place: '未注明',
    audience: '2—4人组队',
    requirement: '意向登记≠最终作品提交',
    quality: 'complete',
    status: 'signing',
    raw: '2—4人组队；9月21日18:00前完成校内意向登记；10月20日提交作品；意向登记不等同于最终作品提交',
  },
  {
    id: '08',
    title: '校园软件项目组招募',
    source: 'official',
    type: 'recruitment',
    time: '每周预计投入5小时',
    deadline: '长期招募，满员即止',
    place: '未注明',
    audience: '大一、大二学生，希望了解Git基本操作',
    requirement: '开发校园实用工具',
    quality: 'complete',
    status: 'longterm',
    raw: '开发校园实用工具；面向大一、大二学生；希望成员了解Git基本操作；每周预计投入5小时；长期招募，满员即止',
  },
  {
    id: '09',
    title: '程序设计训练营补充通知',
    source: 'official',
    type: 'supplement',
    time: '首次训练改为9月21日19:30',
    deadline: '报名截止时间不变',
    place: '改至实验楼A402',
    audience: '已报名同学无需重复提交',
    requirement: '关联01训练营',
    quality: 'complete',
    status: 'updated',
    raw: '因场地调整，首次训练改为9月21日19:30，地点改至实验楼A402；已报名同学无需重复提交；报名截止时间不变',
    links: ['01'],
  },
  {
    id: '10',
    title: '前端开发经验交流会',
    source: 'official',
    type: 'lecture',
    time: '9月19日15:00—16:30（今日）',
    deadline: '无需报名',
    place: '线下A201并同步线上直播',
    audience: '全校学生',
    requirement: '无',
    quality: 'complete',
    status: 'today',
    raw: '9月19日15:00—16:30；线下A201并同步线上直播；无需报名',
  },
  {
    id: '11',
    title: '大学生科研入门分享会',
    source: 'official',
    type: 'lecture',
    time: '9月21日19:00—20:30',
    deadline: '未注明报名',
    place: '未注明',
    audience: '全校学生',
    requirement: '介绍论文检索、学生科研项目、导师联系方法',
    quality: 'complete',
    status: 'upcoming',
    raw: '9月21日19:00—20:30；介绍论文检索、学生科研项目和导师联系方法；面向全校学生',
  },
  {
    id: '12',
    title: '全国高校计算机能力挑战赛',
    source: 'official',
    type: 'competition',
    time: '未注明比赛时间',
    deadline: '10月5日23:59报名截止',
    place: '未注明',
    audience: '本科生，个人参赛',
    requirement: '具体费用信息未提供',
    quality: 'partial',
    qualityNote: '费用信息未提供',
    status: 'signing',
    raw: '面向本科生；10月5日23:59报名截止；个人参赛；具体费用信息未提供',
  },
  {
    id: '13',
    title: '科研助理招募',
    source: 'official',
    type: 'recruitment',
    time: '每周预计投入6小时',
    deadline: '9月21日截止报名',
    place: '未注明',
    audience: '仅限大二及以上学生',
    requirement: '协助数据整理和实验工作',
    quality: 'complete',
    status: 'signing',
    raw: '协助数据整理和实验工作；仅限大二及以上学生；每周预计投入6小时；9月21日截止报名',
  },
  {
    id: '14',
    title: 'Git与GitHub零基础工作坊',
    source: 'official',
    type: 'workshop',
    time: '9月21日19:00—20:30',
    deadline: '需提前预约，提交报名表≠最终录取',
    place: '未注明',
    audience: '主要面向大一新生，限40人',
    requirement: '以审核通知为准',
    quality: 'complete',
    status: 'signing',
    raw: '9月21日19:00—20:30；主要面向大一新生；限40人；需提前预约，提交报名表不代表最终录取，以审核通知为准',
  },
  {
    id: '15',
    title: 'AI应用创意挑战',
    source: 'official',
    type: 'competition',
    time: '9月30日前提交最终作品',
    deadline: '9月23日23:59前提交创意方案',
    place: '未注明',
    audience: '允许个人或团队参加',
    requirement: '进入展示环节后可再组队',
    quality: 'complete',
    status: 'signing',
    raw: '9月23日23:59前提交创意方案；9月30日前提交最终作品；允许个人或团队参加；进入展示环节后可再组队',
  },
  {
    id: '16',
    title: '校园摄影志愿者招募',
    source: 'official',
    type: 'recruitment',
    time: '长期招募',
    deadline: '具体报名截止时间未注明',
    place: '校内大型活动',
    audience: '有摄影设备者优先（不作硬性要求）',
    requirement: '参与校内大型活动摄影',
    quality: 'partial',
    qualityNote: '报名截止时间未注明',
    status: 'longterm',
    raw: '长期招募；参与校内大型活动摄影；具体报名截止时间未注明；有摄影设备者优先但不作硬性要求',
  },
  {
    id: '17',
    title: 'Python程序设计学习资料合集',
    source: 'official',
    type: 'material',
    time: '资料长期开放',
    deadline: '网盘提取有效至9月22日，后续统一更新',
    place: '网盘',
    audience: '全校学生',
    requirement: '注意提取有效期',
    quality: 'complete',
    status: 'available',
    raw: '包含课程、练习和项目案例；资料长期开放；当前网盘提取信息有效至9月22日，后续将统一更新',
  },
  {
    id: '18',
    title: '网络安全兴趣交流小组',
    source: 'official',
    type: 'studyGroup',
    time: '首次9月19日19:30（今日），之后每两周一次',
    deadline: '未注明报名',
    place: '未注明',
    audience: '对CTF、Web安全等方向感兴趣的学生，不限基础',
    requirement: '无',
    quality: 'complete',
    status: 'today',
    raw: '首次交流时间为9月19日19:30；之后每两周开展一次；面向CTF、Web安全等方向感兴趣的学生；不限基础',
  },
  {
    id: '19',
    title: '学生创新项目路演观摩',
    source: 'official',
    type: 'observation',
    time: '9月20日14:30',
    deadline: '原报名截止9月18日22:00（已截止）',
    place: '未注明',
    audience: '全校学生',
    requirement: '现场有余位可接受候补入场',
    quality: 'complete',
    status: 'waitlist',
    raw: '活动时间9月20日14:30；原报名截止时间为9月18日22:00；活动方说明如现场仍有余位，可接受候补入场',
  },
  {
    id: '20',
    title: '创新创业项目团队补充说明',
    source: 'official',
    type: 'supplement',
    time: '9月22日18:00截止',
    deadline: '此前已投递者无需重复提交',
    place: '未注明',
    audience: '现主要补充设计与材料成员',
    requirement: '开发方向名额已满，关联03',
    quality: 'complete',
    status: 'updated',
    raw: '开发方向名额已满，现主要补充设计与材料成员；9月22日18:00截止；此前已投递者无需重复提交',
    links: ['03'],
  },
  {
    id: '21',
    title: '计算机学院AI产品设计分享会',
    source: 'official',
    type: 'lecture',
    time: '9月20日19:00',
    deadline: '无需报名，座位有限',
    place: '明德楼B203',
    audience: '全校学生',
    requirement: '座位有限，建议提前到场',
    quality: 'complete',
    status: 'upcoming',
    raw: '计算机学院发布；9月20日19:00；明德楼B203；面向全校学生；无需报名，座位有限',
  },
  {
    id: '22',
    title: '学生发起｜周末羽毛球约球',
    source: 'student',
    type: 'social',
    time: '9月20日16:00',
    deadline: '满员即止',
    place: '场地待最终确认',
    audience: '计划6—8人',
    requirement: '费用AA',
    quality: 'partial',
    qualityNote: '场地待确认',
    status: 'upcoming',
    raw: '学生个人发布；9月20日16:00；计划6—8人；费用AA；场地待最终确认',
  },
  {
    id: '23',
    title: '学生发起｜AI工具交流搭子招募',
    source: 'student',
    type: 'recruitment',
    time: '拟于9月21日晚开展',
    deadline: '报名后拉群',
    place: '具体地点未确定',
    audience: '欢迎零基础',
    requirement: '报名后拉群',
    quality: 'partial',
    qualityNote: '具体地点未确定',
    status: 'upcoming',
    raw: '学生个人发布；拟于9月21日晚开展；欢迎零基础；报名后拉群；具体地点未确定',
  },
  {
    id: '24',
    title: '学生发起｜"校园兼职福利分享"',
    source: 'student',
    type: 'ad',
    time: '未注明',
    deadline: '未注明',
    place: '未注明',
    audience: '称"零门槛、日结"',
    requirement: '要求添加私人微信获取详情',
    quality: 'suspicious',
    qualityNote: '未提供主办方、地点和完整内容',
    status: 'risk',
    warning: '疑似兼职推广：要求加私人微信、未提供主办方/地点/完整内容，与校园活动关联较弱，请谨慎判断。',
    raw: '学生个人发布；称"零门槛、日结"，要求添加私人微信获取详情；未提供主办方、地点和完整内容',
  },
  {
    id: '25',
    title: '学生发起｜数码新品体验交流',
    source: 'student',
    type: 'ad',
    time: '未注明',
    deadline: '未注明',
    place: '未注明',
    audience: '未注明',
    requirement: '正文含商家优惠及购买链接',
    quality: 'suspicious',
    qualityNote: '标题为技术交流，正文主要为商家优惠及购买链接，活动时间/地点未注明',
    status: 'risk',
    warning: '疑似商品推广：标题为技术交流，正文主要介绍商家优惠及购买链接，与校园活动关联较弱，请谨慎判断。',
    raw: '学生个人发布；标题为技术交流，正文主要介绍某商家优惠及购买链接；活动时间、地点未注明',
  },
  {
    id: '26',
    title: '外国语学院校园语言角',
    source: 'official',
    type: 'social',
    time: '9月21日15:00',
    deadline: '无需提前报名',
    place: '场地容量有限',
    audience: '全校学生，自由交流',
    requirement: '场地容量有限',
    quality: 'complete',
    status: 'upcoming',
    raw: '外国语学院发布；9月21日15:00；面向全校学生；自由交流；场地容量有限，无需提前报名',
  },
];

// 状态文案映射
const STATUS_LABELS = {
  today: { label: '今日进行', tone: 'hot' },
  upcoming: { label: '即将开始', tone: 'live' },
  signing: { label: '报名中', tone: 'open' },
  longterm: { label: '长期招募', tone: 'open' },
  available: { label: '资料可用', tone: 'open' },
  waitlist: { label: '可候补', tone: 'warn' },
  ended: { label: '已结束/回放待出', tone: 'muted' },
  updated: { label: '补充更新', tone: 'info' },
  risk: { label: '风险提示', tone: 'risk' },
};

// 发起组队 / 发布表单可选项（任务2 偏好条用）
const PUBLISH_OPTIONS = {
  roles: ['开发', '设计', '材料', '科研助理', '摄影志愿者', '学习者', '搭子', '运营', '其他'],
  skills: ['Web前端', '后端', 'AI', '算法', 'Git', '创新', '项目实战', '数据整理', '实验', 'CTF', 'Web安全', '摄影', '创意', '零基础', '工具开发', 'UI设计'],
  times: ['工作日晚间', '周末上午', '周末下午', '周末晚间', '灵活/长期', '短期集中'],
  levels: [
    { v: 'all', t: '不限' },
    { v: 'beginner', t: '零基础友好' },
    { v: 'freshman-sophomore', t: '大一大二' },
    { v: 'sophomore+', t: '大二及以上' },
  ],
};

// 广告/推广关键词（任务3 广告治理：自动降级）
const AD_KEYWORDS = [
  '私人微信', '加微信', '购买链接', '代购', '兼职日结', '零门槛日结',
  '商家优惠', '优惠券', '免费领', '扫码福利', '刷单', '高额佣金', '代理',
];

// 扫描一条信息是否命中广告关键词
function scanAdRisk(a) {
  const text = [a.title, a.raw, a.requirement, a.contact, a.qualityNote].filter(Boolean).join(' ');
  const hits = AD_KEYWORDS.filter((k) => text.includes(k));
  return { hits, isAd: hits.length > 0 || a.type === 'ad' };
}

// ---------- localStorage 持久化 ----------
function loadUserPublished() {
  try {
    return JSON.parse(localStorage.getItem('campushub_published') || '[]');
  } catch (e) {
    return [];
  }
}

function saveUserPublished(list) {
  localStorage.setItem('campushub_published', JSON.stringify(list));
}

// 举报记录 { id: 次数 }
function loadReports() {
  try {
    return JSON.parse(localStorage.getItem('campushub_reports') || '{}') || {};
  } catch (e) {
    return {};
  }
}

function saveReports(map) {
  localStorage.setItem('campushub_reports', JSON.stringify(map));
}

function reportCount(id) {
  return loadReports()[id] || 0;
}

// 合并官方 26 条 + 用户发布；对用户发布做广告关键词自动降级
function getAllActivities() {
  const user = loadUserPublished().map((u) => {
    const item = { ...u, userPublished: true };
    const ad = scanAdRisk(item);
    if (ad.isAd && item.type !== 'ad') {
      item.type = 'ad';
      item.quality = 'suspicious';
      item.qualityNote = '系统检测到推广/引流关键词，已自动降级为广告类，请谨慎。';
      item.warning = `命中关键词：${ad.hits.join('、')}。与校园活动关联较弱，请谨慎判断。`;
    }
    return item;
  });
  return [...ACTIVITIES, ...user];
}

window.CampusData = {
  TODAY, SOURCES, TYPES, QUALITIES, STATUS_LABELS, ACTIVITIES,
  PUBLISH_OPTIONS, AD_KEYWORDS,
  loadUserPublished, saveUserPublished,
  loadReports, saveReports, reportCount,
  scanAdRisk, getAllActivities,
};
