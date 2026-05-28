const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const excelPath = path.join(__dirname, 'data', 'inventory.xlsx');
let syncTimeout;
let lastSyncTime = 0;

console.log('📁 Starting Excel file watcher...');
console.log(`📍 Watching: ${excelPath}\n`);

// Watch for changes
fs.watch(excelPath, (eventType, filename) => {
  // Debounce: only sync if 2 seconds have passed since last sync
  const now = Date.now();
  if (now - lastSyncTime < 2000) {
    return;
  }

  // Clear previous timeout
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  // Wait 1 second to ensure file is fully written
  syncTimeout = setTimeout(async () => {
    try {
      lastSyncTime = Date.now();
      const timestamp = new Date().toLocaleTimeString();
      console.log(`\n[${timestamp}] 📝 Excel file changed, syncing database...`);

      // Run sync script
      execSync('node sync-database.js', { stdio: 'inherit' });

      console.log(`[${timestamp}] ✅ Database synced successfully!\n`);
    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString()}] ❌ Sync failed:`, error.message);
    }
  }, 1000);
});

console.log('✓ Watcher active. Edit the Excel file to auto-sync the database.\n');
console.log('Press Ctrl+C to stop watching.\n');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Watcher stopped.');
  process.exit(0);
});
