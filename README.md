# 산책 ON — 한국 여행 산책 코스 + 날씨

지역별 산책 코스를 지도(카카오맵)로 보여주고, 기상청 예보·특보를 함께 확인하는 웹 프로젝트입니다.

## 구성
- `index.html`, `html/`, `css/`, `js/`: 화면(코스 찾기, 지도, 소개)
- `server.py`: 정적 파일 서버 + 날씨 API 중계(공공데이터포털 기상청 단기·중기예보, 기상특보)

## 실행
```bash
export DATA_GO_KR_KEY="공공데이터포털 Encoding 키"   # Windows: set DATA_GO_KR_KEY=...
python server.py
```
브라우저에서 http://localhost:8000/index.html 을 엽니다. (Windows는 `날씨서버_실행.bat` 더블클릭)

카카오맵은 `js/loader.js`의 JavaScript 키를 사용하며, 본인 키로 바꾸고 사이트 도메인에 `http://localhost:8000`을 등록해야 합니다.
