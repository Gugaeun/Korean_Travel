/* ═══════════════════════════════════════
   후기 데이터
═══════════════════════════════════════ */
const COURSE_REVIEWS = [
  { region:'seoul', avatar:'🚶', name:'산책러_민준',   place:'남산 순환 둘레길',     stars:5, text:'남산 한 바퀴 돌고 나서 기분이 완전 리셋됐어요. 봄에 벚꽃이 피면 더 예쁠 것 같아서 또 오고 싶어요.', date:'2025.04.12' },
  { region:'seoul', avatar:'💑', name:'우리둘이여행',  place:'반포한강공원 무지개길', stars:5, text:'저녁에 달빛무지개분수 보면서 걸었는데 진짜 로맨틱했어요. 돗자리 챙겨오면 더 좋을 것 같아요.', date:'2025.05.03' },
  { region:'seoul', avatar:'🌿', name:'초록탐험가',    place:'용산가족공원 숲길',     stars:4, text:'아이랑 같이 왔는데 넓어서 좋았어요. 나무 그늘이 많아서 여름에도 걷기 괜찮을 것 같아요.', date:'2025.06.01' },
  { region:'jeju',  avatar:'🏝', name:'제주러버_지수', place:'비자림 숲길',           stars:5, text:'천 년 된 비자나무 숲 속을 걷는 느낌이 진짜 신비로워요. 공기가 너무 좋아서 폐가 정화되는 기분.', date:'2025.03.22' },
  { region:'jeju',  avatar:'🌊', name:'올레꾼_태양',   place:'절물자연휴양림 산책로', stars:5, text:'피톤치드 가득한 삼나무 숲길이요. 제주 왔으면 한 번은 꼭 와야 하는 곳이에요. 조용하고 힐링 그 자체.', date:'2025.04.18' },
  { region:'jeju',  avatar:'🦋', name:'느린여행자',    place:'사려니숲길',            stars:5, text:'안개 낀 날 갔더니 완전 신비로운 분위기였어요. 길도 평탄해서 누구나 걷기 좋아요. 꼭 다시 올게요!', date:'2025.05.30' },
];

const FOOD_REVIEWS = [
  { region:'seoul', avatar:'☕', name:'카페탐방러',    place:'한강뷰 도넛카페',   stars:5, text:'반포한강 산책하고 들렀는데 도넛이 진짜 맛있어요. 한강 뷰 보면서 먹으니까 더 맛있는 것 같아요.', date:'2025.05.10' },
  { region:'seoul', avatar:'🍜', name:'용산맛집헌터',  place:'용산 손칼국수',     stars:4, text:'면을 직접 뽑아서인지 쫄깃함이 달라요. 양도 많고 가격도 착해서 산책 후 들르기 딱 좋아요.', date:'2025.04.28' },
  { region:'seoul', avatar:'🥩', name:'이촌주민_기현', place:'이촌동 삼겹살',     stars:5, text:'숯불 향이 장난 아니에요. 한강 산책 마치고 왔더니 더 맛있게 느껴졌어요. 재방문 확정!', date:'2025.06.05' },
  { region:'jeju',  avatar:'🐷', name:'제주흑돼지마니아', place:'사려니 흑돼지', stars:5, text:'사려니숲 다녀온 뒤 바로 왔어요. 제주 흑돼지라 그런지 육질이 정말 달랐어요. 필수 코스예요.', date:'2025.03.30' },
  { region:'jeju',  avatar:'🍵', name:'힐링중독자',    place:'한라산 뷰 카페',   stars:5, text:'한라산 보이는 뷰에서 귤 에이드 마시니까 완전 힐링이에요. 케이크도 수제라 맛있었어요.', date:'2025.04.20' },
  { region:'jeju',  avatar:'🐚', name:'해산물러버',    place:'사려니 보말죽',    stars:5, text:'숲길 걷고 먹는 보말죽이 이렇게 맛있을 수가 없어요. 제주 특유의 맛이 제대로 살아있어요.', date:'2025.05.14' },
];

/* ═══════════════════════════════════════
   후기 팝업
═══════════════════════════════════════ */
let popReviewRegion = 'all';
let popReviewType   = 'course';

function openReviewPopup(region) {
  popReviewRegion = region || 'all';
  popReviewType   = 'course';
  const regionLabel = popReviewRegion === 'seoul' ? '서울' : popReviewRegion === 'jeju' ? '제주' : '전체';
  const box = document.getElementById('popBox');
  box.className = 'pop-box pop-review';
  box.innerHTML = `
    <div class="review-pop-body">
      <div class="courses-pop-head">
        <div>
          <p class="sec-label" style="margin-bottom:4px">${regionLabel} 방문자 후기</p>
          <h2 class="courses-pop-title">함께 걸은 사람들의 <em style="color:var(--accent);font-style:normal">이야기</em></h2>
        </div>
        <button class="courses-pop-close" onclick="closePopBtn()" aria-label="닫기">✕</button>
      </div>
      <div class="rv-type-tabs" id="rvTypeTabs">
        <button class="rv-type-tab on" onclick="setReviewType('course',this)">코스 후기</button>
        <button class="rv-type-tab" onclick="setReviewType('food',this)">맛집 후기</button>
      </div>
      <div class="review-grid" id="reviewGrid"></div>
    </div>`;
  document.getElementById('popOv').classList.add('open');
  renderReviews();
}

function setReviewType(type, btn) {
  popReviewType = type;
  document.querySelectorAll('#rvTypeTabs .rv-type-tab').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  renderReviews();
}

function renderReviews() {
  const src  = popReviewType === 'course' ? COURSE_REVIEWS : FOOD_REVIEWS;
  const list = popReviewRegion === 'all' ? src : src.filter(r => r.region === popReviewRegion);
  const grid = document.getElementById('reviewGrid');
  if (!grid) return;
  grid.innerHTML = list.length === 0
    ? '<p style="color:#888;text-align:center;padding:40px 0;grid-column:1/-1">등록된 후기가 없습니다.</p>'
    : list.map(r => `
    <div class="rv-card">
      <div class="rv-top">
        <div class="rv-user">
          <div class="rv-avatar">${r.avatar}</div>
          <div>
            <div class="rv-name">${r.name}</div>
            <div class="rv-region-label">${r.region === 'seoul' ? '🌉 서울' : '🏝 제주'}</div>
          </div>
        </div>
        <div class="rv-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
      </div>
      <span class="rv-course">${r.place}</span>
      <p class="rv-text">${r.text}</p>
      <div class="rv-date">${r.date}</div>
    </div>`).join('');
}
