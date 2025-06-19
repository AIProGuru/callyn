const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const csv = require("csv-parser");
const sqlite3 = require("sqlite3").verbose();
const axios = require("axios");
const streamifier = require("streamifier");

dotenv.config();

const app = express();
const port = 5000;

// Initialize DB
const db = new sqlite3.Database("./calls.db");
db.run(`CREATE TABLE IF NOT EXISTS calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  assistant_id TEXT,
  call_id TEXT,                     -- Vapi call ID
  name TEXT,                        -- Customer Name
  email TEXT,                       -- Contact Email
  phone TEXT,                       -- Customer Phone
  company TEXT,                     -- Customer Company
  duration INTEGER,                 -- Call duration in seconds
  outcome TEXT,                     -- Call outcome (e.g., voicemail, booked, no answer, etc.)
  campaign TEXT,                    -- Campaign identifier or name (nullable for now)
  cost REAL,                        -- Cost of the call
  transcript TEXT,                 -- Full transcript of the call
  notes TEXT,                       -- Manual or automatic notes
  status TEXT,                      -- Backend call status (queued, called, failed, etc.)
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP  -- When the call was initiated
);
`);

db.run(`
    CREATE TABLE IF NOT EXISTS assistants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    assistant_id TEXT,
    name TEXT,
    voice TEXT,
    model TEXT,
    instructions TEXT,
    industry TEXT,
    target_audience TEXT,
    main_goal TEXT,
    custom_script TEXT,
    speaking_speed REAL,
    enthusiasm INTEGER,
    use_small_talk INTEGER,
    handle_objections INTEGER,
    tone TEXT,
    formality TEXT,
    scriptMethod TEXT,
    websiteUrl TEXT,
    uploadedFile TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP  -- When the call was initiated
  );
`);

db.run(`
    CREATE TABLE IF NOT EXISTS purchased_numbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    sid TEXT NOT NULL,
    friendly_name TEXT,
    phone_id TEXT,
    orgId TEXT,
    status TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const VAPI_API_KEY = process.env.VAPI_API_KEY;

/**
 * Upload leads + start calls for a specific user and assistant.
 * Assumes frontend sends:
 * - user_id: from Supabase
 * - assistant_id: user's assistant created in Vapi
 */

async function createPhoneNumber({ number, assistantId, name }) {
  try {
    const response = await fetch("https://api.vapi.ai/phone-number", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider: "twilio",
        number,
        twilioAccountSid: accountSid,
        twilioAuthToken: authToken,
        assistantId,
        name,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Vapi API error: ${response.status} ${response.statusText}`
      );
    }

    const body = await response.json();
    return body;
  } catch (error) {
    console.error("Error creating phone number:", error);
    throw error;
  }
}

async function fetchAvailableNumbers(country = "US") {
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/AvailablePhoneNumbers/${country}/Local.json`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    const data = await response.json();
    return data.available_phone_numbers || [];
  } catch (error) {
    console.error("Failed to refresh available numbers:", error);
    return [];
  }
}

const getPurchasedNumbersByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM purchased_numbers WHERE user_id = ? ORDER BY created_at DESC`;

    db.all(query, [userId], (err, rows) => {
      if (err) {
        console.error("Error fetching purchased numbers:", err);
        return reject(err);
      }
      resolve(rows);
    });
  });
};

function parseCSVFromBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const leads = [];
    const stream = streamifier.createReadStream(buffer);

    stream
      .pipe(csv())
      .on("data", (row) => {
        const { Name, Phone, Email } = row;
        if (Name && Phone && Email) {
          leads.push({ Name, Phone, Email });
        }
      })
      .on("end", () => resolve(leads))
      .on("error", reject);
  });
}

function getAssistantsByUserId(user_id) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM assistants WHERE user_id = ?",
      [user_id],
      (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      }
    );
  });
}

function getPhoneNumbersByUserId(user_id) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM purchased_numbers WHERE user_id = ?",
      [user_id],
      (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      }
    );
  });
}

app.post("/api/upload", upload.single("data"), async (req, res) => {
  const { user_id } = req.body;
  const file = req.file;
  if (!user_id) {
    return res.status(400).json({ error: "Missing user_id" });
  }

  const assistantRow = await getAssistantsByUserId(user_id);
  const phoneRow = await getPhoneNumbersByUserId(user_id);

  if (!assistantRow || !phoneRow) {
    return res
      .status(404)
      .json({ error: "assistant_id or phone_id not found" });
  }

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const assistant_id = assistantRow[0].assistant_id;
  const phoneNumber_id = phoneRow[0].phone_id;

  try {
    const leads = await parseCSVFromBuffer(file.buffer);

    let successCount = 0;
    let failureCount = 0;
    const callResults = [];

    for (const lead of leads) {
      try {
        const response = await axios.post(
          "https://api.vapi.ai/call",
          {
            assistantId: assistant_id,
            phoneNumberId: phoneNumber_id,
            customer: {
              number: lead.Phone,
              name: lead.Name,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${VAPI_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        const callData = response.data;

        db.run(
          `INSERT INTO calls (user_id, assistant_id, call_id, name, email, phone, company, duration, outcome, campaign, cost, transcript, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user_id,
            assistant_id,
            callData.id,
            lead.Name,
            lead.Email,
            lead.Phone,
            "",
            0,
            "",
            "",
            callData.cost,
            "",
            "",
            callData.status,
          ]
        );

        successCount++;
        callResults.push({
          phone: lead.Phone,
          name: lead.Name,
          status: "called",
          call: callData,
        });
      } catch (err) {
        const errorMsg = err.response?.data || err.message;
        console.error("Vapi error:", errorMsg);

        failureCount++;
        callResults.push({
          phone: lead.Phone,
          name: lead.Name,
          status: "failed",
          error: errorMsg,
        });
      }
    }

    const total = leads.length;
    const status =
      failureCount === 0
        ? "success"
        : successCount === 0
        ? "failed"
        : "partial_success";

    res.status(status === "success" ? 200 : 207).json({
      status,
      totalLeads: total,
      called: successCount,
      failed: failureCount,
      results: callResults,
    });
  } catch (err) {
    console.error("Upload or parsing error:", err);
    res.status(500).json({ error: "Upload or call failed" });
  }
});

/**
 * Get call logs for a user
 * Frontend sends: user_id
 */
app.get("/api/calls", async (req, res) => {
  const { user_id } = req.query; // Use req.query for GET parameters

  if (!user_id) {
    return res.status(400).json({ error: "Missing assistant_id" });
  }

  console.log(user_id)

  const assistantRow = await getAssistantsByUserId(user_id);
  const assistant_id = assistantRow[0].assistant_id;

  try {
    const response = await axios.get("https://api.vapi.ai/call", {
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      params: {
        assistantId: assistant_id, // Query param
      },
    });

    const callData = response.data;

    res.json(callData);
  } catch (err) {
    const errorMsg = err.response?.data || err.message;
    console.error("Vapi error:", errorMsg);
    res.status(err.response?.status || 500).json({ error: errorMsg });
  }
});

app.get("/api/assistants", async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "Missing user_id" });
  }

  try {
    const assistantData = await getAssistantsByUserId(user_id);
    res.json(assistantData);
  } catch (err) {
    console.error("DB error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/update-agent", async (req, res) => {
  const userId = req.body.userId;
  const data = req.body.data;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // Get assistant from DB
    db.get(
      "SELECT * FROM assistants WHERE user_id = ? LIMIT 1",
      [userId],
      async (err, assistant) => {
        if (err || !assistant) {
          return res
            .status(404)
            .json({ error: "Assistant not found for user" });
        }
        // Construct updated instructions
        const instructions = `
          Personality: ${data.personality || assistant.tone}.
          Script: ${data.customScript || assistant.custom_script}.
          Business: ${data.businessName || assistant.name}. 
          Industry: ${data.industry || assistant.industry}.
          Target Audience: ${data.targetAudience || assistant.target_audience}.
          Goal: ${data.mainGoal || assistant.main_goal}.
          Speaking Speed: ${
            data.speakingSpeed || assistant.speaking_speed
          } (Slower: 0.5x, Normal: 1.0x, Faster: 2.0x).
          Enthusiasm: ${
            data.enthusiasm || assistant.enthusiasm
          } (1 = Calm & Professional, 10 = Energetic & Enthusiastic).
          Tone: ${data.languageConfig?.tone || assistant.tone}.
          Formality: ${data.languageConfig?.formality || assistant.formality}.
          SmallTalk: ${data.useSmallTalk || assistant.use_small_talk}.
          HandleObjection: ${data.handleObjections || assistant.use_small_talk}.
        `.trim();

        const payload = {
          name: data.businessName || assistant.name,
          model: {
            provider: "openai",
            model: "chatgpt-4o-latest",
            messages: [
              {
                role: "assistant",
                content: instructions,
              },
            ],
          },
          voice: {
            provider: "11labs",
            voiceId: data.selectedVoice || data.languageConfig?.voiceId || "",
          },
        };

        // Update assistant on VAPI
        const vapiRes = await fetch(
          `https://api.vapi.ai/assistant/${assistant.assistant_id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${VAPI_API_KEY}`,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!vapiRes.ok) {
          const errText = await vapiRes.text();
          return res
            .status(500)
            .json({ error: "VAPI update failed", detail: errText });
        }

        const updated = await vapiRes.json();

        // Update DB
        db.run(
          `UPDATE assistants SET
            name = ?, voice = ?, model = ?, instructions = ?,
            industry = ?, target_audience = ?, main_goal = ?,
            custom_script = ?, speaking_speed = ?, enthusiasm = ?,
            use_small_talk = ?, handle_objections = ?, tone = ?, formality = ?
          WHERE assistant_id = ?`,
          [
            data.businessName || assistant.name,
            data.selectedVoice || data.languageConfig?.voiceId || "",
            "chatgpt-4o-latest",
            instructions,
            data.industry || assistant.industry,
            data.targetAudience || assistant.target_audience,
            data.mainGoal || assistant.main_goal,
            data.customScript || assistant.custom_script,
            data.speakingSpeed || assistant.speaking_speed,
            data.enthusiasm || assistant.enthusiasm,
            data.useSmallTalk || assistant.use_small_talk,
            data.handleObjections || assistant.use_small_talk,
            data.languageConfig?.tone || assistant.tone,
            data.languageConfig?.formality || assistant.formality,
            assistant.assistant_id,
          ],
          (updateErr) => {
            if (updateErr) {
              console.error("DB update error:", updateErr);
              return res.status(500).json({ error: "Failed to update DB" });
            }

            return res.status(200).json({
              message: "Assistant updated successfully",
              assistant_id: assistant.assistant_id,
              name: data.businessName || assistant.name,
              voice: data.selectedVoice || "9BWtsMINqrJLrRacOk9x",
              personality: data.personality || "professional",
              script: data.customScript || "Default sales script",
              businessInfo: {
                name: data.businessName || assistant.name,
                industry: data.industry || assistant.industry,
                targetAudience: data.targetAudience || assistant.targetAudience,
                mainGoal: data.mainGoal || assistant.main_goal,
              },
              createdAt: updated.createdAt || new Date().toISOString(),
              scriptMethod: assistant.scriptMethod,
              websiteUrl: assistant.websiteUrl,
              uploadedFile: assistant.uploadedFile,
            });
          }
        );
      }
    );
  } catch (err) {
    console.error("Update assistant error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/create-assistant", async (req, res) => {
  const {
    user_id,
    name,
    model_provider,
    model_id,
    voice_provider,
    voice_id,
    industry,
    targetAudience,
    mainGoal,
    scriptMethod,
    websiteUrl,
    uploadedFile,
    customScript,
    speakingSpeed,
    enthusiasm,
    useSmallTalk,
    handleObjections,
    languageConfig,
    selectedScenario,
    trainingMethod,
    voicePreview,
  } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const instructions = `
      Assistant Name: ${name || "My AI Agent"}
      Industry: ${industry || "General"}
      Target Audience: ${targetAudience || "General audience"}
      Main Goal: ${mainGoal || "Provide assistance and support"}
      Script: ${customScript || "Default sales or support script"}

      Speaking Speed: ${speakingSpeed || 1.0}x (Slower = 0.5x, Faster = 2.0x)
      Enthusiasm Level: ${enthusiasm || 5} (1 = Calm, 10 = Energetic)

      Small Talk Enabled: ${useSmallTalk ? "Yes" : "No"}
      Handle Objections: ${handleObjections ? "Yes" : "No"}

      Tone: ${languageConfig?.tone || "neutral"}
      Formality: ${languageConfig?.formality || "balanced"}
    `.trim();
    // Call Vapi API to create assistant
    const response = await axios.post(
      "https://api.vapi.ai/assistant",
      {
        model: {
          messages: [
            {
              content: instructions,
              role: "assistant",
            },
          ],
          model: model_id,
          provider: model_provider,
          temperature: 0.5,
          maxTokens: 250,
          emotionRecognitionEnabled: true,
        },
        voice: {
          cachingEnabled: true,
          provider: voice_provider,
          voiceId: voice_id,
          chunkPlan: {
            enabled: true,
            minCharacters: 30,
            punctuationBoundaries: ["。"],
          },
        },

        name: name,
        stopSpeakingPlan: {
          numWords: 0,
          voiceSeconds: 0.2,
          backoffSeconds: 1,
          acknowledgementPhrases: [
            "i understand",
            "i see",
            "i got it",
            "i hear you",
            "im listening",
            "im with you",
            "right",
            "okay",
            "ok",
            "sure",
            "alright",
            "got it",
            "understood",
            "yeah",
            "yes",
            "uh-huh",
            "mm-hmm",
            "gotcha",
            "mhmm",
            "ah",
            "yeah okay",
            "yeah sure",
          ],
          interruptionPhrases: [
            "stop",
            "shut",
            "up",
            "enough",
            "quiet",
            "silence",
            "but",
            "dont",
            "not",
            "no",
            "hold",
            "wait",
            "cut",
            "pause",
            "nope",
            "nah",
            "nevermind",
            "never",
            "bad",
            "actually",
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${VAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const assistant = response.data;

    // Save assistant to local DB
    db.run(
      `INSERT INTO assistants (
        user_id,
        assistant_id,
        name,
        voice,
        model,
        instructions,
        industry,
        target_audience,
        main_goal,
        custom_script,
        speaking_speed,
        enthusiasm,
        use_small_talk,
        handle_objections,
        tone,
        formality,
        scriptMethod,
        websiteUrl,
        uploadedFile
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        assistant.id,
        name,
        assistant.voice?.voiceId || voice_id,
        assistant.model?.model || model_id,
        instructions,
        industry || "",
        targetAudience || "",
        mainGoal || "",
        customScript || "",
        speakingSpeed || 1.0,
        enthusiasm || 5,
        useSmallTalk ? 1 : 0,
        handleObjections ? 1 : 0,
        languageConfig?.tone || "",
        languageConfig?.formality || "",
        scriptMethod,
        websiteUrl,
        uploadedFile,
      ],
      function (err) {
        if (err) {
          console.error("DB insert error:", err);
          return res
            .status(500)
            .json({ error: "Failed to save assistant to database" });
        }

        res.json({ status: "success", assistant });
      }
    );
  } catch (err) {
    console.error(
      "Vapi assistant creation failed:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to create Vapi assistant" });
  }
});

app.post("/api/provision-number", async (req, res) => {
  const { phoneNumber, userId, country = "US" } = req.body;

  if (!phoneNumber || !userId) {
    return res
      .status(400)
      .json({ error: "Phone number and user ID are required" });
  }

  try {
    // Provision the number
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          PhoneNumber: phoneNumber,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: data.message || "Twilio error" });
    }

    // Refresh available numbers
    const refreshedNumbers = await fetchAvailableNumbers(country);
    const purchasedNumbers = await getPurchasedNumbersByUserId(userId);
    const assistants = await getAssistantsByUserId(userId);
    const name = assistants[0].name;
    const assistantId = assistants[0].assistant_id;

    const result = await createPhoneNumber({
      number: phoneNumber,
      assistantId,
      name,
    });

    // Save provisioned number to DB
    const insertQuery = `
      INSERT INTO purchased_numbers (user_id, phone_number, sid, friendly_name, phone_id, orgId, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;

    db.run(
      insertQuery,
      [
        userId,
        phoneNumber,
        result.twilioAccountSid,
        data.friendly_name,
        result.id,
        result.orgId,
        result.status,
      ],
      (err) => {
        if (err) {
          console.error("DB insert error:", err);
        }
      }
    );

    return res.status(200).json({
      message: "Number provisioned successfully",
      phone_number: data.phone_number,
      availableNumbers: refreshedNumbers,
      purchasedNumbers,
    });
  } catch (err) {
    console.error("Provisioning error:", err);
    res.status(500).json({ error: "Server error purchasing number" });
  }
});

app.post("/api/get-available-numbers", async (req, res) => {
  const { country = "US" } = req.body;

  try {
    const availableNumbers = await fetchAvailableNumbers(country);
    return res.status(200).json({ availableNumbers });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/purchased-numbers", async (req, res) => {
  const userId = req.body.user_id;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const purchasedNumbers = await getPurchasedNumbersByUserId(userId);
    res.status(200).json({ purchasedNumbers });
  } catch (error) {
    console.error("Error fetching purchased numbers:", error);
    res.status(500).json({ error: "Failed to retrieve purchased numbers" });
  }
});

app.post("/api/create-number", async (req, res) => {
  const { number, assistantId, name = "demo" } = req.body;

  if (!number || !assistantId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await createPhoneNumber({
      number,
      assistantId,
      name,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
