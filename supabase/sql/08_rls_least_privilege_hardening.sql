-- 훈노트 v4.5.14 RLS·최소 권한 보강
-- 대상: public.memos, public.memo_categories, 카테고리 RPC 함수
-- 목적:
--   1) memos 정책 대상을 authenticated로 명시
--   2) anon/PUBLIC의 테이블 직접 권한 제거
--   3) 카테고리 RPC 함수의 anon/PUBLIC 실행 권한 제거
--
-- 이 스크립트는 메모/카테고리 데이터를 수정하거나 삭제하지 않습니다.
-- 정책과 권한만 변경하며, 반복 실행해도 같은 상태가 되도록 작성했습니다.

begin;

-- 1. memos RLS가 반드시 활성화되어 있어야 합니다.
alter table public.memos enable row level security;

-- 2. 기존 정책을 명확한 authenticated 전용 정책으로 교체합니다.
drop policy if exists "Users can read own memos" on public.memos;
create policy "Users can read own memos"
  on public.memos
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own memos" on public.memos;
create policy "Users can insert own memos"
  on public.memos
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own memos" on public.memos;
create policy "Users can update own memos"
  on public.memos
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own memos" on public.memos;
create policy "Users can delete own memos"
  on public.memos
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 3. 카테고리 RLS도 활성화 상태를 보장합니다.
alter table public.memo_categories enable row level security;

-- 4. 비로그인 역할은 두 테이블을 직접 호출할 필요가 없습니다.
--    PUBLIC 권한도 제거한 뒤 authenticated에 필요한 CRUD만 다시 부여합니다.
revoke all privileges on table public.memos from public;
revoke all privileges on table public.memos from anon;
revoke all privileges on table public.memo_categories from public;
revoke all privileges on table public.memo_categories from anon;

grant select, insert, update, delete on table public.memos to authenticated;
grant select, insert, update, delete on table public.memo_categories to authenticated;

-- 5. 카테고리 변경 RPC는 로그인 사용자만 실행할 수 있게 제한합니다.
revoke all privileges on function public.rename_memo_category(uuid, text) from public;
revoke all privileges on function public.rename_memo_category(uuid, text) from anon;
revoke all privileges on function public.delete_memo_category(uuid) from public;
revoke all privileges on function public.delete_memo_category(uuid) from anon;

grant execute on function public.rename_memo_category(uuid, text) to authenticated;
grant execute on function public.delete_memo_category(uuid) to authenticated;

commit;
