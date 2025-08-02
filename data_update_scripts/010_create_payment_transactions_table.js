/**
 * Migration script to create the base_payment_transactions table
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.resolve(__dirname, '../questionbank.db'));

// Create base_payment_transactions table
function up() {
  return new Promise((resolve, reject) => {
    console.log('Running migration: Create base_payment_transactions table');
    
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS base_payment_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          qr_code_id INTEGER NOT NULL,
          transaction_ref TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          verified INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          FOREIGN KEY (qr_code_id) REFERENCES base_payment_qr_codes (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating base_payment_transactions table:', err);
          reject(err);
          return;
        }
        
        // Create indexes for faster lookup
        db.run(`
          CREATE INDEX IF NOT EXISTS idx_base_payment_transactions_qr_code_id 
          ON base_payment_transactions (qr_code_id)
        `, (err) => {
          if (err) {
            console.error('Error creating index on qr_code_id:', err);
            reject(err);
            return;
          }
          
          db.run(`
            CREATE INDEX IF NOT EXISTS idx_base_payment_transactions_user_id 
            ON base_payment_transactions (user_id)
          `, (err) => {
            if (err) {
              console.error('Error creating index on user_id:', err);
              reject(err);
              return;
            }
            
            db.run(`
              CREATE INDEX IF NOT EXISTS idx_base_payment_transactions_verified 
              ON base_payment_transactions (verified)
            `, (err) => {
              if (err) {
                console.error('Error creating index on verified:', err);
                reject(err);
                return;
              }
              
              console.log('Successfully created base_payment_transactions table and indexes');
              resolve();
            });
          });
        });
      });
    });
  });
}

// Drop base_payment_transactions table
function down() {
  return new Promise((resolve, reject) => {
    console.log('Running migration: Drop base_payment_transactions table');
    
    db.run(`DROP TABLE IF EXISTS base_payment_transactions`, (err) => {
      if (err) {
        console.error('Error dropping base_payment_transactions table:', err);
        reject(err);
        return;
      }
      
      console.log('Successfully dropped base_payment_transactions table');
      resolve();
    });
  });
}

module.exports = {
  up,
  down
};
