/* ═══════════════════════════════════════
   코스 데이터
═══════════════════════════════════════ */
const COURSES = [
  /* ─── 제주 국립공원 산책·둘레길 코스 ─── */
  {id:'j_bija',        trail:'숲길',   name:'비자림 휴양림',              region:'jeju',  type:['family','couple'],        theme:['nature'],        diff:'쉬움', km:'약 2.2km',    time:'약 1시간',
   desc:'수령 500~800년 비자나무 숲을 도는 평탄한 송이길. 누구나 편하게 걷는 힐링 산책 코스.',
   img:'images/비자림.png'},
  {id:'j_jeolmul',     trail:'숲길',   name:'절물 자연 휴양림',     region:'jeju',  type:['family','solo'],          theme:['nature'],        diff:'쉬움', km:'약 3km',      time:'1~2시간',
   desc:'삼나무 숲과 약수터, 생이소리길을 갖춘 한라산 동쪽 휴양림. 데크 산책로로 가족 단위에 좋은 코스.',
   img:'images/절물자연휴양림.png'},
  {id:'j_dongbaek',    trail:'숲길',   name:'제주 곶자왈 도립공원',    region:'jeju',  type:['solo','couple','family'], theme:['nature'],        diff:'쉬움', km:'약 5km',      time:'1.5~2시간',
   desc:'람사르 습지로 등록된 원시 곶자왈 숲길. 먼물깍 습지를 도는 평탄한 탐방로.',
   img:'images/제주곶자왈도립공원.png'},
  {id:'j_halla',       trail:'둘레길', name:'한라산 국립공원',     region:'jeju',  type:['solo','couple'],          theme:['nature'],        diff:'보통', km:'약 13km',     time:'4~5시간',
   desc:'해발 600~800m 한라산 국립공원 환상 숲길. 완만하지만 길어 보통 난이도의 중산간 둘레길 구간.',
   img:'images/한라산국립공원.png'},
  {id:'j_seogwipo',    trail:'해안길', name:'서귀포 해양 도립공원',   region:'jeju',  type:['solo','couple','family'], theme:['sea','nature'],  diff:'보통', km:'구간별 상이', time:'구간별 상이',
   desc:'서귀포 해안의 절경을 따라 걷는 해양도립공원 탐방로. 주상절리와 폭포를 함께 즐길 수 있다.',
   img:'images/서귀포해양도립공원.png'},
  {id:'j_seongsan',    trail:'해안길', name:'성산일출 해양 도립공원', region:'jeju',  type:['solo','couple','family'], theme:['sea','nature'],  diff:'보통', km:'약 1.5km',    time:'약 1시간',
   desc:'유네스코 세계자연유산 성산일출봉을 중심으로 한 해안 산책 코스. 일출 명소로 유명한 제주 대표 탐방지.',
   img:'images/성산일출해양도립공원.png'},
  {id:'j_sangari',     trail:'숲길',   name:'상가리 야자숲 휴양림',   region:'jeju',  type:['solo','couple','family'], theme:['nature'],        diff:'쉬움', km:'약 2km',      time:'약 1시간',
   desc:'이국적인 야자수 숲이 펼쳐지는 제주 특색 있는 휴양림. 평탄한 산책로로 가볍게 걷기 좋다.',
   img:'images/상가리야자숲.png'},
  /* ─── 서울 용산·한강 산책 코스 ─── */
  {id:'s_yongsan',     trail:'숲길',   name:'용산 가족공원 숲길',         region:'seoul', type:['family','couple'],        theme:['nature'],        diff:'쉬움', km:'약 2km',      time:'약 1시간',
   desc:'국립중앙박물관 옆 도심 공원. 잔디밭과 연못을 따라 평탄하게 걷는 용산 대표 가족 산책 코스.',
   img:'images/용산가족공원.png'},
  {id:'s_yongsan_kbs', trail:'공원길', name:'용산공원 반환부지(어린이정원)', region:'seoul', type:['family','solo'],          theme:['city','nature'], diff:'쉬움', km:'약 1km',      time:'약 30분',
   desc:'미군 기지 반환 후 조성된 용산어린이정원. 역사적 공간을 걷는 도심 속 특별한 산책 코스.',
   img:'images/용산공원.png'},
  {id:'s_yongsan_war', trail:'공원길', name:'용산공원(전쟁기념관)',        region:'seoul', type:['solo','family'],          theme:['city'],          diff:'쉬움', km:'약 1.5km',    time:'약 40분',
   desc:'전쟁기념관을 끼고 걷는 용산 역사 산책 코스. 기념관 앞 광장과 조각 공원을 둘러볼 수 있다.',
   img:'images/전쟁기념관1.png'},
  {id:'s_namsan_tower', trail:'전망대', name:'남산타워(남산 케이블카)',     region:'seoul', type:['couple','family','solo'], theme:['city','nature'], diff:'쉬움', km:'약 0.5km',    time:'1~2시간',
   desc:'N서울타워와 남산 전망대. 케이블카로 오르거나 도보로 올라 서울 전경을 한눈에 담을 수 있는 랜드마크.',
   img:'images/남산타워.png'},
  {id:'s_namsan_garden', trail:'공원길', name:'남산 야외식물원',           region:'seoul', type:['solo','couple','family'], theme:['nature'],        diff:'쉬움', km:'약 1km',      time:'약 30~40분',
   desc:'남산 중턱에 자리한 야외 식물원. 다양한 수목과 꽃을 감상하며 걷는 조용한 산책 코스.',
   img:'images/남산야외식물원.png'},
  {id:'s_namsan',       trail:'둘레길', name:'남산 순환 둘레길',          region:'seoul', type:['solo','couple','family'], theme:['nature','city'], diff:'보통', km:'약 7km',      time:'2~3시간',
   desc:'용산 접경 남산을 한 바퀴 도는 도심 숲길. 완만한 순환로로 사계절 산책에 좋고 야경도 일품.',
   img:'images/남산순환둘레길.png'},
  {id:'s_cheonggyecheon', trail:'하천길', name:'청계천 수변 산책로',      region:'seoul', type:['solo','couple','family'], theme:['city'],          diff:'쉬움', km:'약 10.9km',   time:'2~4시간',
   desc:'서울 도심을 가로지르는 청계천 복원 수변 산책로. 평탄한 하천길로 구간별 선택이 자유롭다.',
   img:'images/청계천.png'},
  {id:'s_jamsu',        trail:'둘레길', name:'잠수교 도보길',             region:'seoul', type:['solo','couple'],          theme:['city'],          diff:'쉬움', km:'약 1.2km',    time:'약 30분',
   desc:'한강을 가로지르는 잠수교 보행 데크. 강을 바로 위에서 건너며 걷는 이색 도보 코스.',
   img:'images/잠수교.png'},
];

/* ═══════════════════════════════════════
   코스 팝업
═══════════════════════════════════════ */
let popCourseRegion = 'all';

function openCoursesPopup(region) {
  popCourseRegion = region || 'all';
  const box = document.getElementById('popBox');
  box.className = 'pop-box pop-courses';
  box.innerHTML = `
    <div class="courses-pop-body">
      <div class="courses-pop-head">
        <div>
          <p class="sec-label" style="margin-bottom:4px">산책 코스</p>
          <h2 class="courses-pop-title">걷기 좋은 <em style="color:var(--accent);font-style:normal">둘레길 · 숲길</em></h2>
        </div>
        <button class="courses-pop-close" onclick="closePopBtn()" aria-label="닫기">✕</button>
      </div>
      <div class="rv-type-tabs" id="courseRegionTabs">
        <button class="rv-type-tab ${popCourseRegion==='all'?'on':''}" onclick="setPopCourseRegion('all',this)">전체</button>
        <button class="rv-type-tab ${popCourseRegion==='seoul'?'on':''}" onclick="setPopCourseRegion('seoul',this)">서울</button>
        <button class="rv-type-tab ${popCourseRegion==='jeju'?'on':''}" onclick="setPopCourseRegion('jeju',this)">제주</button>
      </div>
      <div class="courses-pop-grid" id="coursesPopGrid"></div>
    </div>`;
  document.getElementById('popOv').classList.add('open');
  renderCoursesPopGrid();
}

function setPopCourseRegion(region, btn) {
  popCourseRegion = region;
  document.querySelectorAll('#courseRegionTabs .rv-type-tab').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  renderCoursesPopGrid();
}

function renderCoursesPopGrid() {
  let list = COURSES;
  if (popCourseRegion !== 'all') list = list.filter(c => c.region === popCourseRegion);
  const el = document.getElementById('coursesPopGrid');
  if (!el) return;
  el.innerHTML = list.length === 0
    ? '<p style="color:#888;text-align:center;padding:40px 0;grid-column:1/-1">조건에 맞는 코스가 없습니다.</p>'
    : list.map(c => `
      <div class="cpc-card" onclick="closePopBtn();setTimeout(()=>openCourse('${c.id}'),150)">
        <img class="cpc-img" src="${c.img}" alt="${c.name}" onerror="this.style.background='#c8d8a0';this.removeAttribute('src')">
        <div class="cpc-body">
          <div class="cpc-trail">${c.trail === '둘레길' ? '🥾 둘레길' : '🌲 숲길'}</div>
          <div class="cpc-name">${c.name}</div>
          <div class="cpc-desc">${c.desc}</div>
          <div class="cpc-info"><span>📏 ${c.km}</span><span>⏱ ${c.time}</span><span>⚡ ${c.diff}</span></div>
        </div>
      </div>`).join('');
}
