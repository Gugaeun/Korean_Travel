#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
구석구석 — 기상청 API 백엔드 (Python 표준 라이브러리만 사용)

실행 방법 (이 폴더에서):
    python server.py
그 다음 브라우저에서 http://localhost:8000/korea_travel.html 열기

하는 일:
  1) 정적 파일(html/css/js/이미지) 서빙
  2) /api/weather/Seoul, /api/weather/Jeju  → 기상청 단기예보를 프런트 형식으로 변환
  3) /api/warnings                           → 기상청 기상특보(태풍·호우·대설 등)

★ 사용 전 반드시: 아래 SERVICE_KEY 에 공공데이터포털 '일반 인증키(Decoding)'를 붙여넣으세요.
   data.go.kr 에서 아래 2개 활용신청 후 발급:
     - 기상청_단기예보 조회서비스
     - 기상청_기상특보 조회서비스
"""

import os
import json
import datetime as dt
from urllib.parse import urlencode, quote_plus
from urllib.request import urlopen, Request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# 실행 위치와 무관하게 항상 이 파일(server.py)이 있는 폴더 기준으로 서빙
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# ─────────────────────────────────────────────
# 설정
# ─────────────────────────────────────────────
# ── 인증키 (공공데이터포털 'Encoding 키') ──
# 보통 계정당 키 1개라서 세 개가 같습니다. 같으면 SERVICE_KEY 한 곳만 채우세요.
# 만약 API별로 키가 다르게 발급됐다면 아래 KEY_* 를 각각 다른 키로 바꾸면 됩니다.
SERVICE_KEY = os.environ.get("DATA_GO_KR_KEY", "YOUR_SERVICE_KEY")  # 공공데이터포털 Encoding 키 (환경변수 DATA_GO_KR_KEY)

KEY_SHORT = SERVICE_KEY   # 단기예보
KEY_MID   = SERVICE_KEY   # 중기예보(기온·육상)
KEY_WARN  = SERVICE_KEY   # 기상특보

PORT = 8000

# 지역별 동네예보 격자 좌표(nx, ny) + 기상특보 지점번호(stnId) + 중기예보 지역코드
# Seoul → 서울 용산구(용산구청 일대), Jeju → 한라산 국립공원(어리목·중산간 일대)
# ※ 단기예보는 동네 단위로 좁아지지만, 기상특보(stnId)·중기예보는 광역 단위로만 제공됩니다.
CITY = {
    "Seoul": {"nx": 60, "ny": 126, "stnId": 109, "ko": "용산구",
              "midTa": "11B10101", "midLand": "11B00000"},
    "Jeju":  {"nx": 52, "ny": 35,  "stnId": 184, "ko": "한라산",
              "midTa": "11G00201", "midLand": "11G00000"},
}

VILAGE_URL   = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"
WARN_URL     = "http://apis.data.go.kr/1360000/WthrWrnInfoService/getWthrWrnList"
MID_TA_URL   = "http://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa"        # 중기기온
MID_LAND_URL = "http://apis.data.go.kr/1360000/MidFcstInfoService/getMidLandFcst"  # 중기육상예보

WEEKDAY_KO = ['월', '화', '수', '목', '금', '토', '일']


# ─────────────────────────────────────────────
# 기상청 단기예보: base_date / base_time 계산
# (발표시각 02,05,08,11,14,17,20,23시 — 약 10분 뒤 제공)
# ─────────────────────────────────────────────
def base_datetime():
    now = dt.datetime.now() - dt.timedelta(minutes=15)
    hours = [23, 20, 17, 14, 11, 8, 5, 2]
    for h in hours:
        if now.hour >= h:
            base = now.replace(hour=h, minute=0, second=0, microsecond=0)
            return base.strftime("%Y%m%d"), f"{h:02d}00"
    # 02시 이전 → 전날 23시
    y = now - dt.timedelta(days=1)
    return y.strftime("%Y%m%d"), "2300"


def http_get_json(url, params, key):
    from urllib.error import HTTPError
    qs = urlencode(params, quote_via=quote_plus)
    full = f"{url}?serviceKey={quote_plus(key)}&{qs}"
    req = Request(full, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise Exception(f"HTTP {e.code} — body: {body[:300]}")


# ─────────────────────────────────────────────
# 단기예보 → OWM 유사 형식(list)으로 변환
#   프런트(script.js)가 쓰던 필드를 그대로 맞춰줌:
#   dt, dt_txt, main.temp, weather[0].main/description,
#   wind.speed, pop, rain['3h'], snow['3h']
# ─────────────────────────────────────────────
def sky_pty_to_weather(sky, pty):
    # PTY: 0없음 1비 2비/눈 3눈 4소나기 / SKY: 1맑음 3구름많음 4흐림
    if pty == "1": return ("Rain", "비")
    if pty == "2": return ("Rain", "비/눈")
    if pty == "3": return ("Snow", "눈")
    if pty == "4": return ("Rain", "소나기")
    if sky == "1": return ("Clear", "맑음")
    if sky == "3": return ("Clouds", "구름많음")
    if sky == "4": return ("Clouds", "흐림")
    return ("Clouds", "구름")


def parse_amount(v):
    # '강수없음', '1.0mm', '1cm', '-' 등 → float(mm/cm)
    if not v or v in ("강수없음", "적설없음", "-"):
        return 0.0
    num = "".join(ch for ch in v if (ch.isdigit() or ch == "."))
    try:
        return float(num) if num else 0.0
    except ValueError:
        return 0.0


def build_weather(city_key):
    c = CITY[city_key]
    base_date, base_time = base_datetime()
    params = {
        "pageNo": 1, "numOfRows": 1000, "dataType": "JSON",
        "base_date": base_date, "base_time": base_time,
        "nx": c["nx"], "ny": c["ny"],
    }
    data = http_get_json(VILAGE_URL, params, KEY_SHORT)
    items = data["response"]["body"]["items"]["item"]

    # (fcstDate, fcstTime) 별로 카테고리 묶기
    slots = {}
    for it in items:
        key = (it["fcstDate"], it["fcstTime"])
        slots.setdefault(key, {})[it["category"]] = it["fcstValue"]

    out = []
    for (fdate, ftime) in sorted(slots.keys()):
        v = slots[(fdate, ftime)]
        if "TMP" not in v:   # 기온 없는 슬롯은 건너뜀
            continue
        when = dt.datetime.strptime(fdate + ftime, "%Y%m%d%H%M")
        main, desc = sky_pty_to_weather(v.get("SKY", ""), v.get("PTY", "0"))
        out.append({
            "dt": int(when.timestamp()),
            "dt_txt": when.strftime("%Y-%m-%d %H:%M:%S"),
            "main": {"temp": float(v["TMP"])},
            "weather": [{"main": main, "description": desc}],
            "wind": {"speed": float(v.get("WSD", 0) or 0)},
            "pop": (float(v.get("POP", 0) or 0)) / 100.0,
            "rain": {"3h": parse_amount(v.get("PCP", ""))},
            "snow": {"3h": parse_amount(v.get("SNO", ""))},
        })
    return {"list": out}


# ─────────────────────────────────────────────
# 7일 예보 = 단기예보(0~2일) + 중기예보(3~6일)
# ─────────────────────────────────────────────
def klabel(d):
    return f"{d.month}/{d.day}({WEEKDAY_KO[d.weekday()]})"


def wf_to_main(wf):
    # 중기육상 날씨 텍스트('맑음','구름많음','흐리고 비','눈' 등) → 대표 코드
    if "눈" in wf: return "Snow"
    if "비" in wf: return "Rain"
    if "흐" in wf or "구름많" in wf: return "Clouds"
    if "맑" in wf: return "Clear"
    return "Clouds"


def mid_tmfc():
    # 중기예보 발표시각: 06시 / 18시
    now = dt.datetime.now()
    if now.hour >= 18:
        base = now.replace(hour=18, minute=0)
    elif now.hour >= 6:
        base = now.replace(hour=6, minute=0)
    else:
        base = (now - dt.timedelta(days=1)).replace(hour=18, minute=0)
    return base.strftime("%Y%m%d%H%M")


def short_daily(city_key, max_days=4):
    """단기예보 시간별 → 하루 단위로 묶어 앞 max_days일 반환."""
    wl = build_weather(city_key)["list"]
    days = {}
    for it in wl:
        days.setdefault(it["dt_txt"][:10], []).append(it)
    out = []
    for date in sorted(days)[:max_days]:
        items = days[date]
        temps = [i["main"]["temp"] for i in items]
        noon = min(items, key=lambda i: abs(int(i["dt_txt"][11:13]) - 14))
        out.append({
            "d": dt.datetime.strptime(date, "%Y-%m-%d"),
            "main": noon["weather"][0]["main"],
            "description": noon["weather"][0]["description"],
            "tempHigh": round(max(temps)),
            "tempLow": round(min(temps)),
            "rainProb": round(max(i["pop"] for i in items) * 100),
        })
    return out


def build_weekly(city_key):
    out = short_daily(city_key, max_days=7)   # 단기예보 최대 커버 (보통 3~4일, 중기예보 활성화 전 임시)
    n_short = len(out)
    try:
        c = CITY[city_key]
        tmfc = mid_tmfc()
        ta = http_get_json(MID_TA_URL, {
            "pageNo": 1, "numOfRows": 10, "dataType": "JSON",
            "regId": c["midTa"], "tmFc": tmfc,
        }, KEY_MID)["response"]["body"]["items"]["item"][0]
        land = http_get_json(MID_LAND_URL, {
            "pageNo": 1, "numOfRows": 10, "dataType": "JSON",
            "regId": c["midLand"], "tmFc": tmfc,
        }, KEY_MID)["response"]["body"]["items"]["item"][0]
        today = dt.datetime.now()
        for n in range(n_short, 8):           # 단기예보가 커버 못 한 나머지 (중기예보)
            try:
                d = today + dt.timedelta(days=n)
                wf = land.get(f"wf{n}Pm") or land.get(f"wf{n}Am") or land.get(f"wf{n}") or ""
                rains = [land.get(f"rnSt{n}Am"), land.get(f"rnSt{n}Pm"), land.get(f"rnSt{n}")]
                rain = max((int(float(r)) for r in rains if r not in (None, "")), default=0)
                out.append({
                    "d": d,
                    "main": wf_to_main(wf),
                    "description": wf or "—",
                    "tempHigh": int(float(ta.get(f"taMax{n}", 0) or 0)),
                    "tempLow": int(float(ta.get(f"taMin{n}", 0) or 0)),
                    "rainProb": rain,
                })
            except Exception:
                continue
    except Exception as mid_err:
        print(f"[중기예보 오류] {mid_err}")  # 단기 예보만 반환

    return [{
        "date": klabel(e["d"]),
        "main": e["main"],
        "description": e["description"],
        "tempHigh": e["tempHigh"],
        "tempLow": e["tempLow"],
        "rainProb": e["rainProb"],
    } for e in out[:7]]


# ─────────────────────────────────────────────
# 기상특보(태풍·호우·대설·강풍 등) 조회
# ─────────────────────────────────────────────
def build_warnings():
    today = dt.datetime.now()
    frm = (today - dt.timedelta(days=2)).strftime("%Y%m%d") + "0000"
    to  = today.strftime("%Y%m%d") + "2359"
    result = {}
    for key, c in CITY.items():
        try:
            params = {
                "pageNo": 1, "numOfRows": 10, "dataType": "JSON",
                "stnId": c["stnId"], "fromTmFc": frm, "toTmFc": to,
            }
            data = http_get_json(WARN_URL, params, KEY_WARN)
            body = data["response"]["body"]
            items = body.get("items", {})
            item = items.get("item", []) if isinstance(items, dict) else []
            if isinstance(item, dict):
                item = [item]
            result[key] = [
                {"title": it.get("title", ""), "tmFc": it.get("tmFc", "")}
                for it in item
            ]
        except Exception as e:
            result[key] = {"error": str(e)}
    return result


# ─────────────────────────────────────────────
# HTTP 핸들러
# ─────────────────────────────────────────────
class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # 브라우저가 옛날 CSS/JS를 캐시하지 않도록 (수정 즉시 반영)
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def _send_json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        try:
            if self.path.startswith("/api/weather/"):
                city = self.path.rsplit("/", 1)[-1]
                if city not in CITY:
                    return self._send_json({"error": "unknown city"}, 404)
                return self._send_json(build_weather(city))
            if self.path.startswith("/api/weekly/"):
                city = self.path.rsplit("/", 1)[-1]
                if city not in CITY:
                    return self._send_json({"error": "unknown city"}, 404)
                return self._send_json(build_weekly(city))
            if self.path.startswith("/api/warnings"):
                return self._send_json(build_warnings())
            if self.path.startswith("/api/debug/mid"):
                c = CITY["Seoul"]
                tmfc = mid_tmfc()
                ta   = http_get_json(MID_TA_URL,   {"pageNo":1,"numOfRows":10,"dataType":"JSON","regId":c["midTa"],   "tmFc":tmfc}, KEY_MID)
                land = http_get_json(MID_LAND_URL,  {"pageNo":1,"numOfRows":10,"dataType":"JSON","regId":c["midLand"],"tmFc":tmfc}, KEY_MID)
                return self._send_json({"tmfc":tmfc, "ta_item": ta["response"]["body"]["items"]["item"][0] if ta["response"]["body"]["items"] else {}, "land_item": land["response"]["body"]["items"]["item"][0] if land["response"]["body"]["items"] else {}})
        except Exception as e:
            import traceback; traceback.print_exc()
            return self._send_json({"error": str(e)}, 500)
        # 그 외 → 정적 파일
        return super().do_GET()


if __name__ == "__main__":
    print(f"▶ 구석구석 서버 실행 중:  http://localhost:{PORT}/korea_travel.html")
    print("  (종료: Ctrl+C)")
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
