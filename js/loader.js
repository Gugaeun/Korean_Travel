/*
  [loader.js]
  기능 : HTML 컴포넌트 파일들을 fetch로 불러와 페이지에 주입한 뒤
         앱 스크립트를 순서대로 로드하고 initApp()을 실행
  UI   : 사용자에게 보이지 않는 초기화 로직
         로드 순서: topbar → hero → finder → slider → map → overlay → footer
                    → courses.js → reviews.js → about.js → script.js → kakao_map.js
                    → initApp()
*/

(async function () {

  /* ── 1. HTML 컴포넌트 주입 ── */
  const COMPONENTS = [
    ['comp-topbar',  'html/topbar.html' ],
    ['comp-hero',    'html/hero.html'   ],
    ['comp-finder',  'html/finder.html' ],
    ['comp-slider',  'html/slider.html' ],
    ['comp-map',     'html/map.html'    ],
    ['comp-overlay',        'html/overlay.html'       ],
    ['comp-finder-result',  'html/finder_result.html' ],
    ['comp-footer',         'html/footer.html'        ],
  ];

  await Promise.all(
    COMPONENTS.map(async ([id, url]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const res  = await fetch(url);
      const html = await res.text();
      el.outerHTML = html;   // placeholder div를 실제 HTML로 교체
    })
  );

  /* ── 2. 앱 스크립트 순차 로드 ── */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s    = document.createElement('script');
      s.src      = src;
      s.onload   = resolve;
      s.onerror  = () => reject(new Error(`스크립트 로드 실패: ${src}`));
      document.head.appendChild(s);
    });
  }

  /* 카카오맵 SDK는 콜백 없이 async 로드 허용 */
  await loadScript(
    'https://dapi.kakao.com/v2/maps/sdk.js?appkey=7c520696a711e12a28bb2e604706da59&autoload=false&libraries=services'
  ).catch(() => { window.__kakaoFailed = true; });

  await loadScript('js/courses.js');
  await loadScript('js/reviews.js');
  await loadScript('js/about.js');
  await loadScript('js/script.js');
  await loadScript('js/kakao_map.js');
  await loadScript('js/finder_result.js');

  /* ── 3. 앱 초기화 ── */
  if (typeof initApp          === 'function') initApp();
  if (typeof initFinderResult === 'function') initFinderResult();

})();
