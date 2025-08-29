const { getPhonesByUserId, addPhoneForUser, deletePhoneForUser } = require('../services/phone');
const { updateInboundSettings } = require('../services/phone');
const { getAvailableNumbers, provisionNumber, createVapiPhone, getIncomingNumbers } = require('../utils/phone');

// GET /api/phone - Get all phones for the logged-in user
async function getPhones(req, res) {
  try {
    const { user_id } = req.user;
    const phones = await getPhonesByUserId(user_id);
    return res.status(200).json({ phones });
  } catch (err) {
    console.error('Get phones failed:', err);
    return res.status(500).json({ error: 'Failed to fetch phones' });
  }
}

// GET /api/phone/available - Get available phone numbers from Twilio
async function getAvailablePhones(req, res) {
  try {
    const { country = "US" } = req.query;
    const availableNumbers = await getAvailableNumbers(country);
    return res.status(200).json({ availableNumbers });
  } catch (err) {
    console.error('Get available phones failed:', err);
    return res.status(500).json({ error: 'Failed to fetch available phone numbers' });
  }
}

// GET /api/phone/existing - Get user's existing Twilio numbers
async function getExistingPhones(req, res) {
  try {
    const existingNumbers = await getIncomingNumbers();
    return res.status(200).json({ existingNumbers });
  } catch (err) {
    console.error('Get existing phones failed:', err);
    return res.status(500).json({ error: 'Failed to fetch existing phone numbers' });
  }
}

// POST /api/phone - Add a new phone for the logged-in user
async function addPhone(req, res) {
  try {
    const { user_id } = req.user;
    const { phone_id } = req.body;

    if (!phone_id) {
      return res.status(400).json({ error: 'Phone ID is required' });
    }

    const phone = await addPhoneForUser(user_id, phone_id);
    return res.status(201).json({ phone });
  } catch (err) {
    console.error('Add phone failed:', err);
    return res.status(500).json({ error: 'Failed to add phone' });
  }
}

// POST /api/phone/purchase - Purchase a new phone number
async function purchasePhone(req, res) {
  try {
    const { user_id } = req.user;
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Step 1: Provision the number with Twilio
    const provisionedNumber = await provisionNumber(phoneNumber);
    if (!provisionedNumber || provisionedNumber.error) {
      return res.status(400).json({ error: 'Failed to provision phone number with Twilio' });
    }

    // Step 2: Import the number to VAPI
    const vapiPhone = await createVapiPhone(phoneNumber);
    if (!vapiPhone || !vapiPhone.id) {
      return res.status(400).json({ error: 'Failed to import phone number to VAPI' });
    }

    // Step 3: Save the VAPI phone ID to our database
    const phone = await addPhoneForUser(user_id, vapiPhone.id);
    
    return res.status(201).json({ 
      phone, 
      provisionedNumber,
      vapiPhone 
    });
  } catch (err) {
    console.error('Purchase phone failed:', err);
    return res.status(500).json({ error: 'Failed to purchase phone number' });
  }
}

// POST /api/phone/import - Import an existing Twilio number to VAPI
async function importExistingPhone(req, res) {
  try {
    const { user_id } = req.user;
    const { phoneNumber } = req.body;

    console.log('Import request:', { user_id, phoneNumber });

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Import the existing number to VAPI
    console.log('Creating VAPI phone for:', phoneNumber);
    const vapiPhone = await createVapiPhone(phoneNumber);
    
    if (!vapiPhone) {
      console.error('VAPI phone creation returned null');
      return res.status(400).json({ error: 'Failed to import phone number to VAPI - no response from VAPI' });
    }
    
    if (!vapiPhone.id) {
      console.error('VAPI phone creation succeeded but no ID returned:', vapiPhone);
      return res.status(400).json({ error: 'Failed to import phone number to VAPI - no phone ID returned' });
    }

    console.log('VAPI phone created successfully:', vapiPhone.id);

    // Save the VAPI phone ID to our database
    const phone = await addPhoneForUser(user_id, vapiPhone.id);
    
    return res.status(201).json({ 
      phone, 
      vapiPhone 
    });
  } catch (err) {
    console.error('Import existing phone failed:', err);
    return res.status(500).json({ error: 'Failed to import existing phone number' });
  }
}

// DELETE /api/phone/:phone_id - Delete a phone for the logged-in user
async function deletePhone(req, res) {
  try {
    const { user_id } = req.user;
    const { phone_id } = req.params;

    const result = await deletePhoneForUser(user_id, phone_id);
    
    if (!result.deleted) {
      return res.status(404).json({ error: 'Phone not found' });
    }

    let message = 'Phone deleted successfully';
    if (!result.vapi_deleted) {
      message += ' (VAPI deletion failed, but removed from database)';
    }

    return res.status(200).json({ 
      message,
      vapi_deleted: result.vapi_deleted 
    });
  } catch (err) {
    console.error('Delete phone failed:', err);
    return res.status(500).json({ error: 'Failed to delete phone' });
  }
}

// PATCH /api/phone/:phone_id/inbound - Update inbound settings (assistant + fallback)
async function patchInboundSettings(req, res) {
  try {
    const { user_id } = req.user;
    const { phone_id } = req.params;
    const { assistantId, workflowId, fallbackNumber } = req.body || {};

    if (!assistantId && !workflowId && !fallbackNumber) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    await updateInboundSettings(user_id, phone_id, { assistantId, workflowId, fallbackNumber });
    return res.status(200).json({ message: 'Inbound settings updated' });
  } catch (err) {
    console.error('Update inbound settings failed:', err);
    const status = err?.status ? err.status : (String(err?.message || '').includes('Phone not found') ? 404 : 500);
    return res.status(status).json({ error: err?.message || 'Failed to update inbound settings' });
  }
}

module.exports = {
  getPhones,
  getAvailablePhones,
  addPhone,
  purchasePhone,
  deletePhone,
  getExistingPhones,
  importExistingPhone,
  patchInboundSettings
};