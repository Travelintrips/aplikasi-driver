import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  // ✅ Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
      status: 200,
    });
  }

  try {
    const { target, message } = await req.json();
    const token = Deno.env.get("FONNTE_TOKEN");

    // ✅ Normalisasi target
    const formattedTarget = Array.isArray(target)
      ? target.filter(Boolean).join(",")
      : String(target || "").trim();

    console.log("📩 Incoming request:", { target: formattedTarget, message });

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token || "",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        target: formattedTarget,
        message,
      }),
    });

    // ✅ log status & headers dari Fonnte
    console.log("📡 Fonnte response status:", response.status);
    console.log(
      "📡 Fonnte response headers:",
      Object.fromEntries(response.headers.entries()),
    );

    // ✅ amanin parsing JSON
    const raw = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { raw }; // fallback kalau bukan JSON
    }
    console.log("📡 Fonnte response body:", parsed);

    // ✅ Selalu balikin status 200 ke frontend
    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        data: parsed,
      }),
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        status: 200,
      },
    );
  } catch (error) {
    console.error("❌ Error in send-whatsapp function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
      }),
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        status: 200, // ✅ tetap 200 biar frontend gak error
      },
    );
  }
});
