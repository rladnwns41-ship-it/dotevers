// Dotverse 데모 시드 데이터. Supabase 연결이 없을 때 UI가 그대로 동작하도록 한다.
(function () {
  // 16색 공용 도트 팔레트
  const P = {
    ".": null,
    K: "#1b1d23",
    W: "#f3efe6",
    A: "#9aa3b2",
    C: "#c9d3de",
    G: "#4f9e7f",
    D: "#2f6f5e",
    B: "#7a4a2b",
    N: "#4a3220",
    Y: "#f2b23e",
    O: "#e0653a",
    R: "#b8496f",
    I: "#4a5fd1",
    S: "#6fd3c7",
    P: "#8d6bd8",
    E: "#c8b48a",
  };

  const art = {
    tree: [
      "................", ".....KKKK.......", "....KDDDDK......", "...KDGGGDKK.....",
      "..KDGGGGGGGK....", "..KDGGGGGGGGK...", ".KDGGGGGGGGGGK..", ".KDGGGGGGGGGK...",
      "..KDGGGGGGGGK...", "...KDGGGGGGK....", "....KKBBBKK.....", "......BBB.......",
      "......BNB.......", ".....BBNB.......", "....KNNNNNK.....", "....KKKKKKK.....",
    ],
    chest: [
      "................", "................", "..KKKKKKKKKKK...", "..KYYYYYYYYYK...",
      "..KYNNNNNNNYK...", "..KYNNNKNNNYK...", "..KKKKKKKKKKK...", "..KYNNNKNNNYK...",
      "..KYNNNKNNNYK...", "..KYNNNYNNNYK...", "..KYNNNKNNNYK...", "..KYNNNNNNNYK...",
      "..KKKKKKKKKKK...", "...KAAAAAAAK....", "................", "................",
    ],
    slime: [
      "................", "................", ".....KKKKK......", "....KSSSSSK.....",
      "...KSSSSSSSK....", "..KSSSKSSKSSK...", "..KSSSKSSKSSK...", "..KSSSSSSSSSK...",
      "..KSSSSSSSSSK...", ".KSSSSSSSSSSSK..", ".KSSSSSSSSSSSK..", ".KSSSSSSSSSSSK..",
      ".KKSSSSSSSSSKK..", "..KKKKKKKKKKK...", "................", "................",
    ],
    lamp: [
      "................", "......KKK.......", ".....KYYYK......", "....KYWWWYK.....",
      "....KYWWWYK.....", "....KYWWWYK.....", ".....KYYYK......", "......KAK.......",
      "......KAK.......", "......KAK.......", "......KAK.......", "......KAK.......",
      ".....KAAAK......", "....KAAAAAK.....", "....KKKKKKK.....", "................",
    ],
    sign: [
      "................", "...KKKKKKKKK....", "...KEEEEEEEK....", "...KEKKEKKEK....",
      "...KEEEEEEEK....", "...KEKKKKKEK....", "...KEEEEEEEK....", "...KKKKKKKKK....",
      "......KBK.......", "......KBK.......", "......KBK.......", "......KNK.......",
      ".....KNNNK......", "....KGGGGGK.....", "...KGGGGGGGK....", "................",
    ],
    pot: [
      "................", "................", "........R.......", ".......RRR......",
      "......RRPRR.....", ".....RRPPPRR....", "......RRPRR.....", ".......RGR......",
      "........G.......", "......KKGKK.....", ".....KOOOOOK....", ".....KOOOOOK....",
      "......KOOOK.....", "......KOOOK.....", ".......KKK......", "................",
    ],
    portal: [
      "................", "......KKKK......", ".....KIIIIK.....", "....KIIPPIIK....",
      "...KIIPWWPIIK...", "...KIPWWWWPIK...", "..KIIPWWWWPIIK..", "..KIIPWWWWPIIK..",
      "..KIIPWWWWPIIK..", "...KIPWWWWPIK...", "...KIIPWWPIIK...", "....KIIPPIIK....",
      ".....KIIIIK.....", "......KKKK......", "................", "................",
    ],
    coin: [
      "................", "................", "................", "......KKKK......",
      ".....KYYYYK.....", "....KYYWWYYK....", "....KYWYYWYK....", "....KYWYYWYK....",
      "....KYWYYWYK....", "....KYYWWYYK....", ".....KYYYYK.....", "......KKKK......",
      "................", "................", "................", "................",
    ],
    key: [
      "................", "................", "................", ".....KKKK.......",
      "....KYYYYK......", "...KYYKKYYK.....", "...KYKWWKYK.....", "...KYYKKYYK.....",
      "....KYYYYK......", ".....KYYK.......", "......KYK.......", "......KYKK......",
      "......KYYK......", "......KYKK......", "......KYYK......", ".......KK.......",
    ],
    torch: [
      "................", ".......KK.......", "......KOOK......", ".....KOYYOK.....",
      ".....KOYWYOK....", ".....KOYYYOK....", "......KOYOK.....", ".......KOK......",
      ".......KBK......", ".......KBK......", ".......KBK......", ".......KNK......",
      ".......KNK......", ".......KNK......", "......KKKK......", "................",
    ],
  };

  const assets = [
    { id: "a1", art: "tree", name: "숲 나무 (4방향)", kind: "object", author: "도트하는너구리", handle: "raccoon_dot", uses: 12840, likes: 3211, dislikes: 24, license: "CC BY", frames: 1, size: "16×16", tags: ["자연", "타일셋", "숲"] },
    { id: "a2", art: "chest", name: "황금 보물상자", kind: "animation", author: "픽셀공방", handle: "pixel_atelier", uses: 9420, likes: 2870, dislikes: 31, license: "CC0", frames: 6, size: "16×16", tags: ["아이템", "애니메이션"] },
    { id: "a3", art: "slime", name: "말랑 슬라임", kind: "character", author: "밤샘개발자", handle: "nightowl", uses: 7715, likes: 2410, dislikes: 12, license: "CC BY", frames: 8, size: "16×16", tags: ["NPC", "걷기"] },
    { id: "a4", art: "lamp", name: "가로등 (야간발광)", kind: "object", author: "도트하는너구리", handle: "raccoon_dot", uses: 6103, likes: 1880, dislikes: 9, license: "CC BY", frames: 2, size: "16×16", tags: ["도시", "조명"] },
    { id: "a5", art: "sign", name: "안내 표지판", kind: "object", author: "느린손", handle: "slowhand", uses: 5540, likes: 1502, dislikes: 7, license: "CC0", frames: 1, size: "16×16", tags: ["UI", "상호작용"] },
    { id: "a6", art: "pot", name: "창가 화분", kind: "object", author: "온실", handle: "greenhouse", uses: 4980, likes: 1344, dislikes: 5, license: "CC BY", frames: 3, size: "16×16", tags: ["실내", "장식"] },
    { id: "a7", art: "portal", name: "차원 포탈", kind: "effect", author: "밤샘개발자", handle: "nightowl", uses: 4410, likes: 1690, dislikes: 18, license: "리메이크 전용", frames: 12, size: "16×16", tags: ["이동", "이펙트"] },
    { id: "a8", art: "coin", name: "회전 코인", kind: "animation", author: "픽셀공방", handle: "pixel_atelier", uses: 3980, likes: 1210, dislikes: 4, license: "CC0", frames: 8, size: "16×16", tags: ["아이템", "점수"] },
  ];

  const worlds = [
    { id: "w1", art: "portal", title: "심야 도서관 방탈출", author: "밤샘개발자", handle: "nightowl", cat: "social", catName: "소셜/방탈출", summary: "불이 꺼진 도서관에서 네 명이 흩어진 열쇠를 맞춘다.", likes: 4821, dislikes: 63, comments: 512, plays: 128400, online: 312, ago: "12분 전", tags: ["협동", "추리", "4인"] },
    { id: "w2", art: "slime", title: "슬라임 목장 24시", author: "온실", handle: "greenhouse", cat: "simulation", catName: "시뮬레이션", summary: "실시간 데이터베이스로 목장이 접속 안 해도 자란다.", likes: 3902, dislikes: 41, comments: 388, plays: 96200, online: 204, ago: "34분 전", tags: ["방치", "육성"] },
    { id: "w3", art: "coin", title: "픽셀 코인 러시", author: "픽셀공방", handle: "pixel_atelier", cat: "rhythm", catName: "리듬/액션", summary: "8초 안에 코인을 다 먹어야 하는 초단편 액션 30스테이지.", likes: 3140, dislikes: 88, comments: 276, plays: 88700, online: 178, ago: "1시간 전", tags: ["속도", "랭킹"] },
    { id: "w4", art: "tree", title: "숲속 우체국", author: "도트하는너구리", handle: "raccoon_dot", cat: "adventure", catName: "어드벤처", summary: "편지를 배달하며 마을 사람들의 사연을 모은다.", likes: 2985, dislikes: 22, comments: 431, plays: 74100, online: 141, ago: "2시간 전", tags: ["스토리", "1인"] },
    { id: "w5", art: "chest", title: "지하 3층 상점가", author: "느린손", handle: "slowhand", cat: "social", catName: "소셜/방탈출", summary: "플레이어끼리 아이템을 실시간으로 거래하는 상점 월드.", likes: 2610, dislikes: 55, comments: 302, plays: 66900, online: 233, ago: "3시간 전", tags: ["거래", "경제"] },
    { id: "w6", art: "sign", title: "한국사 연표 마라톤", author: "교실뒷자리", handle: "backseat", cat: "education", catName: "학습", summary: "연표를 순서대로 밟아야 다음 구역 벽이 열린다.", likes: 2288, dislikes: 19, comments: 198, plays: 59800, online: 96, ago: "5시간 전", tags: ["수업", "퀴즈"] },
    { id: "w7", art: "lamp", title: "야간 산책 라이트오프", author: "밤샘개발자", handle: "nightowl", cat: "puzzle", catName: "퍼즐", summary: "가로등만 밝은 밤길, 시야 밖은 보이지 않는다.", likes: 1974, dislikes: 30, comments: 154, plays: 48300, online: 74, ago: "8시간 전", tags: ["시야", "탐험"], remakeOf: "야간 산책 (원본)" },
    { id: "w8", art: "pot", title: "작은 온실 갤러리", author: "온실", handle: "greenhouse", cat: "showcase", catName: "전시/갤러리", summary: "직접 찍은 도트 작품을 걸어두는 전시 공간.", likes: 1730, dislikes: 8, comments: 121, plays: 39500, online: 52, ago: "11시간 전", tags: ["전시", "도트"] },
  ];

  const creators = [
    { name: "밤샘개발자", handle: "nightowl", art: "slime", memo: "새벽 3시에 만든 건 다 방탈출이 된다.", followers: 24100, worlds: 38, growth: "+18%" },
    { name: "도트하는너구리", handle: "raccoon_dot", art: "tree", memo: "타일셋 공유 12,000회. 마음껏 쓰세요.", followers: 19800, worlds: 21, growth: "+12%" },
    { name: "픽셀공방", handle: "pixel_atelier", art: "coin", memo: "8프레임 안에 다 담는 게 취미입니다.", followers: 16250, worlds: 44, growth: "+31%" },
    { name: "온실", handle: "greenhouse", art: "pot", memo: "느리게 자라는 월드를 좋아합니다.", followers: 12400, worlds: 17, growth: "+9%" },
    { name: "느린손", handle: "slowhand", art: "sign", memo: "상호작용 블록만 300개 써봤습니다.", followers: 9870, worlds: 12, growth: "+22%" },
    { name: "교실뒷자리", handle: "backseat", art: "chest", memo: "수업용 월드는 무료 배포합니다.", followers: 8110, worlds: 26, growth: "+15%" },
  ];

  const comments = [
    { world: "심야 도서관 방탈출", art: "portal", author: "느린손", handle: "slowhand", body: "3층 열쇠 힌트가 책 제목 순서라는 걸 알고 소름 돋았어요. 4인 필수.", likes: 412, dislikes: 6, replies: 18, ago: "8분 전" },
    { world: "슬라임 목장 24시", art: "slime", author: "교실뒷자리", handle: "backseat", body: "접속 안 한 사이에도 자라 있어서 매일 켜게 됩니다. 실시간 DB 어떻게 쓰신 건가요?", likes: 388, dislikes: 3, replies: 24, ago: "22분 전" },
    { world: "픽셀 코인 러시", art: "coin", author: "온실", handle: "greenhouse", body: "22스테이지에서 벽 판정이 한 칸 넓은 것 같아요. 경계 다시 봐주실 수 있나요?", likes: 271, dislikes: 12, replies: 9, ago: "41분 전" },
    { world: "숲속 우체국", art: "tree", author: "픽셀공방", handle: "pixel_atelier", body: "편지 봉투 도트 리메이크해서 써도 될까요? 원본 링크는 꼭 걸어둘게요.", likes: 244, dislikes: 2, replies: 31, ago: "1시간 전" },
  ];

  const blockCats = [
    { name: "움직임", icon: "lucide:move", count: 62, color: "#4a5fd1" },
    { name: "생김새", icon: "lucide:eye", count: 54, color: "#8d6bd8" },
    { name: "소리", icon: "lucide:volume-2", count: 28, color: "#b8496f" },
    { name: "이벤트", icon: "lucide:zap", count: 34, color: "#f2b23e" },
    { name: "흐름", icon: "lucide:repeat", count: 26, color: "#e0653a" },
    { name: "판단·논리", icon: "lucide:git-branch", count: 30, color: "#2f6f5e" },
    { name: "계산", icon: "lucide:calculator", count: 38, color: "#4f9e7f" },
    { name: "변수·리스트", icon: "lucide:database", count: 40, color: "#4a5fd1" },
    { name: "실시간 DB", icon: "lucide:server", count: 44, color: "#0f766e" },
    { name: "멀티플레이", icon: "lucide:users", count: 36, color: "#8d6bd8" },
    { name: "채팅·표현", icon: "lucide:message-circle", count: 24, color: "#b8496f" },
    { name: "오브젝트·맵", icon: "lucide:layout-grid", count: 42, color: "#7a4a2b" },
    { name: "카메라·UI", icon: "lucide:camera", count: 30, color: "#e0653a" },
    { name: "확장", icon: "lucide:puzzle", count: 12, color: "#9aa3b2" },
  ];

  const palette = {
    "실시간 DB": [
      { t: "테이블 [ 랭킹 ] 에 컬럼 [ 점수 ] 값 ( 0 ) 넣기", c: "#0f766e" },
      { t: "테이블 [ 랭킹 ] 에서 컬럼 [ 점수 ] 가 가장 큰 행 가져오기", c: "#0f766e" },
      { t: "실시간 변수 [ 남은시간 ] 을 ( 60 ) 으로 정하기", c: "#0f766e" },
      { t: "내 행의 컬럼 [ 코인 ] 을 ( 1 ) 만큼 바꾸기", c: "#0f766e" },
      { t: "테이블 [ 랭킹 ] 이 바뀌었을 때", c: "#f2b23e" },
    ],
    "움직임": [
      { t: "( 4 ) 칸 앞으로 이동하기", c: "#4a5fd1" },
      { t: "x ( 0 ) y ( 0 ) 위치로 이동하기", c: "#4a5fd1" },
      { t: "( 0.4 ) 초 동안 x ( 32 ) y ( 0 ) 만큼 움직이기", c: "#4a5fd1" },
      { t: "벽에 닿으면 멈추기", c: "#4a5fd1" },
      { t: "높이(z) 를 ( 1 ) 로 정하기", c: "#4a5fd1" },
    ],
    "멀티플레이": [
      { t: "플레이어가 들어왔을 때", c: "#f2b23e" },
      { t: "모든 플레이어에게 [ 시작합니다 ] 신호 보내기", c: "#8d6bd8" },
      { t: "나를 제외한 플레이어 수", c: "#8d6bd8" },
      { t: "플레이어를 [ 대기실 ] 구역으로 옮기기", c: "#8d6bd8" },
    ],
    "변수·리스트": [
      { t: "로컬 변수 [ 콤보 ] 를 ( 0 ) 으로 정하기", c: "#4a5fd1" },
      { t: "로컬 리스트 [ 먹은코인 ] 에 ( 코인 ) 추가하기", c: "#4a5fd1" },
      { t: "로컬 변수 [ 콤보 ] 값", c: "#4a5fd1" },
    ],
    "채팅·표현": [
      { t: "말풍선으로 [ 안녕! ] 2 초 동안 말하기", c: "#b8496f" },
      { t: "표정을 [ 놀람 ] 으로 바꾸기", c: "#b8496f" },
      { t: "채팅이 입력되었을 때 (필터 통과 후)", c: "#f2b23e" },
    ],
  };

  Object.assign(palette, {
    "생김새": [
      { t: "모양을 [ 기본 ] 으로 바꾸기", c: "#8D6BD8" },
      { t: "다음 모양으로 바꾸기", c: "#8D6BD8" },
      { t: "크기를 ( 10 ) 만큼 바꾸기", c: "#8D6BD8" },
      { t: "투명도를 ( 50 ) % 로 정하기", c: "#8D6BD8" },
      { t: "모양 숨기기", c: "#8D6BD8" },
      { t: "맨 앞으로 보내기", c: "#8D6BD8" },
    ],
    "소리": [
      { t: "소리 [ 딩 ] 재생하기", c: "#B8496F" },
      { t: "소리 [ 배경음 ] 을 ( 2 ) 초 재생하고 기다리기", c: "#B8496F" },
      { t: "모든 소리 멈추기", c: "#B8496F" },
      { t: "소리 크기를 ( 60 ) % 로 정하기", c: "#B8496F" },
    ],
    "이벤트": [
      { t: "시작 버튼을 눌렀을 때", c: "#F2B23E" },
      { t: "[ 스페이스 ] 키를 눌렀을 때", c: "#F2B23E" },
      { t: "오브젝트를 클릭했을 때", c: "#F2B23E" },
      { t: "[ 신호1 ] 신호를 받았을 때", c: "#F2B23E" },
      { t: "[ 신호1 ] 신호 보내기", c: "#F2B23E" },
    ],
    "흐름": [
      { t: "( 1 ) 초 기다리기", c: "#E0653A" },
      { t: "( 10 ) 번 반복하기", c: "#E0653A" },
      { t: "계속 반복하기", c: "#E0653A" },
      { t: "( 조건 ) 이 될 때까지 기다리기", c: "#E0653A" },
      { t: "반복 중단하기", c: "#E0653A" },
      { t: "이 오브젝트의 다른 코드 멈추기", c: "#E0653A" },
    ],
    "판단·논리": [
      { t: "만약 ( 조건 ) 이라면", c: "#2F6F5E" },
      { t: "만약 ( 조건 ) 이라면 아니면", c: "#2F6F5E" },
      { t: "( [ 슬라임 ] 에 닿았는가? )", c: "#2F6F5E" },
      { t: "( [ 스페이스 ] 키가 눌렸는가? )", c: "#2F6F5E" },
      { t: "( ( 10 ) > ( 5 ) )", c: "#2F6F5E" },
      { t: "( ( 참 ) 그리고 ( 참 ) )", c: "#2F6F5E" },
      { t: "( ( 참 ) 이(가) 아니다 )", c: "#2F6F5E" },
    ],
    "계산": [
      { t: "( ( 10 ) + ( 5 ) )", c: "#4F9E7F" },
      { t: "( ( 10 ) - ( 5 ) )", c: "#4F9E7F" },
      { t: "( ( 10 ) × ( 5 ) )", c: "#4F9E7F" },
      { t: "( ( 10 ) ÷ ( 5 ) )", c: "#4F9E7F" },
      { t: "( ( 10 ) 부터 ( 20 ) 사이의 무작위 수 )", c: "#4F9E7F" },
      { t: "( ( 10 ) 을 ( 3 ) 으로 나눈 나머지 )", c: "#4F9E7F" },
      { t: "( ( 3.7 ) 의 소수점 버림 )", c: "#4F9E7F" },
      { t: "( [ 슬라임 ] 의 x 좌표 )", c: "#4F9E7F" },
      { t: "( 초시계 값 )", c: "#4F9E7F" },
    ],
    "오브젝트·맵": [
      { t: "오브젝트 [ 코인 ] 복제하기", c: "#7A4A2B" },
      { t: "이 복제본 삭제하기", c: "#7A4A2B" },
      { t: "타일 ( 4 , 7 ) 을 [ 벽 ] 으로 바꾸기", c: "#7A4A2B" },
      { t: "[ 경기장 ] 구역 안에 있는가?", c: "#7A4A2B" },
      { t: "장면을 [ 장면 2 ] 로 바꾸기", c: "#7A4A2B" },
    ],
    "카메라·UI": [
      { t: "카메라를 [ 슬라임 ] 따라가게 하기", c: "#E0653A" },
      { t: "카메라 확대를 ( 1.5 ) 배로 정하기", c: "#E0653A" },
      { t: "화면 흔들기 ( 0.3 ) 초", c: "#E0653A" },
      { t: "화면에 [ 점수: 12 ] 글자 보이기", c: "#E0653A" },
      { t: "버튼 [ 다시하기 ] 보이기", c: "#E0653A" },
    ],
    "확장": [
      { t: "현재 [ 시각 ] 가져오기", c: "#9AA3B2" },
      { t: "[ 한국어 ] 를 [ 영어 ] 로 번역하기", c: "#9AA3B2" },
      { t: "읽어주기 [ 안녕하세요 ]", c: "#9AA3B2" },
    ],
  });

  const script = [
    { d: 0, t: "플레이어가 들어왔을 때", c: "#f2b23e", cap: true },
    { d: 1, t: "실시간 변수 [ 접속자수 ] 를 ( 접속자수 + 1 ) 로 정하기", c: "#0f766e" },
    { d: 1, t: "테이블 [ 방문기록 ] 에 컬럼 [ 이름 ] 값 ( 내 이름 ) 넣기", c: "#0f766e" },
    { d: 1, t: "만약 ( 실시간 변수 [ 접속자수 ] > 3 ) 이라면", c: "#2f6f5e" },
    { d: 2, t: "모든 플레이어에게 [ 게임시작 ] 신호 보내기", c: "#8d6bd8" },
    { d: 2, t: "플레이어를 [ 경기장 ] 구역으로 옮기기", c: "#8d6bd8" },
    { d: 1, t: "아니면", c: "#2f6f5e" },
    { d: 2, t: "말풍선으로 [ 4명이 모이면 시작해요 ] 2 초 동안 말하기", c: "#b8496f" },
    { d: 1, t: "계속 반복하기", c: "#e0653a" },
    { d: 2, t: "로컬 변수 [ 콤보 ] 를 ( 콤보 + 1 ) 로 정하기", c: "#4a5fd1" },
    { d: 2, t: "테이블 [ 랭킹 ] 에서 컬럼 [ 점수 ] 를 ( 콤보 ) 로 바꾸기", c: "#0f766e", err: true },
  ];

  const boards = [
    { slug: "tips", name: "팁 & 노하우", icon: "lucide:lightbulb", desc: "블록 조합, 최적화, 도트 찍는 법", posts: 4820, color: "#f2b23e" },
    { slug: "talk", name: "이야기방", icon: "lucide:message-square", desc: "자유롭게 만든 이야기, 근황, 잡담", posts: 12904, color: "#4a5fd1" },
    { slug: "suggestion", name: "건의함", icon: "lucide:inbox", desc: "기능 제안과 버그 신고, 운영팀 답변", posts: 1731, color: "#2f6f5e" },
    { slug: "notice", name: "공지", icon: "lucide:megaphone", desc: "업데이트, 점검, 정책 변경 안내", posts: 214, color: "#b8496f" },
  ];

  const posts = [
    { board: "팁 & 노하우", title: "실시간 변수 100개 쓰면 느려집니다 — 테이블 한 개로 합치는 법", author: "밤샘개발자", handle: "nightowl", likes: 1204, comments: 186, ago: "1시간 전", pinned: true },
    { board: "팁 & 노하우", title: "16×16 도트로 사람처럼 보이게 하는 4가지 규칙", author: "픽셀공방", handle: "pixel_atelier", likes: 980, comments: 142, ago: "3시간 전" },
    { board: "이야기방", title: "제 첫 월드에 낯선 분이 댓글 달아주셨어요", author: "교실뒷자리", handle: "backseat", likes: 742, comments: 231, ago: "5시간 전" },
    { board: "건의함", title: "충돌 경계를 곡선으로도 그을 수 있으면 좋겠습니다", author: "느린손", handle: "slowhand", likes: 611, comments: 74, ago: "7시간 전", answered: true },
    { board: "팁 & 노하우", title: "오류 패널에 빨간 줄 뜰 때 가장 흔한 원인 5가지", author: "온실", handle: "greenhouse", likes: 588, comments: 96, ago: "9시간 전" },
    { board: "이야기방", title: "리메이크 원본 링크 눌러보는 사람 저 말고도 있나요", author: "도트하는너구리", handle: "raccoon_dot", likes: 465, comments: 118, ago: "12시간 전" },
  ];

  const notifs = [
    { kind: "comment", icon: "lucide:message-circle", who: "느린손", body: "«심야 도서관 방탈출» 에 댓글을 남겼습니다: 3층 열쇠 힌트가…", ago: "8분 전", color: "#4a5fd1" },
    { kind: "asset_used", icon: "lucide:box", who: "교실뒷자리", body: "공유 오브젝트 «가로등 (야간발광)» 을 자신의 월드에 사용했습니다", ago: "26분 전", color: "#2f6f5e" },
    { kind: "remake", icon: "lucide:git-fork", who: "픽셀공방", body: "«야간 산책» 을 리메이크했습니다 — 원본 링크가 표시됩니다", ago: "1시간 전", color: "#8d6bd8" },
    { kind: "like", icon: "lucide:heart", who: "온실 외 42명", body: "«숲속 우체국» 을 좋아합니다", ago: "2시간 전", color: "#b8496f" },
    { kind: "follow", icon: "lucide:user-plus", who: "backseat", body: "님이 당신을 팔로우했습니다", ago: "4시간 전", color: "#f2b23e" },
  ];

  const features = [
    { icon: "lucide:blocks", title: "14개 카테고리 블록", body: "움직임·판단·계산부터 실시간 데이터베이스까지. 끌어서 붙이면 그대로 실행됩니다.", color: "#4a5fd1" },
    { icon: "lucide:grid-2x2", title: "도트로 찍는 오브젝트", body: "픽셀 캔버스와 프레임 타임라인으로 오브젝트와 애니메이션을 직접 만듭니다.", color: "#e0653a" },
    { icon: "lucide:share-2", title: "공유하고 가져다 쓰기", body: "찍은 오브젝트를 공유하면 다른 사람이 가져다 씁니다. 원작자 표기는 자동으로 따라갑니다.", color: "#2f6f5e" },
    { icon: "lucide:server", title: "실시간 데이터베이스", body: "테이블과 실시간 변수를 블록으로 다룹니다. 접속을 끊어도 남는 데이터와, 나가면 사라지는 로컬 변수를 구분합니다.", color: "#0f766e" },
    { icon: "lucide:map", title: "경계까지 그리는 맵 편집", body: "배경을 올리거나 직접 그리고, 갈 수 있는 곳과 벽을 칸 단위로 지정합니다.", color: "#8d6bd8" },
    { icon: "lucide:bug", title: "실행하면서 고치기", body: "논리적으로 성립하지 않으면 아래 오류 패널에 뜨고, 해당 블록이 빨갛게 표시되며 원인을 알려줍니다.", color: "#b8496f" },
    { icon: "lucide:git-fork", title: "리메이크와 원본 링크", body: "누구나 리메이크할 수 있고, 리메이크 작품에는 원본으로 바로 가는 링크가 붙습니다.", color: "#f2b23e" },
    { icon: "lucide:shield-check", title: "모든 기능에 걸린 필터", body: "닉네임, 제목, 댓글, 채팅, 오브젝트 이름까지 비속어 필터를 통과합니다. 신고는 24시간 내 검토합니다.", color: "#4f9e7f" },
  ];

  const dashboard = {
    days: [
      { d: "월", v: 1240, p: 2810 }, { d: "화", v: 1610, p: 3402 }, { d: "수", v: 1480, p: 3120 },
      { d: "목", v: 2010, p: 4380 }, { d: "금", v: 2740, p: 6120 }, { d: "토", v: 3620, p: 8140 },
      { d: "일", v: 3180, p: 7260 },
    ],
    kpis: [
      { label: "누적 접속자", value: "128,412", delta: "+8.2%", icon: "lucide:users", color: "#4a5fd1" },
      { label: "현재 접속 중", value: "312", delta: "실시간", icon: "lucide:radio", color: "#2f6f5e" },
      { label: "평균 플레이 시간", value: "14분 20초", delta: "+1분 12초", icon: "lucide:timer", color: "#e0653a" },
      { label: "이번 주 활동", value: "9,480", delta: "댓글·좋아요·리메이크", icon: "lucide:activity", color: "#8d6bd8" },
    ],
  };

  const terms = [
    {
      no: "제1장", title: "총칙과 용어", items: [
        "제1조 (목적) 이 약관은 Dotverse(이하 «서비스»)가 제공하는 2D 픽셀 메타버스 제작·플레이·공유 기능의 이용 조건, 회사와 회원의 권리·의무 및 책임사항을 정합니다.",
        "제2조 (용어의 정의) «월드»는 회원이 블록코딩과 맵 편집으로 만든 저작물을, «오브젝트»는 도트 편집기로 만든 이미지·애니메이션 리소스를, «리메이크»는 원본 표기를 유지한 채 사본을 만들어 수정하는 행위를 말합니다.",
        "제3조 (약관의 게시와 개정) 개정 시 적용일 7일 전(회원에게 불리한 개정은 30일 전)부터 서비스 내 공지와 알림으로 통지합니다. 회원이 적용일까지 거부 의사를 표시하지 않으면 동의한 것으로 봅니다.",
        "제4조 (만 14세 미만 회원) 만 14세 미만은 법정대리인의 동의 절차를 완료한 후에만 계정을 생성할 수 있으며, 채팅 필터는 최고 등급으로 고정됩니다.",
      ],
    },
    {
      no: "제2장", title: "수집하는 정보와 이용 목적", items: [
        "필수 수집: 이메일, 비밀번호(단방향 암호화 저장), 닉네임/핸들. 목적은 계정 식별과 로그인이며 회원 탈퇴 시 즉시 파기합니다.",
        "서비스 이용 중 자동 생성: 접속 IP(해시 처리), 브라우저·기기 정보, 접속 일시, 플레이 세션 시간, 월드별 접속자 수. 목적은 통계·대시보드 제공과 부정 이용 방지이며 12개월 보관 후 파기합니다.",
        "제작 데이터: 블록 스크립트, 맵·경계 데이터, 도트 오브젝트와 프레임, 작품이 사용하는 실시간 테이블·변수 값. 목적은 저작물 저장·복원·버전 관리입니다.",
        "커뮤니케이션: 댓글·대댓글, 좋아요/싫어요 기록, 팔로우 관계, 월드 내 채팅 로그. 채팅 로그는 신고 처리 목적으로 90일간 보관 후 파기합니다.",
        "로컬 변수·로컬 리스트는 서버에 저장하지 않습니다. 플레이어의 브라우저에만 임시로 유지되며 작품을 나가거나 이탈하면 초기화되어 사라집니다.",
        "결제 정보는 결제대행사가 처리하며 서비스는 카드번호를 보관하지 않습니다.",
        "제3자 제공은 원칙적으로 하지 않으며, 법령에 따른 요청이 있는 경우에만 최소 범위로 제공하고 그 사실을 사후 통지합니다.",
        "처리 위탁: 데이터 저장·인증·실시간 통신은 Supabase(호스팅 리전 명시)에 위탁합니다.",
      ],
    },
    {
      no: "제3장", title: "저작물, 공유 오브젝트, 리메이크", items: [
        "회원이 만든 월드와 오브젝트의 저작권은 회원에게 있습니다. 서비스는 운영·홍보·검색 노출을 위한 범위에서만 무상으로 사용할 수 있는 비독점적 이용권을 가집니다.",
        "오브젝트를 «공유»로 설정하면 다른 회원이 가져다 쓸 수 있습니다. 라이선스(CC0 / CC BY / 리메이크 전용 / 비공개)는 제작자가 직접 선택하며, 가져다 쓴 작품에는 원작자와 원본 링크가 자동으로 표기됩니다.",
        "리메이크를 허용한 월드는 누구나 사본을 만들 수 있고, 리메이크 작품 상단에는 원본으로 이동하는 하이퍼링크가 항상 노출됩니다. 원본 표기를 제거하거나 위조하는 행위는 금지됩니다.",
        "타인의 저작물·상표·초상을 무단으로 도트로 옮겨 게시하는 행위는 금지되며, 권리자 요청 시 게시 중단(Notice & Takedown) 절차를 따릅니다. 이의신청 절차도 함께 제공합니다.",
        "회원이 작품을 삭제하면 공유 오브젝트의 사본은 이미 가져다 쓴 회원의 작품에 남을 수 있습니다. 이 점은 공유 설정 시 별도로 안내합니다.",
      ],
    },
    {
      no: "제4장", title: "금지행위와 필터링", items: [
        "비속어·혐오표현·성적 표현, 타인 사칭, 개인정보 노출 유도, 외부 연락처 유도, 도박·불법 거래, 자살·자해 조장 내용은 금지됩니다.",
        "닉네임, 월드 제목·설명·태그, 조작법 안내, 오브젝트 이름, 댓글·대댓글, 커뮤니티 글, 월드 내 실시간 채팅 등 텍스트를 입력하는 모든 기능에 필터가 적용됩니다.",
        "1단계는 해당 표현 가림, 2단계는 등록 차단, 3단계는 계정 이용 제한으로 처리하며 제재 시 사유와 이의신청 방법을 함께 안내합니다.",
        "자동 필터를 우회하기 위한 문자 변형·자간 삽입도 동일하게 제재 대상입니다.",
        "신고는 작품·오브젝트·글·댓글·프로필 단위로 가능하며 접수 후 24시간 내 1차 검토, 결과는 알림으로 통지합니다.",
      ],
    },
    {
      no: "제5장", title: "책임과 분쟁", items: [
        "서비스는 회원 간 또는 회원과 제3자 간에 발생한 분쟁에 개입하지 않으며, 회원이 게시한 콘텐츠로 인한 법적 책임은 게시한 회원에게 있습니다.",
        "천재지변, 회선 장애, 위탁 인프라 장애 등 통제할 수 없는 사유로 인한 서비스 중단에 대해서는 책임이 면제됩니다. 다만 예정된 점검은 사전 공지합니다.",
        "회원은 언제든 탈퇴할 수 있으며, 탈퇴 시 계정 정보는 즉시 파기됩니다. 이미 공유된 오브젝트와 게시된 작품의 처리 방식은 탈퇴 화면에서 선택합니다.",
        "이 약관은 대한민국 법을 준거법으로 하고, 분쟁은 회원의 주소지 관할 법원에 제기할 수 있습니다.",
        "문의: help@dotverse.example / 개인정보 보호책임자 연락처는 개인정보처리방침에 기재합니다.",
      ],
    },
  ];

  window.DOT_SEED = {
    P, art, assets, worlds, creators, comments, blockCats, palette, script,
    boards, posts, notifs, features, dashboard, terms,
    rollWords: ["예술", "걸작", "아름다움", "세계", "이야기", "규칙", "놀이터", "농담", "기억"],
  };
})();
