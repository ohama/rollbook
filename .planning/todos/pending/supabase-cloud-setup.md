# Supabase Cloud 프로젝트 생성

**Priority:** high
**Phase:** 07-cloud-deployment
**Created:** 2026-02-11

## 할 일

1. **Supabase Cloud 프로젝트 생성**
   - https://supabase.com/dashboard → New Project
   - Region: Korea South (또는 가까운 지역)
   - 강력한 데이터베이스 비밀번호 설정

2. **프로젝트 정보 확인 및 기록**
   - Project Settings → API
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...`
   - Project Settings → General
   - **Project Reference ID**: (supabase link에 필요)

## 완료 후

Phase 7 실행 계속: `/gsd:execute-phase 7`

## 참고

- 무료 플랜으로 시작 가능 (500MB DB, 1GB Storage)
- 프로젝트는 새로 생성해야 함 (기존 스키마 없는 상태)
- 마이그레이션은 CLI로 자동 적용됨
