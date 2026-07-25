-- 훈노트 v4.5.14 운영 Supabase 데이터 안전성·사용자 분리 1차 감사
-- 읽기 전용: 테이블/정책/권한/제약을 조회만 하며 데이터를 변경하지 않습니다.
-- Supabase Dashboard > SQL Editor에서 실행한 뒤 결과 표 전체를 전달하세요.

with
policy_summary as (
  select
    tablename,
    cmd,
    policyname,
    roles,
    coalesce(qual, '') as qual,
    coalesce(with_check, '') as with_check
  from pg_catalog.pg_policies
  where schemaname = 'public'
    and tablename in ('memos', 'memo_categories')
),
table_summary as (
  select
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as force_rls
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('memos', 'memo_categories')
    and c.relkind in ('r', 'p')
),
column_summary as (
  select table_name, column_name, is_nullable, data_type, udt_name
  from information_schema.columns
  where table_schema = 'public'
    and table_name in ('memos', 'memo_categories')
),
constraint_summary as (
  select
    c.relname as table_name,
    con.conname as constraint_name,
    con.contype,
    pg_catalog.pg_get_constraintdef(con.oid, true) as definition
  from pg_catalog.pg_constraint con
  join pg_catalog.pg_class c on c.oid = con.conrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('memos', 'memo_categories')
),
index_summary as (
  select tablename, indexname, indexdef
  from pg_catalog.pg_indexes
  where schemaname = 'public'
    and tablename in ('memos', 'memo_categories')
),
function_summary as (
  select
    p.proname,
    pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
    p.prosecdef as security_definer,
    coalesce(array_to_string(p.proconfig, ','), '') as function_settings
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'rename_memo_category',
      'delete_memo_category',
      'get_account_deletion_readiness'
    )
),
function_grants as (
  select routine_name, grantee, privilege_type
  from information_schema.role_routine_grants
  where routine_schema = 'public'
    and routine_name in (
      'rename_memo_category',
      'delete_memo_category',
      'get_account_deletion_readiness'
    )
),
checks as (
  select
    10 as sort_order,
    '테이블'::text as area,
    'public.memos 존재'::text as check_name,
    case when to_regclass('public.memos') is not null then 'PASS' else 'FAIL' end as status,
    coalesce(to_regclass('public.memos')::text, '없음') as detail

  union all
  select 11, '테이블', 'public.memo_categories 존재',
    case when to_regclass('public.memo_categories') is not null then 'PASS' else 'FAIL' end,
    coalesce(to_regclass('public.memo_categories')::text, '없음')

  union all
  select 20, 'RLS', 'memos RLS 활성화',
    case when exists (
      select 1 from table_summary where table_name = 'memos' and rls_enabled
    ) then 'PASS' else 'FAIL' end,
    coalesce((select format('enabled=%s, force=%s', rls_enabled, force_rls)
      from table_summary where table_name = 'memos'), '테이블 없음')

  union all
  select 21, 'RLS', 'memo_categories RLS 활성화',
    case when exists (
      select 1 from table_summary where table_name = 'memo_categories' and rls_enabled
    ) then 'PASS' else 'FAIL' end,
    coalesce((select format('enabled=%s, force=%s', rls_enabled, force_rls)
      from table_summary where table_name = 'memo_categories'), '테이블 없음')

  union all
  select 30, '소유권', 'memos.user_id NOT NULL',
    case when exists (
      select 1 from column_summary
      where table_name = 'memos' and column_name = 'user_id' and is_nullable = 'NO'
    ) then 'PASS' else 'FAIL' end,
    coalesce((select format('%s / nullable=%s', coalesce(udt_name, data_type), is_nullable)
      from column_summary where table_name = 'memos' and column_name = 'user_id'), '컬럼 없음')

  union all
  select 31, '소유권', 'memo_categories.user_id NOT NULL',
    case when exists (
      select 1 from column_summary
      where table_name = 'memo_categories' and column_name = 'user_id' and is_nullable = 'NO'
    ) then 'PASS' else 'FAIL' end,
    coalesce((select format('%s / nullable=%s', coalesce(udt_name, data_type), is_nullable)
      from column_summary where table_name = 'memo_categories' and column_name = 'user_id'), '컬럼 없음')

  union all
  select 40, '외래키', 'memos.user_id → auth.users ON DELETE CASCADE',
    case when exists (
      select 1 from constraint_summary
      where table_name = 'memos'
        and contype = 'f'
        and definition ilike 'foreign key (user_id)%references auth.users(id)%on delete cascade%'
    ) then 'PASS' else 'FAIL' end,
    coalesce((select definition from constraint_summary
      where table_name = 'memos' and contype = 'f' and definition ilike 'foreign key (user_id)%'
      limit 1), '해당 외래키 없음')

  union all
  select 41, '외래키', 'memo_categories.user_id → auth.users ON DELETE CASCADE',
    case when exists (
      select 1 from constraint_summary
      where table_name = 'memo_categories'
        and contype = 'f'
        and definition ilike 'foreign key (user_id)%references auth.users(id)%on delete cascade%'
    ) then 'PASS' else 'FAIL' end,
    coalesce((select definition from constraint_summary
      where table_name = 'memo_categories' and contype = 'f' and definition ilike 'foreign key (user_id)%'
      limit 1), '해당 외래키 없음')

  union all
  select 50, '인덱스', 'memos.user_id 인덱스',
    case when exists (
      select 1 from index_summary
      where tablename = 'memos' and indexdef ~* '\(user_id([,\)])'
    ) then 'PASS' else 'WARN' end,
    coalesce((select indexname from index_summary
      where tablename = 'memos' and indexdef ~* '\(user_id([,\)])' limit 1), '전용/선두 인덱스 확인 필요')

  union all
  select 51, '인덱스', 'memo_categories.user_id 인덱스',
    case when exists (
      select 1 from index_summary
      where tablename = 'memo_categories' and indexdef ~* '\(user_id([,\)])'
    ) then 'PASS' else 'WARN' end,
    coalesce((select indexname from index_summary
      where tablename = 'memo_categories' and indexdef ~* '\(user_id([,\)])' limit 1), '전용/선두 인덱스 확인 필요')

  union all
  select 60, '정책', 'memos SELECT 본인 행만 허용',
    case when exists (
      select 1 from policy_summary
      where tablename = 'memos'
        and cmd in ('SELECT', 'ALL')
        and 'authenticated'::name = any(roles)
        and qual ~* 'auth\.uid\(\)'
        and qual ~* 'user_id'
    ) then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(format('%s: %s', policyname, qual), ' | ')
      from policy_summary where tablename = 'memos' and cmd in ('SELECT', 'ALL')), '정책 없음')

  union all
  select 61, '정책', 'memos INSERT user_id 위조 차단',
    case when exists (
      select 1 from policy_summary
      where tablename = 'memos'
        and cmd in ('INSERT', 'ALL')
        and 'authenticated'::name = any(roles)
        and with_check ~* 'auth\.uid\(\)'
        and with_check ~* 'user_id'
    ) then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(format('%s: %s', policyname, with_check), ' | ')
      from policy_summary where tablename = 'memos' and cmd in ('INSERT', 'ALL')), '정책 없음')

  union all
  select 62, '정책', 'memos UPDATE 기존·변경 행 소유권 검사',
    case when exists (
      select 1 from policy_summary
      where tablename = 'memos'
        and cmd in ('UPDATE', 'ALL')
        and 'authenticated'::name = any(roles)
        and qual ~* 'auth\.uid\(\)'
        and qual ~* 'user_id'
        and with_check ~* 'auth\.uid\(\)'
        and with_check ~* 'user_id'
    ) then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(format('%s: USING=%s / CHECK=%s', policyname, qual, with_check), ' | ')
      from policy_summary where tablename = 'memos' and cmd in ('UPDATE', 'ALL')), '정책 없음')

  union all
  select 63, '정책', 'memos DELETE 본인 행만 허용',
    case when exists (
      select 1 from policy_summary
      where tablename = 'memos'
        and cmd in ('DELETE', 'ALL')
        and 'authenticated'::name = any(roles)
        and qual ~* 'auth\.uid\(\)'
        and qual ~* 'user_id'
    ) then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(format('%s: %s', policyname, qual), ' | ')
      from policy_summary where tablename = 'memos' and cmd in ('DELETE', 'ALL')), '정책 없음')

  union all
  select 64, '정책', 'memo_categories SELECT 본인 행만 허용',
    case when exists (
      select 1 from policy_summary
      where tablename = 'memo_categories'
        and cmd in ('SELECT', 'ALL')
        and 'authenticated'::name = any(roles)
        and qual ~* 'auth\.uid\(\)'
        and qual ~* 'user_id'
    ) then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(format('%s: %s', policyname, qual), ' | ')
      from policy_summary where tablename = 'memo_categories' and cmd in ('SELECT', 'ALL')), '정책 없음')

  union all
  select 65, '정책', 'memo_categories INSERT user_id 위조 차단',
    case when exists (
      select 1 from policy_summary
      where tablename = 'memo_categories'
        and cmd in ('INSERT', 'ALL')
        and 'authenticated'::name = any(roles)
        and with_check ~* 'auth\.uid\(\)'
        and with_check ~* 'user_id'
    ) then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(format('%s: %s', policyname, with_check), ' | ')
      from policy_summary where tablename = 'memo_categories' and cmd in ('INSERT', 'ALL')), '정책 없음')

  union all
  select 66, '정책', 'memo_categories UPDATE 기존·변경 행 소유권 검사',
    case when exists (
      select 1 from policy_summary
      where tablename = 'memo_categories'
        and cmd in ('UPDATE', 'ALL')
        and 'authenticated'::name = any(roles)
        and qual ~* 'auth\.uid\(\)'
        and qual ~* 'user_id'
        and with_check ~* 'auth\.uid\(\)'
        and with_check ~* 'user_id'
    ) then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(format('%s: USING=%s / CHECK=%s', policyname, qual, with_check), ' | ')
      from policy_summary where tablename = 'memo_categories' and cmd in ('UPDATE', 'ALL')), '정책 없음')

  union all
  select 67, '정책', 'memo_categories DELETE 본인 행만 허용',
    case when exists (
      select 1 from policy_summary
      where tablename = 'memo_categories'
        and cmd in ('DELETE', 'ALL')
        and 'authenticated'::name = any(roles)
        and qual ~* 'auth\.uid\(\)'
        and qual ~* 'user_id'
    ) then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(format('%s: %s', policyname, qual), ' | ')
      from policy_summary where tablename = 'memo_categories' and cmd in ('DELETE', 'ALL')), '정책 없음')

  union all
  select 70, '정책', '소유권 조건 없는 위험 정책 없음',
    case when not exists (
      select 1 from policy_summary
      where tablename in ('memos', 'memo_categories')
        and (
          ('anon'::name = any(roles))
          or (cmd in ('SELECT', 'UPDATE', 'DELETE', 'ALL') and (qual = '' or qual ~* '^\(?\s*true\s*\)?$'))
          or (cmd in ('INSERT', 'UPDATE', 'ALL') and (with_check = '' or with_check ~* '^\(?\s*true\s*\)?$'))
        )
    ) then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(format('%s.%s[%s] roles=%s', tablename, policyname, cmd, roles), ' | ')
      from policy_summary
      where ('anon'::name = any(roles))
         or (cmd in ('SELECT', 'UPDATE', 'DELETE', 'ALL') and (qual = '' or qual ~* '^\(?\s*true\s*\)?$'))
         or (cmd in ('INSERT', 'UPDATE', 'ALL') and (with_check = '' or with_check ~* '^\(?\s*true\s*\)?$'))),
      '위험 정책 없음')

  union all
  select 80, '권한', 'anon 테이블 권한 최소화',
    case when not exists (
      select 1 from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name in ('memos', 'memo_categories')
        and grantee = 'anon'
        and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
    ) then 'PASS' else 'WARN' end,
    coalesce((select string_agg(format('%s:%s', table_name, privilege_type), ', ')
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name in ('memos', 'memo_categories')
        and grantee = 'anon'), 'anon 직접 권한 없음')

  union all
  select 81, '권한', 'authenticated CRUD 권한',
    case when (
      select count(distinct table_name || ':' || privilege_type)
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name in ('memos', 'memo_categories')
        and grantee = 'authenticated'
        and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
    ) = 8 then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(format('%s:%s', table_name, privilege_type), ', ' order by table_name, privilege_type)
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name in ('memos', 'memo_categories')
        and grantee = 'authenticated'), '권한 없음')

  union all
  select 90, '함수', '카테고리 변경 함수 SECURITY INVOKER',
    case when (
      select count(*) from function_summary
      where proname in ('rename_memo_category', 'delete_memo_category')
        and security_definer = false
    ) = 2 then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(format('%s(%s): definer=%s settings=%s', proname, arguments, security_definer, function_settings), ' | ')
      from function_summary where proname in ('rename_memo_category', 'delete_memo_category')), '함수 없음')

  union all
  select 91, '함수', '카테고리 함수 anon/PUBLIC 실행권한 없음',
    case when not exists (
      select 1 from function_grants
      where routine_name in ('rename_memo_category', 'delete_memo_category')
        and grantee in ('anon', 'PUBLIC')
        and privilege_type = 'EXECUTE'
    ) then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(format('%s:%s', routine_name, grantee), ', ')
      from function_grants
      where routine_name in ('rename_memo_category', 'delete_memo_category')
        and grantee in ('anon', 'PUBLIC')), '위험 실행권한 없음')

  union all
  select 92, '함수', '계정삭제 준비 함수 service_role 전용',
    case when exists (
      select 1 from function_summary
      where proname = 'get_account_deletion_readiness'
        and security_definer = true
        and function_settings like '%search_path=%'
    ) and exists (
      select 1 from function_grants
      where routine_name = 'get_account_deletion_readiness'
        and grantee = 'service_role'
        and privilege_type = 'EXECUTE'
    ) and not exists (
      select 1 from function_grants
      where routine_name = 'get_account_deletion_readiness'
        and grantee in ('anon', 'authenticated', 'PUBLIC')
        and privilege_type = 'EXECUTE'
    ) then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(format('%s:%s', routine_name, grantee), ', ')
      from function_grants where routine_name = 'get_account_deletion_readiness'), '권한/함수 없음')

  union all
  select 100, '데이터 무결성', 'memos user_id NULL 행 없음',
    case when (select count(*) from public.memos where user_id is null) = 0 then 'PASS' else 'FAIL' end,
    format('null_rows=%s', (select count(*) from public.memos where user_id is null))

  union all
  select 101, '데이터 무결성', 'memo_categories user_id NULL 행 없음',
    case when (select count(*) from public.memo_categories where user_id is null) = 0 then 'PASS' else 'FAIL' end,
    format('null_rows=%s', (select count(*) from public.memo_categories where user_id is null))

  union all
  select 102, '데이터 무결성', 'memos 고아 user_id 없음',
    case when (
      select count(*) from public.memos m
      left join auth.users u on u.id = m.user_id
      where m.user_id is not null and u.id is null
    ) = 0 then 'PASS' else 'FAIL' end,
    format('orphan_rows=%s', (
      select count(*) from public.memos m
      left join auth.users u on u.id = m.user_id
      where m.user_id is not null and u.id is null
    ))

  union all
  select 103, '데이터 무결성', 'memo_categories 고아 user_id 없음',
    case when (
      select count(*) from public.memo_categories c
      left join auth.users u on u.id = c.user_id
      where c.user_id is not null and u.id is null
    ) = 0 then 'PASS' else 'FAIL' end,
    format('orphan_rows=%s', (
      select count(*) from public.memo_categories c
      left join auth.users u on u.id = c.user_id
      where c.user_id is not null and u.id is null
    ))

  union all
  select 104, '데이터 무결성', '카테고리 대소문자 중복 없음',
    case when not exists (
      select 1 from public.memo_categories
      group by user_id, lower(btrim(name))
      having count(*) > 1
    ) then 'PASS' else 'FAIL' end,
    format('duplicate_groups=%s', (
      select count(*) from (
        select 1 from public.memo_categories
        group by user_id, lower(btrim(name))
        having count(*) > 1
      ) duplicates
    ))

  union all
  select 110, '요약', '운영 데이터 규모(내용 비노출)', 'INFO',
    format('users=%s, memos=%s, categories=%s',
      (select count(*) from auth.users),
      (select count(*) from public.memos),
      (select count(*) from public.memo_categories))
)
select area, check_name, status, detail
from checks
order by sort_order;
