const axios = require("axios");

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Check if required environment variables are set
if (!VAPI_API_KEY) {
    console.error('VAPI_API_KEY environment variable is not set');
}

if (!accountSid) {
    console.error('TWILIO_ACCOUNT_SID environment variable is not set');
}

if (!authToken) {
    console.error('TWILIO_AUTH_TOKEN environment variable is not set');
}

const twilioToken = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

async function getVapiPhone(phone_id) {
    try {
        const phone = await axios.get(`https://api.vapi.ai/phone-number/${phone_id}`, {
            headers: {
                Authorization: `Bearer ${VAPI_API_KEY}`,
                "Content-Type": "application/json",
            }
        }).then(res => res.data);
        return phone;
    } catch (_) {
        return null;
    }
}

async function getAvailableNumbers(country = "US") {
    try {
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/AvailablePhoneNumbers/${country}/Local.json`,
            {
                headers: {
                    Authorization: `Basic ${twilioToken}`,
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

async function getIncomingNumbers() {
    try {
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`,
            {
                headers: {
                    Authorization: `Basic ${twilioToken}`,
                },
            }
        );

        const data = await response.json();
        return data.incoming_phone_numbers || [];
    } catch (error) {
        console.error("Failed to refresh available numbers:", error);
        return [];
    }
}

async function createVapiPhone(phoneNumber, assistantId = null) {
    try {
        console.log('Creating VAPI phone with payload:', {
            provider: 'twilio',
            number: phoneNumber,
            twilioAccountSid: accountSid ? '***' : 'MISSING',
            twilioAuthToken: authToken ? '***' : 'MISSING',
            assistantId: assistantId || 'NOT_PROVIDED'
        });
        
        const payload = {
            provider: 'twilio',
            number: phoneNumber,
            twilioAccountSid: accountSid,
            twilioAuthToken: authToken,
        };
        
        // Only add assistantId if provided
        if (assistantId) {
            payload.assistantId = assistantId;
        }
        
        console.log('Making VAPI API request...');
        const phone = await axios.post(`https://api.vapi.ai/phone-number`, payload, {
            headers: {
                Authorization: `Bearer ${VAPI_API_KEY}`,
                "Content-Type": "application/json",
            },
        }).then(res => res.data);
        
        console.log('VAPI API response:', phone);
        return phone;
    } catch (error) {
        console.error('Failed to create VAPI phone:', error.response?.data || error.message);
        return null;
    }
}

async function deleteVapiPhone(phone_id) {
    try {
        await axios.delete(`https://api.vapi.ai/phone-number/${phone_id}`, {
            headers: {
                Authorization: `Bearer ${VAPI_API_KEY}`,
                "Content-Type": "application/json",
            }
        });
        return true;
    } catch (error) {
        console.error('Failed to delete VAPI phone:', error);
        return false;
    }
}

async function provisionNumber(phoneNumber) {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch(
                `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Basic ${twilioToken}`,
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        PhoneNumber: phoneNumber,
                    }),
                }
            );

            const data = await response.json();
            resolve(data);
        } catch (err) {
            reject(err);
        }
    })
}

module.exports = { getVapiPhone, getAvailableNumbers, getIncomingNumbers, createVapiPhone, deleteVapiPhone, provisionNumber }