const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const {
  getTodayString,
  backupExistsForToday,
  pruneOldBackups,
  performBackup,
} = require('../../src/utils/backupManager');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'backup-test-'));
}

function touchBackup(dir, date) {
  fs.writeFileSync(path.join(dir, `tasks-backup-${date}.db.gz`), '');
}

describe('getTodayString', () => {
  it('returns YYYY-MM-DD format', () => {
    expect(getTodayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('backupExistsForToday', () => {
  it('returns false when no backup exists', () => {
    const dir = makeTempDir();
    expect(backupExistsForToday(dir, '2026-07-03')).toBe(false);
  });

  it('returns true when today backup exists', () => {
    const dir = makeTempDir();
    touchBackup(dir, '2026-07-03');
    expect(backupExistsForToday(dir, '2026-07-03')).toBe(true);
  });
});

describe('pruneOldBackups', () => {
  it('does nothing when at or under keepCount', () => {
    const dir = makeTempDir();
    ['2026-07-01', '2026-07-02', '2026-07-03'].forEach(d => touchBackup(dir, d));
    pruneOldBackups(dir, 5);
    const backupFiles = fs.readdirSync(dir).filter(f => /\.db\.gz$/.test(f));
    expect(backupFiles).toHaveLength(3);
  });

  it('deletes oldest files when over keepCount', () => {
    const dir = makeTempDir();
    const dates = ['2026-06-28', '2026-06-29', '2026-06-30', '2026-07-01', '2026-07-02', '2026-07-03'];
    dates.forEach(d => touchBackup(dir, d));
    pruneOldBackups(dir, 5);
    const remaining = fs.readdirSync(dir).sort();
    expect(remaining).toHaveLength(5);
    expect(remaining[0]).toBe('tasks-backup-2026-06-29.db.gz');
  });

  it('ignores non-matching filenames', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'something-else.txt'), '');
    touchBackup(dir, '2026-07-03');
    pruneOldBackups(dir, 5);
    expect(fs.existsSync(path.join(dir, 'something-else.txt'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'tasks-backup-2026-07-03.db.gz'))).toBe(true);
  });
});

describe('performBackup', () => {
  it('skips when today backup already exists', async () => {
    const dir = makeTempDir();
    const today = getTodayString();
    const backupDir = path.join(dir, 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    touchBackup(backupDir, today);
    const db = { backup: jest.fn() };
    await performBackup(db, dir);
    expect(db.backup).not.toHaveBeenCalled();
  });

  it('creates a .gz backup and removes the raw .db temp file', async () => {
    const dir = makeTempDir();
    const today = getTodayString();

    // Mock db.backup() to write a small SQLite-like file
    const db = {
      backup: jest.fn(async (destPath) => {
        fs.writeFileSync(destPath, 'fake-sqlite-data');
      }),
    };

    await performBackup(db, dir);

    const backupDir = path.join(dir, 'backups');
    const gzFile = path.join(backupDir, `tasks-backup-${today}.db.gz`);
    const rawFile = path.join(backupDir, `tasks-backup-${today}.db`);

    expect(fs.existsSync(gzFile)).toBe(true);
    expect(fs.existsSync(rawFile)).toBe(false);

    // Verify the gz file is valid gzip
    const content = fs.readFileSync(gzFile);
    expect(content[0]).toBe(0x1f); // gzip magic byte
    expect(content[1]).toBe(0x8b);
  });

  it('cleans up raw .db temp file even if compression fails', async () => {
    const dir = makeTempDir();
    const today = getTodayString();

    const db = {
      backup: jest.fn(async (destPath) => {
        fs.writeFileSync(destPath, 'fake-data');
      }),
    };

    // Force a compression failure by mocking createReadStream to throw
    const originalCreateReadStream = fs.createReadStream;
    jest.spyOn(fs, 'createReadStream').mockImplementationOnce(() => {
      const { Readable } = require('stream');
      const r = new Readable({ read() {} });
      process.nextTick(() => r.destroy(new Error('mock read error')));
      return r;
    });

    const backupDir = path.join(dir, 'backups');

    await expect(performBackup(db, dir)).rejects.toThrow('mock read error');

    const rawFile = path.join(backupDir, `tasks-backup-${today}.db`);
    expect(fs.existsSync(rawFile)).toBe(false);

    fs.createReadStream.mockRestore();
  });
});
