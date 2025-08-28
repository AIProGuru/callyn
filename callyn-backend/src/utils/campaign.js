const axios = require('axios');
const { OpenAI } = require('openai');
const { SocksProxyAgent } = require('socks-proxy-agent');

const VAPI_API_KEY = process.env.VAPI_API_KEY;

async function createVapiCampaign(name, phone_id, assistant_id, customers, schedulePlan = null, workflowId = null) {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('VAPI API Key available:', !!VAPI_API_KEY);
            console.log('Creating VAPI campaign with payload:', { name, phone_id, assistant_id, customers, schedulePlan, workflowId });
            
            const payload = {
                name,
                phoneNumberId: phone_id,
                customers
            };
            
            // Only include assistantId OR workflowId (not both)
            if (assistant_id) {
                payload.assistantId = assistant_id;
            } else if (workflowId) {
                payload.workflowId = workflowId;
            }
            
            // Include schedule plan if provided
            if (schedulePlan) {
                payload.schedulePlan = schedulePlan;
            }
            
            console.log('Final VAPI payload:', payload);
            
            const campaign = await axios.post('https://api.vapi.ai/campaign', payload, {
                headers: {
                    Authorization: `Bearer ${VAPI_API_KEY}`,
                    "Content-Type": "application/json",
                }
            }).then(res => res.data)
            
            console.log('VAPI response:', campaign);
            resolve(campaign);
        } catch (err) {
            console.error('VAPI campaign creation error:', err);
            console.error('Error response:', err.response?.data);
            reject(err);
        }
    })
}

async function getVapiCampaign(campaign_id) {
    try {
        const campaign = await axios.get(`https://api.vapi.ai/campaign/${campaign_id}`,
            {
                headers: {
                    Authorization: `Bearer ${VAPI_API_KEY}`
                }
            }
        ).then(res => res.data);
        return campaign
    } catch (err) {
        return null;
    }
}

async function getCampaignName(business_context, target_audience) {
    // Configure OpenAI with proxy if available
    const openaiConfig = {
        apiKey: process.env.OPENAI_API_KEY,
    };
    
    // Add proxy configuration if available
    if (process.env.SOCKS_PROXY_URL) {
        console.log('Using SOCKS proxy for OpenAI:', process.env.SOCKS_PROXY_URL);
        const agent = new SocksProxyAgent(process.env.SOCKS_PROXY_URL);
        openaiConfig.httpAgent = agent;
        openaiConfig.httpsAgent = agent;
    }
    
    const openai = new OpenAI(openaiConfig);
    
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o', // Or 'gpt-4o', etc.
            messages: [
                {
                    role: 'user', content: `Generate a creative and compelling campaign name based on the following details:
Business Context: ${business_context}
Target Audience: ${target_audience}
(e.g. Dental Practice Outreach, B2B Software Demo Campaign, Real Estate Investment)
Only return campaign name without any unnecessary words or beginning statement.`
                },
            ],
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        return null;
    }
}

module.exports = { getCampaignName, getVapiCampaign, createVapiCampaign };