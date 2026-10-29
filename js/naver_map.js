(function () {
  'use strict';

  const SPEED_KMH = 4;
  const REVIEW_KEY = 'san_reviews';

  const DATA = {
    seoul: {
      label: '서울 용산·한강',
      center: { lat: 37.5108, lng: 126.9968 },
      zoom: 14,
      courses: [
        { id: 's_banpo', name: '반포한강공원 무지개분수 산책', diff: '쉬움',
          path: [
            { lat: 37.5101, lng: 126.9954 }, { lat: 37.5112, lng: 126.9978 },
            { lat: 37.5124, lng: 127.0009 }, { lat: 37.5135, lng: 127.0048 },
            { lat: 37.5128, lng: 127.0086 },
          ] },
        { id: 's_jamsu', name: '잠수교 도보 코스(남단↔북단)', diff: '쉬움',
          path: [
            { lat: 37.5160, lng: 126.9989 }, { lat: 37.5132, lng: 126.9981 },
            { lat: 37.5105, lng: 126.9973 }, { lat: 37.5079, lng: 126.9966 },
          ] },
        { id: 's_yongsan', name: '용산가족공원 숲길', diff: '쉬움',
          path: [
            { lat: 37.5224, lng: 126.9905 }, { lat: 37.5236, lng: 126.9928 },
            { lat: 37.5247, lng: 126.9951 }, { lat: 37.5231, lng: 126.9972 },
          ] },
      ],
      foods: [
        { id: 'sf1', kind: 'blue', name: '한강 갈비',       cat: '한식', lat: 37.5172, lng: 126.9962,
          img: 'images/food_samgyeopsal.jpg', desc: '반포한강공원 인근 숯불 갈비 노포. 산책 후 든든한 한 끼.' },
        { id: 'sf2', kind: 'good', name: '용산 손칼국수',   cat: '한식', lat: 37.5298, lng: 126.9712,
          img: 'images/food_makgeolli.jpg',  desc: '착한가격업소 지정. 직접 뽑은 면의 따뜻한 칼국수 한 그릇.' },
        { id: 'sf3', kind: 'cafe', name: '노을 리버뷰 카페', cat: '카페', lat: 37.5133, lng: 127.0102,
          img: 'images/food_jejucafe.jpg',   desc: '한강 노을이 보이는 통창 카페. 산책 마무리에 딱.' },
      ],
    },
    jeju: {
      label: '제주 국립공원',
      center: { lat: 33.4012, lng: 126.6300 },
      zoom: 12,
      courses: [
        { id: 'j_saryeoni', name: '사려니숲길(삼나무 숲)', diff: '쉬움',
          path: [
            { lat: 33.4145, lng: 126.6588 }, { lat: 33.4089, lng: 126.6601 },
            { lat: 33.4031, lng: 126.6623 }, { lat: 33.3978, lng: 126.6650 },
          ] },
        { id: 'j_seongpanak', name: '한라산 성판악~사라오름 입구', diff: '보통',
          path: [
            { lat: 33.3850, lng: 126.6189 }, { lat: 33.3812, lng: 126.6101 },
            { lat: 33.3777, lng: 126.6018 }, { lat: 33.3745, lng: 126.5946 },
          ] },
        { id: 'j_eorimok', name: '어리목~윗세오름 탐방로(초입)', diff: '어려움',
          path: [
            { lat: 33.3978, lng: 126.4906 }, { lat: 33.3920, lng: 126.4951 },
            { lat: 33.3861, lng: 126.4999 }, { lat: 33.3802, lng: 126.5048 },
          ] },
      ],
      foods: [
        { id: 'jf1', kind: 'blue', name: '사려니 흑돼지', cat: '한식', lat: 33.4163, lng: 126.6552,
          img: 'images/food_heukdwaeji.jpg', desc: '사려니숲 입구 근처 제주 흑돼지 전문점. 블루리본 선정.' },
        { id: 'jf2', kind: 'good', name: '숲길 고기국수',  cat: '한식', lat: 33.4002, lng: 126.6212,
          img: 'images/food_galchi.jpg',     desc: '착한가격업소. 진한 사골 육수의 제주 고기국수.' },
        { id: 'jf3', kind: 'cafe', name: '한라산 뷰 카페', cat: '카페', lat: 33.4071, lng: 126.6411,
          img: 'images/food_bingsu.png',     desc: '한라산이 보이는 중산간 카페. 한라봉 빙수가 인기.' },
      ],
    },
  };

  /* ── 상태 ─────────────────────────────────────────────── */
  let map, ready = false, pendingRegion = null;
  let region = 'seoul';
  let mode = 'course';
  let courseLine = null, courseDots = [];
  let startMarker = null, endMarker = null, freeLine = null;
  let foodMarkers = [], foodOverlay = null, foodVisible = true;
  let currentFood = null;

  /* ── SVG 마커 ─────────────────────────────────────────── */
  function svgMarker(bg, glyph, w = 34, h = 42) {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 34 42">
        <path d="M17 0C7.6 0 0 7.4 0 16.6 0 28 17 42 17 42s17-14 17-25.4C34 7.4 26.4 0 17 0z" fill="${bg}"/>
        <circle cx="17" cy="16" r="11" fill="#fff"/>
        <text x="17" y="21" font-size="13" text-anchor="middle" font-family="Apple SD Gothic Neo,Noto Sans KR,sans-serif">${glyph}</text>
      </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  const MARK = {
    start: () => svgMarker('#2e7d32', '출', 36, 46),
    end:   () => svgMarker('#c0392b', '도', 36, 46),
    blue:  () => svgMarker('#1565c0', '🎀'),
    good:  () => svgMarker('#2e9d52', '💚'),
    cafe:  () => svgMarker('#8a5a2b', '☕'),
  };

  /* ── Haversine 거리 계산 ──────────────────────────────── */
  function haversine(p1, p2) {
    const R = 6371000;
    const dLat = (p2.lat() - p1.lat()) * Math.PI / 180;
    const dLng = (p2.lng() - p1.lng()) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function pathLength(pts) {
    let total = 0;
    for (let i = 1; i < pts.length; i++) total += haversine(pts[i - 1], pts[i]);
    return total;
  }

  /* ── 부트스트랩 ──────────────────────────────────────── */
  function boot() {
    if (!window.naver || !window.naver.maps) { showFallback(); renderMeasure(); return; }
    try {
      init();
      setTimeout(() => { if (!ready) showFallback(); }, 4000);
    } catch (e) { showFallback(); }
  }

  function init() {
    const el = document.getElementById('naverMap');
    if (!el) return;
    map = new naver.maps.Map(el, {
      center: new naver.maps.LatLng(DATA.seoul.center.lat, DATA.seoul.center.lng),
      zoom: DATA.seoul.zoom,
      zoomControl: true,
      zoomControlOptions: { position: naver.maps.Position.RIGHT_CENTER },
    });
    ready = true;
    applyRegion(pendingRegion || region);
  }

  /* ── 폴백 ────────────────────────────────────────────── */
  function showFallback() {
    const fb = document.getElementById('mapFallback');
    const nm = document.getElementById('naverMap');
    if (nm) nm.style.display = 'none';
    if (!fb) return;
    fb.style.display = 'flex';
    fb.innerHTML = `
      <div class="fb-card">
        <div class="fb-emoji">🗺</div>
        <h3>네이버 지도 API를 불러오는 중입니다</h3>
        <p class="fb-note">잠시 후에도 지도가 표시되지 않으면 API 키를 확인해 주세요.</p>
      </div>`;
  }

  /* ── 지역 전환 ───────────────────────────────────────── */
  function applyRegion(r) {
    region = r;
    if (!ready) { pendingRegion = r; return; }
    clearCourse(); clearFree(); closeFoodOverlay();
    const d = DATA[r];
    map.setZoom(d.zoom);
    map.setCenter(new naver.maps.LatLng(d.center.lat, d.center.lng));
    buildCourseSelect();
    renderFoodMarkers();
    if (mode === 'course') selectCourse(d.courses[0].id);
    else startFreeMode();
  }

  /* ── 코스 드롭다운 ───────────────────────────────────── */
  function buildCourseSelect() {
    const sel = document.getElementById('courseSelect');
    if (!sel) return;
    sel.innerHTML = DATA[region].courses
      .map(c => `<option value="${c.id}">${c.name} · ${c.diff}</option>`).join('');
    sel.style.display = mode === 'course' ? '' : 'none';
  }

  /* ── 코스 폴리라인 ───────────────────────────────────── */
  function clearCourse() {
    if (courseLine) courseLine.setMap(null);
    courseDots.forEach(m => m.setMap(null));
    courseLine = null; courseDots = [];
  }

  function drawCourse(course) {
    clearCourse();
    const pts = course.path.map(p => new naver.maps.LatLng(p.lat, p.lng));
    courseLine = new naver.maps.Polyline({
      path: pts,
      strokeWeight: 6,
      strokeColor: '#e85a2b',
      strokeOpacity: 0.9,
      strokeStyle: 'solid',
      map: map,
    });
    [[pts[0], MARK.start(), 36, 46], [pts[pts.length - 1], MARK.end(), 36, 46]]
      .forEach(([pt, src, w, h]) => {
        courseDots.push(new naver.maps.Marker({
          position: pt, map,
          icon: { url: src, size: new naver.maps.Size(w, h), anchor: new naver.maps.Point(w / 2, h) },
        }));
      });
    const bounds = new naver.maps.LatLngBounds();
    pts.forEach(p => bounds.extend(p));
    map.fitBounds(bounds, { padding: 60 });
    renderMeasure(pathLength(pts), course);
  }

  /* ── 자유 코스 ───────────────────────────────────────── */
  function clearFree() {
    if (startMarker) startMarker.setMap(null);
    if (endMarker) endMarker.setMap(null);
    if (freeLine) freeLine.setMap(null);
    startMarker = endMarker = freeLine = null;
  }

  function startFreeMode() {
    clearCourse(); clearFree();
    const c = DATA[region].center;
    const sp = new naver.maps.LatLng(c.lat + 0.004, c.lng - 0.006);
    const ep = new naver.maps.LatLng(c.lat - 0.004, c.lng + 0.006);
    startMarker = new naver.maps.Marker({
      position: sp, map, draggable: true,
      icon: { url: MARK.start(), size: new naver.maps.Size(36, 46), anchor: new naver.maps.Point(18, 46) },
    });
    endMarker = new naver.maps.Marker({
      position: ep, map, draggable: true,
      icon: { url: MARK.end(), size: new naver.maps.Size(36, 46), anchor: new naver.maps.Point(18, 46) },
    });
    naver.maps.Event.addListener(startMarker, 'drag', updateFreeLine);
    naver.maps.Event.addListener(endMarker, 'drag', updateFreeLine);
    naver.maps.Event.addListener(startMarker, 'dragend', updateFreeLine);
    naver.maps.Event.addListener(endMarker, 'dragend', updateFreeLine);
    updateFreeLine();
  }

  function updateFreeLine() {
    if (!startMarker || !endMarker) return;
    if (freeLine) freeLine.setMap(null);
    const path = [startMarker.getPosition(), endMarker.getPosition()];
    freeLine = new naver.maps.Polyline({
      path, strokeWeight: 5, strokeColor: '#1565c0',
      strokeOpacity: 0.9, strokeStyle: 'shortdash', map,
    });
    renderMeasure(haversine(path[0], path[1]), null);
  }

  /* ── 거리·소요시간 패널 ──────────────────────────────── */
  function fmtDist(m) {
    return m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m';
  }
  function fmtTime(m) {
    const min = Math.round((m / 1000) / SPEED_KMH * 60);
    if (min < 60) return min + '분';
    return Math.floor(min / 60) + '시간 ' + (min % 60) + '분';
  }
  function renderMeasure(len, course) {
    const el = document.getElementById('measureBody');
    if (!el) return;
    if (!ready) {
      el.innerHTML = `<p class="mb-hint">네이버 지도에서 출발·도착 핀을 드래그해<br>거리와 예상 도보 시간을 계산합니다.</p>`;
      return;
    }
    const distTxt = len != null ? fmtDist(len) : '—';
    const timeTxt = len != null ? fmtTime(len) : '—';
    const diff = course ? course.diff : '자유 설정';
    const dc = diff === '쉬움' ? '#2e7d32' : diff === '보통' ? '#c67a00' : diff === '어려움' ? '#c0392b' : '#555';
    el.innerHTML = `
      <div class="mb-mode">${mode === 'course' ? '🥾 정해진 코스' : '🎈 자유 코스 — 핀을 드래그하세요'}</div>
      <div class="mb-grid">
        <div class="mb-cell"><div class="mb-k">총 거리</div><div class="mb-v">${distTxt}</div></div>
        <div class="mb-cell"><div class="mb-k">예상 시간</div><div class="mb-v">${timeTxt}</div></div>
      </div>
      <div class="mb-diff">난이도 <b style="color:${dc}">${diff}</b><span class="mb-speed">· 도보 ${SPEED_KMH}km/h 기준</span></div>`;
  }

  /* ── 맛집 마커 + 오버레이 ────────────────────────────── */
  function clearFoodMarkers() {
    foodMarkers.forEach(m => m.setMap(null));
    foodMarkers = [];
    closeFoodOverlay();
  }
  function closeFoodOverlay() {
    if (foodOverlay) { foodOverlay.close(); foodOverlay = null; }
    currentFood = null;
  }
  function renderFoodMarkers() {
    clearFoodMarkers();
    if (!foodVisible) return;
    DATA[region].foods.forEach(f => {
      const src = f.kind === 'blue' ? MARK.blue() : f.kind === 'cafe' ? MARK.cafe() : MARK.good();
      const mk = new naver.maps.Marker({
        position: new naver.maps.LatLng(f.lat, f.lng),
        map,
        icon: { url: src, size: new naver.maps.Size(34, 42), anchor: new naver.maps.Point(17, 42) },
        title: f.name,
      });
      naver.maps.Event.addListener(mk, 'click', () => openFoodOverlay(f));
      foodMarkers.push(mk);
    });
  }

  function ribbonBadge(kind) {
    if (kind === 'blue') return '<span class="ro-badge ro-blue">🎀 블루리본</span>';
    if (kind === 'cafe') return '<span class="ro-badge ro-cafe">☕ 카페</span>';
    return '<span class="ro-badge ro-good">💚 착한업소</span>';
  }

  function openFoodOverlay(f) {
    closeFoodOverlay();
    currentFood = f;
    foodOverlay = new naver.maps.InfoWindow({
      content: buildOverlayHTML(f),
      borderWidth: 0,
      backgroundColor: 'transparent',
      pixelOffset: new naver.maps.Point(0, -10),
    });
    foodOverlay.open(map, new naver.maps.LatLng(f.lat, f.lng));
  }

  function buildOverlayHTML(f) {
    const reviews = getReviews(f.id);
    const list = reviews.length
      ? reviews.map(r =>
          `<div class="ro-rev">
            <span class="ro-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
            <span class="ro-rtxt">${escapeHtml(r.text)}</span>
            <span class="ro-rdate">${r.date}</span>
          </div>`).join('')
      : '<div class="ro-empty">아직 후기가 없어요. 첫 후기를 남겨보세요!</div>';
    return `
      <div class="ro-box" data-food-id="${f.id}">
        <button class="ro-close" aria-label="닫기">✕</button>
        <div class="ro-head">
          <img class="ro-thumb" src="${f.img}" alt="${f.name}" onerror="this.style.display='none'">
          <div>
            <div class="ro-name">${f.name}</div>
            <div class="ro-meta">${ribbonBadge(f.kind)}<span class="ro-cat">${f.cat}</span></div>
          </div>
        </div>
        <p class="ro-desc">${f.desc}</p>
        <div class="ro-revs">${list}</div>
        <div class="ro-form">
          <select class="ro-rating">
            <option value="5">★★★★★</option>
            <option value="4">★★★★☆</option>
            <option value="3">★★★☆☆</option>
            <option value="2">★★☆☆☆</option>
            <option value="1">★☆☆☆☆</option>
          </select>
          <input class="ro-input" type="text" maxlength="60" placeholder="후기를 남겨주세요" />
          <button class="ro-submit">등록</button>
        </div>
      </div>`;
  }

  // 이벤트 위임 — InfoWindow 내부 버튼 처리
  document.addEventListener('click', function (e) {
    if (e.target.closest('.ro-close')) { closeFoodOverlay(); return; }
    if (e.target.closest('.ro-submit') && currentFood) { submitReview(currentFood); }
  });

  function submitReview(f) {
    const inp = document.querySelector('.ro-input');
    const sel = document.querySelector('.ro-rating');
    if (!inp) return;
    const txt = inp.value.trim();
    const rating = sel ? parseInt(sel.value, 10) : 5;
    if (!txt) { inp.focus(); return; }
    const all = loadReviews();
    (all[f.id] = all[f.id] || []).unshift({ text: txt, rating, date: new Date().toISOString().slice(0, 10) });
    localStorage.setItem(REVIEW_KEY, JSON.stringify(all));
    // 오버레이 갱신
    if (foodOverlay) foodOverlay.setContent(buildOverlayHTML(f));
  }

  function loadReviews() {
    try { return JSON.parse(localStorage.getItem(REVIEW_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function getReviews(id) { return loadReviews()[id] || []; }
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ── 전역 핸들러 ─────────────────────────────────────── */
  window.setMapRegion = function (r) {
    if (r !== 'seoul' && r !== 'jeju') return;
    if (typeof currentRegion !== 'undefined') { try { currentRegion = r; } catch (e) {} }
    const tabJ = document.getElementById('tabJ'), tabS = document.getElementById('tabS');
    if (tabJ) tabJ.classList.toggle('on', r === 'jeju');
    if (tabS) tabS.classList.toggle('on', r === 'seoul');
    const nt = document.getElementById('noticeTitle');
    if (nt) nt.textContent = r === 'jeju' ? '🔔 제주 국립공원 위험 안내' : '🔔 서울 용산·한강 위험 안내';
    if (typeof renderNotices === 'function') renderNotices();
    if (typeof renderCourses === 'function') renderCourses();
    applyRegion(r);
  };

  window.setMapMode = function (m) {
    mode = m;
    document.getElementById('modeCourse').classList.toggle('on', m === 'course');
    document.getElementById('modeFree').classList.toggle('on', m === 'free');
    const sel = document.getElementById('courseSelect');
    if (sel) sel.style.display = m === 'course' ? '' : 'none';
    if (!ready) { renderMeasure(); return; }
    if (m === 'course') { clearFree(); selectCourse(DATA[region].courses[0].id); }
    else { clearCourse(); startFreeMode(); }
  };

  window.selectCourse = function (id) {
    if (!ready) return;
    const c = DATA[region].courses.find(x => x.id === id);
    if (c) { const sel = document.getElementById('courseSelect'); if (sel) sel.value = id; drawCourse(c); }
  };

  window.toggleFoodMarkers = function () {
    foodVisible = !foodVisible;
    const btn = document.getElementById('foodToggle');
    if (btn) btn.classList.toggle('on', foodVisible);
    if (ready) renderFoodMarkers();
  };

  // 네이버 지도 API는 로드뷰를 지원하지 않습니다
  window.toggleRoadview = function () {};

  window.resetMap = function () {
    if (!ready) return;
    closeFoodOverlay();
    if (mode === 'course') selectCourse(DATA[region].courses[0].id);
    else startFreeMode();
    map.setZoom(DATA[region].zoom);
    map.setCenter(new naver.maps.LatLng(DATA[region].center.lat, DATA[region].center.lng));
  };

  window.renderPins = function () {};

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
