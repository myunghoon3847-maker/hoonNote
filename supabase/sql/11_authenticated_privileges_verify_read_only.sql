-- 훈노트 v4.5.14 authenticated 테이블 권한 최종 확인
-- 읽기 전용입니다.

with grants as (
  select table_name, privilege_type
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in ('memos', 'memo_categories')
    and grantee = 'authenticated'
), checks as (
  select
    'authenticated 필수 CRUD 8개'::text as check_name,
    case when count(*) filter (
      where privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
    ) = 8 then 'PASS' else 'FAIL' end as status,
    coalesce(string_agg(table_name || ':' || privilege_type, ', ' order by table_name, privilege_type), '권한 없음') as detail
  from grants

  union all

  select
    'authenticated 불필요 권한 없음',
    case when count(*) = 0 then 'PASS' else 'FAIL' end,
    coalesce(string_agg(table_name || ':' || privilege_type, ', ' order by table_name, privilege_type), 'TRUNCATE/REFERENCES/TRIGGER 없음')
  from grants
  where privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER')
)
select check_name, status, detail
from checks;
