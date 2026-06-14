const path = require("path");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const cloudinary = require("cloudinary").v2;

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const isPlaceholderOpenAI = (key) => !key || key === "your_openai_api_key";
const hasCloudinary =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;

const withTimeout = (promise, ms, label) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms))
  ]);
};

const checkOpenAI = async () => {
  if (isPlaceholderOpenAI(process.env.OPENAI_API_KEY)) {
    return { ok: false, message: "OPENAI_API_KEY missing or placeholder" };
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resp = await withTimeout(
      client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: "Return exactly: ok",
      temperature: 0
      }),
      15000,
      "OpenAI"
    );
    const out = (resp.output_text || "").trim().toLowerCase();
    return { ok: out.includes("ok"), message: `OpenAI responded: ${out || "(empty)"}` };
  } catch (error) {
    return { ok: false, message: `OpenAI error: ${error.message}` };
  }
};

const checkCloudinary = async () => {
  if (!hasCloudinary) {
    return { ok: false, message: "Cloudinary credentials missing" };
  }

  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    const ping = await withTimeout(cloudinary.api.ping(), 15000, "Cloudinary");
    return { ok: ping.status === "ok", message: `Cloudinary ping: ${ping.status}` };
  } catch (error) {
    return { ok: false, message: `Cloudinary error: ${error.message}` };
  }
};

const run = async () => {
  const openai = await checkOpenAI();
  const cloud = await checkCloudinary();

  console.log("Integration Check Results");
  console.log("- OpenAI:", openai.ok ? "PASS" : "FAIL", "|", openai.message);
  console.log("- Cloudinary:", cloud.ok ? "PASS" : "FAIL", "|", cloud.message);

  if (!openai.ok || !cloud.ok) {
    process.exit(1);
  }

  process.exit(0);
};

run().catch((err) => {
  console.error("Integration check failed:", err.message);
  process.exit(1);
});
