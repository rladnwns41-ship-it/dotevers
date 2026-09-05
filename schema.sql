-- ═══════════════════════════════════════════════════════════
-- Dotverse 최종 스키마 (Supabase / PostgreSQL)
-- Supabase 대시보드 > SQL Editor 에 그대로 붙여 실행하세요.
-- 실행 후: Settings > API 에서 Data API 활성화, Exposed schemas 에 public 포함
-- ═══════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── 0. 초기화 ──────────────────────────────────────────────
-- 예전에 만든 테이블의 id 타입(uuid)이 앱이 쓰는 텍스트 id(w1…)와 달라
-- 외래키를 만들 수 없습니다. 아래 5개를 지우고 새로 만듭니다.
-- (작품·저장본·게임 데이터가 지워집니다. 남길 데이터가 있으면 먼저 내보내세요.)
drop table if exists public.game_rows      cascade;
drop table if exists public.game_tables    cascade;
drop table if exists public.game_vars      cascade;
drop table if exists public.world_versions cascade;
drop table if exists public.worlds         cascade;

-- ── 프로필 ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  handle        text unique not null,
  display_name  text not null default '플레이어',
  avatar_art    text,
  memo          text,
  created_at    timestamptz not null default now()
);

drop function if exists public.on_auth_user_created() cascade;
create or replace function public.on_auth_user_created()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, handle, display_name)
  values (new.id,
          'u' || substr(replace(new.id::text, '-', ''), 1, 10),
          coalesce(new.raw_user_meta_data->>'name', '플레이어'))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function public.on_auth_user_created();

-- ── 작품(월드) ─────────────────────────────────────────────
create table if not exists public.worlds (
  id             text primary key default ('w' || substr(gen_random_uuid()::text, 1, 8)),
  owner_id       uuid references public.profiles(id) on delete cascade,
  title          text not null,
  summary        text,
  thumb_url      text,
  category       text default 'adventure',
  tags           text[] default '{}',
  license        text default 'cc_by',
  status         text not null default 'draft',   -- draft | published | hidden
  like_count     int  not null default 0,
  dislike_count  int  not null default 0,
  comment_count  int  not null default 0,
  play_count     int  not null default 0,
  published_at   timestamptz,
  created_at     timestamptz not null default now()
);

-- 저장본: 블록 · 맵 · 오브젝트 · 변수 · 사진/소리 링크가 모두 여기 들어간다
create table if not exists public.world_versions (
  id           bigserial primary key,
  world_id     text not null references public.worlds(id) on delete cascade,
  version      int  not null,
  label        text,
  scene        jsonb not null default '{}'::jsonb,  -- scenes, objectsBy, tiles, vars, arts, sounds…
  blocks       jsonb not null default '{}'::jsonb,  -- 오브젝트별 블록 트리
  block_count  int   not null default 0,
  created_at   timestamptz not null default now(),
  unique (world_id, version)
);

-- ── 공유 오브젝트(도트) ────────────────────────────────────
create table if not exists public.assets (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references public.profiles(id) on delete set null,
  origin_id     uuid references public.assets(id) on delete set null,
  name          text not null,
  kind          text not null default 'object',
  width         int  not null default 16,
  height        int  not null default 16,
  palette       jsonb default '[]'::jsonb,
  frames        jsonb default '[]'::jsonb,
  image_url     text,
  license       text not null default 'cc_by',      -- cc0 | cc_by | remix_only
  tags          text[] default '{}',
  is_public     boolean not null default true,
  use_count     int not null default 0,
  like_count    int not null default 0,
  dislike_count int not null default 0,
  created_at    timestamptz not null default now()
);

-- ── 게임 데이터 (블록의 «실시간 DB» 꾸러미) ────────────────
create table if not exists public.game_vars (
  world_id   text not null references public.worlds(id) on delete cascade,
  player_id  uuid references public.profiles(id) on delete cascade,
  key        text not null,
  value      jsonb,
  updated_at timestamptz not null default now(),
  primary key (world_id, player_id, key)
);
alter table public.game_vars replica identity full;

create table if not exists public.game_tables (
  id            uuid primary key default gen_random_uuid(),
  world_id      text not null references public.worlds(id) on delete cascade,
  name          text not null,
  columns       jsonb not null default '[]'::jsonb,
  is_per_player boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (world_id, name)
);

create table if not exists public.game_rows (
  id         bigserial primary key,
  table_id   uuid not null references public.game_tables(id) on delete cascade,
  world_id   text not null references public.worlds(id) on delete cascade,
  player_id  uuid references public.profiles(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ── 커뮤니티 ───────────────────────────────────────────────
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  board      text not null default 'tips',
  author_id  uuid references public.profiles(id) on delete set null,
  title      text not null,
  body       text default '',
  poll       jsonb,                                 -- { q, opts[] }
  pinned     boolean not null default false,
  answered   boolean not null default false,
  like_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references public.posts(id) on delete cascade,
  world_id   text references public.worlds(id) on delete cascade,
  author_id  uuid references public.profiles(id) on delete set null,
  body       text not null,
  parent_id  uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  subject_type text not null,                       -- post | comment | world | asset | poll
  subject_id   text not null,
  voter_id     uuid not null references public.profiles(id) on delete cascade,
  value        int  not null default 1,             -- 1 | -1 | 투표 항목 번호
  created_at   timestamptz not null default now(),
  primary key (subject_type, subject_id, voter_id)
);

create table if not exists public.notifications (
  id         bigserial primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  actor_id   uuid references public.profiles(id) on delete set null,
  kind       text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id         bigserial primary key,
  reporter_id  uuid references public.profiles(id) on delete set null,
  subject_type text not null,
  subject_id   text not null,
  reason       text not null,
  detail       text,
  status       text not null default 'open',
  created_at   timestamptz not null default now()
);

-- ── 이미 있던 테이블 보정 (컬럼이 빠져 있으면 채운다) ─────
alter table public.profiles       add column if not exists created_at timestamptz not null default now();
alter table public.profiles       add column if not exists display_name text not null default '플레이어';
alter table public.profiles       add column if not exists avatar_art text;
alter table public.profiles       add column if not exists memo text;

alter table public.worlds         add column if not exists created_at timestamptz not null default now();
alter table public.worlds         add column if not exists published_at timestamptz;
alter table public.worlds         add column if not exists status text not null default 'draft';
alter table public.worlds         add column if not exists summary text;
alter table public.worlds         add column if not exists thumb_url text;
alter table public.worlds         add column if not exists category text default 'adventure';
alter table public.worlds         add column if not exists tags text[] default '{}';
alter table public.worlds         add column if not exists license text default 'cc_by';
alter table public.worlds         add column if not exists like_count int not null default 0;
alter table public.worlds         add column if not exists dislike_count int not null default 0;
alter table public.worlds         add column if not exists comment_count int not null default 0;
alter table public.worlds         add column if not exists play_count int not null default 0;
alter table public.worlds         add column if not exists owner_id uuid references public.profiles(id) on delete cascade;

alter table public.world_versions add column if not exists created_at timestamptz not null default now();
alter table public.world_versions add column if not exists label text;
alter table public.world_versions add column if not exists scene jsonb not null default '{}'::jsonb;
alter table public.world_versions add column if not exists blocks jsonb not null default '{}'::jsonb;
alter table public.world_versions add column if not exists block_count int not null default 0;

alter table public.assets         add column if not exists created_at timestamptz not null default now();
alter table public.assets         add column if not exists image_url text;
alter table public.assets         add column if not exists frames jsonb default '[]'::jsonb;
alter table public.assets         add column if not exists palette jsonb default '[]'::jsonb;
alter table public.assets         add column if not exists tags text[] default '{}';
alter table public.assets         add column if not exists license text not null default 'cc_by';
alter table public.assets         add column if not exists is_public boolean not null default true;
alter table public.assets         add column if not exists use_count int not null default 0;
alter table public.assets         add column if not exists like_count int not null default 0;
alter table public.assets         add column if not exists dislike_count int not null default 0;
alter table public.assets         add column if not exists origin_id uuid;

alter table public.game_vars      add column if not exists updated_at timestamptz not null default now();
alter table public.game_vars      add column if not exists value jsonb;

alter table public.game_tables    add column if not exists created_at timestamptz not null default now();
alter table public.game_tables    add column if not exists columns jsonb not null default '[]'::jsonb;
alter table public.game_tables    add column if not exists is_per_player boolean not null default false;

alter table public.game_rows      add column if not exists created_at timestamptz not null default now();
alter table public.game_rows      add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.game_rows      add column if not exists player_id uuid;

alter table public.posts          add column if not exists created_at timestamptz not null default now();
alter table public.posts          add column if not exists board text not null default 'tips';
alter table public.posts          add column if not exists body text default '';
alter table public.posts          add column if not exists poll jsonb;
alter table public.posts          add column if not exists pinned boolean not null default false;
alter table public.posts          add column if not exists answered boolean not null default false;
alter table public.posts          add column if not exists like_count int not null default 0;
alter table public.posts          add column if not exists author_id uuid;

alter table public.comments       add column if not exists created_at timestamptz not null default now();
alter table public.comments       add column if not exists parent_id uuid;
alter table public.comments       add column if not exists world_id text;
alter table public.comments       add column if not exists post_id uuid;

alter table public.votes          add column if not exists created_at timestamptz not null default now();
alter table public.notifications  add column if not exists created_at timestamptz not null default now();
alter table public.notifications  add column if not exists read_at timestamptz;
alter table public.notifications  add column if not exists link text;
alter table public.notifications  add column if not exists body text;
alter table public.reports        add column if not exists created_at timestamptz not null default now();
alter table public.reports        add column if not exists status text not null default 'open';
alter table public.reports        add column if not exists detail text;

-- ── 인덱스 ─────────────────────────────────────────────────
create index if not exists worlds_pub_idx    on public.worlds (status, published_at desc);
create index if not exists assets_pub_idx    on public.assets (is_public, use_count desc);
create index if not exists game_rows_tbl_idx on public.game_rows (table_id, created_at desc);
create index if not exists posts_board_idx   on public.posts (board, created_at desc);

-- ── 검색 · 가져오기 함수 ───────────────────────────────────
drop function if exists public.search_worlds(text);
create or replace function public.search_worlds(q text)
returns setof public.worlds language sql stable as $$
  select * from public.worlds
  where status = 'published'
    and (title ilike '%' || q || '%' or summary ilike '%' || q || '%'
         or q = any(tags))
  order by published_at desc
  limit 40;
$$;

drop function if exists public.fork_asset(uuid, text);
create or replace function public.fork_asset(p_asset_id uuid, p_world_id text)
returns uuid language plpgsql security definer as $$
declare new_id uuid;
begin
  insert into public.assets (owner_id, origin_id, name, kind, width, height,
                             palette, frames, image_url, license, tags, is_public)
  select auth.uid(), a.id, a.name, a.kind, a.width, a.height,
         a.palette, a.frames, a.image_url, a.license, a.tags, false
  from public.assets a where a.id = p_asset_id
  returning id into new_id;

  update public.assets set use_count = use_count + 1 where id = p_asset_id;
  return new_id;
end $$;

-- ── 실시간 구독 (멀티플레이 · 실시간 변수) ─────────────────
do $$ begin
  alter publication supabase_realtime add table public.game_vars;
exception when duplicate_object then null; when others then null; end $$;

-- ── Storage: 사진 · 소리 (작품에는 링크만 저장) ────────────
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

do $$ begin
  drop policy if exists "media 읽기 누구나" on storage.objects;
  create policy "media 읽기 누구나" on storage.objects
    for select using (bucket_id = 'media');
  drop policy if exists "media 쓰기 로그인" on storage.objects;
  create policy "media 쓰기 로그인" on storage.objects
    for insert to authenticated with check (bucket_id = 'media');
  drop policy if exists "media 수정 로그인" on storage.objects;
  create policy "media 수정 로그인" on storage.objects
    for update to authenticated using (bucket_id = 'media');
exception when others then
  raise notice 'storage 정책은 대시보드 Storage > Policies 에서 추가하세요';
end $$;

-- ── RLS ────────────────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.worlds         enable row level security;
alter table public.world_versions enable row level security;
alter table public.assets         enable row level security;
alter table public.game_vars      enable row level security;
alter table public.game_tables    enable row level security;
alter table public.game_rows      enable row level security;
alter table public.posts          enable row level security;
alter table public.comments       enable row level security;
alter table public.votes          enable row level security;
alter table public.notifications  enable row level security;
alter table public.reports        enable row level security;

-- 프로필: 누구나 보고, 본인만 고침
drop policy if exists "p_read" on public.profiles;
create policy "p_read" on public.profiles for select using (true);
drop policy if exists "p_write" on public.profiles;
create policy "p_write" on public.profiles for update using (id = auth.uid());
drop policy if exists "p_insert" on public.profiles;
create policy "p_insert" on public.profiles for insert with check (id = auth.uid());

-- 작품: 게시된 것은 누구나, 내 것은 전부
drop policy if exists "w_read" on public.worlds;
create policy "w_read" on public.worlds for select using (status = 'published' or owner_id = auth.uid());
drop policy if exists "w_write" on public.worlds;
create policy "w_write" on public.worlds for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- 저장본: 작품을 볼 수 있으면 읽고, 주인만 쓴다
drop policy if exists "wv_read" on public.world_versions;
create policy "wv_read" on public.world_versions for select using (
  exists (select 1 from public.worlds w where w.id = world_id
          and (w.status = 'published' or w.owner_id = auth.uid())));
drop policy if exists "wv_write" on public.world_versions;
create policy "wv_write" on public.world_versions for insert with check (
  exists (select 1 from public.worlds w where w.id = world_id and w.owner_id = auth.uid()));

-- 공유 오브젝트
drop policy if exists "a_read" on public.assets;
create policy "a_read" on public.assets for select using (is_public or owner_id = auth.uid());
drop policy if exists "a_write" on public.assets;
create policy "a_write" on public.assets for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- 게임 데이터: 플레이 중 읽고 쓴다 (플레이어별 값은 본인 것만)
drop policy if exists "gv_read" on public.game_vars;
create policy "gv_read" on public.game_vars for select using (true);
drop policy if exists "gv_write" on public.game_vars;
create policy "gv_write" on public.game_vars for all
  using (player_id is null or player_id = auth.uid())
  with check (player_id is null or player_id = auth.uid());

drop policy if exists "gt_read" on public.game_tables;
create policy "gt_read" on public.game_tables for select using (true);
drop policy if exists "gt_write" on public.game_tables;
create policy "gt_write" on public.game_tables for all using (
  exists (select 1 from public.worlds w where w.id = world_id and w.owner_id = auth.uid()));

drop policy if exists "gr_read" on public.game_rows;
create policy "gr_read" on public.game_rows for select using (true);
drop policy if exists "gr_write" on public.game_rows;
create policy "gr_write" on public.game_rows for insert with check (
  player_id is null or player_id = auth.uid());

-- 커뮤니티
drop policy if exists "po_read" on public.posts;
create policy "po_read" on public.posts for select using (true);
drop policy if exists "po_write" on public.posts;
create policy "po_write" on public.posts for insert to authenticated with check (author_id = auth.uid());
drop policy if exists "po_edit" on public.posts;
create policy "po_edit" on public.posts for update using (author_id = auth.uid());

drop policy if exists "cm_read" on public.comments;
create policy "cm_read" on public.comments for select using (true);
drop policy if exists "cm_write" on public.comments;
create policy "cm_write" on public.comments for insert to authenticated with check (author_id = auth.uid());
drop policy if exists "cm_edit" on public.comments;
create policy "cm_edit" on public.comments for update using (author_id = auth.uid());

drop policy if exists "v_read" on public.votes;
create policy "v_read" on public.votes for select using (true);
drop policy if exists "v_write" on public.votes;
create policy "v_write" on public.votes for all to authenticated
  using (voter_id = auth.uid()) with check (voter_id = auth.uid());

drop policy if exists "n_read" on public.notifications;
create policy "n_read" on public.notifications for select using (user_id = auth.uid());
drop policy if exists "n_write" on public.notifications;
create policy "n_write" on public.notifications for update using (user_id = auth.uid());

drop policy if exists "r_write" on public.reports;
create policy "r_write" on public.reports for insert with check (true);
drop policy if exists "r_read" on public.reports;
create policy "r_read" on public.reports for select using (reporter_id = auth.uid());

-- ── 익명 플레이 허용이 필요하면 (로그인 없이 저장 테스트) ──
-- Supabase > Authentication > Providers > Anonymous sign-ins 를 켜세요.

-- ═══════════════════════════════════════════════════════════
-- 2차: 알림 자동 생성 · 카운터 갱신 (전체 연동용)
-- ═══════════════════════════════════════════════════════════

-- 댓글이 달리면 작품 주인에게 알림을 남기고 댓글 수를 올린다
create or replace function public.on_comment_created()
returns trigger language plpgsql security definer as $$
declare owner uuid; wtitle text; who text;
begin
  select display_name into who from public.profiles where id = new.author_id;

  if new.world_id is not null then
    select owner_id, title into owner, wtitle from public.worlds where id = new.world_id;
    update public.worlds set comment_count = comment_count + 1 where id = new.world_id;
    if owner is not null and owner <> new.author_id then
      insert into public.notifications (user_id, actor_id, kind, body, link)
      values (owner, new.author_id, 'comment',
              coalesce(who, '누군가') || ' 님이 «' || coalesce(wtitle, '월드') || '» 에 댓글을 남겼습니다.',
              '/world/' || new.world_id);
    end if;
  end if;

  if new.post_id is not null then
    select author_id into owner from public.posts where id = new.post_id;
    if owner is not null and owner <> new.author_id then
      insert into public.notifications (user_id, actor_id, kind, body, link)
      values (owner, new.author_id, 'comment',
              coalesce(who, '누군가') || ' 님이 글에 댓글을 남겼습니다.',
              '/post/' || new.post_id);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_comment_created on public.comments;
create trigger trg_comment_created
  after insert on public.comments
  for each row execute function public.on_comment_created();

-- 추천·비추천이 들어오면 카운터를 다시 세고 주인에게 알린다
create or replace function public.recount_votes()
returns trigger language plpgsql security definer as $$
declare sid text; stype text; owner uuid; who text; up int; down int;
begin
  sid   := coalesce(new.subject_id, old.subject_id);
  stype := coalesce(new.subject_type, old.subject_type);

  select count(*) filter (where value > 0), count(*) filter (where value < 0)
    into up, down
  from public.votes where subject_type = stype and subject_id = sid;

  if stype = 'world' then
    update public.worlds set like_count = up, dislike_count = down where id = sid;
    select owner_id into owner from public.worlds where id = sid;
  elsif stype = 'post' then
    update public.posts set like_count = up where id = sid::uuid;
    select author_id into owner from public.posts where id = sid::uuid;
  elsif stype = 'asset' then
    update public.assets set like_count = up, dislike_count = down where id = sid::uuid;
    select owner_id into owner from public.assets where id = sid::uuid;
  end if;

  if tg_op = 'INSERT' and new.value > 0 and owner is not null and owner <> new.voter_id then
    select display_name into who from public.profiles where id = new.voter_id;
    insert into public.notifications (user_id, actor_id, kind, body)
    values (owner, new.voter_id, 'like', coalesce(who, '누군가') || ' 님이 좋아합니다.');
  end if;
  return null;
end $$;

drop trigger if exists trg_votes_recount on public.votes;
create trigger trg_votes_recount
  after insert or update or delete on public.votes
  for each row execute function public.recount_votes();

-- 오브젝트를 가져다 쓰면 원작자에게 알린다
create or replace function public.on_asset_forked()
returns trigger language plpgsql security definer as $$
declare owner uuid; who text; aname text;
begin
  if new.origin_id is null then return new; end if;
  select owner_id, name into owner, aname from public.assets where id = new.origin_id;
  select display_name into who from public.profiles where id = new.owner_id;
  if owner is not null and owner <> new.owner_id then
    insert into public.notifications (user_id, actor_id, kind, body)
    values (owner, new.owner_id, 'use',
            coalesce(who, '누군가') || ' 님이 «' || coalesce(aname, '오브젝트') || '» 를 가져다 썼습니다.');
  end if;
  return new;
end $$;

drop trigger if exists trg_asset_forked on public.assets;
create trigger trg_asset_forked
  after insert on public.assets
  for each row execute function public.on_asset_forked();

-- 저장본 버전 번호를 자동으로 올린다
create or replace function public.next_version()
returns trigger language plpgsql as $$
begin
  if new.version is null or new.version = 0 then
    select coalesce(max(version), 0) + 1 into new.version
    from public.world_versions where world_id = new.world_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_next_version on public.world_versions;
create trigger trg_next_version
  before insert on public.world_versions
  for each row execute function public.next_version();

-- 플레이 수 올리기 (앱에서 호출)
create or replace function public.bump_play(p_world_id text)
returns void language sql security definer as $$
  update public.worlds set play_count = play_count + 1 where id = p_world_id;
$$;

-- 알림 모두 읽음
create or replace function public.read_all_notifications()
returns void language sql security definer as $$
  update public.notifications set read_at = now()
  where user_id = auth.uid() and read_at is null;
$$;

-- ═══════════════════════════════════════════════════════════
-- 3차: 채팅 · 블록 저장 · 플레이 기록
-- ═══════════════════════════════════════════════════════════

-- 월드 안 채팅 (실행화면 오른쪽 아래 창)
create table if not exists public.chats (
  id         bigserial primary key,
  world_id   text not null references public.worlds(id) on delete cascade,
  room       text not null default '1번방',
  author_id  uuid references public.profiles(id) on delete set null,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists chats_room_idx on public.chats (world_id, room, created_at desc);
alter table public.chats replica identity full;

-- 블록 코드: 오브젝트별로 따로 저장해 조금만 바뀌어도 그 부분만 올린다
create table if not exists public.world_blocks (
  world_id    text not null references public.worlds(id) on delete cascade,
  obj_key     text not null,                       -- '장면id:오브젝트id'
  stacks      jsonb not null default '[]'::jsonb,
  block_count int not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (world_id, obj_key)
);

-- 플레이 기록
create table if not exists public.plays (
  id         bigserial primary key,
  world_id   text not null references public.worlds(id) on delete cascade,
  player_id  uuid references public.profiles(id) on delete set null,
  seconds    int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists plays_world_idx on public.plays (world_id, created_at desc);

alter table public.chats        enable row level security;
alter table public.world_blocks enable row level security;
alter table public.plays        enable row level security;

drop policy if exists "ch_read" on public.chats;
create policy "ch_read" on public.chats for select using (true);
drop policy if exists "ch_write" on public.chats;
create policy "ch_write" on public.chats for insert with check (true);

drop policy if exists "wb_read" on public.world_blocks;
create policy "wb_read" on public.world_blocks for select using (true);
drop policy if exists "wb_write" on public.world_blocks;
create policy "wb_write" on public.world_blocks for all using (
  exists (select 1 from public.worlds w where w.id = world_id and w.owner_id = auth.uid())
) with check (
  exists (select 1 from public.worlds w where w.id = world_id and w.owner_id = auth.uid())
);

drop policy if exists "pl_read" on public.plays;
create policy "pl_read" on public.plays for select using (true);
drop policy if exists "pl_write" on public.plays;
create policy "pl_write" on public.plays for insert with check (true);

-- 채팅을 실시간으로 받는다
do $$ begin
  alter publication supabase_realtime add table public.chats;
exception when duplicate_object then null; when others then null; end $$;

-- 오래된 채팅 정리 (용량 절약) — 필요하면 스케줄로 돌리세요
create or replace function public.trim_chats()
returns void language sql as $$
  delete from public.chats where created_at < now() - interval '7 days';
$$;

-- ═══════════════════════════════════════════════════════════
-- 4차: 팔로우 · 리메이크 원본 링크
-- ═══════════════════════════════════════════════════════════

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  target_id   uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, target_id)
);

-- 리메이크한 작품이 원본을 가리킨다
alter table public.worlds add column if not exists origin_id text references public.worlds(id) on delete set null;

alter table public.follows enable row level security;
drop policy if exists "fo_read" on public.follows;
create policy "fo_read" on public.follows for select using (true);
drop policy if exists "fo_write" on public.follows;
create policy "fo_write" on public.follows for all to authenticated
  using (follower_id = auth.uid()) with check (follower_id = auth.uid());

-- 팔로우 · 리메이크 알림
create or replace function public.on_follow()
returns trigger language plpgsql security definer as $$
declare who text;
begin
  select display_name into who from public.profiles where id = new.follower_id;
  insert into public.notifications (user_id, actor_id, kind, body)
  values (new.target_id, new.follower_id, 'follow',
          coalesce(who, '누군가') || ' 님이 팔로우했습니다.');
  return new;
end $$;

drop trigger if exists trg_follow on public.follows;
create trigger trg_follow after insert on public.follows
  for each row execute function public.on_follow();

create or replace function public.on_world_remade()
returns trigger language plpgsql security definer as $$
declare owner uuid; who text; wtitle text;
begin
  if new.origin_id is null then return new; end if;
  select owner_id, title into owner, wtitle from public.worlds where id = new.origin_id;
  select display_name into who from public.profiles where id = new.owner_id;
  if owner is not null and owner <> new.owner_id then
    insert into public.notifications (user_id, actor_id, kind, body)
    values (owner, new.owner_id, 'remake',
            coalesce(who, '누군가') || ' 님이 «' || coalesce(wtitle, '월드') || '» 를 리메이크했습니다.');
  end if;
  return new;
end $$;

drop trigger if exists trg_world_remade on public.worlds;
create trigger trg_world_remade after insert on public.worlds
  for each row execute function public.on_world_remade();

-- 팔로워 수 (프로필 화면)
create or replace function public.follower_count(p_handle text)
returns int language sql stable as $$
  select count(*)::int from public.follows f
  join public.profiles p on p.id = f.target_id
  where p.handle = p_handle;
$$;
