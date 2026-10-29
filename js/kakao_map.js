/* ═══════════════════════════════════════════════════════════
   산책 ON — 카카오맵 산책 코스 플래너
   ─ 기획서 연동 기능 ─
   · 선 거리 측정(지도를 클릭해 직접 그리기) → 거리 + 도보/자전거 예상 시간
   · 다양한 이미지 마커(맛집 · 블루리본/착한업소)
   · 커스텀 오버레이(맛집 정보 + 후기 작성/저장)
   · 로드뷰 연동
   ※ 정해진 코스 · 자유 코스 기능은 제거하고 선 거리 측정 기능만 남김
   ※ korea_travel.html 의 YOUR_KAKAO_JS_KEY 를 발급받은 키로 바꾸면 동작합니다.
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const REVIEW_KEY = 'san_reviews';

  /* ── 지역 · 맛집 데이터 ───────────────────────── */
  const DATA = {
    seoul: {
      label: '서울 용산·한강',
      center: { lat: 37.5108, lng: 126.9968 },
      level: 6,
      foods: [
        { id: 'sf1', kind: 'blue', name: '한강 갈비',  cat: '한식', lat: 37.5068, lng: 126.9942,
          img: 'images/food_samgyeopsal.jpg', desc: '반포한강공원 인근 숯불 갈비 노포. 산책 후 든든한 한 끼.' },
        { id: 'sf2', kind: 'good', name: '용산 손칼국수', cat: '한식', lat: 37.5298, lng: 126.9712,
          img: 'images/food_makgeolli.jpg', desc: '착한가격업소 지정. 직접 뽑은 면의 따뜻한 칼국수 한 그릇.' },
        { id: 'sf3', kind: 'cafe', name: '노을 리버뷰 카페', cat: '카페', lat: 37.5133, lng: 127.0102,
          img: 'images/food_jejucafe.jpg', desc: '한강 노을이 보이는 통창 카페. 산책 마무리에 딱.' },
      ],
    },
    jeju: {
      label: '제주 국립공원',
      center: { lat: 33.4012, lng: 126.6300 },
      level: 9,
      foods: [
        { id: 'jf1', kind: 'blue', name: '사려니 흑돼지', cat: '한식', lat: 33.4163, lng: 126.6552,
          img: 'images/food_heukdwaeji.jpg', desc: '사려니숲 입구 근처 제주 흑돼지 전문점. 블루리본 선정.' },
        { id: 'jf2', kind: 'good', name: '숲길 고기국수', cat: '한식', lat: 33.4002, lng: 126.6212,
          img: 'images/food_galchi.jpg', desc: '착한가격업소. 진한 사골 육수의 제주 고기국수.' },
        { id: 'jf3', kind: 'cafe', name: '한라산 뷰 카페', cat: '카페', lat: 33.4071, lng: 126.6411,
          img: 'images/food_bingsu.png', desc: '한라산이 보이는 중산간 카페. 한라봉 빙수가 인기.' },
      ],
    },
  };

  /* ── 상태 ─────────────────────────────────────────────── */
  let map, rv, rvClient, ready = false, pendingRegion = null;
  let region = 'seoul';
  let foodMarkers = [], foodOverlay = null, foodVisible = true;
  let roadviewOn = false;
  let freeCourseOn = true;   // 🎈 자유 코스(선 그리기) on/off — 꺼져 있으면 지도 클릭이 선을 그리지 않음
  // 선 거리 측정(직접 그리기) 상태
  let drawFlag = false, drawClickLine = null, drawMoveLine = null,
      drawDistanceOverlay = null, drawDots = [];

  /* ── 이미지 마커(SVG data URI) ───────────────────────── */
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
    blue:  () => svgMarker('#1565c0', '🎀'),
    good:  () => svgMarker('#2e9d52', '💚'),
    cafe:  () => svgMarker('#8a5a2b', '☕'),
  };

  /* ── 부트스트랩 ──────────────────────────────────────── */
  function boot() {
    const sdk = document.querySelector('script[src*="dapi.kakao.com"]');
    const noKey = window.__kakaoFailed || !sdk || /YOUR_KAKAO_JS_KEY/.test(sdk.src);
    if (noKey) { showFallback(); renderDrawMeasure(); return; }
    if (!window.kakao || !window.kakao.maps) { showFallback(); renderDrawMeasure(); return; }
    try {
      kakao.maps.load(init);
      setTimeout(() => { if (!ready) showFallback(); }, 4000);
    } catch (e) { showFallback(); }
  }

  function init() {
    const el = document.getElementById('kakaoMap');
    if (!el) return;
    map = new kakao.maps.Map(el, {
      center: new kakao.maps.LatLng(DATA.seoul.center.lat, DATA.seoul.center.lng),
      level: DATA.seoul.level,
    });
    map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
    rv = new kakao.maps.Roadview(document.getElementById('roadview'));
    rvClient = new kakao.maps.RoadviewClient();
    bindDrawEvents();   // 선 거리 측정용 클릭/이동/우클릭 이벤트 등록
    ready = true;
    applyRegion(pendingRegion || region);
  }

  /* ── 폴백(키 미설정) 안내 ────────────────────────────── */
  function showFallback() {
    const fb = document.getElementById('mapFallback');
    const km = document.getElementById('kakaoMap');
    if (km) km.style.display = 'none';
    if (!fb) return;
    fb.style.display = 'flex';
    fb.innerHTML = `
      <div class="fb-card">
        <div class="fb-emoji">🗺</div>
        <h3>카카오맵 키를 연결하면 지도가 표시됩니다</h3>
        <ol class="fb-steps">
          <li><a href="https://developers.kakao.com" target="_blank" rel="noopener">developers.kakao.com</a> 로그인 → <b>내 애플리케이션</b> → 앱 생성</li>
          <li><b>앱 키</b> 메뉴의 <b>JavaScript 키</b> 복사</li>
          <li><b>플랫폼 → Web</b> 에 사이트 도메인 등록 (예: <code>http://localhost:8000</code>)</li>
          <li><code>korea_travel.html</code> 의 <code>YOUR_KAKAO_JS_KEY</code> 를 복사한 키로 교체</li>
          <li>저장 후 새로고침하면 지도·로드뷰·선 거리 측정이 활성화됩니다</li>
        </ol>
        <p class="fb-note">키가 없어도 명소 · 코스 · 맛집 · 날씨 등 나머지 기능은 정상 동작합니다.</p>
      </div>`;
  }

  /* ── 지역 전환 ───────────────────────────────────────── */
  function applyRegion(r) {
    region = r;
    if (!ready) { pendingRegion = r; return; }
    clearDraw(); closeRoadview();
    const d = DATA[r];
    map.setLevel(d.level);
    map.setCenter(new kakao.maps.LatLng(d.center.lat, d.center.lng));
    map.relayout();
    renderFoodMarkers();
    if (freeCourseOn) renderDrawMeasure(); else renderFreeOffMeasure();
  }

  /* ── 선 거리 측정(직접 그리기) ─────────────────────────
     지도를 클릭하면 선 그리기가 시작되고, 클릭할 때마다 점이 추가되며,
     오른쪽 클릭하면 그리기가 종료되고 총거리 + 도보/자전거 예상 시간이
     우측 "거리 · 소요시간" 패널에 표시됩니다. */
  function clearDrawVisuals() {
    if (drawClickLine) { drawClickLine.setMap(null); drawClickLine = null; }
    if (drawMoveLine)  { drawMoveLine.setMap(null);  drawMoveLine  = null; }
    if (drawDistanceOverlay) { drawDistanceOverlay.setMap(null); drawDistanceOverlay = null; }
    drawDots.forEach(d => {
      if (d.circle)   d.circle.setMap(null);
      if (d.distance) d.distance.setMap(null);
    });
    drawDots = [];
  }
  function clearDraw() {   // 지역 전환 · 초기화 시 호출 — 그리던 선까지 완전히 정리
    clearDrawVisuals();
    drawFlag = false;
  }

  function showDrawDistance(content, position) {
    if (drawDistanceOverlay) {
      drawDistanceOverlay.setPosition(position);
      drawDistanceOverlay.setContent(content);
    } else {
      drawDistanceOverlay = new kakao.maps.CustomOverlay({
        map, content, position, xAnchor: 0, yAnchor: 0, zIndex: 3,
      });
    }
  }

  function displayDrawDot(position, distance) {
    const circleOverlay = new kakao.maps.CustomOverlay({
      content: '<span class="dm-point"></span>', position, zIndex: 1,
    });
    circleOverlay.setMap(map);

    let distOverlay = null;
    if (distance > 0) {
      distOverlay = new kakao.maps.CustomOverlay({
        content: '<div class="dm-badge">거리 <span class="dm-num">' + distance + '</span>m</div>',
        position, yAnchor: 1, zIndex: 2,
      });
      distOverlay.setMap(map);
    }
    drawDots.push({ circle: circleOverlay, distance: distOverlay });
  }

  function fmtDrawMinutes(totalMin) {
    if (totalMin > 60) return Math.floor(totalMin / 60) + '시간 ' + (totalMin % 60) + '분';
    return totalMin + '분';
  }
  function drawWalkBikeTime(distance) {
    // 도보 평균 분속 67m/min, 자전거 평균 분속 227m/min 기준
    return {
      walk: fmtDrawMinutes(distance / 67 | 0),
      bike: fmtDrawMinutes(distance / 227 | 0),
    };
  }

  function bindDrawEvents() {
    kakao.maps.event.addListener(map, 'click', function (mouseEvent) {
      if (!freeCourseOn) return;
      const clickPosition = mouseEvent.latLng;

      if (!drawFlag) {
        drawFlag = true;
        clearDrawVisuals();   // 이전에 그리던 선이 남아있으면 지우고 새로 시작

        drawClickLine = new kakao.maps.Polyline({
          map, path: [clickPosition], strokeWeight: 3, strokeColor: '#db4040',
          strokeOpacity: 1, strokeStyle: 'solid',
        });
        drawMoveLine = new kakao.maps.Polyline({
          strokeWeight: 3, strokeColor: '#db4040', strokeOpacity: 0.5, strokeStyle: 'solid',
        });
        displayDrawDot(clickPosition, 0);
      } else {
        const path = drawClickLine.getPath();
        path.push(clickPosition);
        drawClickLine.setPath(path);
        const distance = Math.round(drawClickLine.getLength());
        displayDrawDot(clickPosition, distance);
      }
    });

    kakao.maps.event.addListener(map, 'mousemove', function (mouseEvent) {
      if (!freeCourseOn || !drawFlag) return;
      const mousePosition = mouseEvent.latLng;
      const path = drawClickLine.getPath();
      const movePath = [path[path.length - 1], mousePosition];
      drawMoveLine.setPath(movePath);
      drawMoveLine.setMap(map);

      const distance = Math.round(drawClickLine.getLength() + drawMoveLine.getLength());
      const content = '<div class="dm-badge">총거리 <span class="dm-num">' + distance + '</span>m</div>';
      showDrawDistance(content, mousePosition);
    });

    kakao.maps.event.addListener(map, 'rightclick', function (mouseEvent) {
      if (!freeCourseOn || !drawFlag) return;

      if (drawMoveLine) { drawMoveLine.setMap(null); drawMoveLine = null; }
      if (drawDistanceOverlay) { drawDistanceOverlay.setMap(null); drawDistanceOverlay = null; }   // 지도 위 떠있던 실시간 거리 말풍선 제거 — 결과는 패널에 표시
      const path = drawClickLine.getPath();

      if (path.length > 1) {
        const last = drawDots[drawDots.length - 1];
        if (last && last.distance) { last.distance.setMap(null); last.distance = null; }

        const distance = Math.round(drawClickLine.getLength());
        renderDrawMeasure(distance);   // 거리·소요시간 패널에 최종 결과 표시
      } else {
        clearDrawVisuals();
        renderDrawMeasure();           // 패널을 다시 안내 문구로
      }
      drawFlag = false;
    });
  }

  function renderDrawMeasure(distance) {
    const el = document.getElementById('measureBody');
    if (!el) return;
    if (!ready) {
      el.innerHTML = `<p class="mb-hint">카카오맵 키를 연결하면 지도를 클릭해<br>선을 그리고 거리를 측정할 수 있어요.</p>`;
      return;
    }
    if (distance == null) {
      el.innerHTML = `<p class="mb-hint">지도를 클릭하면 선 그리기가 시작되고<br>오른쪽 클릭하면 종료돼요.<br>완성된 선의 거리·예상 시간이 여기 표시됩니다.</p>`;
      return;
    }
    const { walk, bike } = drawWalkBikeTime(distance);
    el.innerHTML = `
      <div class="dm-grid3">
        <div class="mb-cell"><div class="mb-k">총거리</div><div class="mb-v">${distance}m</div></div>
        <div class="mb-cell"><div class="mb-k">도보</div><div class="mb-v">${walk}</div></div>
        <div class="mb-cell"><div class="mb-k">자전거</div><div class="mb-v">${bike}</div></div>
      </div>`;
  }

  function renderFreeOffMeasure() {
    const el = document.getElementById('measureBody');
    if (!el) return;
    el.innerHTML = `<p class="mb-hint">🎈 자유 코스가 꺼져 있어요.<br>켜면 지도를 클릭해 선을 그리고<br>거리를 측정할 수 있어요.</p>`;
  }

  /* ── 맛집 이미지 마커 + 커스텀 오버레이 ──────────────── */
  function clearFoodMarkers() {
    foodMarkers.forEach(m => m.setMap(null));
    foodMarkers = [];
    if (foodOverlay) { foodOverlay.setMap(null); foodOverlay = null; }
  }
  function renderFoodMarkers() {
    clearFoodMarkers();
    if (!foodVisible) return;
    DATA[region].foods.forEach(f => {
      const img = f.kind === 'blue' ? MARK.blue() : f.kind === 'cafe' ? MARK.cafe() : MARK.good();
      const mk = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(f.lat, f.lng), map,
        image: new kakao.maps.MarkerImage(img, new kakao.maps.Size(34, 42), { offset: new kakao.maps.Point(17, 40) }),
        title: f.name,
      });
      kakao.maps.event.addListener(mk, 'click', () => openFoodOverlay(f));
      foodMarkers.push(mk);
    });
  }

  function ribbonBadge(kind) {
    if (kind === 'blue') return '<span class="ro-badge ro-blue">🎀 블루리본</span>';
    if (kind === 'cafe') return '<span class="ro-badge ro-cafe">☕ 카페</span>';
    return '<span class="ro-badge ro-good">💚 착한업소</span>';
  }

  function openFoodOverlay(f) {
    if (foodOverlay) { foodOverlay.setMap(null); foodOverlay = null; }
    const wrap = document.createElement('div');
    wrap.className = 'food-ov';
    wrap.innerHTML = buildOverlayHTML(f);
    wrap.querySelector('.ro-close').addEventListener('click', () => { foodOverlay.setMap(null); foodOverlay = null; });
    wrap.querySelector('.ro-submit').addEventListener('click', () => submitReview(f, wrap));
    foodOverlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(f.lat, f.lng),
      content: wrap, yAnchor: 1.25, xAnchor: 0.5, zIndex: 50,
    });
    foodOverlay.setMap(map);
  }

  function buildOverlayHTML(f) {
    const reviews = getReviews(f.id);
    const list = reviews.length
      ? reviews.map(r => `<div class="ro-rev"><span class="ro-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span><span class="ro-rtxt">${escapeHtml(r.text)}</span><span class="ro-rdate">${r.date}</span></div>`).join('')
      : '<div class="ro-empty">아직 후기가 없어요. 첫 후기를 남겨보세요!</div>';
    return `
      <div class="ro-box">
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

  function submitReview(f, wrap) {
    const txt = wrap.querySelector('.ro-input').value.trim();
    const rating = parseInt(wrap.querySelector('.ro-rating').value, 10);
    if (!txt) { wrap.querySelector('.ro-input').focus(); return; }
    const all = loadReviews();
    (all[f.id] = all[f.id] || []).unshift({
      text: txt, rating,
      date: new Date().toISOString().slice(0, 10),
    });
    localStorage.setItem(REVIEW_KEY, JSON.stringify(all));
    // 오버레이 갱신
    wrap.innerHTML = buildOverlayHTML(f);
    wrap.querySelector('.ro-close').addEventListener('click', () => { foodOverlay.setMap(null); foodOverlay = null; });
    wrap.querySelector('.ro-submit').addEventListener('click', () => submitReview(f, wrap));
  }

  function loadReviews() {
    try { return JSON.parse(localStorage.getItem(REVIEW_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function getReviews(id) { return loadReviews()[id] || []; }
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ── 로드뷰 ──────────────────────────────────────────── */
  function closeRoadview() {
    roadviewOn = false;
    const rvEl = document.getElementById('roadview');
    const cls = document.getElementById('rvClose');
    const tgl = document.getElementById('roadviewToggle');
    if (rvEl) rvEl.style.display = 'none';
    if (cls) cls.style.display = 'none';
    if (tgl) tgl.classList.remove('on');
  }
  function openRoadview() {
    if (!ready) return;
    const c = map.getCenter();
    rvClient.getNearestPanoId(c, 80, panoId => {
      if (!panoId) { alert('이 위치 주변에는 로드뷰가 없어요. 지도를 도심·도로 쪽으로 옮겨보세요.'); return; }
      roadviewOn = true;
      const rvEl = document.getElementById('roadview');
      const cls = document.getElementById('rvClose');
      const tgl = document.getElementById('roadviewToggle');
      if (rvEl) rvEl.style.display = 'block';
      if (cls) cls.style.display = 'block';
      if (tgl) tgl.classList.add('on');
      rv.setPanoId(panoId, c);
      setTimeout(() => rv.relayout(), 60);
    });
  }

  /* ── 전역 핸들러 (HTML onclick / script.js 연동) ─────── */
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

  window.toggleFreeCourse = function () {
    freeCourseOn = !freeCourseOn;
    document.getElementById('freeToggle').classList.toggle('on', freeCourseOn);
    const hint = document.getElementById('mapDrawHint');
    if (hint) hint.style.display = freeCourseOn ? '' : 'none';

    if (!freeCourseOn) {
      clearDraw();            // 끄는 순간 그리던 선이 있으면 정리
      renderFreeOffMeasure();
    } else {
      renderDrawMeasure();
    }
  };

  window.toggleFoodMarkers = function () {
    foodVisible = !foodVisible;
    document.getElementById('foodToggle').classList.toggle('on', foodVisible);
    if (ready) renderFoodMarkers();
  };

  window.toggleRoadview = function () {
    if (!ready) return;
    if (roadviewOn) closeRoadview(); else openRoadview();
  };

  window.resetMap = function () {
    if (!ready) return;
    closeRoadview();
    clearDraw();
    if (freeCourseOn) renderDrawMeasure(); else renderFreeOffMeasure();
    map.setLevel(DATA[region].level);
    map.setCenter(new kakao.maps.LatLng(DATA[region].center.lat, DATA[region].center.lng));
  };

  // 레거시(정적 핀) 함수 무력화 — script.js 의 load 핸들러가 호출함
  window.renderPins = function () {};

  /* 부트 */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();