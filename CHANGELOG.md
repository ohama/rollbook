# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.1] - 2026-02-18

### Added
- 앨범에서 사진 선택 기능 (카메라 촬영 외 갤러리 선택 지원)
- 프로필 페이지 및 헤더 리디자인
- 랜딩 페이지 (스포츠 사진, 네비게이션)
- 관리자 페이지 (역할 관리, 감사 로그, 복원 기능)
- 감사 스키마 및 트리거 기반 변경 로깅
- 사진 모달 (풀스크린 오버레이)
- 팀 캘린더 뷰 및 3단계 네비게이션
- 일별 상세 뷰 및 캘린더 카운트 뱃지
- 멀티 레코드 CRUD (사진/텍스트 기록)
- 날짜 네비게이션 및 나/우리 뷰 스코프 전환
- v2.0 스키마 마이그레이션

### Changed
- 관리자 페이지 컴팩트 멤버 목록으로 간소화
- 로그인/회원가입/레이아웃 컴포넌트 리팩토링
- 랜딩 페이지 입력 필드 placeholder 방식으로 변경

### Fixed
- 앱 타이틀 및 관리자/프로필 탭 네비게이션 숨김 처리
- 로그인 입력 필드 너비 확대
- Supabase schema() API 감사 테이블 접근 수정
