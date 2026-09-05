// Dotverse 블록 엔진 — 모델 / 레이아웃 / 붙이기·떼기 / 실행
// 트리 구조: { id, def, inputs:{key:값|블록}, body:[블록], next:블록|null }
(function () {
  const ROW_H = 40;      // 한 줄 높이
  const INDENT = 20;     // C블록 안쪽 들여쓰기
  const SNAP = 30;       // 붙는 거리(px)

  // 절대 겹치지 않는 id — 스크립트가 다시 평가돼도 기존 블록과 부딪히지 않는다
  let seq = 0;
  const uid = () => "b" + Date.now().toString(36) + (++seq).toString(36) + Math.random().toString(36).slice(2, 6);

  // ── 블록 정의 ─────────────────────────────────────────────
  // shape: hat(모자) / stack(쌓기) / c(감싸기) / bool(판단) / num(계산)
  // parts: lbl(글자) / num,txt(직접 입력) / slot(블록 끼우기) / sel(고르기)
  const D = {};
  const def = (o) => { D[o.id] = o; return o; };

  const C = {
    move: "#4A5FD1", look: "#8D6BD8", sound: "#B8496F", event: "#F2B23E",
    flow: "#E0653A", logic: "#2F6F5E", calc: "#4F9E7F", data: "#3E6FD9",
    db: "#0F766E", multi: "#8D6BD8", obj: "#7A4A2B",
  };

  // 이벤트 (모자 블록)
  def({ id: "when_start", cat: "이벤트", shape: "hat", c: C.event,
    parts: [{ t: "lbl", v: "시작 버튼을 눌렀을 때" }] });
  def({ id: "when_key", cat: "이벤트", shape: "hat", c: C.event,
    parts: [{ t: "lbl", v: "" }, { t: "sel", k: "key", opts: ["위쪽", "아래쪽", "왼쪽", "오른쪽", "스페이스"], def: "오른쪽" }, { t: "lbl", v: "키를 눌렀을 때" }] });
  def({ id: "when_click", cat: "이벤트", shape: "hat", c: C.event,
    parts: [{ t: "lbl", v: "오브젝트를 클릭했을 때" }] });
  def({ id: "broadcast", cat: "이벤트", shape: "stack", c: C.event,
    parts: [{ t: "sel", k: "sig", opts: ["__SIG__"], def: "신호1" }, { t: "lbl", v: "신호 보내기" }] });
  def({ id: "when_signal", cat: "이벤트", shape: "hat", c: C.event,
    parts: [{ t: "sel", k: "sig", opts: ["__SIG__"], def: "신호1" }, { t: "lbl", v: "신호를 받았을 때" }] });

  // 움직임
  def({ id: "move_steps", cat: "움직임", shape: "stack", c: C.move,
    parts: [{ t: "slot", k: "n", accept: "num", def: 10 }, { t: "lbl", v: "만큼 앞으로 이동하기" }] });
  def({ id: "move_xy", cat: "움직임", shape: "stack", c: C.move,
    parts: [{ t: "lbl", v: "x" }, { t: "slot", k: "x", accept: "num", def: 0 }, { t: "lbl", v: "y" }, { t: "slot", k: "y", accept: "num", def: 0 }, { t: "lbl", v: "위치로 이동하기" }] });
  def({ id: "change_x", cat: "움직임", shape: "stack", c: C.move,
    parts: [{ t: "lbl", v: "x 좌표를" }, { t: "slot", k: "n", accept: "num", def: 10 }, { t: "lbl", v: "만큼 바꾸기" }] });
  def({ id: "change_y", cat: "움직임", shape: "stack", c: C.move,
    parts: [{ t: "lbl", v: "y 좌표를" }, { t: "slot", k: "n", accept: "num", def: 10 }, { t: "lbl", v: "만큼 바꾸기" }] });
  def({ id: "turn", cat: "움직임", shape: "stack", c: C.move,
    parts: [{ t: "lbl", v: "방향을" }, { t: "slot", k: "n", accept: "num", def: 90 }, { t: "lbl", v: "도 회전하기" }] });

  // 생김새
  def({ id: "say", cat: "생김새", shape: "stack", c: C.look,
    parts: [{ t: "txt", k: "msg", def: "안녕!" }, { t: "lbl", v: "라고 말하기" }] });
  def({ id: "say_wait", cat: "생김새", shape: "stack", c: C.look,
    parts: [{ t: "txt", k: "msg", def: "안녕!" }, { t: "lbl", v: "을" }, { t: "slot", k: "sec", accept: "num", def: 1 }, { t: "lbl", v: "초 동안 말하기" }] });
  def({ id: "set_size", cat: "생김새", shape: "stack", c: C.look,
    parts: [{ t: "lbl", v: "크기를" }, { t: "slot", k: "n", accept: "num", def: 120 }, { t: "lbl", v: "% 로 정하기" }] });
  def({ id: "hide", cat: "생김새", shape: "stack", c: C.look, parts: [{ t: "lbl", v: "모양 숨기기" }] });
  def({ id: "show", cat: "생김새", shape: "stack", c: C.look, parts: [{ t: "lbl", v: "모양 보이기" }] });
  def({ id: "to_front", cat: "생김새", shape: "stack", c: C.look, parts: [{ t: "lbl", v: "맨 앞으로 보내기" }] });

  // 흐름
  def({ id: "wait", cat: "흐름", shape: "stack", c: C.flow,
    parts: [{ t: "slot", k: "sec", accept: "num", def: 1 }, { t: "lbl", v: "초 기다리기" }] });
  def({ id: "repeat", cat: "흐름", shape: "c", c: C.flow,
    parts: [{ t: "slot", k: "n", accept: "num", def: 10 }, { t: "lbl", v: "번 반복하기" }] });
  def({ id: "forever", cat: "흐름", shape: "c", c: C.flow,
    parts: [{ t: "lbl", v: "계속 반복하기" }] });
  def({ id: "repeat_until", cat: "흐름", shape: "c", c: C.flow,
    parts: [{ t: "slot", k: "cond", accept: "bool" }, { t: "lbl", v: "이 될 때까지 반복하기" }] });
  def({ id: "stop_this", cat: "흐름", shape: "stack", c: C.flow,
    parts: [{ t: "lbl", v: "이 코드 멈추기" }] });

  // 판단 (C블록 + 조건 슬롯)
  def({ id: "if", cat: "판단·논리", shape: "c", c: C.logic,
    parts: [{ t: "lbl", v: "만약" }, { t: "slot", k: "cond", accept: "bool" }, { t: "lbl", v: "이라면" }] });
  def({ id: "if_else", cat: "판단·논리", shape: "c2", c: C.logic,
    parts: [{ t: "lbl", v: "만약" }, { t: "slot", k: "cond", accept: "bool" }, { t: "lbl", v: "이라면" }],
    elseLabel: "아니면" });
  def({ id: "gt", cat: "판단·논리", shape: "bool", c: C.logic,
    parts: [{ t: "slot", k: "a", accept: "num", def: 10 }, { t: "lbl", v: ">" }, { t: "slot", k: "b", accept: "num", def: 5 }] });
  def({ id: "lt", cat: "판단·논리", shape: "bool", c: C.logic,
    parts: [{ t: "slot", k: "a", accept: "num", def: 10 }, { t: "lbl", v: "<" }, { t: "slot", k: "b", accept: "num", def: 5 }] });
  def({ id: "eq", cat: "판단·논리", shape: "bool", c: C.logic,
    parts: [{ t: "slot", k: "a", accept: "num", def: 10 }, { t: "lbl", v: "=" }, { t: "slot", k: "b", accept: "num", def: 10 }] });
  def({ id: "and", cat: "판단·논리", shape: "bool", c: C.logic,
    parts: [{ t: "slot", k: "a", accept: "bool" }, { t: "lbl", v: "그리고" }, { t: "slot", k: "b", accept: "bool" }] });
  def({ id: "or", cat: "판단·논리", shape: "bool", c: C.logic,
    parts: [{ t: "slot", k: "a", accept: "bool" }, { t: "lbl", v: "또는" }, { t: "slot", k: "b", accept: "bool" }] });
  def({ id: "not", cat: "판단·논리", shape: "bool", c: C.logic,
    parts: [{ t: "slot", k: "a", accept: "bool" }, { t: "lbl", v: "이 아니다" }] });
  def({ id: "key_down", cat: "판단·논리", shape: "bool", c: C.logic,
    parts: [{ t: "sel", k: "key", opts: ["위쪽", "아래쪽", "왼쪽", "오른쪽", "스페이스"], def: "오른쪽" }, { t: "lbl", v: "키가 눌렸는가?" }] });
  def({ id: "touching", cat: "판단·논리", shape: "bool", c: C.logic,
    parts: [{ t: "lbl", v: "" }, { t: "sel", k: "name", opts: ["__OBJ__"], def: "" }, { t: "lbl", v: "에 닿았는가?" }] });

  // 계산
  def({ id: "add", cat: "계산", shape: "num", c: C.calc,
    parts: [{ t: "slot", k: "a", accept: "num", def: 10 }, { t: "lbl", v: "+" }, { t: "slot", k: "b", accept: "num", def: 5 }] });
  def({ id: "sub", cat: "계산", shape: "num", c: C.calc,
    parts: [{ t: "slot", k: "a", accept: "num", def: 10 }, { t: "lbl", v: "-" }, { t: "slot", k: "b", accept: "num", def: 5 }] });
  def({ id: "mul", cat: "계산", shape: "num", c: C.calc,
    parts: [{ t: "slot", k: "a", accept: "num", def: 10 }, { t: "lbl", v: "×" }, { t: "slot", k: "b", accept: "num", def: 5 }] });
  def({ id: "div", cat: "계산", shape: "num", c: C.calc,
    parts: [{ t: "slot", k: "a", accept: "num", def: 10 }, { t: "lbl", v: "÷" }, { t: "slot", k: "b", accept: "num", def: 5 }] });
  def({ id: "mod", cat: "계산", shape: "num", c: C.calc,
    parts: [{ t: "slot", k: "a", accept: "num", def: 10 }, { t: "lbl", v: "의 나머지" }, { t: "slot", k: "b", accept: "num", def: 3 }] });
  def({ id: "random", cat: "계산", shape: "num", c: C.calc,
    parts: [{ t: "slot", k: "a", accept: "num", def: 1 }, { t: "lbl", v: "부터" }, { t: "slot", k: "b", accept: "num", def: 10 }, { t: "lbl", v: "사이 무작위 수" }] });
  def({ id: "floor", cat: "계산", shape: "num", c: C.calc,
    parts: [{ t: "slot", k: "a", accept: "num", def: 3.7 }, { t: "lbl", v: "의 소수점 버리기" }] });
  def({ id: "my_x", cat: "계산", shape: "num", c: C.calc, parts: [{ t: "lbl", v: "나의 x 좌표" }] });
  def({ id: "my_y", cat: "계산", shape: "num", c: C.calc, parts: [{ t: "lbl", v: "나의 y 좌표" }] });
  def({ id: "timer", cat: "계산", shape: "num", c: C.calc, parts: [{ t: "lbl", v: "초시계 값" }] });

  // 변수
  def({ id: "set_var", cat: "변수·리스트", shape: "stack", c: C.data,
    parts: [{ t: "lbl", v: "변수" }, { t: "sel", k: "name", opts: ["__VAR__"], def: "점수" }, { t: "lbl", v: "를" }, { t: "slot", k: "v", accept: "num", def: 0 }, { t: "lbl", v: "로 정하기" }] });
  def({ id: "change_var", cat: "변수·리스트", shape: "stack", c: C.data,
    parts: [{ t: "lbl", v: "변수" }, { t: "sel", k: "name", opts: ["__VAR__"], def: "점수" }, { t: "lbl", v: "를" }, { t: "slot", k: "v", accept: "num", def: 1 }, { t: "lbl", v: "만큼 바꾸기" }] });
  def({ id: "get_var", cat: "변수·리스트", shape: "num", c: C.data,
    parts: [{ t: "sel", k: "name", opts: ["__VAR__"], def: "점수" }, { t: "lbl", v: "값" }] });

  // 실시간 DB
  def({ id: "db_set", cat: "실시간 DB", shape: "stack", c: C.db,
    parts: [{ t: "lbl", v: "테이블" }, { t: "txt", k: "tbl", def: "랭킹" }, { t: "lbl", v: "의 컬럼" }, { t: "txt", k: "col", def: "점수" }, { t: "lbl", v: "을" }, { t: "slot", k: "v", accept: "num", def: 0 }, { t: "lbl", v: "로 저장하기" }] });
  def({ id: "db_get", cat: "실시간 DB", shape: "num", c: C.db,
    parts: [{ t: "lbl", v: "테이블" }, { t: "txt", k: "tbl", def: "랭킹" }, { t: "lbl", v: "의 컬럼" }, { t: "txt", k: "col", def: "점수" }, { t: "lbl", v: "값" }] });
  def({ id: "rt_set", cat: "실시간 DB", shape: "stack", c: C.db,
    parts: [{ t: "lbl", v: "실시간 변수" }, { t: "txt", k: "key", def: "접속자수" }, { t: "lbl", v: "를" }, { t: "slot", k: "v", accept: "num", def: 1 }, { t: "lbl", v: "로 정하기" }] });

  // 오브젝트·장면
  def({ id: "goto_scene", cat: "오브젝트·맵", shape: "stack", c: C.obj,
    parts: [{ t: "lbl", v: "장면을" }, { t: "sel", k: "scene", opts: ["__SCENE__"], def: "" }, { t: "lbl", v: "으로 바꾸기" }] });
  def({ id: "clone", cat: "오브젝트·맵", shape: "stack", c: C.obj,
    parts: [{ t: "lbl", v: "나의 복제본 만들기" }] });


  // ── 추가 블록 ─────────────────────────────────────────────
  const C2 = { pen: "#0EA5A0", text: "#D97706", list: "#3E6FD9", func: "#7C5CD6", ext: "#9AA3B2", sound: C.sound };

  // 움직임 (추가)
  def({ id: "move_dir", cat: "움직임", shape: "stack", c: C.move,
    parts: [{ t: "sel", k: "dir", opts: ["위쪽", "아래쪽", "왼쪽", "오른쪽"], def: "오른쪽" }, { t: "lbl", v: "으로" }, { t: "slot", k: "n", accept: "num", def: 10 }, { t: "lbl", v: "만큼 움직이기" }] });
  def({ id: "glide_xy", cat: "움직임", shape: "stack", c: C.move,
    parts: [{ t: "slot", k: "sec", accept: "num", def: 1 }, { t: "lbl", v: "초 동안 x" }, { t: "slot", k: "x", accept: "num", def: 0 }, { t: "lbl", v: "y" }, { t: "slot", k: "y", accept: "num", def: 0 }, { t: "lbl", v: "로 이동하기" }] });
  def({ id: "set_x", cat: "움직임", shape: "stack", c: C.move,
    parts: [{ t: "lbl", v: "x 좌표를" }, { t: "slot", k: "n", accept: "num", def: 0 }, { t: "lbl", v: "로 정하기" }] });
  def({ id: "set_y", cat: "움직임", shape: "stack", c: C.move,
    parts: [{ t: "lbl", v: "y 좌표를" }, { t: "slot", k: "n", accept: "num", def: 0 }, { t: "lbl", v: "로 정하기" }] });
  def({ id: "bounce_edge", cat: "움직임", shape: "stack", c: C.move,
    parts: [{ t: "lbl", v: "벽에 닿으면 튕기기" }] });
  def({ id: "point_to", cat: "움직임", shape: "stack", c: C.move,
    parts: [{ t: "sel", k: "name", opts: ["__OBJ__"], def: "" }, { t: "lbl", v: "쪽 보기" }] });

  // 생김새 (추가)
  def({ id: "change_size", cat: "생김새", shape: "stack", c: C.look,
    parts: [{ t: "lbl", v: "크기를" }, { t: "slot", k: "n", accept: "num", def: 10 }, { t: "lbl", v: "만큼 바꾸기" }] });
  def({ id: "set_alpha", cat: "생김새", shape: "stack", c: C.look,
    parts: [{ t: "lbl", v: "투명도를" }, { t: "slot", k: "n", accept: "num", def: 50 }, { t: "lbl", v: "% 로 정하기" }] });
  def({ id: "to_back", cat: "생김새", shape: "stack", c: C.look, parts: [{ t: "lbl", v: "맨 뒤로 보내기" }] });
  def({ id: "clear_say", cat: "생김새", shape: "stack", c: C.look, parts: [{ t: "lbl", v: "말풍선 지우기" }] });

  // 글상자 (생김새)
  def({ id: "text_set", cat: "생김새", shape: "stack", c: C.look,
    parts: [{ t: "lbl", v: "글상자 내용을" }, { t: "txt", k: "msg", def: "안녕!" }, { t: "lbl", v: "로 정하기" }] });
  def({ id: "text_add", cat: "생김새", shape: "stack", c: C.look,
    parts: [{ t: "lbl", v: "글상자 뒤에" }, { t: "slot", k: "v", accept: "num", def: 1 }, { t: "lbl", v: "붙이기" }] });
  def({ id: "text_size", cat: "생김새", shape: "stack", c: C.look,
    parts: [{ t: "lbl", v: "글자 크기를" }, { t: "slot", k: "n", accept: "num", def: 24 }, { t: "lbl", v: "로 정하기" }] });
  def({ id: "text_color", cat: "생김새", shape: "stack", c: C.look,
    parts: [{ t: "lbl", v: "글자 색을" }, { t: "sel", k: "c", opts: ["검정", "빨강", "초록", "파랑", "노랑", "흰색"], def: "검정" }, { t: "lbl", v: "으로 정하기" }] });

  // 소리
  def({ id: "play_sound", cat: "소리", shape: "stack", c: C2.sound,
    parts: [{ t: "sel", k: "s", opts: ["__SOUND__"], def: "딩" }, { t: "lbl", v: "재생하기" }] });
  def({ id: "play_wait", cat: "소리", shape: "stack", c: C2.sound,
    parts: [{ t: "sel", k: "s", opts: ["__SOUND__"], def: "딩" }, { t: "lbl", v: "재생하고 기다리기" }] });
  def({ id: "set_vol", cat: "소리", shape: "stack", c: C2.sound,
    parts: [{ t: "lbl", v: "소리 크기를" }, { t: "slot", k: "n", accept: "num", def: 60 }, { t: "lbl", v: "% 로 정하기" }] });
  def({ id: "stop_sound", cat: "소리", shape: "stack", c: C2.sound, parts: [{ t: "lbl", v: "모든 소리 멈추기" }] });

  // 붓
  def({ id: "pen_down", cat: "붓", shape: "stack", c: C2.pen, parts: [{ t: "lbl", v: "그리기 시작하기" }] });
  def({ id: "pen_up", cat: "붓", shape: "stack", c: C2.pen, parts: [{ t: "lbl", v: "그리기 멈추기" }] });
  def({ id: "pen_color", cat: "붓", shape: "stack", c: C2.pen,
    parts: [{ t: "lbl", v: "붓 색을" }, { t: "sel", k: "c", opts: ["검정", "빨강", "초록", "파랑", "노랑"], def: "초록" }, { t: "lbl", v: "으로 정하기" }] });
  def({ id: "pen_size", cat: "붓", shape: "stack", c: C2.pen,
    parts: [{ t: "lbl", v: "붓 굵기를" }, { t: "slot", k: "n", accept: "num", def: 2 }, { t: "lbl", v: "로 정하기" }] });
  def({ id: "pen_clear", cat: "붓", shape: "stack", c: C2.pen, parts: [{ t: "lbl", v: "모두 지우기" }] });

  // 글상자·UI
  def({ id: "ui_text", cat: "카메라·UI", shape: "stack", c: C.obj,
    parts: [{ t: "lbl", v: "화면에" }, { t: "txt", k: "msg", def: "점수" }, { t: "lbl", v: "글자 보이기" }] });
  def({ id: "cam_follow", cat: "카메라·UI", shape: "stack", c: C.obj,
    parts: [{ t: "lbl", v: "카메라를" }, { t: "sel", k: "name", opts: ["__OBJ__"], def: "" }, { t: "lbl", v: "따라가게 하기" }] });
  def({ id: "cam_zoom", cat: "카메라·UI", shape: "stack", c: C.obj,
    parts: [{ t: "lbl", v: "카메라 확대를" }, { t: "slot", k: "n", accept: "num", def: 1.5 }, { t: "lbl", v: "배로 정하기" }] });
  def({ id: "shake", cat: "카메라·UI", shape: "stack", c: C.obj,
    parts: [{ t: "lbl", v: "화면 흔들기" }, { t: "slot", k: "sec", accept: "num", def: 0.3 }, { t: "lbl", v: "초" }] });

  // 계산 (추가)
  def({ id: "abs", cat: "계산", shape: "num", c: C.calc,
    parts: [{ t: "slot", k: "a", accept: "num", def: -5 }, { t: "lbl", v: "의 절댓값" }] });
  def({ id: "round", cat: "계산", shape: "num", c: C.calc,
    parts: [{ t: "slot", k: "a", accept: "num", def: 3.5 }, { t: "lbl", v: "을 반올림" }] });
  def({ id: "min", cat: "계산", shape: "num", c: C.calc,
    parts: [{ t: "slot", k: "a", accept: "num", def: 3 }, { t: "lbl", v: "과" }, { t: "slot", k: "b", accept: "num", def: 8 }, { t: "lbl", v: "중 작은 값" }] });
  def({ id: "max", cat: "계산", shape: "num", c: C.calc,
    parts: [{ t: "slot", k: "a", accept: "num", def: 3 }, { t: "lbl", v: "과" }, { t: "slot", k: "b", accept: "num", def: 8 }, { t: "lbl", v: "중 큰 값" }] });
  def({ id: "dist_to", cat: "계산", shape: "num", c: C.calc,
    parts: [{ t: "sel", k: "name", opts: ["__OBJ__"], def: "" }, { t: "lbl", v: "까지의 거리" }] });
  def({ id: "obj_x", cat: "계산", shape: "num", c: C.calc,
    parts: [{ t: "sel", k: "name", opts: ["__OBJ__"], def: "" }, { t: "lbl", v: "의 x 좌표" }] });
  def({ id: "obj_y", cat: "계산", shape: "num", c: C.calc,
    parts: [{ t: "sel", k: "name", opts: ["__OBJ__"], def: "" }, { t: "lbl", v: "의 y 좌표" }] });
  def({ id: "reset_timer", cat: "계산", shape: "stack", c: C.calc, parts: [{ t: "lbl", v: "초시계 초기화하기" }] });

  // 리스트
  def({ id: "list_add", cat: "변수·리스트", shape: "stack", c: C2.list,
    parts: [{ t: "lbl", v: "리스트" }, { t: "sel", k: "name", opts: ["__LIST__"], def: "기록" }, { t: "lbl", v: "에" }, { t: "slot", k: "v", accept: "num", def: 0 }, { t: "lbl", v: "추가하기" }] });
  def({ id: "list_del", cat: "변수·리스트", shape: "stack", c: C2.list,
    parts: [{ t: "lbl", v: "리스트" }, { t: "sel", k: "name", opts: ["__LIST__"], def: "기록" }, { t: "lbl", v: "의" }, { t: "slot", k: "i", accept: "num", def: 1 }, { t: "lbl", v: "번째 삭제하기" }] });
  def({ id: "list_clear", cat: "변수·리스트", shape: "stack", c: C2.list,
    parts: [{ t: "lbl", v: "리스트" }, { t: "sel", k: "name", opts: ["__LIST__"], def: "기록" }, { t: "lbl", v: "모두 비우기" }] });
  def({ id: "list_get", cat: "변수·리스트", shape: "num", c: C2.list,
    parts: [{ t: "sel", k: "name", opts: ["__LIST__"], def: "기록" }, { t: "lbl", v: "의" }, { t: "slot", k: "i", accept: "num", def: 1 }, { t: "lbl", v: "번째 값" }] });
  def({ id: "list_len", cat: "변수·리스트", shape: "num", c: C2.list,
    parts: [{ t: "sel", k: "name", opts: ["__LIST__"], def: "기록" }, { t: "lbl", v: "의 개수" }] });
  def({ id: "list_max", cat: "변수·리스트", shape: "num", c: C2.list,
    parts: [{ t: "sel", k: "name", opts: ["__LIST__"], def: "기록" }, { t: "lbl", v: "의 최고값" }] });

  // 실시간 DB (추가)
  def({ id: "db_add_row", cat: "실시간 DB", shape: "stack", c: C.db,
    parts: [{ t: "lbl", v: "테이블" }, { t: "txt", k: "tbl", def: "랭킹" }, { t: "lbl", v: "에 내 기록" }, { t: "slot", k: "v", accept: "num", def: 0 }, { t: "lbl", v: "추가하기" }] });
  def({ id: "db_top", cat: "실시간 DB", shape: "num", c: C.db,
    parts: [{ t: "lbl", v: "테이블" }, { t: "txt", k: "tbl", def: "랭킹" }, { t: "lbl", v: "의 컬럼" }, { t: "txt", k: "col", def: "점수" }, { t: "lbl", v: "최고값" }] });
  def({ id: "db_rows", cat: "실시간 DB", shape: "num", c: C.db,
    parts: [{ t: "lbl", v: "테이블" }, { t: "txt", k: "tbl", def: "랭킹" }, { t: "lbl", v: "의 행 개수" }] });
  def({ id: "rt_get", cat: "실시간 DB", shape: "num", c: C.db,
    parts: [{ t: "lbl", v: "실시간 변수" }, { t: "txt", k: "key", def: "접속자수" }, { t: "lbl", v: "값" }] });
  def({ id: "rt_change", cat: "실시간 DB", shape: "stack", c: C.db,
    parts: [{ t: "lbl", v: "실시간 변수" }, { t: "txt", k: "key", def: "접속자수" }, { t: "lbl", v: "를" }, { t: "slot", k: "v", accept: "num", def: 1 }, { t: "lbl", v: "만큼 바꾸기" }] });
  def({ id: "when_rt_change", cat: "실시간 DB", shape: "hat", c: C.event,
    parts: [{ t: "lbl", v: "실시간 변수" }, { t: "txt", k: "key", def: "접속자수" }, { t: "lbl", v: "가 바뀌었을 때" }] });

  // 멀티플레이
  def({ id: "when_join", cat: "멀티플레이", shape: "hat", c: C.event,
    parts: [{ t: "lbl", v: "플레이어가 들어왔을 때" }] });
  def({ id: "player_count", cat: "멀티플레이", shape: "num", c: C.multi,
    parts: [{ t: "lbl", v: "접속한 플레이어 수" }] });
  def({ id: "move_to_zone", cat: "멀티플레이", shape: "stack", c: C.multi,
    parts: [{ t: "lbl", v: "플레이어를" }, { t: "txt", k: "zone", def: "대기실" }, { t: "lbl", v: "구역으로 옮기기" }] });
  def({ id: "chat_send", cat: "멀티플레이", shape: "stack", c: C.multi,
    parts: [{ t: "lbl", v: "채팅으로" }, { t: "txt", k: "msg", def: "시작합니다" }, { t: "lbl", v: "보내기 (필터 적용)" }] });
  def({ id: "my_name", cat: "멀티플레이", shape: "num", c: C.multi, parts: [{ t: "lbl", v: "내 이름" }] });

  // 멀티플레이 — 이 블록 하나면 같은 방의 사람들이 서로 보이고 움직임이 오간다
  def({ id: "mp_join", cat: "멀티플레이", shape: "stack", c: C.multi,
    parts: [{ t: "txt", k: "room", def: "1번방" }, { t: "lbl", v: "멀티플레이 시작하기 (자동 연결)" }] });
  def({ id: "mp_leave", cat: "멀티플레이", shape: "stack", c: C.multi,
    parts: [{ t: "lbl", v: "멀티플레이 끝내기" }] });
  def({ id: "mp_nick", cat: "멀티플레이", shape: "stack", c: C.multi,
    parts: [{ t: "lbl", v: "내 이름을" }, { t: "txt", k: "name", def: "플레이어" }, { t: "lbl", v: "로 정하기" }] });
  def({ id: "when_mp_join", cat: "멀티플레이", shape: "hat", c: C.event,
    parts: [{ t: "lbl", v: "다른 플레이어가 들어왔을 때" }] });
  def({ id: "mp_others", cat: "멀티플레이", shape: "num", c: C.multi,
    parts: [{ t: "lbl", v: "나 말고 접속한 사람 수" }] });

  // 오브젝트·맵 (추가)
  def({ id: "del_clone", cat: "오브젝트·맵", shape: "stack", c: C.obj, parts: [{ t: "lbl", v: "이 복제본 삭제하기" }] });
  def({ id: "set_tile", cat: "오브젝트·맵", shape: "stack", c: C.obj,
    parts: [{ t: "lbl", v: "타일" }, { t: "slot", k: "x", accept: "num", def: 4 }, { t: "lbl", v: "," }, { t: "slot", k: "y", accept: "num", def: 7 }, { t: "lbl", v: "을" }, { t: "sel", k: "t", opts: ["바닥", "벽", "경계"], def: "벽" }, { t: "lbl", v: "로 바꾸기" }] });
  def({ id: "in_zone", cat: "오브젝트·맵", shape: "bool", c: C.logic,
    parts: [{ t: "txt", k: "zone", def: "경기장" }, { t: "lbl", v: "구역 안에 있는가?" }] });

  // 확장
  def({ id: "now", cat: "확장", shape: "num", c: C2.ext,
    parts: [{ t: "sel", k: "unit", opts: ["시", "분", "초", "연도", "월", "일"], def: "초" }, { t: "lbl", v: "값" }] });
  def({ id: "translate", cat: "확장", shape: "num", c: C2.ext,
    parts: [{ t: "txt", k: "msg", def: "안녕" }, { t: "lbl", v: "을" }, { t: "sel", k: "to", opts: ["영어", "일본어", "중국어"], def: "영어" }, { t: "lbl", v: "로 번역하기" }] });
  def({ id: "speak", cat: "확장", shape: "stack", c: C2.ext,
    parts: [{ t: "txt", k: "msg", def: "안녕하세요" }, { t: "lbl", v: "읽어주기" }] });


  // 데이터베이스 정의 블록 — 코드가 아니라 블록으로 테이블·컬럼을 만든다
  def({ id: "db_create", cat: "실시간 DB", shape: "stack", c: C.db,
    parts: [{ t: "lbl", v: "테이블" }, { t: "txt", k: "tbl", def: "랭킹" }, { t: "lbl", v: "을" }, { t: "sel", k: "scope", opts: ["전역", "플레이어별"], def: "전역" }, { t: "lbl", v: "으로 만들기" }] });
  def({ id: "db_add_col", cat: "실시간 DB", shape: "stack", c: C.db,
    parts: [{ t: "lbl", v: "테이블" }, { t: "txt", k: "tbl", def: "랭킹" }, { t: "lbl", v: "에 컬럼" }, { t: "txt", k: "col", def: "점수" }, { t: "lbl", v: "을" }, { t: "sel", k: "type", opts: ["숫자", "글자", "참/거짓"], def: "숫자" }, { t: "lbl", v: "로 추가하기" }] });
  def({ id: "db_drop_col", cat: "실시간 DB", shape: "stack", c: C.db,
    parts: [{ t: "lbl", v: "테이블" }, { t: "txt", k: "tbl", def: "랭킹" }, { t: "lbl", v: "의 컬럼" }, { t: "txt", k: "col", def: "점수" }, { t: "lbl", v: "삭제하기" }] });
  def({ id: "db_drop", cat: "실시간 DB", shape: "stack", c: C.db,
    parts: [{ t: "lbl", v: "테이블" }, { t: "txt", k: "tbl", def: "랭킹" }, { t: "lbl", v: "삭제하기" }] });
  def({ id: "db_has_table", cat: "실시간 DB", shape: "bool", c: C.logic,
    parts: [{ t: "lbl", v: "테이블" }, { t: "txt", k: "tbl", def: "랭킹" }, { t: "lbl", v: "이 있는가?" }] });

  // ── 2차 확장 블록 ─────────────────────────────────────────
  const C3 = { func: "#7C5CD6", str: "#D97706" };

  // 이벤트
  def({ id: "when_clone_start", cat: "이벤트", shape: "hat", c: C.event,
    parts: [{ t: "lbl", v: "복제본이 처음 만들어졌을 때" }] });
  def({ id: "when_scene_start", cat: "이벤트", shape: "hat", c: C.event,
    parts: [{ t: "lbl", v: "장면이 시작되었을 때" }] });
  def({ id: "when_mouse", cat: "이벤트", shape: "hat", c: C.event,
    parts: [{ t: "lbl", v: "마우스를 클릭했을 때" }] });

  // 움직임
  def({ id: "set_rot", cat: "움직임", shape: "stack", c: C.move,
    parts: [{ t: "lbl", v: "방향을" }, { t: "slot", k: "n", accept: "num", def: 90 }, { t: "lbl", v: "도로 정하기" }] });
  def({ id: "move_random", cat: "움직임", shape: "stack", c: C.move,
    parts: [{ t: "lbl", v: "무작위 위치로 이동하기" }] });
  def({ id: "move_to_obj", cat: "움직임", shape: "stack", c: C.move,
    parts: [{ t: "sel", k: "name", opts: ["__OBJ__"], def: "" }, { t: "lbl", v: "위치로 이동하기" }] });

  // 생김새
  def({ id: "next_shape", cat: "생김새", shape: "stack", c: C.look,
    parts: [{ t: "lbl", v: "다음 모양으로 바꾸기" }] });
  def({ id: "set_shape", cat: "생김새", shape: "stack", c: C.look,
    parts: [{ t: "lbl", v: "모양을" }, { t: "sel", k: "art", opts: ["__ART__"], def: "" }, { t: "lbl", v: "으로 바꾸기" }] });
  def({ id: "flip_h", cat: "생김새", shape: "stack", c: C.look, parts: [{ t: "lbl", v: "좌우 모양 뒤집기" }] });
  def({ id: "flip_v", cat: "생김새", shape: "stack", c: C.look, parts: [{ t: "lbl", v: "위아래 모양 뒤집기" }] });
  def({ id: "set_hue", cat: "생김새", shape: "stack", c: C.look,
    parts: [{ t: "lbl", v: "색깔 효과를" }, { t: "slot", k: "n", accept: "num", def: 60 }, { t: "lbl", v: "로 정하기" }] });

  // 흐름
  def({ id: "wait_until", cat: "흐름", shape: "stack", c: C.flow,
    parts: [{ t: "slot", k: "cond", accept: "bool" }, { t: "lbl", v: "이 될 때까지 기다리기" }] });
  def({ id: "stop_all", cat: "흐름", shape: "stack", c: C.flow, parts: [{ t: "lbl", v: "모든 코드 멈추기" }] });
  def({ id: "repeat_while", cat: "흐름", shape: "c", c: C.flow,
    parts: [{ t: "lbl", v: "만약" }, { t: "slot", k: "cond", accept: "bool" }, { t: "lbl", v: "인 동안 반복하기" }] });

  // 판단·논리
  def({ id: "true_v", cat: "판단·논리", shape: "bool", c: C.logic, parts: [{ t: "lbl", v: "참" }] });
  def({ id: "false_v", cat: "판단·논리", shape: "bool", c: C.logic, parts: [{ t: "lbl", v: "거짓" }] });
  def({ id: "gte", cat: "판단·논리", shape: "bool", c: C.logic,
    parts: [{ t: "slot", k: "a", accept: "num", def: 10 }, { t: "lbl", v: "≥" }, { t: "slot", k: "b", accept: "num", def: 5 }] });
  def({ id: "lte", cat: "판단·논리", shape: "bool", c: C.logic,
    parts: [{ t: "slot", k: "a", accept: "num", def: 10 }, { t: "lbl", v: "≤" }, { t: "slot", k: "b", accept: "num", def: 5 }] });
  def({ id: "neq", cat: "판단·논리", shape: "bool", c: C.logic,
    parts: [{ t: "slot", k: "a", accept: "num", def: 10 }, { t: "lbl", v: "≠" }, { t: "slot", k: "b", accept: "num", def: 5 }] });
  def({ id: "mouse_down", cat: "판단·논리", shape: "bool", c: C.logic,
    parts: [{ t: "lbl", v: "마우스를 클릭했는가?" }] });
  def({ id: "touch_edge", cat: "판단·논리", shape: "bool", c: C.logic,
    parts: [{ t: "lbl", v: "벽에 닿았는가?" }] });

  // 계산
  def({ id: "pow", cat: "계산", shape: "num", c: C.calc,
    parts: [{ t: "slot", k: "a", accept: "num", def: 2 }, { t: "lbl", v: "의" }, { t: "slot", k: "b", accept: "num", def: 3 }, { t: "lbl", v: "제곱" }] });
  def({ id: "quot", cat: "계산", shape: "num", c: C.calc,
    parts: [{ t: "slot", k: "a", accept: "num", def: 10 }, { t: "lbl", v: "÷" }, { t: "slot", k: "b", accept: "num", def: 3 }, { t: "lbl", v: "의 몫" }] });
  def({ id: "math_fn", cat: "계산", shape: "num", c: C.calc,
    parts: [{ t: "sel", k: "f", opts: ["제곱근", "sin", "cos", "tan", "log"], def: "제곱근" }, { t: "lbl", v: "(" }, { t: "slot", k: "a", accept: "num", def: 9 }, { t: "lbl", v: ")" }] });
  def({ id: "mouse_x", cat: "계산", shape: "num", c: C.calc, parts: [{ t: "lbl", v: "마우스 x 좌표" }] });
  def({ id: "mouse_y", cat: "계산", shape: "num", c: C.calc, parts: [{ t: "lbl", v: "마우스 y 좌표" }] });
  def({ id: "join", cat: "계산", shape: "num", c: C3.str,
    parts: [{ t: "txt", k: "a", def: "점수:" }, { t: "lbl", v: "와" }, { t: "slot", k: "b", accept: "num", def: 0 }, { t: "lbl", v: "를 합치기" }] });
  def({ id: "str_len", cat: "계산", shape: "num", c: C3.str,
    parts: [{ t: "txt", k: "s", def: "안녕" }, { t: "lbl", v: "의 글자 수" }] });
  def({ id: "char_at", cat: "계산", shape: "num", c: C3.str,
    parts: [{ t: "txt", k: "s", def: "안녕하세요" }, { t: "lbl", v: "의" }, { t: "slot", k: "i", accept: "num", def: 1 }, { t: "lbl", v: "번째 글자" }] });

  // 변수·리스트
  def({ id: "ask", cat: "변수·리스트", shape: "stack", c: C.data,
    parts: [{ t: "txt", k: "msg", def: "이름이 뭐야?" }, { t: "lbl", v: "라고 묻고 대답 기다리기" }] });
  def({ id: "answer", cat: "변수·리스트", shape: "num", c: C.data, parts: [{ t: "lbl", v: "대답" }] });
  def({ id: "show_var", cat: "변수·리스트", shape: "stack", c: C.data,
    parts: [{ t: "lbl", v: "변수" }, { t: "sel", k: "name", opts: ["__VAR__"], def: "점수" }, { t: "lbl", v: "보이기" }] });
  def({ id: "hide_var", cat: "변수·리스트", shape: "stack", c: C.data,
    parts: [{ t: "lbl", v: "변수" }, { t: "sel", k: "name", opts: ["__VAR__"], def: "점수" }, { t: "lbl", v: "숨기기" }] });
  def({ id: "list_insert", cat: "변수·리스트", shape: "stack", c: C2.list,
    parts: [{ t: "lbl", v: "리스트" }, { t: "sel", k: "name", opts: ["__LIST__"], def: "기록" }, { t: "lbl", v: "의" }, { t: "slot", k: "i", accept: "num", def: 1 }, { t: "lbl", v: "번째에" }, { t: "slot", k: "v", accept: "num", def: 0 }, { t: "lbl", v: "넣기" }] });
  def({ id: "list_replace", cat: "변수·리스트", shape: "stack", c: C2.list,
    parts: [{ t: "lbl", v: "리스트" }, { t: "sel", k: "name", opts: ["__LIST__"], def: "기록" }, { t: "lbl", v: "의" }, { t: "slot", k: "i", accept: "num", def: 1 }, { t: "lbl", v: "번째를" }, { t: "slot", k: "v", accept: "num", def: 0 }, { t: "lbl", v: "로 바꾸기" }] });
  def({ id: "list_has", cat: "변수·리스트", shape: "bool", c: C.logic,
    parts: [{ t: "sel", k: "name", opts: ["__LIST__"], def: "기록" }, { t: "lbl", v: "에" }, { t: "slot", k: "v", accept: "num", def: 0 }, { t: "lbl", v: "가 있는가?" }] });
  def({ id: "list_index", cat: "변수·리스트", shape: "num", c: C2.list,
    parts: [{ t: "sel", k: "name", opts: ["__LIST__"], def: "기록" }, { t: "lbl", v: "에서" }, { t: "slot", k: "v", accept: "num", def: 0 }, { t: "lbl", v: "의 순서" }] });

  // 카메라·UI
  def({ id: "ui_clear", cat: "카메라·UI", shape: "stack", c: C.obj, parts: [{ t: "lbl", v: "화면 글자 지우기" }] });
  def({ id: "cam_reset", cat: "카메라·UI", shape: "stack", c: C.obj, parts: [{ t: "lbl", v: "카메라 원래대로" }] });

  // ── 함수: 사용자가 만든 함수를 블록 정의로 등록한다 ───────
  // f = { id, name, params:[이름…] }
  function syncFuncs(funcs) {
    Object.keys(D).forEach((k) => { if (/^fn/.test(k)) delete D[k]; });
    (funcs || []).forEach((f) => {
      const args = (f.params || []).map((p, i) => ({ t: "slot", k: "p" + i, accept: "num", def: 0 }));
      def({ id: "fnh_" + f.id, cat: "함수", shape: "hat", c: C3.func, fname: f.name,
        parts: [{ t: "lbl", v: "함수 정의" }, { t: "lbl", v: f.name }].concat(
          (f.params || []).map((p) => ({ t: "lbl", v: "(" + p + ")" }))) });
      def({ id: "fn_" + f.id, cat: "함수", shape: "stack", c: C3.func, fname: f.name,
        parts: [{ t: "lbl", v: f.name }].concat(args) });
      (f.params || []).forEach((p, i) => {
        def({ id: "fna_" + f.id + "_" + i, cat: "함수", shape: "num", c: C3.func,
          parts: [{ t: "lbl", v: p }] });
      });
    });
  }

  // ── 모델 도우미 ───────────────────────────────────────────
  function make(defId) {
    const d = D[defId];
    if (!d) return null;
    const inputs = {};
    (d.parts || []).forEach((p) => {
      if (p.t === "num" || p.t === "txt" || p.t === "sel") inputs[p.k] = p.def;
      else if (p.t === "slot") inputs[p.k] = p.def === undefined ? null : { lit: p.def };
    });
    const b = { id: uid(), def: defId, inputs: inputs, next: null };
    if (d.shape === "c" || d.shape === "c2") b.body = [];
    if (d.shape === "c2") b.body2 = [];
    return b;
  }

  const isValue = (b) => b && (D[b.def].shape === "bool" || D[b.def].shape === "num");

  // 트리에서 블록 찾기 / 떼기
  function findParent(list, id, path) {
    for (let i = 0; i < list.length; i++) {
      let b = list[i], prev = null;
      while (b) {
        if (b.id === id) return { list: list, i: i, prev: prev, block: b };
        for (const key of ["body", "body2"]) {
          if (b[key] && b[key].length) {
            const r = findParent(b[key], id);
            if (r) return r;
          }
        }
        // 슬롯 안의 값 블록
        for (const k in b.inputs) {
          const v = b.inputs[k];
          if (v && v.id === id) return { slotOwner: b, slotKey: k, block: v };
          if (v && v.id) {
            const r = findParentInValue(v, id);
            if (r) return r;
          }
        }
        prev = b; b = b.next;
      }
    }
    return null;
  }

  function findParentInValue(v, id) {
    for (const k in v.inputs) {
      const inner = v.inputs[k];
      if (inner && inner.id === id) return { slotOwner: v, slotKey: k, block: inner };
      if (inner && inner.id) {
        const r = findParentInValue(inner, id);
        if (r) return r;
      }
    }
    return null;
  }

  // 블록(및 그 아래 체인)을 트리에서 떼어낸다
  function detach(stacks, id) {
    const r = findParent(stacks.map((s) => s.root), id);
    if (!r) return null;
    if (r.slotOwner) {
      r.slotOwner.inputs[r.slotKey] = null;
      return r.block;
    }
    const b = r.block;
    if (r.prev) r.prev.next = null;
    else {
      // 스택의 첫 블록 → 스택 자체를 목록에서 제거
      const si = stacks.findIndex((s) => s.root === b);
      if (si >= 0) stacks.splice(si, 1);
      else r.list.splice(r.i, 1);
    }
    return b;
  }

  // ── 레이아웃: 스택을 화면에 그릴 줄 목록으로 편다 ─────────
  function flatten(stacks) {
    const rows = [];
    stacks.forEach((st) => {
      let y = st.y;
      const walk = (b, depth) => {
        while (b) {
          const d = D[b.def];
          const row = { block: b, def: d, depth: depth, x: st.x + depth * INDENT, y: y, stack: st };
          rows.push(row);
          y += ROW_H;
          if (d.shape === "c" || d.shape === "c2") {
            const bodyStart = y;
            if (b.body && b.body.length) { walk(b.body[0], depth + 1); }
            else { rows.push({ empty: true, x: st.x + (depth + 1) * INDENT, y: y, c: d.c }); y += 28; }
            if (d.shape === "c2") {
              rows.push({ elseRow: true, label: d.elseLabel, x: st.x + depth * INDENT, y: y, c: d.c }); y += ROW_H;
              if (b.body2 && b.body2.length) { walk(b.body2[0], depth + 1); }
              else { rows.push({ empty: true, x: st.x + (depth + 1) * INDENT, y: y, c: d.c }); y += 28; }
            }
            const footY = y;
            rows.push({ footRow: true, x: st.x + depth * INDENT, y: footY, c: d.c }); y += 20;
            // 감싸는 블록의 왼쪽 기둥 — 머리·안쪽·꼬리를 하나로 이어 보이게 한다
            rows.push({ spineRow: true, x: st.x + depth * INDENT, y: bodyStart, h: footY - bodyStart, c: d.c });
            // 감싸는 블록 다운에 이어 붙이는 자리는 꼬리 밑이다
            row.endY = y;
          }
          b = b.next;
        }
      };
      walk(st.root, 0);
      st._h = y - st.y;
    });
    return rows;
  }

  // 붙일 수 있는 위치 목록
  function targets(stacks, rows, dragged, slotPos) {
    const out = [];
    const draggedIds = new Set();
    (function collect(b) { while (b) { draggedIds.add(b.id); if (b.body) b.body.forEach(collect); if (b.body2) b.body2.forEach(collect); b = b.next; } })(dragged);
    if (isValue(dragged)) {
      // 값 블록 → 빈 슬롯
      rows.forEach((r) => {
        if (!r.block) return;
        (r.def.parts || []).forEach((p, pi) => {
          if (p.t !== "slot") return;
          const cur = r.block.inputs[p.k];
          if (cur && cur.id) return;
          const accept = p.accept;
          const shape = D[dragged.def].shape;
          if (accept === "bool" && shape !== "bool") return;
          const real = slotPos && slotPos(r.block.id, p.k);
          out.push({
            kind: "slot", owner: r.block, key: p.k,
            x: real ? real.x : r.x + 40 + pi * 58,
            y: real ? real.y : r.y + ROW_H / 2,
            w: real ? real.w : 44, h: real ? real.h : ROW_H,
          });
        });
      });
      return out;
    }
    rows.forEach((r) => {
      if (!r.block || draggedIds.has(r.block.id)) return;
      const d = r.def;
      // 블록 아래에 잇기 (감싸는 블록은 꼬리 밑)
      out.push({ kind: "after", block: r.block, x: r.x, y: r.endY === undefined ? r.y + ROW_H : r.endY });
      // C블록 안쪽 첫 자리
      if ((d.shape === "c" || d.shape === "c2")) {
        out.push({ kind: "body", block: r.block, key: "body", x: r.x + INDENT, y: r.y + ROW_H });
        if (d.shape === "c2") out.push({ kind: "body2", block: r.block, key: "body2", x: r.x + INDENT, y: r.y + ROW_H });
      }
      // 모자 블록 위에는 못 붙임 → 첫 블록 위 자리는 hat 이 아닐 때만
      if (r.depth === 0 && r.block === r.stack.root && d.shape !== "hat" && D[dragged.def].shape !== "hat") {
        out.push({ kind: "before", stack: r.stack, x: r.x, y: r.y - 6 });
      }
    });
    return out;
  }

  function nearest(list, x, y) {
    let best = null, bd = SNAP;
    list.forEach((t) => {
      if (t.kind === "slot" && t.w) {
        // 슬롯 사각형을 넉넉히 키운 영역 안이면 거리 0에 가깝게 본다
        const pad = 22;
        const inside = x > t.x - t.w / 2 - pad && x < t.x + t.w / 2 + pad &&
                       y > t.y - t.h / 2 - pad && y < t.y + t.h / 2 + pad;
        if (inside) {
          const d = Math.hypot(t.x - x, t.y - y) * 0.35;
          if (d < bd) { bd = d; best = t; }
          return;
        }
      }
      const d = Math.hypot(t.x - x, t.y - y);
      if (d < bd) { bd = d; best = t; }
    });
    return best;
  }

  function tail(b) { while (b.next) b = b.next; return b; }

  function attach(stacks, dragged, target) {
    if (!target) return false;
    if (target.kind === "slot") { target.owner.inputs[target.key] = dragged; return true; }
    if (target.kind === "after") {
      const rest = target.block.next;
      target.block.next = dragged;
      if (rest) tail(dragged).next = rest;
      return true;
    }
    if (target.kind === "body" || target.kind === "body2") {
      const key = target.key;
      const cur = target.block[key] && target.block[key][0];
      target.block[key] = [dragged];
      if (cur) tail(dragged).next = cur;
      return true;
    }
    if (target.kind === "before") {
      tail(dragged).next = target.stack.root;
      target.stack.root = dragged;
      return true;
    }
    return false;
  }

  // ── 실행기 ────────────────────────────────────────────────
  function makeRuntime(ctx) {
    let stop = false;
    let t0 = Date.now();
    const vars = ctx.vars || {};
    const keys = ctx.keys;
    const frames = [];   // 함수 호출마다 매개변수 값을 쏓아 둔다

    const val = async (v, self) => {
      if (v === null || v === undefined) return 0;
      if (!v.id) return v.lit !== undefined ? v.lit : v;
      const d = D[v.def], I = v.inputs;
      const A = async () => Number(await val(I.a, self)) || 0;
      const B = async () => Number(await val(I.b, self)) || 0;
      if (/^fna_/.test(v.def)) {
        const m = v.def.match(/^fna_(.+)_(\d+)$/);
        const fr = frames[frames.length - 1];
        return fr && fr.id === m[1] ? fr.args[Number(m[2])] : 0;
      }
      switch (v.def) {
        case "add": return await A() + await B();
        case "sub": return await A() - await B();
        case "mul": return await A() * await B();
        case "div": { const b = await B(); return b === 0 ? 0 : await A() / b; }
        case "mod": { const b = await B(); return b === 0 ? 0 : await A() % b; }
        case "random": { const a = await A(), b = await B(); return Math.floor(Math.random() * (b - a + 1)) + a; }
        case "floor": return Math.floor(await A());
        case "my_x": return self.x;
        case "my_y": return self.y;
        case "timer": return Math.round((Date.now() - t0) / 100) / 10;
        case "get_list_dummy": return 0;
        case "get_var": return Number(vars[I.name]) || 0;
        case "db_get": return Number(ctx.dbGet(I.tbl, I.col)) || 0;
        case "gt": return await A() > await B();
        case "lt": return await A() < await B();
        case "eq": return await A() === await B();
        case "and": return !!(await val(I.a, self)) && !!(await val(I.b, self));
        case "or": return !!(await val(I.a, self)) || !!(await val(I.b, self));
        case "not": return !(await val(I.a, self));
        case "key_down": return keys.has(I.key);
        case "touching": return ctx.touching(self, I.name);
        case "abs": return Math.abs(await A());
        case "round": return Math.round(await A());
        case "min": return Math.min(await A(), await B());
        case "max": return Math.max(await A(), await B());
        case "dist_to": return ctx.distTo(self, I.name);
        case "obj_x": { const o = ctx.objByName(I.name); return o ? o.x : 0; }
        case "obj_y": { const o = ctx.objByName(I.name); return o ? o.y : 0; }
        case "list_get": { const L = ctx.list(I.name); const i = Number(await val(I.i, self)) || 1; return L[i - 1] === undefined ? 0 : L[i - 1]; }
        case "list_len": return ctx.list(I.name).length;
        case "list_max": { const L = ctx.list(I.name).map(Number); return L.length ? Math.max.apply(null, L) : 0; }
        case "rt_get": return await ctx.rtGet(I.key);
        case "db_top": return await ctx.dbTop(I.tbl, I.col);
        case "db_rows": return await ctx.dbRows(I.tbl);
        case "player_count": return ctx.playerCount();
        case "mp_others": return Math.max(0, ctx.playerCount() - 1);
        case "my_name": return ctx.myName();
        case "now": return ctx.now(I.unit);
        case "translate": return I.msg;
        case "in_zone": return ctx.inZone(self, I.zone);
        case "db_has_table": return ctx.hasTable(I.tbl);
        case "true_v": return true;
        case "false_v": return false;
        case "gte": return await A() >= await B();
        case "lte": return await A() <= await B();
        case "neq": return await A() !== await B();
        case "mouse_down": return ctx.mouseDown();
        case "touch_edge": return Math.abs(self.x) > 215 || Math.abs(self.y) > 155;
        case "pow": return Math.pow(await A(), await B());
        case "quot": { const b = await B(); return b === 0 ? 0 : Math.floor(await A() / b); }
        case "math_fn": {
          const a = await A();
          const r = { "제곱근": Math.sqrt(Math.abs(a)), sin: Math.sin(a * Math.PI / 180),
            cos: Math.cos(a * Math.PI / 180), tan: Math.tan(a * Math.PI / 180),
            log: a > 0 ? Math.log10(a) : 0 }[I.f];
          return Math.round((r || 0) * 1000) / 1000;
        }
        case "mouse_x": return ctx.mouse().x;
        case "mouse_y": return ctx.mouse().y;
        case "join": return String(I.a) + String(await val(I.b, self));
        case "str_len": return String(I.s).length;
        case "char_at": { const i = Number(await val(I.i, self)) || 1; return String(I.s).charAt(i - 1); }
        case "answer": return ctx.answer();
        case "list_has": { const v2 = await val(I.v, self); return ctx.list(I.name).some((x) => String(x) === String(v2)); }
        case "list_index": { const v2 = await val(I.v, self); return ctx.list(I.name).findIndex((x) => String(x) === String(v2)) + 1; }
        default: return 0;
      }
    };

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    async function runChain(b, self) {
      let guard = 0;
      while (b && !stop) {
        if (++guard > 8000) break;
        const d = D[b.def], I = b.inputs;
        const num = async (k) => Number(await val(I[k], self)) || 0;
        switch (b.def) {
          case "move_steps": self.x += await num("n"); ctx.onFrame(); break;
          case "move_xy": self.x = await num("x"); self.y = await num("y"); ctx.onFrame(); break;
          case "change_x": self.x += await num("n"); ctx.onFrame(); break;
          case "change_y": self.y += await num("n"); ctx.onFrame(); break;
          case "turn": self.rot = (self.rot || 0) + await num("n"); ctx.onFrame(); break;
          case "say": self.say = I.msg; ctx.onFrame(); break;
          case "say_wait": self.say = I.msg; ctx.onFrame(); await sleep(await num("sec") * 1000); self.say = null; ctx.onFrame(); break;
          case "set_size": self.scale = (await num("n")) / 100; ctx.onFrame(); break;
          case "hide": self.on = false; ctx.onFrame(); break;
          case "show": self.on = true; ctx.onFrame(); break;
          case "to_front": ctx.toFront(self); break;
          case "wait": await sleep(Math.max(0, await num("sec")) * 1000); break;
          case "set_var": vars[I.name] = await num("v"); ctx.onVars(vars); break;
          case "change_var": vars[I.name] = (Number(vars[I.name]) || 0) + await num("v"); ctx.onVars(vars); break;
          case "db_set": await ctx.dbSet(I.tbl, I.col, await num("v")); break;
          case "rt_set": await ctx.rtSet(I.key, await num("v")); break;
          case "broadcast": ctx.signal(I.sig); break;
          case "goto_scene": ctx.gotoScene(I.scene); return;
          case "clone": ctx.clone(self); break;
          case "stop_this": return;
          case "move_dir": {
            const n = await num("n");
            if (I.dir === "오른쪽") self.x += n; else if (I.dir === "왼쪽") self.x -= n;
            else if (I.dir === "위쪽") self.y += n; else self.y -= n;
            ctx.onFrame(); break;
          }
          case "glide_xy": {
            const sec = Math.max(0.05, await num("sec")), tx = await num("x"), ty = await num("y");
            const sx = self.x, sy = self.y, steps = Math.max(1, Math.round(sec * 30));
            for (let i = 1; i <= steps && !stop; i++) {
              self.x = sx + (tx - sx) * (i / steps);
              self.y = sy + (ty - sy) * (i / steps);
              ctx.onFrame(); await sleep(sec * 1000 / steps);
            }
            break;
          }
          case "set_x": self.x = await num("n"); ctx.onFrame(); break;
          case "set_y": self.y = await num("n"); ctx.onFrame(); break;
          case "bounce_edge":
            if (self.x > 220 || self.x < -220) self.x = Math.max(-220, Math.min(220, self.x));
            if (self.y > 160 || self.y < -160) self.y = Math.max(-160, Math.min(160, self.y));
            ctx.onFrame(); break;
          case "point_to": { const o = ctx.objByName(I.name); if (o) self.rot = Math.atan2(o.y - self.y, o.x - self.x) * 180 / Math.PI; ctx.onFrame(); break; }
          case "change_size": self.scale = (self.scale || 1) + (await num("n")) / 100; ctx.onFrame(); break;
          case "set_alpha": self.alpha = 1 - (await num("n")) / 100; ctx.onFrame(); break;
          case "to_back": ctx.toBack(self); break;
          case "clear_say": self.say = null; ctx.onFrame(); break;
          case "text_set": self.text = String(I.msg); ctx.onFrame(); break;
          case "text_add": self.text = String(self.text === undefined ? "" : self.text) + String(await val(I.v, self)); ctx.onFrame(); break;
          case "text_size": self.fontSize = Math.max(8, await num("n")); ctx.onFrame(); break;
          case "text_color": self.color = { "검정": "#16181D", "빨강": "#C0392B", "초록": "#2F6F5E", "파랑": "#4A5FD1", "노랑": "#F2B23E", "흰색": "#FFFFFF" }[I.c] || "#16181D"; ctx.onFrame(); break;
          case "play_sound": ctx.sound(I.s, false); break;
          case "play_wait": await ctx.sound(I.s, true); break;
          case "set_vol": ctx.volume(await num("n")); break;
          case "stop_sound": ctx.sound(null); break;
          case "pen_down": self.pen = true; break;
          case "pen_up": self.pen = false; break;
          case "pen_color": self.penColor = I.c; break;
          case "pen_size": self.penSize = await num("n"); break;
          case "pen_clear": ctx.penClear(); break;
          case "ui_text": ctx.uiText(I.msg); break;
          case "cam_follow": ctx.camFollow(I.name); break;
          case "cam_zoom": ctx.camZoom(await num("n")); break;
          case "shake": await ctx.shake(await num("sec")); break;
          case "reset_timer": ctx.resetTimer(); break;
          case "list_add": ctx.listAdd(I.name, await num("v")); break;
          case "list_del": ctx.listDel(I.name, await num("i")); break;
          case "list_clear": ctx.listClear(I.name); break;
          case "db_add_row": await ctx.dbAddRow(I.tbl, await num("v")); break;
          case "db_create": await ctx.tableCreate(I.tbl, I.scope === "플레이어별"); break;
          case "db_add_col": await ctx.colAdd(I.tbl, I.col, I.type); break;
          case "db_drop_col": ctx.colDrop(I.tbl, I.col); break;
          case "db_drop": ctx.tableDrop(I.tbl); break;
          case "rt_change": await ctx.rtSet(I.key, (Number(await ctx.rtGet(I.key)) || 0) + await num("v")); break;
          case "move_to_zone": ctx.moveZone(self, I.zone); break;
          case "chat_send": ctx.chat(I.msg); break;
          case "mp_join": await ctx.mpStart(I.room, self); break;
          case "mp_leave": ctx.mpStop(); break;
          case "mp_nick": ctx.mpNick(I.name); break;
          case "del_clone": ctx.delClone(self); return;
          case "set_tile": ctx.setTile(await num("x"), await num("y"), I.t); break;
          case "speak": ctx.speak(I.msg); break;
          case "set_rot": self.rot = await num("n"); ctx.onFrame(); break;
          case "move_random": self.x = Math.round(Math.random() * 420 - 210); self.y = Math.round(Math.random() * 300 - 150); ctx.onFrame(); break;
          case "move_to_obj": { const o = ctx.objByName(I.name); if (o) { self.x = o.x; self.y = o.y; } ctx.onFrame(); break; }
          case "next_shape": ctx.nextShape(self); break;
          case "set_shape": self.art = ctx.artId(I.art) || self.art; ctx.onFrame(); break;
          case "flip_h": self.flipH = !self.flipH; ctx.onFrame(); break;
          case "flip_v": self.flipV = !self.flipV; ctx.onFrame(); break;
          case "set_hue": self.hue = await num("n"); ctx.onFrame(); break;
          case "wait_until": {
            for (let i = 0; i < 1200 && !stop; i++) {
              if (await val(I.cond, self)) break;
              await sleep(33);
            }
            break;
          }
          case "stop_all": ctx.stopAll(); return;
          case "ask": self.say = null; await ctx.ask(I.msg); break;
          case "show_var": ctx.showVar(I.name, true); break;
          case "hide_var": ctx.showVar(I.name, false); break;
          case "list_insert": ctx.listInsert(I.name, await num("i"), await val(I.v, self)); break;
          case "list_replace": ctx.listReplace(I.name, await num("i"), await val(I.v, self)); break;
          case "ui_clear": ctx.uiText(""); break;
          case "cam_reset": ctx.camReset(); break;
          case "repeat_while": {
            for (let i = 0; i < 3000 && !stop; i++) {
              if (!(await val(I.cond, self))) break;
              await runChain(b.body && b.body[0], self); await sleep(33);
            }
            break;
          }
          case "repeat": {
            const n = await num("n");
            for (let i = 0; i < n && !stop; i++) { await runChain(b.body && b.body[0], self); await sleep(16); }
            break;
          }
          case "forever": {
            while (!stop) { await runChain(b.body && b.body[0], self); await sleep(33); }
            break;
          }
          case "repeat_until": {
            while (!stop) {
              if (await val(I.cond, self)) break;
              await runChain(b.body && b.body[0], self); await sleep(33);
            }
            break;
          }
          case "if": if (await val(I.cond, self)) await runChain(b.body && b.body[0], self); break;
          case "if_else":
            if (await val(I.cond, self)) await runChain(b.body && b.body[0], self);
            else await runChain(b.body2 && b.body2[0], self);
            break;
          default: break;
        }
        if (/^fn_/.test(b.def)) {
          const fid = b.def.slice(3);
          const body = ctx.funcBody(fid);
          if (body && frames.length < 24) {
            const args = [];
            const n2 = (D[b.def].parts || []).filter((p) => p.t === "slot").length;
            for (let i = 0; i < n2; i++) args.push(await val(b.inputs["p" + i], self));
            frames.push({ id: fid, args: args });
            await runChain(body, self);
            frames.pop();
          }
        }
        b = b.next;
      }
    }

    return {
      vars: vars,
      resetTimer: () => { t0 = Date.now(); },
      stop: () => { stop = true; },
      // 모자 블록에서 시작하는 스크립트를 모두 실행
      start: (stacksByObj, kind, extra) => {
        const jobs = [];
        Object.keys(stacksByObj).forEach((objId) => {
          const self = ctx.objById(objId);
          if (!self) return;
          (stacksByObj[objId] || []).forEach((st) => {
            const root = st.root, d = D[root.def];
            if (d.shape !== "hat") return;
            if (kind === "start" && root.def !== "when_start") return;
            if (kind === "key" && !(root.def === "when_key" && root.inputs.key === extra)) return;
            if (kind === "click" && !(root.def === "when_click" && objId === extra)) return;
            if (kind === "signal" && !(root.def === "when_signal" && root.inputs.sig === extra)) return;
            if (kind === "scene" && root.def !== "when_scene_start") return;
            if (kind === "mouse" && root.def !== "when_mouse") return;
            if (kind === "clone" && !(root.def === "when_clone_start" && objId === extra)) return;
            jobs.push(runChain(root.next, self));
          });
        });
        return Promise.all(jobs);
      },
    };
  }

  window.DotBlocks = {
    DEFS: D, ROW_H: ROW_H, INDENT: INDENT,
    make: make, isValue: isValue, flatten: flatten, targets: targets,
    nearest: nearest, detach: detach, attach: attach, makeRuntime: makeRuntime,
    byCat: (cat) => Object.keys(D).filter((k) => D[k].cat === cat).map((k) => D[k]),
    syncFuncs: syncFuncs,
    cats: ["이벤트", "움직임", "생김새", "소리", "붓", "흐름", "판단·논리", "계산", "변수·리스트", "함수", "실시간 DB", "멀티플레이", "오브젝트·맵", "카메라·UI", "확장"],
    count: () => Object.keys(D).length,
  };
})();
