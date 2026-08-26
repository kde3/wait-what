# 프론트엔드 구조/정책

## 익명 사용자 저장되는 정보

전부 `sessionStorage` (탭 닫으면 소멸). 테마만 `localStorage`.

- [x] 익명 닉네임 — `gp_nickname`
- [x] 랜덤 프로필 캐릭터 — `garticphone-profile-image`
- [x] 선택 언어 — `gp_lang`
- [x] 음소거 설정 — `gp_muted`
- [x] 볼륨 설정 — `gp_volume`
- [x] 방별 플레이어 ID — `gp_player_<CODE>`
- [x] 테마 — `heroui-theme` (유일하게 localStorage)