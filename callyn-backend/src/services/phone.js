const db = require('../db/sqlite');
const { getVapiPhone, deleteVapiPhone } = require('../utils/phone');

// Get all phones for a user with VAPI details
function getPhonesByUserId(user_id) {
  return new Promise(async (resolve, reject) => {
    try {
      db.all(
        "SELECT * FROM phones WHERE user_id = ? ORDER BY created_at DESC",
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
                  updated_at_vapi: vapiDetails?.updatedAt || null
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
                  updated_at_vapi: null
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

module.exports = {
  getPhonesByUserId,
  addPhoneForUser,
  deletePhoneForUser
};