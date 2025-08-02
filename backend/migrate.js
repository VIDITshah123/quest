const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const sqlite3 = require('sqlite3').verbose();

// Database configuration
const dbPath = path.join(__dirname, '..', 'db', 'questionbank.db');
const migrationsPath = path.join(__dirname, 'migrations');

// Create db directory if it doesn't exist
const dbDir = path.join(__dirname, '..', 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new sqlite3.Database(dbPath);

// Promisify database methods
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));

async function runMigrations() {
  try {
    // Create migrations table if it doesn't exist
    await run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of migration files
    const files = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files`);

    // Run each migration
    for (const file of files) {
      // Check if migration has already been run
      const migration = await get('SELECT * FROM migrations WHERE name = ?', [file]);
      
      if (!migration) {
        console.log(`Running migration: ${file}`);
        
        // Read and execute migration file
        const migrationSQL = fs.readFileSync(path.join(migrationsPath, file), 'utf8');
        const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
        
        // Execute each statement in the migration file
        for (const stmt of statements) {
          if (stmt.trim()) {
            await run(stmt);
          }
        }
        
        // Record migration
        await run('INSERT INTO migrations (name) VALUES (?)', [file]);
        console.log(`✓ ${file} completed successfully`);
      } else {
        console.log(`- ${file} already executed, skipping`);
      }
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run migrations
runMigrations();
