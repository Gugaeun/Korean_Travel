/*
  [finder_result.js]
  기능 : "내 산책로 찾기" 버튼 클릭 시 필터 조건으로 COURSES 를 필터링하고
         finder_result.html 팝업에 결과 카드를 렌더링.
         카드 클릭 시 해당 코스의 지도 이미지를 뷰어 팝업(#mapViewOverlay)으로 표시.
  연결 : html/finder_result.html (팝업 마크업)
         js/courses.js 의 COURSES 배열 참조
         images/Map/ 폴더의 위치 이미지
*/

/* ── 코스 ID → 지도 이미지 매핑 ──
   images/Map/ 폴더의 파일명과 courses.js 의 id 를 연결
   청계천은 구간이 두 개(동대문·종로)이므로 배열로 처리 */
const COURSE_MAP_IMAGES = {
  /* ─── 서울 ─── */
  s_namsan_garden:  ['images/Map/남산야외식물원_위치.png'],
  s_namsan_tower:   ['images/Map/남산케이블카_위치.png'],
  s_namsan:         ['images/Map/남산순환둘레길_위치.png'],
  s_yongsan:        ['images/Map/용산가족공원_위치.png'],
  s_yongsan_war:    ['images/Map/용산공원_위치.png'],
  s_yongsan_kbs:    ['images/Map/용산공원반환부지_위치.png'],
  s_jamsu:          ['images/Map/잠수교이촌_위치.png'],
  s_cheonggyecheon: ['images/Map/청계천동대문_위치.png', 'images/Map/청계천종로_위치.png'],
  /* ─── 제주 ─── */
  j_halla:    ['images/Map/한라산국립공원_위치.png'],
  j_dongbaek: ['images/Map/제주곶자왈도립공원_위치.png'],
  j_seogwipo: ['images/Map/서귀포해양도립공원_위치.png'],
  j_seongsan: ['images/Map/성산일출해양도립공원_위치.png'],
  j_sangari:  ['images/Map/상가리야자숲_위치.png'],
  j_jeolmul:  ['images/Map/절물자연휴양림_위치.png'],
  j_bija:     ['images/Map/비자림_위치.png'],
};

/* ── 코스 ID → 탐방로 세부 코스 목록 매핑 ──
   지도 뷰어 팝업 하단에 코스별 거리·소요시간을 표시
   (현재 한라산국립공원만 해당, 추후 다른 코스 추가 가능) */
const COURSE_TRAIL_LIST = {
  j_halla: [
    { name:'1코스 · 성판악',  km:'9.6 km', time:'약 4시간 30분', note:'백록담 정상 탐방 가능' },
    { name:'2코스 · 관음사',  km:'8.7 km', time:'약 5시간',      note:'백록담 정상 탐방 가능' },
    { name:'3코스 · 영실',    km:'5.5 km', time:'약 2시간 30분', note:'윗세오름 → 병풍바위 경관' },
    { name:'4코스 · 어리목',  km:'6.8 km', time:'약 3시간 20분', note:'윗세오름 대피소까지' },
    { name:'5코스 · 돈내코',  km:'6.6 km', time:'약 3시간 40분', note:'남벽분기점까지' },
  ],
};

/* 지도 뷰어 상태 */
let _mvImages = [], _mvIdx = 0;

/* ── 시간 필터 ──
   코스의 time 문자열(예: '약 1시간', '1~2시간', '2~4시간', '구간별 상이')을
   분 단위 [최소,최대] 범위로 바꿔서, 선택한 시간대와 "겹치는" 코스를 모두 보여줌.
   (기존엔 미리 정해둔 키워드와 글자가 정확히 똑같아야만 통과돼서,
    실제로는 시간이 맞는데도 표현만 달라서 빠지는 코스가 많았음 → 결과가 너무 적게 나오던 원인) */
function parseTimeRangeMinutes(timeStr) {
  if (!timeStr) return [0, Infinity];
  if (timeStr.includes('구간별')) return [0, Infinity];   // '구간별 상이' → 모든 시간대와 매칭

  const nums = timeStr.match(/\d+(\.\d+)?/g);
  if (!nums) return [0, Infinity];

  // '분'만 있고 '시간'이 없으면 분 단위, 그 외엔 시간 단위로 해석
  const isMinuteUnit = timeStr.includes('분') && !timeStr.includes('시간');
  const toMinutes = n => isMinuteUnit ? parseFloat(n) : parseFloat(n) * 60;

  if (nums.length === 1) {
    const m = toMinutes(nums[0]);
    return [m, m];
  }
  const m1 = toMinutes(nums[0]);
  const m2 = toMinutes(nums[1]);
  return [Math.min(m1, m2), Math.max(m1, m2)];
}

const DURATION_RANGES = {
  quick:  [0, 60],          // 1시간 이내
  normal: [60, 120],        // 1~2시간
  long:   [120, Infinity],  // 2시간 이상
};

function matchesDuration(course, duration) {
  if (duration === 'all') return true;
  const [cMin, cMax] = parseTimeRangeMinutes(course.time);
  const [dMin, dMax] = DURATION_RANGES[duration];
  return cMax >= dMin && cMin <= dMax;   // 코스 소요시간 범위가 선택한 시간대와 겹치면 통과
}

/* ── 동행자별 추천 한도 ──
   아이와 함께(family)는 거리 1.5km 이하, 혼자·둘이서·3명 이상은 소요시간 2시간 이하인
   코스만 추천. "03 산책 가능한 시간" 필터와는 별개로 함께(AND) 적용됨
   — 즉 사용자가 고른 시간대 + 이 동행자 기준을 둘 다 만족해야 결과에 나옴. */
const COMPANION_LIMITS = {
  family: { maxKm: 1.5 },
  solo:   { maxMinutes: 120 },
  couple: { maxMinutes: 120 },
  group:  { maxMinutes: 120 },
};

function parseKm(kmStr) {
  if (!kmStr || kmStr.includes('구간별')) return null;  // 거리 불특정 → 한도 없이 통과
  const nums = kmStr.match(/\d+(\.\d+)?/g);
  if (!nums) return null;
  return Math.max(...nums.map(Number));   // '약 2~3km'처럼 범위면 최댓값 기준으로 판단
}

function withinCompanionLimit(course, people) {
  const limit = COMPANION_LIMITS[people];
  if (!limit) return true;   // people === 'all' 등 한도가 정의되지 않은 경우 통과

  if (limit.maxKm != null) {
    const km = parseKm(course.km);
    return km == null ? true : km <= limit.maxKm;
  }
  if (limit.maxMinutes != null) {
    if (course.time && course.time.includes('구간별')) return true;  // 시간 불특정 → 통과
    const [, cMax] = parseTimeRangeMinutes(course.time);
    return cMax <= limit.maxMinutes;
  }
  return true;
}

/* ── 필터 조건 한글 라벨 ── */
const REGION_LABEL  = { all:'지역 상관없어요', seoul:'서울', jeju:'제주' };
const DURATION_LABEL = { all:'시간 상관없어요', quick:'1시간 이내', normal:'1~2시간', long:'2시간 이상' };
const PEOPLE_LABEL  = { solo:'혼자', couple:'둘이서', group:'3명 이상', family:'아이와 함께' };

/* ── 1. 필터링 함수 ── */
function filterCourses(region, place, duration, people) {
  return COURSES.filter(c => {
    // 지역 필터
    if (region !== 'all' && c.region !== region) return false;

    // 세부 장소 필터 (특정 장소가 선택된 경우 해당 코스 id 일치 여부)
    if (place !== 'all' && c.id !== place) return false;

    // 동행자 필터 — course.type 배열에 선택값 포함 여부
    // group(3명 이상)은 데이터에 없으므로 모든 코스 허용
    if (people !== 'all' && people !== 'group') {
      if (!c.type.includes(people)) return false;
    }

    // 시간 필터(03 드롭다운) OR 동행자별 추천 한도 — 둘 중 하나만 만족해도 통과
    // (아이와 함께 → 거리 1.5km 이하 / 혼자·둘이서·3명 이상 → 소요시간 2시간 이하)
    const passesDuration       = matchesDuration(c, duration);
    const passesCompanionLimit = withinCompanionLimit(c, people);
    if (!passesDuration && !passesCompanionLimit) return false;

    return true;
  });
}

/* ── 2. 코스 카드 HTML 생성 ── */
function buildCourseCard(c) {
  const diffClass  = c.diff === '쉬움' ? 'easy' : c.diff === '보통' ? 'normal' : 'hard';
  const hasMap     = !!COURSE_MAP_IMAGES[c.id];
  // 지도 이미지가 있는 카드는 클릭 가능 표시
  const mapBadge   = hasMap
    ? `<span class="fr-map-badge">지도 보기</span>`
    : '';
  // desc 안의 따옴표를 이스케이프해서 onclick 속성에 안전하게 전달
  const safeDesc = c.desc.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  return `
    <div class="fr-card${hasMap ? ' fr-card--clickable' : ''}" onclick="openMapView('${c.id}', '${c.name}', '${safeDesc}')">
      <div class="fr-card-img" style="background-image:url('${c.img}')">
        <span class="fr-trail">${c.trail}</span>
        ${mapBadge}
      </div>
      <div class="fr-card-body">
        <div class="fr-card-meta">
          <span class="fr-region-badge ${c.region}">${c.region === 'seoul' ? '서울' : '제주'}</span>
          <span class="fr-diff ${diffClass}">${c.diff}</span>
        </div>
        <h3 class="fr-card-name">${c.name}</h3>
        <p class="fr-card-desc">${c.desc}</p>
        <div class="fr-card-info">
          <span>🚶 ${c.km}</span>
          <span>⏱ ${c.time}</span>
        </div>
      </div>
    </div>`;
}

/* ── 그룹 행 화살표 스크롤 ── */
function scrollGroupRow(btn, dir) {
  const row = btn.closest('.fr-group-wrap').querySelector('.fr-group-row');
  if (!row) return;
  row.scrollBy({ left: dir * 252, behavior: 'smooth' });
  // 스크롤 후 화살표 상태 갱신
  setTimeout(() => updateRowArrows(row), 320);
}

function updateRowArrows(row) {
  const wrap = row.closest('.fr-group-wrap');
  if (!wrap) return;
  const prev = wrap.querySelector('.fr-row-prev');
  const next = wrap.querySelector('.fr-row-next');
  const atStart = row.scrollLeft <= 4;
  const atEnd   = row.scrollLeft + row.clientWidth >= row.scrollWidth - 4;
  if (prev) prev.classList.toggle('fr-arrow-hide', atStart);
  if (next) next.classList.toggle('fr-arrow-hide', atEnd);
}

/* ── 지도 뷰어 열기 ── */
function openMapView(courseId, courseName, courseDesc) {
  const images  = COURSE_MAP_IMAGES[courseId] || [];
  const titleEl = document.getElementById('mvTitle');
  const imgEl   = document.getElementById('mvImg');
  const noMapEl = document.getElementById('mvNoMap');
  const pagerEl   = document.getElementById('mvPager');
  const prevBtn   = document.getElementById('mvPrev');
  const nextBtn   = document.getElementById('mvNext');
  const trailsEl  = document.getElementById('mvTrails');
  const trailList = document.getElementById('mvTrailList');
  const overlay   = document.getElementById('mapViewOverlay');
  if (!overlay) return;

  if (titleEl) titleEl.textContent = courseName;
  const descEl = document.getElementById('mvDesc');
  if (descEl) descEl.textContent = courseDesc || '';

  if (images.length === 0) {
    // 지도 이미지 없음
    if (imgEl)   imgEl.hidden   = true;
    if (noMapEl) noMapEl.hidden = false;
    if (pagerEl) pagerEl.hidden = true;
    if (prevBtn) prevBtn.hidden = true;
    if (nextBtn) nextBtn.hidden = true;
  } else {
    _mvImages = images;
    _mvIdx    = 0;
    if (noMapEl) noMapEl.hidden = true;
    if (imgEl) { imgEl.hidden = false; imgEl.src = images[0]; imgEl.alt = courseName + ' 지도'; }
    // 이미지가 2장 이상일 때만 화살표·페이저 표시
    const multi = images.length > 1;
    if (prevBtn) prevBtn.hidden = !multi;
    if (nextBtn) nextBtn.hidden = !multi;
    if (pagerEl) { pagerEl.hidden = !multi; pagerEl.textContent = `1 / ${images.length}`; }
  }

  // 탐방로 코스 목록 렌더링 (데이터가 있는 코스만 표시)
  const trails = COURSE_TRAIL_LIST[courseId];
  if (trailsEl && trailList) {
    if (trails && trails.length) {
      trailList.innerHTML = trails.map((t, i) => `
        <li class="mv-trail-item">
          <span class="mv-trail-num">${i + 1}</span>
          <span class="mv-trail-name">${t.name}</span>
          <span class="mv-trail-stat"><b>${t.km}</b></span>
          <span class="mv-trail-stat"><b>${t.time}</b></span>
          <span class="mv-trail-note">${t.note}</span>
        </li>`).join('');
      trailsEl.hidden = false;
    } else {
      trailsEl.hidden = true;
    }
  }

  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
}

/* ── 지도 뷰어 이미지 전환 ── */
function mvStep(dir) {
  if (!_mvImages.length) return;
  _mvIdx = (_mvIdx + dir + _mvImages.length) % _mvImages.length;
  const imgEl   = document.getElementById('mvImg');
  const pagerEl = document.getElementById('mvPager');
  if (imgEl)   imgEl.src          = _mvImages[_mvIdx];
  if (pagerEl) pagerEl.textContent = `${_mvIdx + 1} / ${_mvImages.length}`;
}

/* ── 지도 뷰어 닫기 ── */
function closeMapView(e) {
  if (e && e.currentTarget !== e.target) return;
  const overlay = document.getElementById('mapViewOverlay');
  if (overlay) { overlay.hidden = true; document.body.style.overflow = 'hidden'; } // 결과 팝업 뒤 스크롤 유지
}

/* ── 3. 팝업 열기 ── */
function openFinderResult() {
  // 필터 값 읽기
  const region   = document.getElementById('wt-region')?.value   || 'all';
  const place    = document.getElementById('wt-place')?.value    || 'all';
  const duration = document.getElementById('wt-duration')?.value || 'all';
  const people   = document.getElementById('wt-people')?.value   || 'all';

  // 필터링
  const results = filterCourses(region, place, duration, people);

  // 조건 요약 태그 렌더링
  const tagsEl = document.getElementById('frTags');
  if (tagsEl) {
    // 선택된 필터 값을 태그로 표시 (기본값이면 제외)
    const tags = [];
    if (region !== 'all')   tags.push(REGION_LABEL[region]);
    if (place  !== 'all') {
      const placeEl = document.getElementById('wt-place');
      const label = placeEl?.options[placeEl.selectedIndex]?.text || place;
      tags.push(label);
    }
    if (duration !== 'all') tags.push(DURATION_LABEL[duration]);
    tags.push(PEOPLE_LABEL[people] || people);

    tagsEl.innerHTML = tags.map(t => `<span class="fr-tag">${t}</span>`).join('');
  }

  // 결과 카드 / 빈 상태 렌더링 — trail 타입별로 그룹핑
  const gridEl  = document.getElementById('frGrid');
  const emptyEl = document.getElementById('frEmpty');
  if (gridEl && emptyEl) {
    if (results.length > 0) {
      // trail 타입 순서대로 정렬 — 같은 길끼리 연달아 나오게
      const TRAIL_ORDER = ['숲길', '해안길', '둘레길', '공원길', '전망대', '하천길'];
      results.sort((a, b) => {
        const ai = TRAIL_ORDER.indexOf(a.trail);
        const bi = TRAIL_ORDER.indexOf(b.trail);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
      });

      // 모든 결과를 한 줄로 표시
      gridEl.innerHTML = `
        <div class="fr-group-wrap">
          <button class="fr-row-arrow fr-row-prev" onclick="scrollGroupRow(this, -1)" aria-label="이전">‹</button>
          <div class="fr-group-row">
            ${results.map(buildCourseCard).join('')}
          </div>
          <button class="fr-row-arrow fr-row-next" onclick="scrollGroupRow(this, 1)" aria-label="다음">›</button>
        </div>`;
      gridEl.hidden  = false;
      emptyEl.hidden = true;

      // 스크롤 이벤트 리스너만 먼저 등록
      document.querySelectorAll('.fr-group-row').forEach(row =>
        row.addEventListener('scroll', () => updateRowArrows(row), { passive: true })
      );
    } else {
      gridEl.innerHTML  = '';
      gridEl.hidden     = true;
      emptyEl.hidden    = false;
    }
  }

  // 팝업 표시 → 팝업이 렌더된 후 화살표 초기 상태 계산
  const overlay = document.getElementById('finderResultOverlay');
  if (overlay) {
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    // hidden 해제 후 레이아웃이 완료된 시점에 화살표 업데이트
    setTimeout(() =>
      document.querySelectorAll('.fr-group-row').forEach(updateRowArrows)
    , 50);
  }
}

/* ── 4. 팝업 닫기 ── */
function closeFinderResult(e) {
  // 딤 레이어 자체를 클릭했을 때만 닫힘 (내부 클릭은 stopPropagation)
  if (e && e.currentTarget !== e.target) return;
  const overlay = document.getElementById('finderResultOverlay');
  if (overlay) {
    overlay.hidden = true;
    document.body.style.overflow = '';
  }
}

/* ── 5. 버튼 이벤트 연결 ──
   initApp() 이후 호출되므로 DOM이 반드시 존재함 */
function initFinderResult() {
  const btn = document.getElementById('recommendButton');
  if (btn) btn.addEventListener('click', openFinderResult);

  // ESC 키: 지도 뷰어가 열려있으면 뷰어만 닫고, 아니면 결과 팝업 닫기
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const mv = document.getElementById('mapViewOverlay');
    if (mv && !mv.hidden) { closeMapView(); return; }
    closeFinderResult();
  });
}