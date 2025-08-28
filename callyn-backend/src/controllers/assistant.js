const { createVapiAssistant, createInstructions, updateVapiAssistant } = require("../utils/assistant");
const { getUserByEmail, getFirstAgentByUserId, updateAssistantByUserId, getAssistantsByUserId} = require("../services/assistant");
const OpenAI = require('openai');
const { SocksProxyAgent } = require('socks-proxy-agent');

const db = require('../db/sqlite');

// Minimal default instruction for blank assistants
const DEFAULT_MINIMAL_INSTRUCTIONS = `This is a blank template with minimal defaults, you can change messages.`;

// POST /api/assistant
// Creates a minimal assistant with default voice, model, and instructions; name can be provided
async function createAssistant(req, res) {
  try {
    const { user_id } = req.user;
    const {
      name = 'New Assistant',
      voice = 'IKne3meq5aSn9XLyUdCD', // ElevenLabs default voice id
      model = 'chatgpt-4o-latest',
      instructions = DEFAULT_MINIMAL_INSTRUCTIONS,
    } = req.body || {};

    // Create assistant in Vapi first
    const vapiAssistant = await createVapiAssistant(name, {
      voice,
      instructions,
    });

    const payload = {
      id: vapiAssistant.id, // use vapi assistant id as a stable unique identifier for immediate UI usage
      user_id,
      assistant_id: vapiAssistant.id,
      name,
      voice: vapiAssistant.voice?.voiceId || voice,
      model: vapiAssistant.model?.model || model,
      instructions,
    };

    db.all(
      `INSERT INTO assistants (
        user_id,
        assistant_id,
        name,
        voice,
        model,
        instructions
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [payload.user_id, payload.assistant_id, payload.name, payload.voice, payload.model, payload.instructions],
      function (err) {
        if (err) {
          console.error('DB insert error:', err);
          return res.status(500).json({ error: 'Failed to save assistant to database' });
        }
        return res.status(201).json({ assistant: payload });
      }
    );
  } catch (err) {
    console.error('Create assistant failed:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to create assistant' });
  }
}

async function createFirstAssistant(req, res) {
  const { user_id } = req.user;
  const {
    voice,
    model,
    // Optional fields for instruction generation only (not stored)
    business_name,
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
  } = req.body;

  try {
    const agentName = `First agent for ${business_name}`
    const instructions = createInstructions({ ...req.body, name: agentName });

    const assistant = await createVapiAssistant(agentName, { voice, instructions });
    const payload = {
      user_id,
      assistant_id: assistant.id,
      name: agentName,
      voice: assistant.voice?.voiceId || voice,
      model: assistant.model?.model || model,
      instructions,
    }

    // Save assistant to local DB
    db.all(
      `INSERT INTO assistants (
        user_id,
        assistant_id,
        name,
        voice,
        model,
        instructions
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [payload.user_id, payload.assistant_id, payload.name, payload.voice, payload.model, payload.instructions],
      function (err) {
        if (err) {
          console.error("DB insert error:", err);
          return res
            .status(500)
            .json({ error: "Failed to save assistant to database" });
        }

        res.json({ status: 200, assistant: payload });
      }
    );
  } catch (err) {
    console.error(
      "Vapi assistant creation failed:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to create Vapi assistant" });
  }
}

async function getAssistant(req, res) {
  try {
    // Get user_id from request (set by auth middleware)
    const { user_id } = req.user;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID not found' });
    }

    // Get assistants for this user
    const assistants = await getAssistantsByUserId(user_id);
    
    return res.status(200).json({ assistants: assistants });
  } catch (err) {
    console.error("DB error:", err.message);
    return res.status(500).json({ error: 'Server error!' });
  }
}

async function updateAssistant(req, res) {
  const { user_id } = req.user;

  try {
    const assistant = await getFirstAgentByUserId(user_id);
    const newAssistant = { ...assistant, ...req.body }
    const instructions = createInstructions(newAssistant)
    await updateAssistantByUserId(user_id, { ...newAssistant, instructions })
    await updateVapiAssistant(assistant.assistant_id, { voice: newAssistant.voice, instructions });
    return res.status(200).json({ data: newAssistant });
  } catch (err) {
    console.log(err);
    return res.status(500).send('Server error!');
  }
}

// PUT /api/assistant/:id
async function updateAssistantById(req, res) {
  try {
    const { id } = req.params;
    const { user_id } = req.user;
    const { name, voice, model, instructions } = req.body;

    // First, verify the assistant belongs to this user
    const assistant = await new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM assistants WHERE assistant_id = ? AND user_id = ?",
        [id, user_id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!assistant) {
      return res.status(404).json({ error: 'Assistant not found' });
    }

    // Update Vapi assistant if voice or instructions changed
    if (voice !== assistant.voice || instructions !== assistant.instructions) {
      try {
        await updateVapiAssistant(assistant.assistant_id, { voice, instructions });
      } catch (vapiErr) {
        console.error('Vapi update failed:', vapiErr);
        return res.status(500).json({ error: 'Failed to update Vapi assistant' });
      }
    }

    // Update local database
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (voice !== undefined) {
      updateFields.push('voice = ?');
      updateValues.push(voice);
    }
    if (model !== undefined) {
      updateFields.push('model = ?');
      updateValues.push(model);
    }
    if (instructions !== undefined) {
      updateFields.push('instructions = ?');
      updateValues.push(instructions);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id, user_id);

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE assistants SET ${updateFields.join(', ')} WHERE assistant_id = ? AND user_id = ?`,
        updateValues,
        function(err) {
          if (err) reject(err);
          resolve();
        }
      );
    });

    // Return updated assistant
    const updatedAssistant = await new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM assistants WHERE assistant_id = ? AND user_id = ?",
        [id, user_id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    return res.status(200).json({ assistant: updatedAssistant });
  } catch (err) {
    console.error('Update assistant failed:', err);
    return res.status(500).json({ error: 'Failed to update assistant' });
  }
}

// POST /api/assistant/generate-prompt (SSE streaming)
async function generatePrompt(req, res) {
  // Configure OpenAI with optional SOCKS5 proxy
  let proxyUrl = process.env.SOCKS_PROXY_URL || '';

  const agent = proxyUrl ? new SocksProxyAgent(proxyUrl) : undefined;
  console.log('Using proxy for OpenAI:', proxyUrl || 'None');
  const openai = agent
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        httpAgent: agent,
        httpsAgent: agent,
        defaultHeaders: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'X-Forwarded-For': '8.8.8.8',
          'X-Real-IP': '8.8.8.8',
        },
      })
    : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { requirements, business } = req.body || {};

  const system = `You are a helpful assistant that writes high-quality, structured, markdown-formatted system prompts for voice AI assistants. The prompt must be:
- Highly structured (with headings, lists)
- Actionable and precise
- Tailored to the provided requirements or business info
- Include sections: Identity & Purpose, Voice & Persona, Knowledge, Guardrails, Conversation Flow`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const content = `Requirements: ${requirements || 'N/A'}\nBusiness info: ${JSON.stringify(business || {}, null, 2)}`;
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content }
      ],
      temperature: 0.4,
    });

    for await (const chunk of stream) {
      const token = chunk.choices?.[0]?.delta?.content || '';
      if (token) {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Prompt generation failed:', err.response?.data || err.message);
    try {
      res.write(`data: ${JSON.stringify({ error: 'Failed to generate prompt' })}\n\n`);
    } finally {
      res.end();
    }
  }
}

module.exports = { createFirstAssistant, createAssistant, getAssistant, updateAssistant, updateAssistantById, generatePrompt }