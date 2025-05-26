// app/api/chat/ai/route.js
export const maxDuration = 60;

import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { CohereClientV2 } from "cohere-ai";

// Initialize Cohere V2 client
const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY,
});

// Free-tier Gemini endpoint
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/** Call Gemini 2.0 Flash */
async function callGemini(prompt) {
  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      maxOutputTokens: 150,
      temperature: 0.7,
    }),
  });
  const json = await res.json();
  return json.candidates?.[0]?.output?.trim() ?? "";
}

/** Call Cohere V2 chat for a single completion */
async function callCohereGenerate(prompt) {
  const resp = await cohere.chat({
    model: "command-a-03-2025",          // free-tier chat model
    messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
    temperature: 0.7,
    max_tokens: 150,
  });
  const segments = resp.choices?.[0]?.message?.content || [];
  return segments.map((seg) => seg.text).join("").trim();
}

/** Fallback: fetch a Wikipedia summary */
async function lookupWikiSummary(query) {
  const title = encodeURIComponent(query.trim().replace(/\s+/g, "_"));
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`
  );
  if (!res.ok) throw new Error("No wiki page");
  const { extract } = await res.json();
  return extract;
}

/** Fallback: generate a simple code snippet via Cohere */
async function generateSimpleCode(prompt) {
  // e.g. “Write a simple Java function that …”
  const codePrompt = `Write a simple ${prompt.trim()}.`;
  return await callCohereGenerate(codePrompt);
}

export async function POST(req) {
  try {
    // 1) Authenticate
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 }
      );
    }

    // 2) Parse body
    const { chatId, prompt } = await req.json();

    // 3) Load chat from MongoDB
    await connectDB();
    const chat = await Chat.findOne({ userId, _id: chatId });
    if (!chat) {
      return NextResponse.json(
        { success: false, message: "Chat not found" },
        { status: 404 }
      );
    }

    // 4) Append the user's message
    const userMsg = { role: "user", content: prompt, timestamp: Date.now() };
    chat.messages.push(userMsg);

    // 5) Call both LLMs in parallel
    const [geminiText, cohereText] = await Promise.all([
      callGemini(prompt),
      callCohereGenerate(prompt),
    ]);
    console.log("🛠️ Gemini returned:", geminiText);
    console.log("🛠️ Cohere returned:", cohereText);

    // 6) Merge via Cohere
    const combine = `
Response A (Gemini):
${geminiText}

Response B (Cohere):
${cohereText}
    `.trim();
    let assistantText = await callCohereGenerate(combine);

    // 7) Fallback to whichever LLM gave something
    if (!assistantText) {
      assistantText = geminiText || cohereText;
    }

    // 8) If still empty *and* this looks like a code request, generate code
    if (!assistantText) {
      const isCodeRequest = /java|python|javascript|function|method/.test(
        prompt.toLowerCase()
      );
      if (isCodeRequest) {
        assistantText = await generateSimpleCode(prompt);
      }
    }

    // 9) If still empty, try Wikipedia
    if (!assistantText) {
      try {
        assistantText = await lookupWikiSummary(prompt);
      } catch {
        // 10) Final fallback: friendly generic reply
        assistantText = `I’m not sure about "${prompt}", but I’m here to help with anything else!`;
      }
    }

    // 11) Append assistant message and save
    const assistantMsg = {
      role: "assistant",
      content: assistantText,
      timestamp: Date.now(),
    };
    chat.messages.push(assistantMsg);
    await chat.save();

    // 12) Return the new message
    return NextResponse.json({ success: true, data: assistantMsg });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
