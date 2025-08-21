const db = require('../db/sqlite')

function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM users WHERE email = ?",
      [email],
      (err, row) => {
        if (err) reject(err);
        resolve(row);
      }
    );
  });
}

function getFirstAgentByUserId(user_id) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM assistants WHERE user_id = ? LIMIT 1",
      [user_id],
      (err, row) => {
        if (err) reject(err);
        resolve(row);
      }
    );
  });
}

function getAssistantsByUserId(user_id) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM assistants WHERE user_id = ? ORDER BY timestamp DESC",
      [user_id],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows || []);
      }
    );
  });
}

function updateAssistantByUserId(user_id, payload) {
  const { name, voice, model, instructions } = payload;
  return new Promise((resolve, reject) => [
    db.all(`UPDATE assistants 
        SET name = ?,
        voice = ?,
        model = ?,
        instructions = ?
        WHERE user_id = ?`, [name, voice, model, instructions, user_id
    ], (err) => {
      if (err) reject(err);
      resolve();
    })
  ])
}

module.exports = { getUserByEmail, getFirstAgentByUserId, getAssistantsByUserId, updateAssistantByUserId }