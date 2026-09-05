// Supabase 클라이언트. 키는 env.js(환경 변수)에서만 읽는다.
// 연결 정보가 없으면 null 을 돌려주고, 앱은 데모 데이터로 동작한다.
(function () {
  const env = window.__ENV || {};
  let client = null;

  function init() {
    if (client) return client;
    if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) return null;
    if (!window.supabase || !window.supabase.createClient) return null;
    client = window.supabase.createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
      realtime: { params: { eventsPerSecond: 20 } },
    });
    return client;
  }

  window.DotDB = {
    init,
    get isLive() {
      return !!init();
    },
    // 최근 게시된 월드
    async recentWorlds(limit = 8) {
      const c = init();
      if (!c) return null;
      const { data, error } = await c
        .from("worlds")
        .select("id,title,summary,thumb_url,category,like_count,dislike_count,comment_count,play_count,published_at,profiles(display_name,handle)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(limit);
      return error ? null : data;
    },
    // 공유된 도트 오브젝트 라이브러리
    async sharedAssets({ kind = null, limit = 24 } = {}) {
      const c = init();
      if (!c) return null;
      let q = c
        .from("assets")
        .select("id,name,kind,width,height,palette,frames,license,use_count,like_count,dislike_count,tags,profiles(display_name,handle)")
        .eq("is_public", true)
        .order("use_count", { ascending: false })
        .limit(limit);
      if (kind) q = q.eq("kind", kind);
      const { data, error } = await q;
      return error ? null : data;
    },
    // 공유 오브젝트 가져오기 (원작자 표기 유지 사본)
    async forkAsset(assetId, worldId) {
      const c = init();
      if (!c) return null;
      const { data, error } = await c.rpc("fork_asset", { p_asset_id: assetId, p_world_id: worldId || null });
      if (error) throw error;
      return data;
    },
    // ── 스튜디오 저장/불러오기 (world_versions.scene / blocks)
    async saveStudio(worldId, payload) {
      const c = init();
      // 작품 행이 없으면 쓸 권한이 없다 — 먼저 만든다
      if (c) {
        const r = await this.ensureWorld(worldId, (payload && payload.scenes && payload.scenes[0] && payload.scenes[0].name) || null);
        if (!r.ok) return { ok: false, reason: r.reason || "auth" };
      }
      if (!c) return { ok: false, reason: "env" };
      const { data: last } = await c
        .from("world_versions")
        .select("version")
        .eq("world_id", worldId)
        .order("version", { ascending: false })
        .limit(1);
      const next = last && last[0] ? last[0].version + 1 : 1;
      const { error } = await c.from("world_versions").insert({
        world_id: worldId,
        version: next,
        label: "스튜디오 자동 저장",
        scene: { scenes: payload.scenes, objectsBy: payload.objectsBy },
        blocks: payload.wsBy,
        block_count: Object.keys(payload.wsBy || {}).reduce(
          (a, k) => a + (payload.wsBy[k] || []).length, 0),
      });
      if (error) return { ok: false, reason: error.message };
      return { ok: true, version: next };
    },
    async loadStudio(worldId) {
      const c = init();
      if (!c) return null;
      const { data, error } = await c
        .from("world_versions")
        .select("version,scene,blocks")
        .eq("world_id", worldId)
        .order("version", { ascending: false })
        .limit(1);
      if (error || !data || !data[0]) return null;
      return data[0];
    },
    // ── 작품 실시간 변수 읽기/쓰기 (블록의 «실시간 변수» 카테고리)
    async setVar(worldId, key, value, perPlayer) {
      const c = init();
      if (!c) return null;
      const { data: u } = await c.auth.getUser();
      const row = {
        world_id: worldId, key: key, value: value,
        player_id: perPlayer && u && u.user ? u.user.id : null,
      };
      const { error } = await c.from("game_vars").upsert(row, {
        onConflict: "world_id,player_id,key",
      });
      return !error;
    },
    async getVars(worldId) {
      const c = init();
      if (!c) return null;
      const { data, error } = await c
        .from("game_vars")
        .select("key,value,player_id")
        .eq("world_id", worldId);
      return error ? null : data;
    },
    // ── 작품용 테이블 정의 (game_tables)
    async createTable(worldId, name, cols, perPlayer) {
      const c = init();
      if (!c) return false;
      const { error } = await c.from("game_tables").insert({
        world_id: worldId,
        name: name,
        columns: cols.map((x) => ({
          name: x.name,
          type: x.type === "숫자" ? "number" : (x.type === "참/거짓" ? "bool" : "text"),
        })),
        is_per_player: !!perPlayer,
      });
      return !error;
    },
    async listTables(worldId) {
      const c = init();
      if (!c) return null;
      const { data, error } = await c
        .from("game_tables")
        .select("id,name,columns,is_per_player")
        .eq("world_id", worldId);
      return error ? null : data;
    },
    async addRow(worldId, tableId, data, perPlayer) {
      const c = init();
      if (!c) return false;
      const { data: u } = await c.auth.getUser();
      const { error } = await c.from("game_rows").insert({
        table_id: tableId, world_id: worldId, data: data,
        player_id: perPlayer && u && u.user ? u.user.id : null,
      });
      return !error;
    },
    // 사진·소리를 Storage 버킷에 올리고 공개 링크를 돌려준다 (테이블 용량 절약)
    async uploadMedia(worldId, path, dataUrl) {
      const c = init();
      if (!c || !/^data:/.test(dataUrl)) return null;
      const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
      if (!m) return null;
      const bin = atob(m[2]);
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      const ext = (m[1].split("/")[1] || "bin").replace("jpeg", "jpg");
      const key = "worlds/" + worldId + "/" + path + "." + ext;
      const { error } = await c.storage.from("media").upload(key, buf, {
        contentType: m[1], upsert: true, cacheControl: "31536000",
      });
      if (error) return null;
      const { data } = c.storage.from("media").getPublicUrl(key);
      return (data && data.publicUrl) || null;
    },
    async searchWorlds(q) {
      const c = init();
      if (!c) return null;
      const { data, error } = await c.rpc("search_worlds", { q });
      return error ? null : data;
    },
    // ── 로그인 (익명 포함) ────────────────────────────────────
    async me() {
      const c = init();
      if (!c) return null;
      const { data } = await c.auth.getUser();
      return (data && data.user) || null;
    },
    // 글·댓글·신고는 로그인이 필요하다. 없으면 익명 세션을 만든다.
    async ensureUser() {
      const c = init();
      if (!c) return null;
      let u = await this.me();
      if (u) return u;
      try {
        const { data } = await c.auth.signInAnonymously();
        u = (data && data.user) || null;
      } catch (e) { u = null; }
      if (u) {
        await c.from("profiles").upsert({
          id: u.id,
          handle: "u" + u.id.replace(/-/g, "").slice(0, 10),
          display_name: "손님",
        }, { onConflict: "id" });
      }
      return u;
    },
    async signUp(email, password, name) {
      const c = init();
      if (!c) return { ok: false, reason: "env" };
      const { data, error } = await c.auth.signUp({
        email: email, password: password,
        options: { data: { name: name || "플레이어" } },
      });
      if (error) return { ok: false, reason: error.message };
      const u = data && data.user;
      if (u) {
        await c.from("profiles").upsert({
          id: u.id, handle: "u" + u.id.replace(/-/g, "").slice(0, 10),
          display_name: name || "플레이어",
        }, { onConflict: "id" });
      }
      return { ok: true, user: u };
    },
    async signIn(email, password) {
      const c = init();
      if (!c) return { ok: false, reason: "env" };
      const { data, error } = await c.auth.signInWithPassword({ email: email, password: password });
      return error ? { ok: false, reason: error.message } : { ok: true, user: data.user };
    },
    async signOut() {
      const c = init();
      if (c) await c.auth.signOut();
    },

    // ── 커뮤니티 ─────────────────────────────────────────────
    async listPosts(board, limit = 40) {
      const c = init();
      if (!c) return null;
      let q = c.from("posts")
        .select("id,board,title,body,poll,pinned,answered,like_count,created_at,profiles!posts_author_id_fkey(display_name,handle)")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (board) q = q.eq("board", board);
      const { data, error } = await q;
      return error ? null : data;
    },
    async createPost(board, title, body, poll) {
      const c = init();
      if (!c) return null;
      const u = await this.ensureUser();
      if (!u) return null;
      const { data, error } = await c.from("posts")
        .insert({ board: board || "tips", title: title, body: body || "", poll: poll || null, author_id: u.id })
        .select("id")
        .single();
      return error ? null : data;
    },
    async listComments(postId, worldId) {
      const c = init();
      if (!c) return null;
      let q = c.from("comments")
        .select("id,body,parent_id,created_at,profiles!comments_author_id_fkey(display_name,handle)")
        .order("created_at", { ascending: true })
        .limit(200);
      q = postId ? q.eq("post_id", postId) : q.eq("world_id", worldId);
      const { data, error } = await q;
      return error ? null : data;
    },
    async addComment({ postId, worldId, body, parentId }) {
      const c = init();
      if (!c) return null;
      const u = await this.ensureUser();
      if (!u) return null;
      const { data, error } = await c.from("comments")
        .insert({
          post_id: postId || null, world_id: worldId || null,
          body: body, parent_id: parentId || null, author_id: u.id,
        })
        .select("id")
        .single();
      return error ? null : data;
    },
    // 추천 · 비추천 · 투표를 한 표로 기록한다 (같은 값을 다시 보내면 취소)
    async vote(subjectType, subjectId, value) {
      const c = init();
      if (!c) return null;
      const u = await this.ensureUser();
      if (!u) return null;
      if (value === null) {
        await c.from("votes").delete()
          .eq("subject_type", subjectType).eq("subject_id", String(subjectId)).eq("voter_id", u.id);
        return true;
      }
      const { error } = await c.from("votes").upsert({
        subject_type: subjectType, subject_id: String(subjectId),
        voter_id: u.id, value: value,
      }, { onConflict: "subject_type,subject_id,voter_id" });
      return !error;
    },
    async myVotes(subjectType, ids) {
      const c = init();
      if (!c || !ids || !ids.length) return null;
      const u = await this.me();
      if (!u) return null;
      const { data, error } = await c.from("votes")
        .select("subject_id,value")
        .eq("subject_type", subjectType)
        .eq("voter_id", u.id)
        .in("subject_id", ids.map(String));
      return error ? null : data;
    },
    // 투표 집계: 항목별 표 수
    async pollTally(postIds) {
      const c = init();
      if (!c || !postIds || !postIds.length) return null;
      const { data, error } = await c.from("votes")
        .select("subject_id,value")
        .eq("subject_type", "poll")
        .in("subject_id", postIds.map(String));
      return error ? null : data;
    },
    // ── 신고 ─────────────────────────────────────────────────
    async report({ subjectType, subjectId, subjectLabel, reason, detail, email, url }) {
      const c = init();
      if (!c) return { ok: false, reason: "env" };
      const u = await this.ensureUser();
      const { data, error } = await c.from("reports").insert({
        reporter_id: u ? u.id : null,
        reporter_email: email || null,
        subject_type: subjectType, subject_id: String(subjectId),
        subject_label: subjectLabel || null,
        reason: reason, detail: detail || null,
        page_url: url || null,
        status: "open",
      }).select("ticket").single();
      if (error) {
        // ticket 컬럼이 없는 경우: 그냥 저장한다
        const r = await c.from("reports").insert({
          reporter_id: u ? u.id : null,
          subject_type: subjectType, subject_id: String(subjectId),
          reason: reason, detail: (detail || "") + (email ? "\n회신: " + email : ""),
          status: "open",
        }).select("id").single();
        if (r.error) return { ok: false, reason: r.error.message };
        return { ok: true, ticket: "R-" + (r.data && r.data.id) };
      }
      return { ok: true, ticket: data && data.ticket };
    },
    // 내가 낸 신고 내역
    async myReports() {
      const c = init();
      if (!c) return null;
      const u = await this.me();
      if (!u) return null;
      const { data, error } = await c.from("reports").select("*").limit(50);
      if (error) return [];
      return (data || [])
        .filter((x) => !x.reporter_id || x.reporter_id === u.id)
        .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
        .slice(0, 30)
        .map((x) => ({
          ticket: x.ticket || ("R-" + (x.id || "")),
          subject_type: x.subject_type || "", subject_label: x.subject_label || null,
          reason: x.reason || "", status: x.status || "open", created_at: x.created_at,
        }));
    },
    // ── 작품 게시 ────────────────────────────────────────────
    // 저장 전에 작품 행이 있는지 확인하고 없으면 만든다 (없으면 RLS 가 403)
    async ensureWorld(worldId, title) {
      const c = init();
      if (!c) return { ok: false, reason: "env" };
      const u = await this.ensureUser();
      if (!u) return { ok: false, reason: "auth" };
      const { data } = await c.from("worlds").select("id,owner_id").eq("id", worldId).maybeSingle();
      if (data) return { ok: data.owner_id === u.id, reason: data.owner_id === u.id ? null : "not_owner" };
      const { error } = await c.from("worlds").insert({
        id: worldId, owner_id: u.id, title: title || "이름 없는 월드", status: "draft",
      });
      return error ? { ok: false, reason: error.message } : { ok: true };
    },
    async publishWorld(worldId, fields) {
      const c = init();
      if (!c) return { ok: false, reason: "env" };
      const u = await this.ensureUser();
      if (!u) return { ok: false, reason: "auth" };
      const row = Object.assign({
        id: worldId, owner_id: u.id, status: "published",
        published_at: new Date().toISOString(),
      }, fields || {});
      let { error } = await c.from("worlds").upsert(row, { onConflict: "id" });
      if (error) {
        const safe = {
          id: worldId, owner_id: u.id, status: "published",
          published_at: new Date().toISOString(),
          title: row.title || "이름 없는 월드",
        };
        const r = await c.from("worlds").upsert(safe, { onConflict: "id" });
        error = r.error;
      }
      return error ? { ok: false, reason: error.message } : { ok: true };
    },
    async countPlay(worldId) {
      const c = init();
      if (!c) return;
      const { data } = await c.from("worlds").select("play_count").eq("id", worldId).single();
      if (data) await c.from("worlds").update({ play_count: (data.play_count || 0) + 1 }).eq("id", worldId);
    },
    // ── 크리에이터 · 프로필 ──────────────────────────────────
    async listCreators(limit = 12) {
      const c = init();
      if (!c) return null;
      const { data, error } = await c.from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      return error ? null : data;
    },
    async myProfile() {
      const c = init();
      if (!c) return null;
      const u = await this.me();
      // 익명 세션(글쓰기용 임시 계정)은 로그인으로 보지 않는다
      if (!u || u.is_anonymous) return null;
      const { data } = await c.from("profiles").select("*").eq("id", u.id).maybeSingle();
      return data || null;
    },
    async profileByHandle(handle) {
      const c = init();
      if (!c) return null;
      const { data } = await c.from("profiles").select("*").eq("handle", handle).single();
      return data || null;
    },
    async updateProfile(fields) {
      const c = init();
      if (!c) return false;
      const u = await this.me();
      if (!u) return false;
      let { error } = await c.from("profiles").update(fields).eq("id", u.id);
      if (error) {
        // 아직 없는 컬럼(avatar_url·banner_url)은 빼고 다시 시도한다
        const safe = {};
        ["display_name", "memo", "avatar_art"].forEach((k) => {
          if (fields[k] !== undefined) safe[k] = fields[k];
        });
        if (!Object.keys(safe).length) return false;
        const r = await c.from("profiles").update(safe).eq("id", u.id);
        error = r.error;
      }
      return !error;
    },
    async myWorlds() {
      const c = init();
      if (!c) return null;
      const u = await this.me();
      if (!u) return null;
      const { data, error } = await c.from("worlds")
        .select("*").eq("owner_id", u.id).order("created_at", { ascending: false });
      return error ? null : data;
    },
    async worldsOf(ownerId, limit = 24) {
      const c = init();
      if (!c) return null;
      const { data, error } = await c.from("worlds")
        .select("*").eq("owner_id", ownerId).eq("status", "published")
        .order("published_at", { ascending: false }).limit(limit);
      return error ? null : data;
    },
    // 최근 달린 댓글 (첫 화면 «이야기» 칸)
    async recentComments(limit = 6) {
      const c = init();
      if (!c) return null;
      let { data, error } = await c.from("comments")
        .select("id,body,created_at,world_id,profiles!comments_author_id_fkey(display_name,handle)")
        .not("world_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) {
        const r = await c.from("comments")
          .select("id,body,created_at,world_id")
          .order("created_at", { ascending: false }).limit(limit);
        if (r.error) return null;
        data = r.data;
      }
      // 월드 제목을 따로 붙인다 (조인 없이)
      const ids = Array.from(new Set((data || []).map((x) => x.world_id).filter(Boolean)));
      let titles = {};
      if (ids.length) {
        const { data: ws } = await c.from("worlds").select("id,title").in("id", ids);
        (ws || []).forEach((w) => { titles[w.id] = w.title; });
      }
      return (data || []).map((x) => Object.assign({}, x, { worlds: { title: titles[x.world_id] || "월드" } }));
    },
    // 전체 개수 (검색 화면 요약)
    async counts() {
      const c = init();
      if (!c) return null;
      const one = async (t, f) => {
        let q = c.from(t).select("*", { count: "exact", head: true });
        if (f) q = q.eq(f[0], f[1]);
        const { count } = await q;
        return count || 0;
      };
      const [worlds, assets, users, posts] = await Promise.all([
        one("worlds", ["status", "published"]), one("assets", ["is_public", true]),
        one("profiles"), one("posts"),
      ]);
      return { worlds, assets, users, posts };
    },
    // ── 월드 안 채팅 (DB 저장 + 실시간) ─────────────────────
    async sendChat(worldId, room, body) {
      const c = init();
      if (!c) return null;
      const u = await this.ensureUser();
      const { data, error } = await c.from("chats")
        .insert({ world_id: worldId, room: room || "1번방", author_id: u ? u.id : null, body: body })
        .select("id")
        .single();
      return error ? null : data;
    },
    async listChats(worldId, room, limit = 40) {
      const c = init();
      if (!c) return null;
      const { data, error } = await c.from("chats")
        .select("id,body,created_at,profiles(display_name)")
        .eq("world_id", worldId).eq("room", room || "1번방")
        .order("created_at", { ascending: false })
        .limit(limit);
      return error ? null : (data || []).reverse();
    },
    // 새 채팅이 들어오면 알려준다
    chatChannel(worldId, room, onRow) {
      const c = init();
      if (!c) return null;
      const ch = c.channel("chat:" + worldId + ":" + room);
      ch.on("postgres_changes",
        { event: "INSERT", schema: "public", table: "chats", filter: "world_id=eq." + worldId },
        (m) => { if (!m.new || m.new.room === room) onRow(m.new); })
        .subscribe();
      return ch;
    },

    // ── 블록 코드: 오브젝트별 스택을 따로 저장한다 ──────────
    async saveBlocks(worldId, blocksByKey) {
      const c = init();
      if (!c) return false;
      const u = await this.ensureUser();
      if (!u) return false;
      const rows = Object.keys(blocksByKey || {}).map((k) => ({
        world_id: worldId, obj_key: k,
        stacks: blocksByKey[k] || [],
        block_count: JSON.stringify(blocksByKey[k] || []).split('"def"').length - 1,
        updated_at: new Date().toISOString(),
      }));
      if (!rows.length) return true;
      const { error } = await c.from("world_blocks").upsert(rows, { onConflict: "world_id,obj_key" });
      return !error;
    },
    async loadBlocks(worldId) {
      const c = init();
      if (!c) return null;
      const { data, error } = await c.from("world_blocks")
        .select("obj_key,stacks").eq("world_id", worldId);
      if (error) return null;
      const out = {};
      (data || []).forEach((r) => { out[r.obj_key] = r.stacks || []; });
      return out;
    },

    // ── 도트 모양 · 사진 · 소리를 공유 오브젝트로 올린다 ────
    async saveAsset({ name, kind, width, height, frames, imageUrl, license, tags, isPublic }) {
      const c = init();
      if (!c) return null;
      const u = await this.ensureUser();
      if (!u) return null;
      const { data, error } = await c.from("assets").insert({
        owner_id: u.id, name: name, kind: kind || "object",
        width: width || 16, height: height || 16,
        frames: frames || [], image_url: imageUrl || null,
        license: license || "cc_by", tags: tags || [],
        is_public: isPublic === false ? false : true,
      }).select("id").single();
      return error ? null : data;
    },

    // ── 플레이 기록 (누가 언제 몇 번) ────────────────────────
    async logPlay(worldId, seconds) {
      const c = init();
      if (!c) return;
      const u = await this.me();
      await c.from("plays").insert({
        world_id: worldId, player_id: u ? u.id : null, seconds: seconds || 0,
      });
    },
    // ── 팔로우 ───────────────────────────────────────────────
    async follow(handle, on) {
      const c = init();
      if (!c) return false;
      const u = await this.ensureUser();
      if (!u) return false;
      const { data: p } = await c.from("profiles").select("id").eq("handle", handle).single();
      if (!p) return false;
      if (on) {
        const { error } = await c.from("follows")
          .upsert({ follower_id: u.id, target_id: p.id }, { onConflict: "follower_id,target_id" });
        return !error;
      }
      await c.from("follows").delete().eq("follower_id", u.id).eq("target_id", p.id);
      return true;
    },
    async myFollows() {
      const c = init();
      if (!c) return null;
      const u = await this.me();
      if (!u) return null;
      const { data } = await c.from("follows")
        .select("target_id,profiles!follows_target_id_fkey(handle)")
        .eq("follower_id", u.id);
      return data || null;
    },

    // ── 리메이크: 작품과 블록을 통째로 복사한다 ──────────────
    async remakeWorld(srcId) {
      const c = init();
      if (!c) return null;
      const u = await this.ensureUser();
      if (!u) return null;
      const { data: src } = await c.from("worlds").select("*").eq("id", srcId).single();
      if (!src) return null;
      const newId = "w" + Math.random().toString(36).slice(2, 10);
      const { error } = await c.from("worlds").insert({
        id: newId, owner_id: u.id,
        title: (src.title || "월드") + " (리메이크)",
        summary: src.summary, category: src.category, tags: src.tags,
        license: src.license, origin_id: srcId, status: "draft",
      });
      if (error) return null;
      // 저장본과 블록을 함께 복사한다
      const { data: ver } = await c.from("world_versions")
        .select("scene,blocks,block_count").eq("world_id", srcId)
        .order("version", { ascending: false }).limit(1).single();
      if (ver) {
        await c.from("world_versions").insert({
          world_id: newId, version: 1, label: "리메이크 시작",
          scene: ver.scene, blocks: ver.blocks, block_count: ver.block_count,
        });
      }
      const { data: blks } = await c.from("world_blocks").select("obj_key,stacks,block_count").eq("world_id", srcId);
      if (blks && blks.length) {
        await c.from("world_blocks").insert(blks.map((b) => ({
          world_id: newId, obj_key: b.obj_key, stacks: b.stacks, block_count: b.block_count,
        })));
      }
      return { id: newId };
    },

    // ── 대시보드 수치 ────────────────────────────────────────
    async dashboard() {
      const c = init();
      if (!c) return null;
      const u = await this.me();
      if (!u) return null;
      const { data: ws } = await c.from("worlds")
        .select("id,play_count,like_count,comment_count").eq("owner_id", u.id);
      const ids = (ws || []).map((w) => w.id);
      let secs = 0, plays = 0;
      if (ids.length) {
        const { data: pl } = await c.from("plays").select("seconds").in("world_id", ids).limit(2000);
        (pl || []).forEach((p) => { secs += p.seconds || 0; plays++; });
      }
      const sum = (k) => (ws || []).reduce((n, w) => n + (w[k] || 0), 0);
      return {
        worlds: (ws || []).length,
        plays: sum("play_count") || plays,
        likes: sum("like_count"),
        comments: sum("comment_count"),
        avgSeconds: plays ? Math.round(secs / plays) : 0,
      };
    },
    // 게시판별 글 수
    async boardCounts() {
      const c = init();
      if (!c) return null;
      const { data } = await c.from("posts").select("board").limit(5000);
      const out = {};
      (data || []).forEach((r) => { out[r.board] = (out[r.board] || 0) + 1; });
      return out;
    },
    // 최근 7일 플레이 · 접속자 (대시보드 그래프)
    async dailyPlays() {
      const c = init();
      if (!c) return null;
      const u = await this.me();
      if (!u) return null;
      const { data: ws } = await c.from("worlds").select("id").eq("owner_id", u.id);
      const ids = (ws || []).map((w) => w.id);
      const days = [];
      const label = ["일", "월", "화", "수", "목", "금", "토"];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        days.push({ d: label[d.getDay()], key: d.toISOString().slice(0, 10), v: 0, p: 0 });
      }
      if (!ids.length) return days;
      const from = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data } = await c.from("plays")
        .select("created_at,player_id,seconds").in("world_id", ids).gte("created_at", from).limit(5000);
      const seen = {};
      (data || []).forEach((r) => {
        const k = String(r.created_at).slice(0, 10);
        const day = days.find((x) => x.key === k);
        if (!day) return;
        day.v++;                                   // 플레이 수
        const pk = k + ":" + (r.player_id || "guest");
        if (!seen[pk]) { seen[pk] = 1; day.p++; }   // 접속자 수
      });
      return days;
    },
    // 크리에이터별 팔로워 수 · 작품 수를 한 번에
    async creatorStats(ids) {
      const c = init();
      if (!c || !ids || !ids.length) return null;
      const [{ data: fo }, { data: ws }] = await Promise.all([
        c.from("follows").select("target_id").in("target_id", ids).limit(5000),
        c.from("worlds").select("owner_id").in("owner_id", ids).eq("status", "published").limit(5000),
      ]);
      const out = {};
      ids.forEach((i) => { out[i] = { followers: 0, worlds: 0 }; });
      (fo || []).forEach((r) => { if (out[r.target_id]) out[r.target_id].followers++; });
      (ws || []).forEach((r) => { if (out[r.owner_id]) out[r.owner_id].worlds++; });
      return out;
    },
    async readNotifications() {
      const c = init();
      if (!c) return false;
      const u = await this.me();
      if (!u) return false;
      const { error } = await c.from("notifications").update({ read_at: new Date().toISOString() })
        .eq("user_id", u.id).is("read_at", null);
      return !error;
    },
    async notifications() {
      const c = init();
      if (!c) return null;
      const { data, error } = await c
        .from("notifications")
        .select("*, actor:actor_id(display_name,handle)")
        .order("created_at", { ascending: false })
        .limit(20);
      return error ? null : data;
    },
    // 작품 실시간 변수 구독
    subscribeVars(worldId, onChange) {
      const c = init();
      if (!c) return null;
      return c
        .channel("world:" + worldId)
        .on("postgres_changes", { event: "*", schema: "public", table: "game_vars", filter: "world_id=eq." + worldId }, onChange)
        .subscribe();
    },
  };
})();
