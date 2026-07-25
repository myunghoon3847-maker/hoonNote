-- 훈노트 v4.5.14 authenticated 역할 추가 권한 정리
-- 데이터/정책을 변경하지 않고 불필요한 테이블 권한만 회수합니다.
-- 필요한 앱 권한 SELECT/INSERT/UPDATE/DELETE는 유지합니다.

begin;

revoke truncate, references, trigger
on table public.memos, public.memo_categories
from authenticated;

grant select, insert, update, delete
on table public.memos, public.memo_categories
  to authenticated;

commit;
