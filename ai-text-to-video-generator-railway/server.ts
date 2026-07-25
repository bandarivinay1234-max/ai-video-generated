import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality, GenerateVideosOperation } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize GenAI
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in environment variables.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Local File Database Helpers
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const VIDEOS_FILE = path.join(DATA_DIR, "videos.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data) as T;
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultValue;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// --- API ENDPOINTS ---

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Helper to generate an intelligent fallback storyboard when Gemini models encounter temporary 503/demand spikes
function buildFallbackStoryboard(prompt: string, category?: string, style?: string, targetDuration?: string, characterNames?: string) {
  const cleanPrompt = prompt.trim();
  const shortTitle = cleanPrompt.length > 40 ? cleanPrompt.slice(0, 37) + "..." : cleanPrompt;
  const styleTag = style || "cinematic";
  const castTag = characterNames ? ` featuring ${characterNames}` : "";

  let sceneCount = 3;
  let defaultDurationPerScene = 5;

  if (targetDuration === '60s') {
    sceneCount = 7;
    defaultDurationPerScene = 8;
  } else if (targetDuration === '90s') {
    sceneCount = 10;
    defaultDurationPerScene = 9;
  } else if (targetDuration === '180s') {
    sceneCount = 18;
    defaultDurationPerScene = 10;
  } else if (targetDuration === '300s') {
    sceneCount = 30;
    defaultDurationPerScene = 10;
  } else if (targetDuration === '600s') {
    sceneCount = 50;
    defaultDurationPerScene = 12;
  }

  const transitions = ['fade', 'zoom-in', 'slide-left', 'dissolve', 'pan'];
  const scenes = [];

  for (let i = 1; i <= sceneCount; i++) {
    const isFirst = i === 1;
    const isLast = i === sceneCount;

    let scriptText = `Section ${i}: Exploring ${cleanPrompt.toLowerCase()}${castTag ? ' with ' + characterNames : ''}.`;
    if (isFirst) {
      scriptText = `Welcome to this epic animation covering ${cleanPrompt.toLowerCase()}${castTag}!`;
    } else if (isLast) {
      scriptText = `And that wraps up our full animated story for ${cleanPrompt.toLowerCase()}. Thanks for watching!`;
    }

    scenes.push({
      sceneNumber: i,
      scriptText,
      visualPrompt: `Scene ${i} animated action shot: ${cleanPrompt}${castTag}, in breathtaking ${styleTag} animation style, vivid animated colors, 8k resolution, energetic character composition.`,
      durationSeconds: defaultDurationPerScene,
      transition: transitions[(i - 1) % transitions.length],
      subtitles: [
        { text: scriptText.slice(0, Math.floor(scriptText.length / 2)), startTime: 0, endTime: defaultDurationPerScene / 2 },
        { text: scriptText.slice(Math.floor(scriptText.length / 2)), startTime: defaultDurationPerScene / 2 + 0.1, endTime: defaultDurationPerScene - 0.2 }
      ]
    });
  }

  return {
    title: shortTitle || "AI YouTube Video Storyboard",
    enhancedPrompt: `Detailed ${styleTag} YouTube animation script: ${cleanPrompt}${castTag}. Dynamic animated character movement across ${sceneCount} narrative scenes.`,
    suggestedVoice: "Kore",
    musicGenre: "cinematic",
    targetDuration: targetDuration || "30s",
    characterNames,
    scenes
  };
}

// 1. Prompt Enhancement API
app.post("/api/enhance-prompt", async (req, res) => {
  const { prompt, category, style, aspectRatio, targetDuration, characterNames } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  let sceneGuideline = "3 to 5 scenes, total video duration approximately 30 seconds.";
  if (targetDuration === "60s") {
    sceneGuideline = "6 to 8 scenes, total video duration approximately 60 seconds (1 minute YouTube Short).";
  } else if (targetDuration === "90s") {
    sceneGuideline = "10 to 14 scenes, total video duration approximately 90 seconds (1.5 minutes YouTube Video).";
  } else if (targetDuration === "180s") {
    sceneGuideline = "16 to 22 scenes, total video duration approximately 180 seconds (3.0 minutes YouTube Explainer / Documentary).";
  } else if (targetDuration === "300s") {
    sceneGuideline = "25 to 30 scenes, total video duration approximately 300 seconds (5.0 minutes YouTube Deep-Dive Episode).";
  } else if (targetDuration === "600s") {
    sceneGuideline = "40 to 50 scenes, total video duration approximately 600 seconds (10.0 minutes Full YouTube Special Episode).";
  }

  const systemPrompt = `You are a professional AI video director and producer specializing in high-engagement YouTube animated content creation. Analyze and enhance the user's prompt into a fully planned multi-scene AI video script flow.
Category: ${category || "custom"}
Style: ${style || "2d-cartoon"}
Aspect Ratio: ${aspectRatio || "16:9"}
Target Video Duration: ${targetDuration || "30s"}
Character / Cast Names: ${characterNames || "None specified"}

Duration Guidelines:
${sceneGuideline}

Important: If Character/Cast names are provided (${characterNames || "None"}), weave these specific names directly into the narration scripts, character interactions, and visual prompts for each scene!

Generate:
1. A concise, catchy YouTube video title.
2. An enhanced detailed summary prompt for YouTube optimization.
3. Suggested voiceover voice ('Kore', 'Puck', 'Zephyr', 'Fenrir', or 'Charon').
4. Background music genre ('cinematic', 'ambient', 'upbeat', 'dramatic', 'lofi', 'epic').
5. A list of scenes matching the requested length. For each scene:
   - sceneNumber: sequential integer starting at 1
   - scriptText: clear, engaging voiceover narration mentioning characters where relevant
   - visualPrompt: vivid, detailed visual description suitable for AI image/video generation in the requested visual/animation style (${style || '2d-cartoon'})
   - durationSeconds: integer between 5 and 10 seconds
   - transition: one of 'fade', 'zoom-in', 'slide-left', 'dissolve', 'pan'
   - subtitles: array of word/phrase objects with text, startTime, and endTime in seconds relative to scene start.`;

  const config = {
    systemInstruction: systemPrompt,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        enhancedPrompt: { type: Type.STRING },
        suggestedVoice: { type: Type.STRING },
        musicGenre: { type: Type.STRING },
        scenes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sceneNumber: { type: Type.INTEGER },
              scriptText: { type: Type.STRING },
              visualPrompt: { type: Type.STRING },
              durationSeconds: { type: Type.INTEGER },
              transition: { type: Type.STRING },
              subtitles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    startTime: { type: Type.NUMBER },
                    endTime: { type: Type.NUMBER },
                  },
                  required: ["text", "startTime", "endTime"],
                },
              },
            },
            required: [
              "sceneNumber",
              "scriptText",
              "visualPrompt",
              "durationSeconds",
              "transition",
              "subtitles",
            ],
          },
        },
      },
      required: ["title", "enhancedPrompt", "suggestedVoice", "musicGenre", "scenes"],
    },
  };

  const modelsToTry = ["gemini-3.6-flash", "gemini-3.1-flash-lite"];

  for (const modelName of modelsToTry) {
    try {
      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `User Prompt: "${prompt}"\n\nGenerate the complete JSON structured video breakdown.`,
        config,
      });

      const jsonText = response.text || "{}";
      const data = JSON.parse(jsonText);
      if (data && data.scenes && data.scenes.length > 0) {
        return res.json(data);
      }
    } catch (error: any) {
      console.warn(`Prompt enhance model ${modelName} encountered error or high demand:`, error.message || error);
    }
  }

  // Graceful fallback storyboard if Gemini model endpoints are under high demand (503 / 429)
  const fallbackData = buildFallbackStoryboard(prompt, category, style, targetDuration, characterNames);
  res.json(fallbackData);
});

// 2. Scene Visual Generation API
app.post("/api/generate-scene-visual", async (req, res) => {
  const { visualPrompt, style, aspectRatio } = req.body;
  if (!visualPrompt) {
    return res.status(400).json({ error: "visualPrompt is required" });
  }

  const promptText = `High quality, ultra detailed ${style || "cinematic"} style visuals: ${visualPrompt}. Masterpiece composition, vibrant colors, 8k render, professional lighting.`;

  // 1. First attempt: GenAI image model
  const imageModelsToTry = ["gemini-3.1-flash-image", "gemini-2.5-flash-image"];
  for (const imageModel of imageModelsToTry) {
    try {
      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: imageModel,
        contents: {
          parts: [{ text: promptText }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || "16:9",
          },
        },
      });

      let imageUrl = "";
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const mimeType = part.inlineData.mimeType || "image/png";
            imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (imageUrl) {
        return res.json({ imageUrl, provider: "gemini" });
      }
    } catch (error: any) {
      console.warn(`Gemini image model ${imageModel} hit quota or error, trying next option:`, error.message || error);
    }
  }

  // 2. Fallback: Pollinations AI Image Synthesis (Flux / SDXL high quality text-to-image)
  try {
    const width = aspectRatio === "9:16" ? 720 : 1280;
    const height = aspectRatio === "9:16" ? 1280 : aspectRatio === "1:1" ? 1080 : 720;
    const seed = Math.floor(Math.random() * 100000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const imgRes = await fetch(pollinationsUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (imgRes.ok) {
      const arrayBuffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = imgRes.headers.get("content-type") || "image/jpeg";
      const imageUrl = `data:${mimeType};base64,${base64}`;
      return res.json({ imageUrl, provider: "pollinations" });
    }
  } catch (pollErr: any) {
    console.warn("Pollinations AI fallback error:", pollErr.message || pollErr);
  }

  // 3. Final Fallback: High quality seed visual
  const seed = Math.abs(
    visualPrompt.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
  );
  const fallbackUrl = `https://picsum.photos/seed/${seed}/1280/720`;
  res.json({ imageUrl: fallbackUrl, provider: "placeholder" });
});

// Wraps raw headerless PCM audio bytes in a standard WAV (RIFF) header so
// that browsers (AudioContext.decodeAudioData) and audio players can read it.
function pcmToWav(
  pcmData: Buffer,
  sampleRate: number,
  numChannels: number,
  bitsPerSample: number
): Buffer {
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16); // fmt chunk size (PCM)
  header.writeUInt16LE(1, 20); // audio format = 1 (PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

// 3. Text-to-Speech (TTS) Narration API
app.post("/api/generate-tts", async (req, res) => {
  const { text, voice } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  const voiceName = voice || "Kore";
  const modelsToTry = ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash"];

  for (const modelName of modelsToTry) {
    try {
      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      const base64Audio = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType || "audio/L16;rate=24000";

      if (base64Audio) {
        // Gemini TTS returns raw headerless PCM (e.g. audio/L16;rate=24000).
        // Browsers' decodeAudioData() cannot decode raw PCM without a WAV
        // header, so we wrap it into a proper WAV file here.
        const pcmBuffer = Buffer.from(base64Audio, "base64");
        const rateMatch = /rate=(\d+)/.exec(mimeType);
        const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
        const wavBuffer = pcmToWav(pcmBuffer, sampleRate, 1, 16);
        const audioUrl = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;
        return res.json({ audioUrl });
      }
    } catch (error: any) {
      console.warn(`TTS narration error with model ${modelName}:`, error.message || error);
    }
  }

  // Graceful response if TTS API is unavailable or quota limit is reached
  res.json({ audioUrl: null, warning: "Speech synthesis currently unavailable or quota reached" });
});

// 4. Veo Video Generation API (3-step pattern)
app.post("/api/veo-generate-video", async (req, res) => {
  try {
    const { prompt, aspectRatio, resolution } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required for video generation" });
    }

    const ai = getGenAI();
    const operation = await ai.models.generateVideos({
      model: "veo-3.1-lite-generate-preview",
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: (resolution as "720p" | "1080p") || "720p",
        aspectRatio: (aspectRatio as "16:9" | "9:16") || "16:9",
      },
    });

    res.json({ operationName: operation.name });
  } catch (error: any) {
    console.error("Error starting Veo video generation:", error);
    res.status(500).json({ error: error.message || "Failed to start video generation" });
  }
});

// 4b. AI Presenter (lip-synced talking avatar) generation
// Builds a Veo prompt describing a presenter speaking the scene's script on
// camera, so Veo's native dialogue/lip-sync generation produces a talking
// avatar clip instead of a silent B-roll clip.
app.post("/api/generate-presenter-scene", async (req, res) => {
  try {
    const { scriptText, presenterDescription, aspectRatio, resolution } = req.body;
    if (!scriptText) {
      return res.status(400).json({ error: "scriptText is required for presenter generation" });
    }

    const appearance =
      presenterDescription?.trim() ||
      "A professional, friendly on-camera presenter, business casual attire, well-lit indoor studio background";

    // Veo's dialogue prompting convention: describe the speaker, the setting,
    // and quote the exact line they should say so audio + lip movement stay
    // in sync with the narration script used elsewhere in the project.
    const prompt = `${appearance}. The presenter speaks directly and warmly to the camera, with natural lip-synced dialogue, clear articulation, and subtle hand gestures. Medium shot, steady camera, professional lighting. The presenter says: "${scriptText.replace(/"/g, "'")}"`;

    const ai = getGenAI();
    const operation = await ai.models.generateVideos({
      model: "veo-3.1-lite-generate-preview",
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: (resolution as "720p" | "1080p") || "720p",
        aspectRatio: (aspectRatio as "16:9" | "9:16") || "16:9",
      },
    });

    res.json({ operationName: operation.name });
  } catch (error: any) {
    console.error("Error starting AI presenter video generation:", error);
    const rawMessage: string = error?.message || String(error);
    let friendlyMessage = rawMessage;
    if (/billing|quota|429|permission|403/i.test(rawMessage)) {
      friendlyMessage =
        "Veo video generation requires a Google Cloud project with billing enabled (it has no free tier). " +
        "Enable billing for your project and confirm Veo access, then try again. Raw error: " +
        rawMessage;
    } else if (/404|not found|not supported/i.test(rawMessage)) {
      friendlyMessage =
        "The Veo model used for the AI Presenter isn't available for this API key/region. Raw error: " + rawMessage;
    }
    res.status(500).json({ error: friendlyMessage });
  }
});

app.post("/api/veo-status", async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: "operationName is required" });
    }

    const ai = getGenAI();
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    res.json({
      done: updated.done,
      error: updated.error ? updated.error.message : null,
    });
  } catch (error: any) {
    console.error("Error checking video status:", error);
    res.status(500).json({ error: error.message || "Failed to check status" });
  }
});

app.post("/api/veo-download", async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: "operationName is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not defined" });
    }

    const ai = getGenAI();
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ error: "Video URI not found in completed operation" });
    }

    const videoRes = await fetch(uri, {
      headers: { "x-goog-api-key": apiKey },
    });

    if (!videoRes.ok) {
      return res.status(videoRes.status).json({ error: "Failed to download video from upstream" });
    }

    res.setHeader("Content-Type", "video/mp4");
    if (videoRes.body) {
      // Stream buffer back
      const buffer = await videoRes.arrayBuffer();
      res.send(Buffer.from(buffer));
    } else {
      res.status(500).json({ error: "Empty video body" });
    }
  } catch (error: any) {
    console.error("Error downloading Veo video:", error);
    res.status(500).json({ error: error.message || "Failed to download video" });
  }
});

// 5. Video Projects CRUD & Persistence
app.get("/api/videos", (req, res) => {
  const { userId } = req.query;
  let videos = readJsonFile<any[]>(VIDEOS_FILE, []);
  if (userId) {
    videos = videos.filter((v) => v.userId === userId || !v.userId);
  }
  res.json(videos);
});

app.post("/api/videos/save", (req, res) => {
  const videoProject = req.body;
  if (!videoProject || !videoProject.id) {
    return res.status(400).json({ error: "Valid video project object is required" });
  }

  const videos = readJsonFile<any[]>(VIDEOS_FILE, []);
  const index = videos.findIndex((v) => v.id === videoProject.id);
  if (index >= 0) {
    videos[index] = { ...videos[index], ...videoProject, updatedAt: new Date().toISOString() };
  } else {
    videos.unshift({ ...videoProject, createdAt: new Date().toISOString() });
  }

  writeJsonFile(VIDEOS_FILE, videos);
  res.json({ success: true, project: videoProject });
});

app.delete("/api/videos/:id", (req, res) => {
  const { id } = req.params;
  let videos = readJsonFile<any[]>(VIDEOS_FILE, []);
  videos = videos.filter((v) => v.id !== id);
  writeJsonFile(VIDEOS_FILE, videos);
  res.json({ success: true });
});

// 6. User Authentication API (Simple Persistence)
app.post("/api/auth/register", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required" });
  }

  const users = readJsonFile<any[]>(USERS_FILE, []);
  if (users.some((u) => u.email === email)) {
    return res.status(400).json({ error: "User with this email already exists" });
  }

  const newUser = {
    id: "user_" + Date.now(),
    username,
    email,
    passwordHash: Buffer.from(password).toString("base64"), // simple hash for demo
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeJsonFile(USERS_FILE, users);

  const { passwordHash, ...userWithoutPassword } = newUser;
  res.json({
    user: userWithoutPassword,
    token: `token_${newUser.id}_${Date.now()}`,
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const users = readJsonFile<any[]>(USERS_FILE, []);
  const user = users.find((u) => u.email === email);

  if (!user || user.passwordHash !== Buffer.from(password).toString("base64")) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const { passwordHash, ...userWithoutPassword } = user;
  res.json({
    user: userWithoutPassword,
    token: `token_${user.id}_${Date.now()}`,
  });
});

// Start Express + Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
