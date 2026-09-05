// 값은 저장소에 넣지 않습니다. Render Build Command 가 이 파일을 덮어씁니다.
//   printf 'window.__ENV={SUPABASE_URL:"%s",SUPABASE_PUBLISHABLE_KEY:"%s"};' "$SUPABASE_URL" "$SUPABASE_PUBLISHABLE_KEY" > env.js
// 로컬에서 볼 때만 아래 두 줄을 채우거나, localStorage 의 dotverse.env 를 씁니다.
window.__ENV = Object.assign(
  {
    SUPABASE_URL: "",
    SUPABASE_PUBLISHABLE_KEY: "",
  },
  window.__ENV || {},
  (() => {
    try { return JSON.parse(localStorage.getItem("dotverse.env") || "{}"); } catch (e) { return {}; }
  })()
);
