const sqlite3 = require("sqlite3").verbose()
const path = require('path')

const db = new sqlite3.Database(path.resolve(__dirname, './callyn.db'));

// Migration to remove unnecessary fields from assistants table
function migrateAssistantsTable() {
  console.log('Starting assistants table migration...');
  
  // Create a new table with only the necessary fields
  db.run(`
    CREATE TABLE IF NOT EXISTS assistants_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      assistant_id TEXT,
      name TEXT,
      voice TEXT,
      model TEXT,
      instructions TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `, (err) => {
    if (err) {
      console.error('Error creating new assistants table:', err);
      return;
    }
    
    console.log('New assistants table created successfully');
    
    // Copy data from old table to new table
    db.run(`
      INSERT INTO assistants_new (id, user_id, assistant_id, name, voice, model, instructions, timestamp)
      SELECT id, user_id, assistant_id, name, voice, model, instructions, timestamp
      FROM assistants;
    `, (err) => {
      if (err) {
        console.error('Error copying data:', err);
        return;
      }
      
      console.log('Data copied successfully');
      
      // Drop the old table
      db.run(`DROP TABLE assistants;`, (err) => {
        if (err) {
          console.error('Error dropping old table:', err);
          return;
        }
        
        console.log('Old assistants table dropped');
        
        // Rename new table to original name
        db.run(`ALTER TABLE assistants_new RENAME TO assistants;`, (err) => {
          if (err) {
            console.error('Error renaming table:', err);
            return;
          }
          
          console.log('Migration completed successfully!');
          db.close();
        });
      });
    });
  });
}

// Run the migration
migrateAssistantsTable();
