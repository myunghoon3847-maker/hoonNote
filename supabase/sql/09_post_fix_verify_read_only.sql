-- 훈노트 v4.5.14 보강 적용 후 핵심 항목 확인
-- 읽기 전용입니다.

with policy_rows as (
  select tablename, policyname, cmd, roles, qual, with_check
  from pg_catalog.pg_policies
  where schemaname = 'public'
    and tablename in ('memos', 'memo_categories')
),
checks as (
  select 10 as sort_order,
    'memos 4개 정책 authenticated 전용'::text as check_name,
    case when (
      select count(*)
      from policy_rows
      where tablename = 'memos'
        and policyname in (
          'Users can read own memos',
          'Users can insert own memos',
          'Users can update own memos',
          'Users can delete own memos'
        )
        and 'authenticated'::name = any(roles)
        and not ('anon'::name = any(roles))
        and not ('public'::name = any(roles))
    ) = 4 then 'PASS' else 'FAIL' end as status,
    coalesce((
      select string_agg(format('%s[%s] roles=%s', policyname, cmd, roles), ' | ' order by cmd, policyname)
      from policy_rows
      where tablename = 'memos'
    ), '정책 없음') as detail

  union all
  select 20,
    'memos 소유권 조건',
    case when (
      select count(*)
      from policy_rows
      where tablename = 'memos'
        and (
          (cmd = 'SELECT' and qual ~* 'auth\.uid\(\)' and qual ~* 'user_id') or
          (cmd = 'INSERT' and with_check ~* 'auth\.uid\(\)' and with_check ~* 'user_id') or
          (cmd = 'UPDATE' and qual ~* 'auth\.uid\(\)' and qual ~* 'user_id'
                          and with_check ~* 'auth\.uid\(\)' and with_check ~* 'user_id') or
          (cmd = 'DELETE' and qual ~* 'auth\.uid\(\)' and qual ~* 'user_id')
        )
    ) = 4 then 'PASS' else 'FAIL' end,
    'SELECT/INSERT/UPDATE/DELETE 모두 auth.uid()와 user_id 비교 필요'

  union all
  select 30,
    'anon 테이블 CRUD 권한 없음',
    case when not exists (
      select 1
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name in ('memos', 'memo_categories')
        and grantee in ('anon', 'PUBLIC')
        and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
    ) then 'PASS' else 'FAIL' end,
    coalesce((
      select string_agg(format('%s:%s:%s', table_name, grantee, privilege_type), ', ')
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name in ('memos', 'memo_categories')
        and grantee in ('anon', 'PUBLIC')
        and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
    ), '직접 CRUD 권한 없음')

  union all
  select 40,
    'authenticated 테이블 CRUD 권한',
    case when (
      select count(distinct table_name || ':' || privilege_type)
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name in ('memos', 'memo_categories')
        and grantee = 'authenticated'
        and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
    ) = 8 then 'PASS' else 'FAIL' end,
    '두 테이블 각각 SELECT/INSERT/UPDATE/DELETE 필요'

  union all
  select 50,
    '카테고리 RPC anon/PUBLIC 실행권한 없음',
    case when not exists (
      select 1
      from information_schema.role_routine_grants
      where routine_schema = 'public'
        and routine_name in ('rename_memo_category', 'delete_memo_category')
        and grantee in ('anon', 'PUBLIC')
        and privilege_type = 'EXECUTE'
    ) then 'PASS' else 'FAIL' end,
    coalesce((
      select string_agg(format('%s:%s', routine_name, grantee), ', ')
      from information_schema.role_routine_grants
      where routine_schema = 'public'
        and routine_name in ('rename_memo_category', 'delete_memo_category')
        and grantee in ('anon', 'PUBLIC')
        and privilege_type = 'EXECUTE'
    ), '위험 실행권한 없음')

  union all
  select 60,
    '카테고리 RPC authenticated 실행권한',
    case when (
      select count(distinct routine_name)
      from information_schema.role_routine_grants
      where routine_schema = 'public'
        and routine_name in ('rename_memo_category', 'delete_memo_category')
        and grantee = 'authenticated'
        and privilege_type = 'EXECUTE'
    ) = 2 then 'PASS' else 'FAIL' end,
    'rename/delete 함수 모두 authenticated EXECUTE 필요'
)
select check_name, status, detail
from checks
order by sort_order;
