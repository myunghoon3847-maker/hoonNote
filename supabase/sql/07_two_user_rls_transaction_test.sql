-- 훈노트 v4.5.14 실제 사용자 A/B RLS 격리 테스트
-- 중요: 전체 테스트는 하나의 트랜잭션 안에서 실행하고 마지막에 ROLLBACK합니다.
-- 실제 메모 내용/이메일을 출력하지 않으며, 최소 2개의 Auth 사용자가 있어야 합니다.
-- Supabase Dashboard > SQL Editor에서 파일 전체를 한 번에 실행하세요.

begin;

create temp table hoonnote_rls_test_context (
  user_a uuid not null,
  user_b uuid not null,
  memo_a uuid not null,
  memo_b uuid not null,
  category_a uuid not null,
  category_b uuid not null
) on commit drop;

create temp table hoonnote_rls_test_results (
  sort_order integer not null,
  test_name text not null,
  status text not null,
  detail text not null
) on commit drop;

grant select on hoonnote_rls_test_context to authenticated;
grant select, insert on hoonnote_rls_test_results to authenticated;

do $$
declare
  selected_users uuid[];
begin
  select array_agg(id order by created_at, id)
    into selected_users
  from (
    select id, created_at
    from auth.users
    order by created_at, id
    limit 2
  ) users;

  if coalesce(array_length(selected_users, 1), 0) < 2 then
    raise exception '실제 사용자 분리 검수에는 Auth 사용자가 최소 2명 필요합니다.';
  end if;

  insert into hoonnote_rls_test_context (
    user_a, user_b, memo_a, memo_b, category_a, category_b
  ) values (
    selected_users[1],
    selected_users[2],
    gen_random_uuid(),
    gen_random_uuid(),
    gen_random_uuid(),
    gen_random_uuid()
  );
end;
$$;

-- 관리자 권한으로 사용자별 테스트 행을 준비합니다. 트랜잭션 종료 시 모두 롤백됩니다.
insert into public.memos (
  id, user_id, title, content, category, project,
  is_important, is_deleted, tasks
)
select memo_a, user_a,
  '__HOONNOTE_RLS_A__', '__transaction_test__', '__RLS_A__', '',
  false, false, '[]'::jsonb
from hoonnote_rls_test_context
union all
select memo_b, user_b,
  '__HOONNOTE_RLS_B__', '__transaction_test__', '__RLS_B__', '',
  false, false, '[]'::jsonb
from hoonnote_rls_test_context;

insert into public.memo_categories (id, user_id, name, position)
select category_a, user_a, '__RLS_A__', 999900
from hoonnote_rls_test_context
union all
select category_b, user_b, '__RLS_B__', 999901
from hoonnote_rls_test_context;

-- 사용자 A로 가장합니다.
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select user_a from hoonnote_rls_test_context)::text,
    'role', 'authenticated'
  )::text,
  true
);
select set_config(
  'request.jwt.claim.sub',
  (select user_a from hoonnote_rls_test_context)::text,
  true
);
set local role authenticated;

insert into hoonnote_rls_test_results
select 10, '사용자 A auth.uid 설정',
  case when auth.uid() = (select user_a from hoonnote_rls_test_context)
    then 'PASS' else 'FAIL' end,
  'JWT sub가 사용자 A로 인식되어야 함';

insert into hoonnote_rls_test_results
select 20, '사용자 A는 자신의 메모만 조회',
  case when
    (select count(*) from public.memos
      where id in ((select memo_a from hoonnote_rls_test_context),
                   (select memo_b from hoonnote_rls_test_context))) = 1
    and exists (
      select 1 from public.memos
      where id = (select memo_a from hoonnote_rls_test_context)
    )
    and not exists (
      select 1 from public.memos
      where id = (select memo_b from hoonnote_rls_test_context)
    )
  then 'PASS' else 'FAIL' end,
  'A 행 1개만 보이고 B 행은 보이면 안 됨';

insert into hoonnote_rls_test_results
select 21, '사용자 A는 자신의 카테고리만 조회',
  case when
    (select count(*) from public.memo_categories
      where id in ((select category_a from hoonnote_rls_test_context),
                   (select category_b from hoonnote_rls_test_context))) = 1
    and exists (
      select 1 from public.memo_categories
      where id = (select category_a from hoonnote_rls_test_context)
    )
    and not exists (
      select 1 from public.memo_categories
      where id = (select category_b from hoonnote_rls_test_context)
    )
  then 'PASS' else 'FAIL' end,
  'A 카테고리만 보이고 B 카테고리는 보이면 안 됨';

with attempted as (
  update public.memos
  set title = '__CROSS_UPDATE_SHOULD_NOT_HAPPEN__'
  where id = (select memo_b from hoonnote_rls_test_context)
  returning id
)
insert into hoonnote_rls_test_results
select 30, '사용자 A의 B 메모 수정 차단',
  case when count(*) = 0 then 'PASS' else 'FAIL' end,
  format('수정된 행=%s (0이어야 함)', count(*))
from attempted;

with attempted as (
  delete from public.memos
  where id = (select memo_b from hoonnote_rls_test_context)
  returning id
)
insert into hoonnote_rls_test_results
select 31, '사용자 A의 B 메모 삭제 차단',
  case when count(*) = 0 then 'PASS' else 'FAIL' end,
  format('삭제된 행=%s (0이어야 함)', count(*))
from attempted;

with attempted as (
  update public.memo_categories
  set name = '__CROSS_CATEGORY_UPDATE__'
  where id = (select category_b from hoonnote_rls_test_context)
  returning id
)
insert into hoonnote_rls_test_results
select 32, '사용자 A의 B 카테고리 수정 차단',
  case when count(*) = 0 then 'PASS' else 'FAIL' end,
  format('수정된 행=%s (0이어야 함)', count(*))
from attempted;

-- 다른 사용자의 user_id로 새 행을 넣으려는 시도는 오류가 나야 합니다.
do $$
begin
  begin
    insert into public.memos (
      user_id, title, content, category, project,
      is_important, is_deleted, tasks
    ) values (
      (select user_b from hoonnote_rls_test_context),
      '__CROSS_INSERT_SHOULD_FAIL__', '', '__RLS__', '', false, false, '[]'::jsonb
    );

    insert into hoonnote_rls_test_results
      values (40, '사용자 A의 B 소유 메모 INSERT 차단', 'FAIL', '위조 INSERT가 성공함');
  exception when others then
    insert into hoonnote_rls_test_results
      values (40, '사용자 A의 B 소유 메모 INSERT 차단', 'PASS', 'RLS 오류로 차단됨');
  end;
end;
$$;

-- RPC도 다른 사용자의 카테고리를 변경하지 못해야 합니다.
do $$
begin
  begin
    perform public.rename_memo_category(
      (select category_b from hoonnote_rls_test_context),
      '__CROSS_RPC_RENAME__'
    );

    insert into hoonnote_rls_test_results
      values (50, '사용자 A의 B 카테고리 RPC 변경 차단', 'FAIL', 'RPC가 성공함');
  exception when others then
    insert into hoonnote_rls_test_results
      values (50, '사용자 A의 B 카테고리 RPC 변경 차단', 'PASS', '대상 없음/권한 오류로 차단됨');
  end;
end;
$$;

reset role;

-- 사용자 B로 전환하여 반대 방향 조회도 확인합니다.
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select user_b from hoonnote_rls_test_context)::text,
    'role', 'authenticated'
  )::text,
  true
);
select set_config(
  'request.jwt.claim.sub',
  (select user_b from hoonnote_rls_test_context)::text,
  true
);
set local role authenticated;

insert into hoonnote_rls_test_results
select 60, '사용자 B는 자신의 메모만 조회',
  case when
    (select count(*) from public.memos
      where id in ((select memo_a from hoonnote_rls_test_context),
                   (select memo_b from hoonnote_rls_test_context))) = 1
    and exists (
      select 1 from public.memos
      where id = (select memo_b from hoonnote_rls_test_context)
    )
    and not exists (
      select 1 from public.memos
      where id = (select memo_a from hoonnote_rls_test_context)
    )
  then 'PASS' else 'FAIL' end,
  'B 행 1개만 보이고 A 행은 보이면 안 됨';

insert into hoonnote_rls_test_results
select 61, '사용자 B는 자신의 카테고리만 조회',
  case when
    (select count(*) from public.memo_categories
      where id in ((select category_a from hoonnote_rls_test_context),
                   (select category_b from hoonnote_rls_test_context))) = 1
    and exists (
      select 1 from public.memo_categories
      where id = (select category_b from hoonnote_rls_test_context)
    )
    and not exists (
      select 1 from public.memo_categories
      where id = (select category_a from hoonnote_rls_test_context)
    )
  then 'PASS' else 'FAIL' end,
  'B 카테고리만 보이고 A 카테고리는 보이면 안 됨';

reset role;

-- 관리자 시점에서 교차 변경이 실제로 없었는지 최종 확인합니다.
insert into hoonnote_rls_test_results
select 70, '교차 수정·삭제 실제 미발생',
  case when
    exists (
      select 1 from public.memos
      where id = (select memo_b from hoonnote_rls_test_context)
        and title = '__HOONNOTE_RLS_B__'
    )
    and exists (
      select 1 from public.memo_categories
      where id = (select category_b from hoonnote_rls_test_context)
        and name = '__RLS_B__'
    )
  then 'PASS' else 'FAIL' end,
  'B 데이터가 원래 값으로 남아 있어야 함';

select test_name, status, detail
from hoonnote_rls_test_results
order by sort_order;

rollback;
