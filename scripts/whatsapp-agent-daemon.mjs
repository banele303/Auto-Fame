const WHAPI_TOKEN = process.env.WHAPI_API_TOKEN || "ohxDDFSuvqRvl4DKZLu7eEYUfbAEkCil";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://reliable-sturgeon-574.convex.cloud";
const AGENT_GROUP_ID = "120363413508068515@g.us";

let cachedContext = null;
let lastContextFetch = 0;

async function getDealershipContext() {
  const now = Date.now();
  if (cachedContext && now - lastContextFetch < 15000) {
    return cachedContext;
  }
  try {
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "agent:getDealershipContext",
        args: {},
        format: "json",
      }),
    });
    const data = await res.json();
    if (data?.value) {
      cachedContext = data.value;
      lastContextFetch = now;
    }
  } catch (err) {
    console.error("Convex fetch error:", err.message);
  }
  return cachedContext;
}

async function pollOnce() {
  try {
    const context = await getDealershipContext();
    await fetch("http://localhost:3000/api/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "agent_auto_reply",
        context,
      }),
    });
  } catch (err) {
    // Ignore transient errors while dev server reloads
  }
}

console.log(`Starting AutoFame WhatsApp AI Agent Daemon on ${AGENT_GROUP_ID}...`);
setInterval(pollOnce, 2500);
pollOnce();
