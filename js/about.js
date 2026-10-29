/* ═══════════════════════════════════════
   소개 팝업
   ═══════════════════════════════════════ */
function openAboutPopup() {
  document.getElementById('popBox').className = 'pop-box pop-about';
  document.getElementById('popBox').innerHTML = `
    <div class="pop-body about-pop-body">
      <button class="pop-close-btn" onclick="closePopBtn()" aria-label="닫기">✕</button>
      <div class="about-pop-tag">✦ 산책 ON 이야기</div>
      <h2 class="about-pop-title">걷는다는 것,<br>그것은 나를 찾는 여정입니다</h2>
      <p></p>
     
      <div class="about-pop-text">
        <p>
          여행을 떠났을 때, 한 번쯤 검색해 본 적 있으신가요?
          <br><b>"이 근처에 걸어볼 만한 산책 코스가 어디 있을까?"</b><br>
        </p>
 
        <p>
          막상 찾아보면 지도, 블로그, 여행 사이트를 하나씩 살펴봐야 하고,<br>
          원하는 산책 코스를 찾기까지 생각보다 많은 시간과 노력이 필요합니다.
        </p>
 
        <p>
          <strong>산책 ON은 이러한 번거로움을 줄이기 위해 만들어졌습니다.</strong>
        </p>
 
        <p>
          서울과 제주의 다양한 산책 코스를 한곳에 모아, 혼자, 친구, 연인, 가족 등 누구와 함께하든<br>
          원하는 산책길을 쉽고 편리하게 찾을 수 있도록 도와드립니다.
        </p>
 
        <p>
          이제 여러 사이트를 오가며 검색하지 마세요.<br>
          <b>산책 ON 하나로 여행지의 다양한 산책 코스를 만나보세요.</b>
        </p>
      </div>
 
      <div class="about-pop-chips">
        <span class="about-chip"># 명소 통합 추천</span>
        <span class="about-chip"># 지도 기반 탐색</span>
        <span class="about-chip"># 코스 연계 맛집</span>
        <span class="about-chip"># 동행자별 맞춤</span>
        <span class="about-chip"># 계절별 안내</span>
      </div>
 
      <div class="about-pop-cards">
        <div class="about-pop-card">
          <div class="apc-icon">🌿</div>
          <div class="apc-title">자연과 도심의 연결</div>
          <div class="apc-desc">제주 국립공원과 서울 용산·한강. <br>도심과 자연의 가장 아름다운 길을 한 곳에서.</div>
        </div>
 
        <div class="about-pop-card">
          <div class="apc-icon">🎯</div>
          <div class="apc-title">나에게 맞는 코스</div>
          <div class="apc-desc">나홀로·연인·가족, 자연·해안·도심, <br>쉬움·보통. 조건으로 딱 맞는 코스를 찾아드립니다.</div>
        </div>
 
        <div class="about-pop-card">
          <div class="apc-icon">🍽</div>
          <div class="apc-title">먹는 즐거움까지</div>
          <div class="apc-desc">걷고 난 뒤의 허기는 여행의 완성. <br>코스 인근 검증된 맛집을 한 번에 확인하세요.</div>
        </div>
      </div>
    </div>`;
  document.getElementById('popOv').classList.add('open');
}