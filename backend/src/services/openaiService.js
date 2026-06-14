const OpenAI = require("openai");

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`OpenAI timeout after ${ms}ms`)), ms))
  ]);
};

const sanitizeIssueText = (input) => {
  const raw = String(input || "").replace(/\s+/g, " ").trim();
  if (!raw) return "The product is not functioning as expected.";

  // Remove command-like phrases users may type when prompting AI.
  const cleaned = raw
    .replace(/\b(write|create|generate|draft)\b\s+(a\s+)?(formal\s+)?(complaint\s+)?(email|mail)/gi, "")
    .replace(/\bplease\s+(write|create|generate|draft)\b/gi, "")
    .replace(/\bfor\s+me\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned || "The product is not functioning as expected.";
};

const fallbackParse = (text) => {
  const today = new Date().toISOString().slice(0, 10);
  const normalized = String(text || "");

  const productMatch =
    normalized.match(/product\s*name\s*[:\-]\s*(.+)/i) ||
    normalized.match(/item\s*name\s*[:\-]\s*(.+)/i) ||
    normalized.match(/description\s*[:\-]\s*(.+)/i) ||
    normalized.match(/model\s*[:\-]\s*(.+)/i);
  const dateMatch = normalized.match(/purchase\s*date\s*[:\-]\s*(\d{4}-\d{2}-\d{2}|\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
  const priceMatch = normalized.match(/price\s*[:\-]?\s*(?:rs\.?|inr|\$|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  const warrantyMatch = normalized.match(/warranty\s*(?:period)?\s*[:\-]?\s*(\d{1,3})\s*(?:month|months|mon|year|years)/i);
  const vendorMatch = normalized.match(/vendor\s*[:\-]\s*(.+)/i);

  const rawDate = dateMatch?.[1] || today;
  const parsedDate = rawDate.includes("/")
    ? rawDate.split("/").reverse().join("-")
    : rawDate.includes("-") && rawDate.match(/^\d{2}-\d{2}-\d{4}$/)
      ? rawDate.split("-").reverse().join("-")
      : rawDate;

  const hasYearKeyword = /warranty\s*(?:period)?\s*[:\-]?\s*\d+\s*(year|years)/i.test(normalized);
  const warrantyBase = Number(warrantyMatch?.[1] || 12);

  return {
    productName: (productMatch?.[1] || "Unknown Product").trim(),
    purchaseDate: parsedDate,
    price: Number((priceMatch?.[1] || "0").replace(/,/g, "")),
    warrantyMonths: hasYearKeyword ? warrantyBase * 12 : warrantyBase,
    vendor: (vendorMatch?.[1] || "").trim(),
    category: ""
  };
};

const normalizeStructuredData = (candidate, fallback) => {
  const safeString = (value, defaultValue) => {
    if (value === null || value === undefined) return defaultValue;
    const parsed = String(value).trim();
    if (!parsed || parsed.toLowerCase() === "null" || parsed.toLowerCase() === "n/a") {
      return defaultValue;
    }
    return parsed;
  };

  const safeNumber = (value, defaultValue) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : defaultValue;
  };

  return {
    productName: safeString(candidate?.productName, fallback.productName),
    purchaseDate: safeString(candidate?.purchaseDate, fallback.purchaseDate),
    price: safeNumber(candidate?.price, fallback.price),
    warrantyMonths: safeNumber(candidate?.warrantyMonths, fallback.warrantyMonths),
    vendor: safeString(candidate?.vendor, fallback.vendor),
    category: safeString(candidate?.category, fallback.category)
  };
};

const parseInvoiceTextToJson = async (text) => {
  const fallback = fallbackParse(text);
  if (!client) {
    return fallback;
  }

  const prompt = `You are an information extraction service.
Extract invoice/warranty details from the text and return strict JSON only.
Schema:
{
  "productName": "string",
  "purchaseDate": "YYYY-MM-DD",
  "price": number,
  "warrantyMonths": number,
  "vendor": "string",
  "category": "string"
}
If a field is unknown, provide sensible default values.
Text:\n${text}`;

  try {
    const response = await withTimeout(
      client.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        input: prompt,
        temperature: 0.1
      }),
      15000
    );

    const raw = response.output_text || "{}";
    try {
      const parsed = JSON.parse(raw);
      return normalizeStructuredData(parsed, fallback);
    } catch (_e) {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return normalizeStructuredData(parsed, fallback);
      }
      return fallback;
    }
  } catch (_error) {
    return fallback;
  }
};

const generateComplaintContent = async ({ productName, vendor, purchaseDate, issueDescription, customerName }) => {
  const issue = sanitizeIssueText(issueDescription);
  const signer = customerName || "Customer";
  const supportTeam = vendor || "Support Team";

  const base = {
    emailSubject: `Complaint regarding ${productName}`,
    emailBody: `Dear ${supportTeam},\n\nI am writing to formally raise a complaint regarding ${productName}, purchased on ${purchaseDate}. ${issue}\n\nI previously contacted your support team, but the issue has not yet been resolved. This is causing significant inconvenience.\n\nI request a suitable resolution at the earliest, such as repair, replacement, or refund under warranty terms.\n\nI would appreciate your response within the next 5 business days.\n\nSincerely,\n${signer}`,
    tweet: `Facing an unresolved warranty issue with ${productName} bought on ${purchaseDate}. Need support from ${vendor || "brand"}. #Warranty #ConsumerRights`
  };

  if (!client) {
    return base;
  }

  const prompt = `Generate a professional complaint email based on the user's issue.
Rewrite the content clearly and formally.
Do not include instructions or raw phrases.
Output only the final email.

Return strict JSON with keys: emailSubject, emailBody, tweet.

Quality rules:
- Do not repeat user instruction words like "write email".
- Use clean grammar and complete sentences.
- Tone must be polite but firm.
- Mention support was already contacted and unresolved.
- Ask for specific resolution: repair/replacement/refund.

Context:
- Product: ${productName}
- Company/Support: ${supportTeam}
- Purchase Date: ${purchaseDate}
- Customer Name: ${signer}
- Issue Summary: ${issue}`;

  try {
    const response = await withTimeout(
      client.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        input: prompt,
        temperature: 0.3
      }),
      15000
    );

    const raw = response.output_text || "{}";
    try {
      return JSON.parse(raw);
    } catch (_e) {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      return base;
    }
  } catch (_error) {
    return base;
  }
};

const chatComplaintAssistant = async ({ productName, vendor, purchaseDate, userMessage, history = [], customerName }) => {
  const issue = sanitizeIssueText(userMessage);
  const signer = customerName || "Customer";
  const supportTeam = vendor || "Support Team";

  const base = {
    assistantReply: "Share what happened, when it started, and what resolution you want. I will draft a ready-to-send complaint email for you.",
    complaintFormat: {
      emailSubject: `Complaint regarding ${productName}`,
      emailBody: `Dear ${supportTeam},\n\nI am writing to report an issue with ${productName}, purchased on ${purchaseDate}. ${issue}\n\nI have already contacted support, but the issue remains unresolved.\n\nPlease provide a suitable resolution, such as repair, replacement, or refund, at the earliest.\n\nSincerely,\n${signer}`,
      tweet: `Need support for ${productName} warranty issue. Please assist urgently. #ConsumerRights #Warranty`
    }
  };

  if (!client) return base;

  const formattedHistory = history
    .slice(-8)
    .map((h) => `${h.role === "assistant" ? "Assistant" : "User"}: ${h.content}`)
    .join("\n");

  const prompt = `You are a complaint assistant for consumer support cases.
Return strict JSON only with schema:
{
  "assistantReply": "string",
  "complaintFormat": {
    "emailSubject": "string",
    "emailBody": "string",
    "tweet": "string"
  }
}
Context:
- Product: ${productName}
- Vendor: ${vendor}
- Purchase Date: ${purchaseDate}
Conversation so far:
${formattedHistory || "No previous conversation"}
Latest user message: ${issue}`;

  try {
    const response = await withTimeout(
      client.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        input: prompt,
        temperature: 0.4
      }),
      15000
    );

    const raw = response.output_text || "{}";
    const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw);
    return {
      assistantReply: parsed.assistantReply || base.assistantReply,
      complaintFormat: {
        emailSubject: parsed.complaintFormat?.emailSubject || base.complaintFormat.emailSubject,
        emailBody: parsed.complaintFormat?.emailBody || base.complaintFormat.emailBody,
        tweet: parsed.complaintFormat?.tweet || base.complaintFormat.tweet
      }
    };
  } catch (_error) {
    return base;
  }
};

module.exports = { parseInvoiceTextToJson, generateComplaintContent, chatComplaintAssistant };
