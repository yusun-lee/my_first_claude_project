# EV Charger Finder 구현 계획

## 사전 준비 (Task 목록 밖, 사용자가 직접 수행)

- [x] 공공데이터포털 "한국전력공사_충전소의 위치 및 현황 정보" 인증키 발급 완료, 실제 호출로 응답 스키마 확인 완료 (충전기 타입 필드 없음 — spec.md/plan.md에 반영됨)
- [ ] 카카오 디벨로퍼스 애플리케이션 등록 → JavaScript 키·REST API 키 발급, 플랫폼에 로컬 개발 도메인(`http://localhost:<port>`) 등록
- 발급받은 키를 `.env.local`에 저장 (Task 1이 만드는 `.env.local.example`을 참고)

카카오 키가 아직 없으므로, Task 1~2의 카카오 관련 자동 테스트는 fetch/스크립트 레벨에서 mock해 검증한다. 공공데이터포털 키는 이미 있으므로 Task 3의 `services/chargerStations.ts`는 실제 API로도 검증 가능하다. 최종 Checkpoint(spec의 End-to-end 검증)는 카카오 키까지 `.env.local`에 채워진 뒤에만 완전히 통과할 수 있다.

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| API 키 은닉 | 공공데이터포털·카카오 REST 요청은 Next.js Route Handler(`app/api/*`)를 통해 서버에서만 호출 | REST/서비스 키가 클라이언트 번들에 노출되면 도용 위험. 카카오 JS 키만 `NEXT_PUBLIC_`으로 노출(도메인 등록으로 보호됨) |
| 반경 필터링 위치 | 서버(Route Handler)에서 haversine 거리 계산 후 5km 이내만 반환 | 실제 API 호출로 확인됨: 공공데이터포털 API(`한국전력공사_충전소의 위치 및 현황 정보`, `api.odcloud.kr`)는 위경도+반경 파라미터를 지원하지 않고 `page`/`perPage` 페이지네이션만 제공(전체 4,394건, 2026-07 기준). 인증은 쿼리스트링이 아니라 `Authorization: Infuser {서비스키}` 헤더로 전달. 서버가 전체 페이지를 순회해 가져온 뒤 haversine으로 직접 필터링 |
| 충전기 타입(급속/완속) 제외 | Station 데이터 모델·팝업에서 충전기 타입 제거 | 사용하는 데이터셋에 해당 필드가 없음(별도 데이터셋 "충전소별 충전기 용량 정보" 조인 필요, MVP 범위 밖 — spec.md 제외 항목) |
| 페이지 컴포넌트 경계 | `app/page.tsx`를 `"use client"` 컴포넌트로 작성 (얇은 서버 래퍼 생략) | 페이지 전체가 검색 상태·이벤트 처리 중심이라 서버 컴포넌트로 얻을 이점이 없음. 불필요한 레이어 추가 방지 |
| 지도 SDK 로드 | 카카오맵 JS SDK를 `next/script`로 로드하고 `window.kakao.maps` 준비 후 초기화 | Next.js 권장 스크립트 로딩 방식(next-best-practices) |
| 지역명 모호성 처리 | 카카오 로컬 API 응답의 첫 번째(최상위 관련도) 결과를 그대로 사용 | spec S3 결정사항 — 후보 선택 UI 없음 |
| 에러/안내 배너 컴포넌트 | shadcn `Alert`를 Task 1에서 도입하고 Task 5가 재사용 | wireframe의 "주소 못 찾음"(S2)과 "반경 내 결과 없음"(S4) 화면이 동일한 시각 패턴(테두리 박스+아이콘+텍스트)이라 컴포넌트를 공유해야 재작업이 없음 |
| wireframe 중심 pin의 의미 | 초기 화면/주소 못 찾음/반경 내 결과 없음 화면의 중심 pin은 "지도 중심 위치"를 나타내는 wireframe 표기 관례일 뿐, 실제 구현에서 별도 마커 컴포넌트가 아니다 (카카오맵 `setCenter`로만 처리) | S4-2("마커는 표시되지 않고")와 혼동 방지 |

## 인프라 리소스

| 리소스 | 유형 | 선언 위치 | 생성 Task |
|---|---|---|---|
| `NEXT_PUBLIC_KAKAO_JS_KEY` | Env var (client) | `.env.local` | Task 1 |
| `KAKAO_REST_API_KEY` | Env var (server) | `.env.local` | Task 1 |
| `DATA_GO_KR_SERVICE_KEY` | Env var (server) | `.env.local` | Task 1 |

## 데이터 모델

### Location (지오코딩 결과)
- lat (required)
- lng (required)
- addressName (required) — 카카오 로컬 API가 반환한 정규화된 주소

### Station (충전소)
- id (required)
- name (required)
- address (required)
- lat (required)
- lng (required)

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| next-best-practices | Task 1, 2, 3 | Route Handler 작성, `next/script` 외부 스크립트 로딩, RSC/Client 경계 판단 |
| shadcn | Task 1, 5 | 기존 Input/Button 재사용, Alert 컴포넌트 신규 추가(레지스트리 경유, 직접 작성 금지) |
| vercel-react-best-practices | Task 3, 6 | 검색 상태 관리, 불필요한 리렌더 방지 |
| web-design-guidelines | Task 1, 4 | 검색 폼 접근성, 팝업 포커스 관리 검토 |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `.env.local.example` | New | Task 1 |
| `types/location.ts` | New | Task 1 |
| `services/kakaoGeocode.ts` | New | Task 1 |
| `app/api/geocode/route.ts` | New | Task 1 |
| `components/ui/alert.tsx` | New (shadcn CLI) | Task 1 |
| `components/search-bar.tsx` | New | Task 1 |
| `app/page.tsx` | New | Task 1 |
| `components/charger-map.tsx` | New | Task 2 |
| `app/page.tsx` | Modify | Task 2 |
| `types/station.ts` | New | Task 3 |
| `services/chargerStations.ts` | New | Task 3 |
| `app/api/stations/route.ts` | New | Task 3 |
| `hooks/useStationSearch.ts` | New | Task 3 |
| `components/charger-map.tsx` | Modify | Task 3 |
| `app/page.tsx` | Modify | Task 3 |
| `app/page.test.tsx` | New | Task 3 |
| `components/charger-popup.tsx` | New | Task 4 |
| `components/charger-map.tsx` | Modify | Task 4 |
| `app/page.test.tsx` | Modify | Task 4 |
| `app/page.tsx` | Modify | Task 5 |
| `hooks/useStationSearch.ts` | Modify | Task 6 |

## Tasks

### Task 1: 주소 검색 + 잘못된 주소 에러 표시 — ✅ 완료 (commit d4a9075)

- **담당 판정 기준**: S2-1 (S2-2는 지도·마커가 존재하는 Task 4에서 검증 — Task 1 시점엔 지도가 없어 "이전 상태 유지"를 증명할 대상이 없음)
- **크기**: M (6 파일 — 타입→서비스→Route Handler→컴포넌트→페이지의 vertical slice라 계층이 여럿이나, horizontal 분할을 피하기 위해 하나의 Task로 유지. 테스트 파일은 크기 집계에서 제외)
- **의존성**: None
- **참조**:
  - shadcn 스킬 (Input, Button, Alert 조합 패턴)
  - next-best-practices 스킬 (Route Handler 작성)
  - 카카오 로컬 API 문서 (주소 검색: `https://developers.kakao.com/docs/latest/ko/local/dev-guide`)
- **구현 대상**:
  - `.env.local.example` (키 이름 플레이스홀더만)
  - `types/location.ts`
  - `services/kakaoGeocode.ts` (`KAKAO_REST_API_KEY`로 카카오 로컬 API 호출, 최상위 결과 반환)
  - `services/kakaoGeocode.test.ts`
  - `app/api/geocode/route.ts` (`services/kakaoGeocode` 호출, 결과 없으면 404류 응답)
  - `app/api/geocode/route.test.ts`
  - `components/ui/alert.tsx` (New, `bunx shadcn@latest add alert`로 생성, 직접 작성/수정 금지)
  - `components/search-bar.tsx` (에러 표시에 `Alert` 재사용)
  - `components/search-bar.test.tsx`
  - `app/page.tsx` (`"use client"`, 검색창 배치 + 에러 메시지 상태)
- **검증**:
  - `bun run test -- search-bar` — 인식 불가 문자열 제출 시 "주소를 찾을 수 없습니다" `Alert`가 노출되는지 확인 `[S2-1]`
  - `bun run test -- kakaoGeocode` — 카카오 API fetch를 mock, 빈 결과/에러 응답 처리 검증
  - `bun run typecheck`

---

### Task 2: 카카오 지도 SDK 통합 + 기본 위치(서울) 표시 — ✅ 완료

- **담당 판정 기준**: 없음 (모든 시나리오의 Given 전제 조건인 초기 화면 레이아웃)
- **크기**: S (2 파일)
- **의존성**: Task 1 (`app/page.tsx` 존재)
- **참조**:
  - next-best-practices 스킬 (`next/script` 전략)
  - 카카오맵 JS SDK 문서 (`https://apis.map.kakao.com/web/guide/`)
- **구현 대상**:
  - `components/charger-map.tsx` (`next/script`로 SDK 로드, 기본 좌표=서울시청으로 지도 초기화)
  - `app/page.tsx` (Modify: `ChargerMap` 배치)
- **검증**:
  - `bun run test -- charger-map` — 지도 컨테이너가 렌더되고 SDK `<script>` src에 `NEXT_PUBLIC_KAKAO_JS_KEY` 값이 포함되는지 확인
  - Browser MCP: 실제 카카오 JS 키가 `.env.local`에 준비된 뒤, 브라우저에서 지도가 실제로 그려지는지 1회 확인, 증거 `artifacts/ev-charger-finder/evidence/task-2.png` 저장 (키 발급 전에는 스킵하고 최종 Checkpoint에서 함께 확인)

---

### Checkpoint: Task 1~2 이후 — ✅ 통과
- [x] 모든 테스트 통과: `bun run test` (4 files, 10 tests)
- [x] 빌드 성공: `bun run build`
- [x] 커버리지 검사: `scripts/spec-coverage.sh ev-charger-finder --tests`는 S2-1만 인용되고 나머지(Task 3~6 담당 ID)는 미인용으로 나옴 — 아직 구현 전이라 예상된 상태. 최종 체크포인트에서 전체 통과를 확인한다
- [x] 초기 화면(검색창 + 기본 위치 지도)과 잘못된 주소 에러 표시가 end-to-end로 동작 (Browser MCP로 실제 확인: `asdkfjqwer1234` 검색 → "주소를 찾을 수 없습니다" 표시, `GET /api/geocode` → 404)

---

### Task 3: 검색 위치 기준 반경 5km 충전소 조회 + 지도 마커 표시 — ✅ 완료

- **담당 판정 기준**: S1-1, S1-2, S3
- **크기**: M (7 파일 — `app/page.tsx`가 훅과 지도 컴포넌트를 실제로 연결하는 배선까지 포함해야 흐름이 완성됨)
- **의존성**: Task 1 (지오코딩 서비스 재사용), Task 2 (지도 컴포넌트에 마커·중심이동 추가)
- **참조**:
  - 공공데이터포털 "한국전력공사_충전소의 위치 및 현황 정보" (`https://api.odcloud.kr/api/15039545/v1/uddi:9d89628d-afe8-4b41-8f61-fa9636ce9e8e`, `page`/`perPage` 파라미터, `Authorization: Infuser {DATA_GO_KR_SERVICE_KEY}` 헤더 — 실제 호출로 확인됨)
- **구현 대상**:
  - `types/station.ts` (충전기 타입 필드 없음 — spec.md 제외 항목)
  - `services/chargerStations.ts` (`Authorization: Infuser` 헤더로 공공데이터포털 API 호출, `perPage`를 충분히 크게 잡아 전체 페이지 순회 후 haversine 거리 계산으로 5km 이내 필터링)
  - `services/chargerStations.test.ts`
  - `app/api/stations/route.ts` (lat/lng 쿼리 파라미터 → 필터링된 station 목록 JSON)
  - `app/api/stations/route.test.ts`
  - `hooks/useStationSearch.ts` (주소 검색 → 지오코딩 → 충전소 조회를 하나의 흐름으로 orchestration, 매 검색마다 station 목록과 중심 좌표를 새로 교체)
  - `components/charger-map.tsx` (Modify: `center` prop을 받아 `kakao.maps.Map#setCenter` 호출 + station 목록을 마커로 렌더)
  - `app/page.tsx` (Modify: `useStationSearch`를 검색창 제출과 연결하고 결과를 `charger-map`에 전달)
  - `app/page.test.tsx` (New, 통합 테스트: `/api/geocode`·`/api/stations` fetch를 mock)
- **검증**:
  - `bun run test -- chargerStations` — 공공데이터 API 응답을 mock, 5km 경계값 안팎 station이 올바르게 필터링되는지 검증
  - `bun run test -- stations/route` — lat/lng 파라미터로 호출 시 필터된 JSON 응답 검증
  - `bun run test -- charger-map` — 전달된 `center`로 지도 중심이 이동하는지 확인 `[S1-1]`, station 목록 개수만큼 마커가 렌더되는지 확인 `[S1-2]`
  - `bun run test -- page` — 모호한 지역명("강남")으로 검색 시 후보 선택 UI 없이 지오코딩 결과 위치로 마커가 렌더되는지 확인(전체 흐름 통합 테스트) `[S3]`
  - `bun run typecheck`

---

### Task 4: 마커 클릭 → 팝업에 충전소 정보 표시 + 재검색 실패 시 상태 유지 — ✅ 완료

- **담당 판정 기준**: S1-4, S2-2
- **크기**: S (2 파일)
- **의존성**: Task 3 (마커·지도 존재)
- **참조**:
  - web-design-guidelines 스킬 (팝업 포커스·닫기 동작 접근성)
- **구현 대상**:
  - `components/charger-popup.tsx`
  - `components/charger-popup.test.tsx`
  - `components/charger-map.tsx` (Modify: 마커 클릭 핸들러 → 팝업 표시)
  - `app/page.test.tsx` (Modify: 케이스 추가)
- **검증**:
  - `bun run test -- charger-popup` — 마커 클릭 시 이름·주소가 팝업에 표시되는지 확인 `[S1-4]`
  - `bun run test -- page` — 유효한 검색으로 마커가 표시된 상태에서 잘못된 주소로 재검색하면, 기존 지도 중심·마커가 그대로 남고 에러 메시지만 추가로 표시되는지 확인 `[S2-2]`
  - `bun run typecheck`

---

### Checkpoint: Task 3~4 이후 — ✅ 통과 (카카오 키 발급 전 범위 내)
- [x] 모든 테스트 통과: `bun run test` (9 files, 24 tests)
- [x] 빌드 성공: `bun run build`
- [x] 커버리지 검사: `scripts/spec-coverage.sh ev-charger-finder --tests`는 Task 5~6 담당 ID(S4, S4-1, S4-2, S5, INV-1)만 미인용 — 예상된 상태
- [x] `/api/stations`는 실제 공공데이터포털 API로 라이브 확인 (서울시청 좌표 기준 5km 이내 실제 충전소 94곳 반환). 지오코딩·지도·팝업을 포함한 전체 S1 해피패스의 라이브 브라우저 확인은 카카오 키가 없어 보류 — 자동 테스트(`components/charger-map.test.tsx`, `app/page.test.tsx`)로 S1-1·S1-2·S1-4 로직은 검증됨. 카카오 키 발급 후 최종 체크포인트에서 함께 재확인한다

---

### Task 5: 반경 내 충전소 없음 안내 — ✅ 완료

- **담당 판정 기준**: S4-1, S4-2
- **크기**: S (2 파일)
- **의존성**: Task 3 (검색 결과 흐름), Task 1 (Alert 컴포넌트 재사용)
- **참조**: None
- **구현 대상**:
  - `app/page.tsx` (Modify: station 목록이 빈 배열이면 Task 1에서 도입한 `Alert`로 안내 문구 표시, 지도 중심은 검색 위치 유지)
- **검증**:
  - `bun run test -- page` 또는 관련 컴포넌트 테스트 — 반경 내 station이 0건일 때 "주변 5km에 충전소가 없습니다" 노출 및 지도 중심 이동 확인 `[S4-1] [S4-2]`
  - `bun run typecheck`

---

### Task 6: 재검색 시 이전 마커 전체 교체 — ✅ 완료 (Task 3의 전체 교체 구현이 이미 충족, 테스트만 추가)

- **담당 판정 기준**: S5, INV-1
- **크기**: S (2 파일)
- **의존성**: Task 3 (`useStationSearch` 상태 관리)
- **참조**: None
- **구현 대상**:
  - `hooks/useStationSearch.ts` (Modify: 필요 시 - 매 검색마다 station 상태를 이전 값과 병합하지 않고 교체하도록 보장)
  - `hooks/useStationSearch.test.ts`
- **검증**:
  - `bun run test -- useStationSearch` — 첫 검색 결과가 있는 상태에서 두 번째 검색을 실행하면 이전 station이 결과에서 사라지고 새 station만 남는지 확인 `[S5]`, 항상 표시되는 마커 수가 마지막 검색의 반경 5km 필터링 결과 수와 일치하는지 확인 `[INV-1]`
  - `bun run typecheck`

---

### 최종 Checkpoint
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 커버리지 검사 통과: `scripts/spec-coverage.sh ev-charger-finder --tests`
- [ ] `.env.local`에 실제 API 키가 채워진 뒤, spec.md의 **End-to-end 검증** 절차를 Browser MCP로 실행하고, 통과한 판정 기준의 체크박스를 spec.md에서 켠다

## 미결정 항목

없음 — 공공데이터포털 API 파라미터 형식은 실제 키로 호출해 확인 완료(`api.odcloud.kr`, `page`/`perPage`, `Authorization: Infuser` 헤더). 확인 과정에서 드러난 두 가지(충전기 타입 필드 없음, 한국전력공사 운영 충전소로 범위 한정)는 spec.md/plan.md에 반영했다.
