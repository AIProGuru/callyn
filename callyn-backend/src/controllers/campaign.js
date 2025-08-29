const { getPhoneNumbersByUserId } = require('../services/phone');
const { getCampaignsByUserId, createCampaignByUserId } = require("../services/campaign");
const { createInstructions, createVapiAssistant } = require("../utils/assistant");
const { getCampaignName, createVapiCampaign } = require("../utils/campaign");
const { createCallByUserId } = require('../services/call');

async function createCampaign(req, res) {
  const { user_id } = req.user;
  const { name, phoneNumberId, customers, agent, target_audience, voice_settings, assistantId, workflowId, schedulePlan } = req.body;

    try {
         // If we have the simple campaign data (from AI Campaign Builder)
     if (name && phoneNumberId && customers) {
       
       console.log('Creating campaign with data:', { name, phoneNumberId, assistantId, customers, schedulePlan, workflowId });
       
       // Create campaign using VAPI (assistantId or workflowId will be included in the campaign payload)
       const campaign = await createVapiCampaign(name, phoneNumberId, assistantId, customers, schedulePlan, workflowId);
       
       console.log('VAPI campaign created:', campaign);

       // Save campaign to database
       await createCampaignByUserId(user_id, campaign);
       
       // Create call records
       if (campaign.calls) {
         const assistantIdForCalls = assistantId || campaign.assistantId || (campaign.assistant && campaign.assistant.id);
         for (const call_id in campaign.calls) {
           await createCallByUserId(user_id, { assistant_id: assistantIdForCalls, call_id });
         }
       }

       return res.status(200).json({ message: 'Campaign created successfully', campaign });
     }

    // Legacy flow for complex campaign creation
    if (agent && target_audience && voice_settings && customers) {
      const phones = await getPhoneNumbersByUserId(user_id);
      if (!phones || !phones.length) {
        return res.status(400).send('No active phone numbers!');
      }

      const instructions = createInstructions({
        name: agent.name,
        role: agent.role,
        business_name: agent.businessName,
        business_context: agent.businessContext,
        industry: agent.businessIndustry,
        main_goal: agent.businessContext,
        target_audience,
        tone: voice_settings.languageConfig.tone,
        formality: voice_settings.languageConfig.formality,
        speaking_speed: voice_settings.speakingSpeed,
        enthusiasm: voice_settings.enthusiasm
      })

      const campaign_name = await getCampaignName(agent.businessContext, target_audience);

      const assistant = await createVapiAssistant(`${agent.name} agent`, { voice: voice_settings.languageConfig.voiceId, instructions });
      const campaign = await createVapiCampaign(campaign_name, phones[0].id, assistant.id, customers);

      await createCampaignByUserId(user_id, campaign);
      for (const call_id in campaign.calls) {
        await createCallByUserId(user_id, { assistant_id: assistant.id, call_id });
      }

      return res.status(200).json({ message: 'success' });
    }

         return res.status(400).json({ error: 'Invalid request data' });
   } catch (err) {
     console.error('Campaign creation error:', err);
     console.error('Error details:', err.response?.data || err.message);
     return res.status(500).json({ 
       error: 'Server error!', 
       details: err.response?.data || err.message 
     });
   }
}

async function getCampaigns(req, res) {
  const { user_id } = req.user;

  const campaigns = await getCampaignsByUserId(user_id);

  return res.status(200).send(campaigns);
}

module.exports = { createCampaign, getCampaigns }