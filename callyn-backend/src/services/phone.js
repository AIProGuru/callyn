const db = require('../db/sqlite');
const { getVapiPhone, deleteVapiPhone, updateVapiPhone } = require('../utils/phone');

// Get all phones for a user with VAPI details
function getPhonesByUserId(user_id) {
  return new Promise(async (resolve, reject) => {
    try {
      db.all(
        "SELECT p.*, ps.fallback_number FROM phones p LEFT JOIN phone_settings ps ON p.user_id = ps.user_id AND p.phone_id = ps.phone_id WHERE p.user_id = ? ORDER BY p.created_at DESC",
        [user_id],
        async (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          // Fetch VAPI details for each phone
          const phonesWithVapiDetails = await Promise.all(
            rows.map(async (phone) => {
              try {
                const vapiDetails = await getVapiPhone(phone.phone_id);
                return {
                  ...phone,
                  vapi_details: vapiDetails,
                  // Add fallback properties if VAPI details are not available
                  number: vapiDetails?.number || phone.phone_id,
                  display_number: vapiDetails?.number || phone.phone_id,
                  status: vapiDetails?.status || 'unknown',
                  assistant_id: vapiDetails?.assistantId || null,
                  created_at_vapi: vapiDetails?.createdAt || null,
                  updated_at_vapi: vapiDetails?.updatedAt || null,
                  fallback_number: phone.fallback_number || null,
                };
              } catch (error) {
                console.error(`Failed to fetch VAPI details for phone ${phone.phone_id}:`, error);
                // Return phone with basic details if VAPI fetch fails
                return {
                  ...phone,
                  vapi_details: null,
                  number: phone.phone_id,
                  display_number: phone.phone_id,
                  status: 'unknown',
                  assistant_id: null,
                  created_at_vapi: null,
                  updated_at_vapi: null,
                  fallback_number: phone.fallback_number || null,
                };
              }
            })
          );

          resolve(phonesWithVapiDetails);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

// Add a new phone for a user
function addPhoneForUser(user_id, phone_id) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO phones (user_id, phone_id) VALUES (?, ?)",
      [user_id, phone_id],
      function(err) {
        if (err) reject(err);
        resolve({ id: this.lastID, user_id, phone_id });
      }
    );
  });
}

// Delete a phone for a user
function deletePhoneForUser(user_id, phone_id) {
  return new Promise(async (resolve, reject) => {
    try {
      // First try to delete from VAPI
      const vapiDeleted = await deleteVapiPhone(phone_id);
      
      // Then delete from database
      db.run(
        "DELETE FROM phones WHERE user_id = ? AND phone_id = ?",
        [user_id, phone_id],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          const dbDeleted = this.changes > 0;
          resolve({ 
            deleted: dbDeleted, 
            vapi_deleted: vapiDeleted 
          });
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

// Update inbound settings: assign assistant/workflow/fallback on VAPI and store fallback number locally
function updateInboundSettings(user_id, phone_id, { assistantId, workflowId, fallbackNumber }) {
  return new Promise(async (resolve, reject) => {
    try {
      // 1) Ensure the phone belongs to user
      db.all(
        "SELECT * FROM phones WHERE user_id = ? AND phone_id = ?",
        [user_id, phone_id],
        async (err, rows) => {
          if (err) return reject(err);
          if (!rows || rows.length === 0) return reject(new Error('Phone not found'));

          const hasVapiUpdate = Boolean((assistantId && assistantId.length) || (workflowId && workflowId.length) || (fallbackNumber && fallbackNumber.length));

          // 2) Update VAPI if any field is provided
          if (hasVapiUpdate) {
            const v = await updateVapiPhone(phone_id, { assistantId, workflowId, fallbackNumber });
            if (!v) {
              const e = new Error('VAPI update failed');
              // Attach status to let controller map to 400
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              e.status = 400;
              return reject(e);
            }
          }

          // 3) Persist fallback number locally (idempotent upsert)
          db.run(
            "CREATE TABLE IF NOT EXISTS phone_settings (user_id TEXT, phone_id TEXT, fallback_number TEXT, PRIMARY KEY (user_id, phone_id))",
            [],
            (createErr) => {
              if (createErr) return reject(createErr);
              db.run(
                "INSERT INTO phone_settings (user_id, phone_id, fallback_number) VALUES (?, ?, ?) ON CONFLICT(user_id, phone_id) DO UPDATE SET fallback_number=excluded.fallback_number",
                [user_id, phone_id, fallbackNumber || null],
                (upsertErr) => {
                  if (upsertErr) return reject(upsertErr);
                  resolve(true);
                }
              );
            }
          );
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  getPhonesByUserId,
  addPhoneForUser,
  deletePhoneForUser,
  updateInboundSettings
};