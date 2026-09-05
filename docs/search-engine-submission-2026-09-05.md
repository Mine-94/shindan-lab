# shindan24.com 검색엔진 등록·점검 체크리스트 — 2026-09-05

## 범위

이 문서는 일본판 `しんだんラボ / shindan24.com`만 다룬다. 제출 대상은 현재 XML 사이트맵에 들어 있는 **검토 완료 66개 URL**이다. 임의 이름이 포함되는 姓名判断 결과, 점수·비율·초대 조건이 붙은 개인화 결과, 선택 완료된 궁합 결과는 `noindex` 상태이며 제출 대상에 넣지 않는다.

공통 사이트맵:

`https://shindan24.com/sitemap.xml`

사용자용 HTML 사이트맵:

`https://shindan24.com/sitemap.html`

우선 검사 URL:

1. `https://shindan24.com/`
2. `https://shindan24.com/16type`
3. `https://shindan24.com/16type/test`
4. `https://shindan24.com/16type/compatibility`
5. `https://shindan24.com/guide/`
6. `https://shindan24.com/guide/16type.html`
7. `https://shindan24.com/guide/compatibility.html`
8. `https://shindan24.com/guide/fortune.html`
9. `https://shindan24.com/updates.html`
10. `https://shindan24.com/about.html`

---

## Google Search Console

### 최초 또는 재확인

- 속성은 가능하면 DNS 방식의 도메인 속성 `shindan24.com`으로 소유 확인한다.
- URL 접두어 속성을 사용하는 경우 공식 URL은 `https://shindan24.com/`으로 통일한다.
- 기존 Render 주소나 `www` 주소가 별도 속성으로 남아 있다면, 검색 성과 판단은 공식 도메인 속성을 기준으로 한다.

### 사이트맵 제출

`색인 생성 → Sitemaps → 새 사이트맵 추가`에서 다음을 제출한다.

`sitemap.xml`

성공 상태와 발견된 URL 수가 66개 전후로 표시되는지 확인한다. 처리 시점에 따라 차이가 있을 수 있으므로 제출 직후 숫자가 다르다고 반복 삭제·재제출하지 않는다.

### URL 검사

새 가이드 중 대표 4개와 홈을 우선 검사한다.

- `/`
- `/guide/`
- `/guide/16type.html`
- `/guide/compatibility.html`
- `/guide/fortune.html`

각 URL에서 다음을 확인한다.

- URL을 Google에 등록할 수 있음
- robots.txt 차단 없음
- 사용자 선언 canonical과 Google 선택 canonical이 `shindan24.com`으로 일치
- 페이지 가져오기 성공
- 모바일 사용 가능
- 렌더링된 HTML에 본문·내부 링크가 표시됨

소수의 핵심 URL만 `색인 생성 요청`을 사용한다. 같은 URL을 반복 요청해도 더 빨라지지 않는다.

### 주간 점검

- 페이지 색인 생성: 서버 오류, 크롤됨-미색인, 중복·canonical 문제
- 실적: 일본 국가, 모바일 기기, 페이지, 실제 검색어
- Core Web Vitals: 실제 데이터가 생긴 뒤 확인
- 보안 및 직접 조치: 경고 유무

---

## Bing Webmaster Tools / Microsoft 검색

### 소유 확인

Bing Webmaster Tools에 `https://shindan24.com`을 추가한다. Google Search Console에서 가져오기 또는 다음 중 한 방식을 사용한다.

- DNS 자동 확인 또는 CNAME
- `BingSiteAuth.xml` 파일
- 홈페이지 `<head>`의 `msvalidate.01` 메타태그

코드에는 `BING_SITE_VERIFICATION` 환경변수로 메타태그를 출력할 수 있게 준비한다. Bing이 발급한 `content` 값만 Render 환경변수에 넣는다.

### 사이트맵·도구

- Sitemaps에서 `https://shindan24.com/sitemap.xml` 제출
- URL Inspection에서 위 우선 URL 검사
- Site Scan을 홈페이지 범위로 1회 실행
- Site Explorer에서 `/guide/`, `/16type/`, `/q/`, `/shichuu/`, `/ketsueki/`별 발견·크롤 상태 확인
- IndexNow 대시보드에서 제출 성공·발견 URL 확인

현재 저장소 자동화는 배포된 사이트맵과 소유 키를 확인한 뒤 검토 완료 66개 URL을 IndexNow API로 제출한다. 같은 URL을 의미 없이 반복 제출하지 않고, 콘텐츠·사이트맵이 실제로 변경된 경우에만 실행한다.

---

## Naver Search Advisor

### 사이트 등록·소유 확인

- 사이트 단위로 `https://shindan24.com` 등록
- HTML 파일 또는 홈페이지 `<head>` 메타태그 방식으로 소유 확인
- 코드에는 `NAVER_SITE_VERIFICATION` 환경변수로 `naver-site-verification` 메타태그를 출력할 수 있게 준비한다.

### 제출·점검

- `요청 → 사이트맵 제출`에서 `/sitemap.xml` 제출
- robots.txt 검사에서 `User-agent: * / Allow: /` 및 Sitemap 줄 확인
- URL 검사에서 홈, 16타입 허브, 새 가이드 4개 점검
- 사이트 상태에서 HTTPS, 리디렉션, 사이트맵, 수집 상태 확인
- 제목·설명·H1 중복 경고가 있는지 확인

Naver 웹 검색은 별도의 검색 등록 순위를 판매하거나 보장하지 않는다. 웹마스터도구 등록은 수집·색인·노출 상태를 확인하고 개선하는 용도다. IndexNow 제출도 지원되지만, Search Advisor에서 사이트 상태와 실제 색인 여부를 별도로 확인한다.

---

## Yahoo! JAPAN

2026-09-05 현재 일본 Yahoo! 검색 사이트를 직접 등록하는 별도 공개 웹마스터 제출 도구는 이 점검에서 확인하지 못했다. 존재하지 않는 제출 절차를 가정하지 않는다.

대신 다음을 유지한다.

- 공개 200 응답
- 공식 canonical
- robots.txt 허용
- XML 사이트맵
- 서버 렌더링된 일본어 본문
- 정확한 제목·설명
- 자연스러운 외부 언급과 링크

Yahoo! JAPAN 관련 노출은 실제 검색 결과와 유입 데이터를 관찰하고, 공식 제출 채널이 새로 확인될 때만 추가한다.

---

## 제출하지 않는 URL

다음은 사이트 기능으로는 사용할 수 있지만 검색 유입용 콘텐츠로 제출하지 않는다.

- `/meimei/r/{姓}/{名}`
- `/q/{quiz}/r/{result}?s={score}`
- `/16type/test?compare=...`
- `/16type/r/{TYPE}?e=...&s=...&t=...&j=...`
- `/16type/compatibility?self=...&partner=...`
- UTM만 붙은 중복 URL

사이트맵과 내부 canonical에는 쿼리 없는 대표 URL만 사용한다.

---

## 확인 주기

### 배포 당일

- 라이브 200 응답
- canonical·robots·sitemap 확인
- IndexNow 제출
- 핵심 URL 3~5개만 Google/Naver/Bing에서 검사

### 주 1회

- 실제 검색어·페이지별 노출·클릭
- 크롤 오류와 미색인 사유
- 사이트맵 처리 상태
- 외부 유입 UTM과 진단 완료율

### 월 1회

- 색인 가치가 낮은 페이지 정리
- 설명이 오래되거나 출처가 바뀐 유명인 정보 검토
- 검색 수요가 확인된 기존 페이지 보강
- 새 페이지 추가 여부 결정

---

## 공식 참고

- Google 재크롤 요청: https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- Google 기술 요건: https://developers.google.com/search/docs/essentials/technical
- Bing 소유 확인: https://www.bing.com/webmasters/help/add-and-verify-site-12184f8b
- Bing Sitemaps: https://www.bing.com/webmasters/help/sitemaps-3b5cf6ed
- Bing IndexNow: https://www.bing.com/webmasters/help/indexnow-0z209wby
- Bing Site Scan: https://www.bing.com/webmasters/help/site-scan-623520c9
- Naver 사이트 등록·소유 확인: https://searchadvisor.naver.com/guide/faq-start-register
- Naver SEO 기본 가이드: https://searchadvisor.naver.com/guide/seo-help
- Naver RSS·사이트맵 제출: https://searchadvisor.naver.com/guide/request-feed
