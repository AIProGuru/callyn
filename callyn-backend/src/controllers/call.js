const { getFirstAgentByUserId } = require("../services/assistant");
const { createCallByUserId, getCallsByUserId } = require("../services/call");
const { getCampaignsByUserId } = require("../services/campaign");
const { getContactById } = require("../services/contact");
const { getPhoneNumbersByUserId } = require("../services/phone");
const { getCallsByCampaigns, createVapiCall, createVapiCallWithPlan } = require("../utils/call");

async function getCall(req, res) {
  const { user_id } = req.user;
  // const campaigns = await getCampaignsByUserId(user_id);
  // const calls = await getCallsByCampaigns(campaigns);

  const calls = await getCallsByUserId(user_id);

  return res.status(200).send(calls);
}

async function createCall(req, res) {
  const { user_id } = req.user;
  const { contact_id } = req.params;

  const contact = await getContactById(contact_id);
  if (!contact || contact.user_id !== user_id) {
    return res.status(400).send('Invalid contact.');
  }

  const firstAgent = await getFirstAgentByUserId(user_id);
  if (!firstAgent) {
    return res.status(400).send('No available assistants.');
  }

  const phones = await getPhoneNumbersByUserId(user_id);
  if (!phones.length) {
    return res.status(400).send('No available phone numbers.');
  }

  const vapiCall = await createVapiCall(firstAgent.assistant_id, phones[0].id, {
    name: contact.name,
    email: contact.email,
    number: contact.number
  });
  if (!vapiCall) {
    return res.status(400).send('Call failed.');
  }

  try {
    await createCallByUserId(user_id, { assistant_id: firstAgent.assistant_id, call_id: vapiCall.id });
    return res.status(200).send('Call started.');
  } catch (err) {
    console.log(err);
    return res.status(500).send('Server error.');
  }
}

// POST /api/call/outbound - create an outbound call immediately or schedule it
async function createOutboundCall(req, res) {
  try {
    const { user_id } = req.user;
    const { assistantId, phoneNumberId, customer, customers, schedulePlan } = req.body || {};

    if (!assistantId) {
      return res.status(400).json({ error: 'assistantId is required' });
    }
    if (!phoneNumberId) {
      return res.status(400).json({ error: 'phoneNumberId (VAPI phone id) is required' });
    }
    if (!customer && !(Array.isArray(customers) && customers.length)) {
      return res.status(400).json({ error: 'Either customer or customers array is required' });
    }
    if (customer && !customer.number) {
      return res.status(400).json({ error: 'customer.number is required' });
    }

    const vapiCall = await createVapiCallWithPlan({ assistantId, phoneNumberId, customer, customers, schedulePlan });
    if (!vapiCall || !vapiCall.id) {
      return res.status(400).json({ error: 'Failed to create call' });
    }

    await createCallByUserId(user_id, { assistant_id: assistantId, call_id: vapiCall.id });
    return res.status(200).json({ call: vapiCall });
  } catch (err) {
    console.error('Create outbound call error:', err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    const error = err?.response?.data || { error: 'Server error' };
    return res.status(status).json(error);
  }
}

module.exports = { getCall, createCall, createOutboundCall }