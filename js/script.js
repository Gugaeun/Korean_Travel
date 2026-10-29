/* 브라우저 스크롤 복원 비활성화 */
if (history.scrollRestoration) {
  history.scrollRestoration = 'manual';
}

/* ═══════════════════════════════════════
   FINDER — 세부 장소 옵션 (지역별)
═══════════════════════════════════════ */
const PLACE_OPTIONS = {
  all: [],
  seoul: [
    { value:'s_yongsan',      label:'용산가족공원 (국립중앙박물관)' },
    { value:'s_yongsan_kbs',  label:'용산공원반환부지 (어린이정원)' },
    { value:'s_yongsan_war',  label:'용산공원 (전쟁기념관)' },
    { value:'s_namsan_tower', label:'남산타워 (케이블카)' },
    { value:'s_namsan_garden',label:'남산 야외식물원' },
    { value:'s_namsan',       label:'남산 순환둘레길' },
    { value:'s_cheonggyecheon',label:'청계천' },
    { value:'s_jamsu',        label:'잠수교' },
  ],
  jeju: [
    { value:'j_halla',    label:'한라산 국립공원' },
    { value:'j_dongbaek', label:'제주 곶자왈 도립공원' },
    { value:'j_seogwipo', label:'서귀포 해양 도립공원' },
    { value:'j_seongsan', label:'성산일출 해양 도립공원' },
    { value:'j_sangari',  label:'상가리 야자숲 휴양림' },
    { value:'j_jeolmul',  label:'절물 자연 휴양림' },
    { value:'j_bija',     label:'비자림 휴양림' },
  ],
};

function updatePlaceOptions() {
  const region = document.getElementById('wt-region').value;
  const sel    = document.getElementById('wt-place');
  if (!sel) return;

  const places = PLACE_OPTIONS[region] || [];
  sel.innerHTML = '<option value="all">장소 상관없어요</option>'
    + places.map(p => `<option value="${p.value}">${p.label}</option>`).join('');
}

function closeFeaturedDrawer(e) {
  if (e && e.target !== document.getElementById('featuredDrawer')) return;
  document.getElementById('featuredDrawer').classList.remove('open');
  document.body.style.overflow = '';
}

/* ═══════════════════════════════════════
   DATA
═══════════════════════════════════════ */
const JEJU_NOTICES = [
  {tag:'공지', text:'한라산 국립공원 탐방로 입산 시간 지정제 운영 안내', date:'2026-06-15', type:'gj'},
  {tag:'위험', text:'사려니숲길 진입로 멧돼지 출몰 주의', date:'2026-06-12', type:'inf'},
  {tag:'안내', text:'한라산 둘레길 동백길 구간 낙석 우회 안내', date:'2026-05-20', type:'inf'},
  {tag:'안내', text:'절물자연휴양림 데크 보수 공사 일부 통제', date:'2026-05-11', type:'inf'},
  {tag:'위험', text:'우천 시 곶자왈 탐방로 미끄럼 주의', date:'2026-04-20', type:'inf'},
];
const SEOUL_NOTICES = [
  {tag:'공지', text:'반포한강공원 달빛무지개분수 야간 운영 안내', date:'2026-06-10', type:'gj'},
  {tag:'위험', text:'잠수교 한강 수위 상승 시 보행 통제 안내', date:'2026-06-08', type:'inf'},
  {tag:'안내', text:'이촌한강공원 자전거·보행 분리구간 공사', date:'2026-05-28', type:'inf'},
  {tag:'안내', text:'남산 순환로 일부 구간 야간 조명 점검', date:'2026-04-15', type:'inf'},
];

/* COURSES 데이터 → courses.js */

const FOODS = [
  {id:'f1', name:'사려니 흑돼지',    cat:'jeju',   type:'korean',  region:'jeju',  price:'15,000원~', rate:'4.7',
   desc:'사려니숲 입구 근처 제주 흑돼지 구이 전문점. 산책 후 든든한 한 끼. (블루리본)',
   img:'images/food_heukdwaeji.jpg',
   menu:[{name:'흑돼지 오겹살(200g)', price:'18,000원'},{name:'제주 돔베고기', price:'15,000원'}]},
  {id:'f2', name:'국립공원 고기국수', cat:'korean', type:'korean',  region:'jeju',  price:'9,000원~',  rate:'4.5',
   desc:'한라산 탐방로 인근 제주 고기국수 노포. 진한 사골 육수가 일품. (착한가격업소)',
   img:'images/food_galchi.jpg',
   menu:[{name:'고기국수', price:'9,000원'},{name:'비빔국수', price:'9,500원'}]},
  {id:'f3', name:'한라산 뷰 카페',    cat:'cafe',   type:'cafe',    region:'jeju',  price:'6,000원~',  rate:'4.8',
   desc:'한라산이 보이는 중산간 카페. 수제 귤 음료와 한라봉 케이크.',
   img:'images/food_jejucafe.jpg',
   menu:[{name:'귤 에이드', price:'6,500원'},{name:'한라봉 케이크', price:'7,000원'}]},
  {id:'f4', name:'한강뷰 도넛카페',   cat:'cafe',   type:'cafe',    region:'seoul', price:'3,500원~',  rate:'4.6',
   desc:'반포한강공원 인근 한강뷰 카페. 산책 마무리에 딱.',
   img:'images/food_donut.jpg',
   menu:[{name:'생크림 도넛', price:'3,500원'},{name:'아메리카노', price:'4,000원'}]},
  {id:'f5', name:'용산 손칼국수',    cat:'korean',  type:'korean',  region:'seoul', price:'8,000원~',  rate:'4.4',
   desc:'용산구 골목의 직접 뽑은 면 칼국수. 산책 후 따뜻한 한 그릇. (착한가격업소)',
   img:'images/food_makgeolli.jpg',
   menu:[{name:'바지락 칼국수', price:'8,000원'},{name:'손만두', price:'6,000원'}]},
  {id:'f6', name:'사려니 보말죽',    cat:'jeju',   type:'seafood', region:'jeju',  price:'10,000원~', rate:'4.9',
   desc:'사려니숲 산책 후 든든한 제주 보말죽·전복죽 전문점.',
   img:'images/food_haenyeo.jpg',
   menu:[{name:'보말죽', price:'11,000원'},{name:'전복죽', price:'15,000원'}]},
  {id:'f7', name:'이촌동 삼겹살',    cat:'korean', type:'korean',  region:'seoul', price:'12,000원~', rate:'4.3',
   desc:'이촌한강공원 인근 숯불 생삼겹살. 한강 산책 후 즐기기 좋은 맛집. (블루리본)',
   img:'images/food_samgyeopsal.jpg',
   menu:[{name:'생삼겹살(200g)', price:'13,000원'},{name:'항정살', price:'15,000원'}]},
  {id:'f8', name:'제주 빙수카페',    cat:'cafe',   type:'cafe',    region:'jeju',  price:'9,000원~',  rate:'4.7',
   desc:'국립공원 입구 인근 제주 흑임자·한라봉 빙수 감성 카페.',
   img:'images/food_bingsu.png',
   menu:[{name:'흑임자 빙수', price:'12,000원'},{name:'한라봉 빙수', price:'11,000원'}]},
];

const WEATHER_DATA = {
  seoul: [
    {date:'오늘', icon:'☀️', temp:'22°'},
    {date:'내일', icon:'⛅', temp:'20°'},
    {date:'모레', icon:'🌧️', temp:'18°'},
    {date:'+3일', icon:'☁️', temp:'19°'},
  ],
  jeju: [
    {date:'오늘', icon:'⛅', temp:'24°'},
    {date:'내일', icon:'🌊', temp:'22°'},
    {date:'모레', icon:'☀️', temp:'25°'},
    {date:'+3일', icon:'⛅', temp:'23°'},
  ]
};

/* ═══════════════════════════════════════
   STATE
═══════════════════════════════════════ */
let currentRegion    = 'seoul';
let foodRegionFilter = 'all';
let foodTypeFilter   = 'all';
let weatherDataForPopup = { seoul:[], jeju:[] };
let weeklyData = { seoul:[], jeju:[] };
let revealObserver = null;

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
/* ESC 키로 드로어 닫기 — 동적 로드 후에도 document는 유지되므로 여기서 등록 */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  closeFeaturedDrawer();
  closeSpotDrawer();
});

/* NAV 스크롤 그림자도 document 레벨이므로 유지 */

/*
  initApp()
  loader.js가 모든 HTML 컴포넌트와 스크립트를 로드한 뒤 호출.
  window.load / DOMContentLoaded 이벤트 대신 이 함수로 초기화를 일원화.
*/
function initApp() {
  window.scrollTo(0, 0);

  setMapRegion(currentRegion);
  renderNotices();
  renderFoods();
  renderReviews();
  renderWeather();
  renderWeekly();
  setupReveal();

  wt_init();   /* 히어로 지역 탭 */
  psInit();    /* 포토 슬라이더 */
}

/* NAV 스크롤 그림자 */
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (nav) nav.style.boxShadow =
    window.scrollY > 10 ? '0 2px 16px rgba(0,0,0,0.1)' : '0 1px 8px rgba(0,0,0,0.05)';
});

/* ═══════════════════════════════════════
   MAP REGION (지도/공지 전환)
═══════════════════════════════════════ */
function setMapRegion(r) {
  currentRegion = r;
  const tabJ = document.getElementById('tabJ');
  const tabS = document.getElementById('tabS');
  if (tabJ) tabJ.classList.toggle('on', r === 'jeju');
  if (tabS) tabS.classList.toggle('on', r === 'seoul');

  const noticeTitle = document.getElementById('noticeTitle');
  if (noticeTitle) noticeTitle.textContent = r === 'jeju' ? '🔔 제주올레길 안내사항' : '🔔 서울둘레길 안내사항';

  renderNotices();
}

/* ═══════════════════════════════════════
   NOTICES
═══════════════════════════════════════ */
function renderNotices() {
  const list = currentRegion === 'jeju' ? JEJU_NOTICES : SEOUL_NOTICES;
  const el = document.getElementById('noticeList');
  if (!el) return;
  el.innerHTML = list.map(n => `
    <div class="n-item">
      <span class="n-tag ${n.type}">${n.tag}</span>
      <span class="n-title">${n.text}</span>
      <span class="n-date">${n.date}</span>
    </div>`).join('');
}

/* ═══════════════════════════════════════
   FOOD
═══════════════════════════════════════ */
function setFoodTab(region, btn) {
  foodRegionFilter = region;
  document.querySelectorAll('.food-stab').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  foodTypeFilter = 'all';
  document.querySelectorAll('.fc').forEach(b => b.classList.remove('on'));
  document.querySelector('.fc').classList.add('on');
  applyFoodFilter();
}
function filterFood(type, btn) {
  foodTypeFilter = type;
  document.querySelectorAll('.fc').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  applyFoodFilter();
}
function applyFoodFilter() {
  let result = FOODS;
  if (foodRegionFilter !== 'all') result = result.filter(f => f.region === foodRegionFilter);
  if (foodTypeFilter   !== 'all') result = result.filter(f => f.type === foodTypeFilter || f.cat === foodTypeFilter);
  renderFoods(result);
}
function renderFoods(list) {
  let data = list !== undefined ? list : FOODS;
  data = [...data].sort((a, b) => {
    if (a.region !== b.region) return a.region === 'seoul' ? -1 : 1;
    return 0;
  });
  const el = document.getElementById('foodGrid');
  if (!el) return;
  el.innerHTML = data.length === 0
    ? '<p style="color:#888;grid-column:1/-1;text-align:center;padding:40px 0">해당하는 맛집이 없습니다.</p>'
    : data.map(f => `
      <div class="f-card" onclick="openFood('${f.id}')">
        <img class="f-img" src="${f.img}" alt="${f.name}"
             onerror="this.style.background='#c8d8a0';this.removeAttribute('src')">
        <div class="f-body">
          <div class="f-name">${f.name}</div>
          <div class="f-sub">${f.cat==='jeju'?'🍊 제주향토':f.type==='cafe'?'☕ 카페':f.type==='seafood'?'🐟 해산물':'🍖 한식'}</div>
          <div class="f-foot"><span class="f-price">${f.price}</span><span class="f-rate">★ ${f.rate}</span></div>
        </div>
      </div>`).join('');
}

/* ═══════════════════════════════════════
   POPUPS
═══════════════════════════════════════ */
function openCourse(id) {
  const c = COURSES.find(x => x.id === id);
  if (!c) return;
  addRecentCourse(id);
  const fav = isSaved(LS_FAV, id);
  const rel = FOODS.filter(f => f.region === c.region).slice(0, 3);
  document.getElementById('popBox').innerHTML = `
    <div class="pop-img-wrap">
      <img class="pop-img" src="${c.img}" alt="${c.name}" onerror="this.style.background='#c8d8a0';this.removeAttribute('src')">
      <button class="pop-cls" onclick="closePopBtn()">✕</button>
    </div>
    <div class="pop-body">
      <h2>${c.name}</h2>
      <div class="pop-row">
        <span class="badge ${c.region==='jeju'?'bj':'bs'}">${c.region==='jeju'?'제주올레':'서울둘레길'}</span>
        ${c.theme.map(t=>t==='sea'?'<span class="badge bsea">해안</span>':t==='nature'?'<span class="badge bn">자연</span>':'<span class="badge bc">도심</span>').join('')}
      </div>
      <p class="pop-desc">${c.desc}</p>
      <div class="pop-grid">
        <div class="pop-gi"><div class="pl">총 거리</div><div class="pv">📏 ${c.km}</div></div>
        <div class="pop-gi"><div class="pl">소요 시간</div><div class="pv">⏱ ${c.time}</div></div>
        <div class="pop-gi"><div class="pl">난이도</div><div class="pv">⚡ ${c.diff}</div></div>
        <div class="pop-gi"><div class="pl">추천 대상</div><div class="pv">👥 ${c.type.map(t=>t==='solo'?'나홀로':t==='couple'?'연인':'가족').join('·')}</div></div>
      </div>
      ${rel.length ? `<div class="pop-mt">🍽 주변 추천 맛집</div><div class="pop-ml">${rel.map(f=>`
        <div class="pop-mi" onclick="closePopBtn();setTimeout(()=>openFood('${f.id}'),200)">
          <img src="${f.img}" alt="${f.name}" onerror="this.style.background='#c8d8a0';this.removeAttribute('src')">
          <span class="pop-mi-name">${f.name}</span>
          <span class="pop-mi-price">${f.price}</span>
        </div>`).join('')}</div>` : ''}
      <div class="pop-btns">
        <button class="pop-btn p" id="favBtn" onclick="toggleFavCourse('${c.id}')">${fav ? '💚 찜 완료' : '🤍 코스 찜하기'}</button>
        <button class="pop-btn g" onclick="closePopBtn()">닫기</button>
      </div>
    </div>`;
  document.getElementById('popOv').classList.add('open');
}

function openFood(id) {
  const f = FOODS.find(x => x.id === id);
  if (!f) return;
  const saved = isSaved(LS_FOOD, id);
  document.getElementById('popBox').innerHTML = `
    <div class="pop-img-wrap">
      <img class="pop-img" src="${f.img}" alt="${f.name}" onerror="this.style.background='#c8d8a0';this.removeAttribute('src')">
      <button class="pop-cls" onclick="closePopBtn()">✕</button>
    </div>
    <div class="pop-body">
      <h2>${f.name}</h2>
      <div class="pop-row">
        <span style="background:#f4f1eb;color:#888;padding:4px 9px;border-radius:9px;font-size:11px;font-weight:700">★ ${f.rate}</span>
        <span style="background:#fdecea;color:#c94520;padding:4px 9px;border-radius:9px;font-size:11px;font-weight:700">${f.region==='jeju'?'제주 맛집':'서울 맛집'}</span>
      </div>
      <p class="pop-desc">${f.desc}</p>
      <div class="pop-grid">
        <div class="pop-gi"><div class="pl">가격대</div><div class="pv">💰 ${f.price}</div></div>
        <div class="pop-gi"><div class="pl">카테고리</div><div class="pv">${f.cat==='jeju'?'🍊 제주향토':f.type==='cafe'?'☕ 카페':f.type==='seafood'?'🐟 해산물':'🍖 한식'}</div></div>
      </div>
      <div class="pop-mt">📋 대표 메뉴</div>
      <div class="pop-ml">${f.menu.map(m=>`
        <div class="pop-mi">
          <img src="${f.img}" alt="${m.name}" onerror="this.style.background='#c8d8a0';this.removeAttribute('src')">
          <span class="pop-mi-name">${m.name}</span>
          <span class="pop-mi-price">${m.price}</span>
        </div>`).join('')}</div>
      <div class="pop-btns">
        <button class="pop-btn p" id="saveBtn" onclick="toggleSaveFood('${f.id}')">${saved ? '📌 저장 완료' : '📍 맛집 저장하기'}</button>
        <button class="pop-btn g" onclick="closePopBtn()">닫기</button>
      </div>
    </div>`;
  document.getElementById('popOv').classList.add('open');
}

function closePop(e) { if (e.target === document.getElementById('popOv')) closePopBtn(); }
function closePopBtn() {
  const ov = document.getElementById('popOv');
  ov.classList.remove('open', 'ov-side');
  document.getElementById('popBox').className = 'pop-box';
}

/* ═══════════════════════════════════════
   MY PAGE — localStorage (로그인 없이 저장)
═══════════════════════════════════════ */
const LS_FAV    = 'kk_fav_courses';
const LS_FOOD   = 'kk_saved_foods';
const LS_RECENT = 'kk_recent_courses';

function lsGet(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}
function lsSet(key, arr) {
  try { localStorage.setItem(key, JSON.stringify(arr)); } catch {}
}
function isSaved(key, id) { return lsGet(key).includes(id); }

function toggleFavCourse(id) {
  let list = lsGet(LS_FAV);
  const has = list.includes(id);
  list = has ? list.filter(x => x !== id) : [id, ...list];
  lsSet(LS_FAV, list);
  const btn = document.getElementById('favBtn');
  if (btn) btn.textContent = has ? '🤍 코스 찜하기' : '💚 찜 완료';
}

function toggleSaveFood(id) {
  let list = lsGet(LS_FOOD);
  const has = list.includes(id);
  list = has ? list.filter(x => x !== id) : [id, ...list];
  lsSet(LS_FOOD, list);
  const btn = document.getElementById('saveBtn');
  if (btn) btn.textContent = has ? '📍 맛집 저장하기' : '📌 저장 완료';
}

function addRecentCourse(id) {
  let list = lsGet(LS_RECENT).filter(x => x !== id);
  list.unshift(id);
  lsSet(LS_RECENT, list.slice(0, 6));
}

function removeItem(key, id) {
  lsSet(key, lsGet(key).filter(x => x !== id));
  openMyPage();
}

function mpCourseRow(id) {
  const c = COURSES.find(x => x.id === id);
  if (!c) return '';
  return `
    <div class="mp-item" onclick="closePopBtn();setTimeout(()=>openCourse('${c.id}'),200)">
      <img src="${c.img}" alt="${c.name}" onerror="this.style.background='#c8d8a0';this.removeAttribute('src')">
      <div class="mp-item-body">
        <div class="mp-item-name">${c.name}</div>
        <div class="mp-item-sub">📏 ${c.km} · ⏱ ${c.time} · ⚡ ${c.diff}</div>
      </div>
      <button class="mp-del" title="삭제"
        onclick="event.stopPropagation();removeItem('${'__KEY__'}','${c.id}')">×</button>
    </div>`;
}
function mpFoodRow(id) {
  const f = FOODS.find(x => x.id === id);
  if (!f) return '';
  return `
    <div class="mp-item" onclick="closePopBtn();setTimeout(()=>openFood('${f.id}'),200)">
      <img src="${f.img}" alt="${f.name}" onerror="this.style.background='#c8d8a0';this.removeAttribute('src')">
      <div class="mp-item-body">
        <div class="mp-item-name">${f.name}</div>
        <div class="mp-item-sub">${f.region==='jeju'?'🍊 제주':'🏙 서울'} · ${f.price}</div>
      </div>
      <button class="mp-del" title="삭제"
        onclick="event.stopPropagation();removeItem('${LS_FOOD}','${f.id}')">×</button>
    </div>`;
}

/* 코스 팝업 → courses.js */
/* 후기 팝업 → reviews.js */
/* 소개 팝업 → about.js */

function openMyPage() {
  const favs    = lsGet(LS_FAV);
  const foods   = lsGet(LS_FOOD);
  const recents = lsGet(LS_RECENT);

  const favHtml = favs.length
    ? favs.map(id => mpCourseRow(id).replace("'__KEY__'", `'${LS_FAV}'`)).join('')
    : '<div class="mp-empty">아직 찜한 코스가 없어요. 코스를 눌러 💚로 찜해보세요!</div>';
  const foodHtml = foods.length
    ? foods.map(id => mpFoodRow(id)).join('')
    : '<div class="mp-empty">저장한 맛집이 없어요. 맛집을 눌러 📌로 저장해보세요!</div>';
  const recentHtml = recents.length
    ? recents.map(id => mpCourseRow(id).replace("'__KEY__'", `'${LS_RECENT}'`)).join('')
    : '<div class="mp-empty">최근 본 코스가 여기에 표시됩니다.</div>';

  document.getElementById('popBox').className = 'pop-box pop-side';
  document.getElementById('popBox').innerHTML = `
    <div class="pop-body">
      <button class="pop-cls" onclick="closePopBtn()" aria-label="닫기">✕</button>
      <h2>🗂 보관함</h2>
      <p class="pop-desc" style="margin-bottom:20px">로그인 없이 이 브라우저에 저장됩니다.</p>

      <div class="mp-section">
        <div class="mp-head"><h3>💚 찜한 코스</h3><span class="mp-count">${favs.length}</span></div>
        <div class="mp-list">${favHtml}</div>
      </div>

      <div class="mp-section">
        <div class="mp-head"><h3>📌 저장한 맛집</h3><span class="mp-count">${foods.length}</span></div>
        <div class="mp-list">${foodHtml}</div>
      </div>

      <div class="mp-section">
        <div class="mp-head"><h3>🕘 최근 본 코스</h3><span class="mp-count">${recents.length}</span></div>
        <div class="mp-list">${recentHtml}</div>
      </div>
    </div>`;
  document.getElementById('popOv').classList.add('open', 'ov-side');
}

/* ═══════════════════════════════════════
   드로어 닫기
═══════════════════════════════════════ */
function closeSpotDrawer(e) {
  if (e && e.target !== document.getElementById('spotDrawer')) return;
  const drawer = document.getElementById('spotDrawer');
  if (drawer) drawer.classList.remove('open');
  document.body.style.overflow = '';
}

/* ═══════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════ */
function setupReveal() {
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); });
  }, { threshold:0.07 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

/* ═══════════════════════════════════════
   WEATHER
═══════════════════════════════════════ */
function _staticWeekly(staticList) {
  return staticList.map(d => {
    const t = parseInt(d.temp) || 20;
    return { date:d.date, icon:d.icon, tempHigh:t, tempLow:t-4, description:'예보 미제공', rainProb:0 };
  });
}

async function renderWeather() {
  /* 즉시 기본 데이터 표시 — 서버 응답 전에도 UI가 채워짐 */
  renderWeatherData('seoulWeather', WEATHER_DATA.seoul);
  renderWeatherData('jejuWeather',  WEATHER_DATA.jeju);
  weeklyData.seoul = _staticWeekly(WEATHER_DATA.seoul);
  weeklyData.jeju  = _staticWeekly(WEATHER_DATA.jeju);
  updateTopbarWeather();

  try {
    const seoulData = await fetchWeather('Seoul');
    const jejuData  = await fetchWeather('Jeju');
    const seoulF    = extractDailyForecasts(seoulData.list);
    const jejuF     = extractDailyForecasts(jejuData.list);
    weatherDataForPopup.seoul = seoulData.list;
    weatherDataForPopup.jeju  = jejuData.list;
    renderWeatherData('seoulWeather', seoulF);
    renderWeatherData('jejuWeather',  jejuF);
    updateTopbarWeather();
  } catch {
    /* 기본 데이터가 이미 표시돼 있으므로 추가 처리 불필요 */
  }
}

function updateTopbarWeather() {
  const region = document.body.dataset.region || 'seoul';
  const id = region === 'seoul' ? 'seoulWeather' : 'jejuWeather';
  const el = document.getElementById(id);
  const firstDay = el ? el.querySelector('.weather-day') : null;
  const labelEl = document.getElementById('topbarWeatherLabel');
  const iconEl  = document.getElementById('topbarWeatherIcon');
  const tempEl  = document.getElementById('topbarWeatherTemp');
  if (labelEl) labelEl.textContent = region === 'seoul' ? '서울' : '제주';
  if (firstDay) {
    if (iconEl) iconEl.textContent = firstDay.querySelector('.weather-icon')?.textContent || '';
    if (tempEl) tempEl.textContent = firstDay.querySelector('.weather-temp')?.textContent || '--';
  }
}

async function renderWeekly() {
  try {
    const [s, j] = await Promise.all([
      fetch('/api/weekly/Seoul').then(r => r.ok ? r.json() : []),
      fetch('/api/weekly/Jeju').then(r => r.ok ? r.json() : []),
    ]);
    weeklyData.seoul = Array.isArray(s) ? s : [];
    weeklyData.jeju  = Array.isArray(j) ? j : [];
  } catch {
    /* 백엔드 미실행 → 팝업은 단기예보로 대체 표시 */
  }
}

async function fetchWeather(city) {
  const res = await fetch(`/api/weather/${city}`);
  if (!res.ok) throw new Error('날씨 API 오류');
  return await res.json();
}
function extractDailyForecasts(list) {
  const result = []; const seen = new Set();
  list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    if (!seen.has(date) && result.length < 4) {
      seen.add(date);
      const d = new Date(item.dt * 1000);
      result.push({ date:d.toLocaleDateString('ko-KR',{month:'short',day:'numeric'}), icon:getWeatherEmoji(item.weather[0].main), temp:Math.round(item.main.temp)+'°' });
    }
  });
  return result;
}
function getWeatherEmoji(main) {
  return {'Clear':'☀️','Clouds':'☁️','Rain':'🌧️','Snow':'❄️','Thunderstorm':'⛈️','Drizzle':'🌦️','Mist':'🌫️','Fog':'🌫️','Dust':'🌪️','Tornado':'🌪️'}[main] || '🌤️';
}
function renderWeatherData(id, forecasts) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = forecasts.map(w => `
    <div class="weather-day">
      <div class="weather-date">${w.date}</div>
      <div class="weather-icon">${w.icon}</div>
      <div class="weather-temp">${w.temp}</div>
    </div>`).join('');
}
function openWeatherPopup() {
  const has = (weatherDataForPopup.seoul || []).length || (weatherDataForPopup.jeju || []).length
           || (weeklyData.seoul || []).length || (weeklyData.jeju || []).length;
  if (!has) { alert('날씨 데이터를 불러오는 중입니다.'); return; }
  renderWeatherPopupTab('seoul');
  document.getElementById('popOv').classList.add('open');
}

function renderWeatherPopupTab(region) {
  let daily = weeklyData[region];
  if (!daily || daily.length === 0) {
    const list = weatherDataForPopup[region];
    daily = list && list.length > 0 ? extractWeeklyData(list) : [];
  }
  document.getElementById('popBox').className = 'pop-box pop-wide';
  document.getElementById('popBox').innerHTML = `
    <div class="pop-body">
      <button class="pop-cls" onclick="closePopBtn()" aria-label="닫기">✕</button>
      <h2>📅 서울 · 제주 7일 날씨</h2>
      <div style="display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid #e8e5df;">
        <button onclick="renderWeatherPopupTab('seoul')"
          style="flex:1;padding:10px;border:none;background:transparent;font-size:14px;font-weight:700;cursor:pointer;
                 border-bottom:3px solid ${region==='seoul'?'var(--accent)':'transparent'};
                 color:${region==='seoul'?'var(--accent)':'#888'};margin-bottom:-2px;">
          서울
        </button>
        <button onclick="renderWeatherPopupTab('jeju')"
          style="flex:1;padding:10px;border:none;background:transparent;font-size:14px;font-weight:700;cursor:pointer;
                 border-bottom:3px solid ${region==='jeju'?'var(--accent)':'transparent'};
                 color:${region==='jeju'?'var(--accent)':'#888'};margin-bottom:-2px;">
          제주
        </button>
      </div>
      <div class="weather-popup-grid">
        ${daily.length === 0
          ? '<p style="color:#888;text-align:center;padding:20px 0;grid-column:1/-1">날씨 데이터 없음</p>'
          : daily.map(day => `
            <div class="weather-popup-day">
              <div class="wpd-date">${day.date}</div>
              <div class="wpd-icon">${day.icon || getWeatherEmoji(day.main)}</div>
              <div class="wpd-temp"><span class="wpd-high">${day.tempHigh}°</span><span class="wpd-low">${day.tempLow}°</span></div>
              <div class="wpd-desc">${day.description}</div>
              <div class="wpd-rain">💧 ${day.rainProb}%</div>
            </div>`).join('')}
      </div>
    </div>`;
}
function extractWeeklyData(list) {
  const result = []; const seen = new Set();
  list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    if (!seen.has(date)) {
      seen.add(date);
      const d       = new Date(item.dt * 1000);
      const sameDay = list.filter(x => x.dt_txt.split(' ')[0] === date);
      const temps   = sameDay.map(x => x.main.temp);
      result.push({
        date:        d.toLocaleDateString('ko-KR',{weekday:'short',month:'short',day:'numeric'}),
        icon:        getWeatherEmoji(item.weather[0].main),
        tempHigh:    Math.round(Math.max(...temps)),
        tempLow:     Math.round(Math.min(...temps)),
        description: item.weather[0].description,
        rainProb:    Math.round((sameDay[0].pop || 0) * 100),
      });
    }
  });
  return result.slice(0, 7);
}

/* ═══════════════════════════════════════
   HERO 지역 탭 (서울 ↔ 제주)
═══════════════════════════════════════ */
function wt_init() {
  document.querySelectorAll('.region-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const region = btn.dataset.region;
      document.body.dataset.region = region;
      document.querySelectorAll('.region-tab').forEach(t => {
        t.classList.toggle('active', t === btn);
        t.setAttribute('aria-selected', t === btn);
      });
      const hp = document.querySelector('.hero-place');
      if (hp) hp.innerHTML = region === 'seoul'
        ? '<span>SEOUL</span> City meets forest'
        : '<span>JEJU</span> Sea meets forest';
      updateTopbarWeather();
    });
  });
}

/* wt_init() 은 initApp()에서 호출 — loader.js 참고 */

/* ── PHOTO SLIDER (카드 3장 캐러셀) ── */
let psRegion = 'all';
let psIdx = 0;
let psTimer = null;

function psVisible() {
  return [...document.querySelectorAll('.ps-slide')].filter(
    s => psRegion === 'all' || s.dataset.region === psRegion
  );
}

function psRender() {
  const track = document.querySelector('.ps-track');
  if (!track) return;
  const all = [...document.querySelectorAll('.ps-slide')];
  const vis = psVisible();
  all.forEach(s => { s.style.display = vis.includes(s) ? '' : 'none'; });

  const maxIdx = Math.max(0, vis.length - 3);
  if (psIdx > maxIdx) psIdx = 0;

  const viewer = document.querySelector('.ps-viewer');
  const cardW = (viewer.offsetWidth - 32) / 3;
  track.style.transform = `translateX(-${psIdx * (cardW + 16)}px)`;

  const wrap = document.getElementById('psDots');
  if (wrap) {
    const total = Math.max(1, vis.length - 2);
    wrap.innerHTML = Array.from({length: total}, (_, i) =>
      `<button class="ps-dot${i === psIdx ? ' active' : ''}" onclick="psGo(${i})"></button>`
    ).join('');
  }
}

function psGo(idx) {
  psIdx = idx;
  psRender();
}

function psNext() {
  const maxIdx = Math.max(0, psVisible().length - 3);
  psIdx = psIdx >= maxIdx ? 0 : psIdx + 1;
  psRender();
}

function psNextBtn() {
  clearInterval(psTimer);
  psNext();
  psTimer = setInterval(psNext, 4000);
}

function psPrev() {
  clearInterval(psTimer);
  const maxIdx = Math.max(0, psVisible().length - 3);
  psIdx = psIdx <= 0 ? maxIdx : psIdx - 1;
  psRender();
  psTimer = setInterval(psNext, 4000);
}

function setPsRegion(region, btn) {
  psRegion = region;
  psIdx = 0;
  document.querySelectorAll('.ps-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  psRender();
  clearInterval(psTimer);
  psTimer = setInterval(psNext, 4000);
}

function psInit() {
  if (!document.querySelector('.ps-track')) return;
  psRender();
  psTimer = setInterval(psNext, 4000);
}

/* psInit() 은 initApp()에서 호출 — loader.js 참고 */
