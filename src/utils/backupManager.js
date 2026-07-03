const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pipeline } = require('stream/promises');

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function getBackupDir(appDir) {
  return path.join(appDir, 'backups');
}

function ensureBackupDir(backupDir) {
  fs.mkdirSync(backupDir, { recursive: true });
}

function backupExistsForToday(backupDir, today) {
  return fs.existsSync(path.join(backupDir, `tasks-backup-${today}.db.gz`));
}

function pruneOldBackups(backupDir, keepCount = 5) {
  const files = fs.readdirSync(backupDir)
    .filter(f => /^tasks-backup-\d{4}-\d{2}-\d{2}\.db\.gz$/.test(f))
    .sort();
  const excess = files.length - keepCount;
  if (excess <= 0) return;
  const toDelete = files.slice(0, excess);
  for (const file of toDelete) {
    try {
      fs.unlinkSync(path.join(backupDir, file));
    } catch (err) {
      console.error(`Failed to delete old backup ${file}:`, err.message);
    }
  }
}

async function performBackup(db, appDir) {
  const today = getTodayString();
  const backupDir = getBackupDir(appDir);
  ensureBackupDir(backupDir);

  if (backupExistsForToday(backupDir, today)) return;

  const rawPath = path.join(backupDir, `tasks-backup-${today}.db`);
  const gzPath = rawPath + '.gz';

  try {
    await db.backup(rawPath);
    await pipeline(
      fs.createReadStream(rawPath),
      zlib.createGzip(),
      fs.createWriteStream(gzPath)
    );
  } finally {
    if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
  }

  pruneOldBackups(backupDir, 5);
  console.log(`Backup created: ${gzPath}`);
}

module.exports = { performBackup, pruneOldBackups, backupExistsForToday, getTodayString };
