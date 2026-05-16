import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Database from 'better-sqlite3';
import * as path from 'path';

export interface HistoryEntry {
  id: number;
  url: string;
  score: number;
  grade: string;
  timestamp: string;
  result: string; // JSON string of full ScanResult
}

@Injectable()
export class HistoryService implements OnModuleInit {
  private readonly logger = new Logger(HistoryService.name);
  private db!: Database.Database;

  onModuleInit() {
    const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'scans.db');
    const dir = path.dirname(dbPath);

    try {
      const fs = require('fs');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch { /* ignore */ }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initialize();
    this.logger.log(`SQLite history database initialized at ${dbPath}`);
  }

  private initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        score INTEGER NOT NULL,
        grade TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        result TEXT NOT NULL
      )
    `);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_scans_timestamp ON scans(timestamp DESC)`);
  }

  save(url: string, score: number, grade: string, timestamp: string, result: object): HistoryEntry {
    const stmt = this.db.prepare(
      `INSERT INTO scans (url, score, grade, timestamp, result) VALUES (?, ?, ?, ?, ?)`
    );
    const info = stmt.run(url, score, grade, timestamp, JSON.stringify(result));
    return {
      id: info.lastInsertRowid as number,
      url,
      score,
      grade,
      timestamp,
      result: JSON.stringify(result),
    };
  }

  list(limit: number = 20, offset: number = 0): { entries: HistoryEntry[]; total: number } {
    const totalRow = this.db.prepare(`SELECT COUNT(*) as count FROM scans`).get() as { count: number };
    const rows = this.db.prepare(
      `SELECT id, url, score, grade, timestamp FROM scans ORDER BY timestamp DESC LIMIT ? OFFSET ?`
    ).all(limit, offset) as HistoryEntry[];

    return { entries: rows, total: totalRow.count };
  }

  getById(id: number): HistoryEntry | null {
    const row = this.db.prepare(`SELECT * FROM scans WHERE id = ?`).get(id) as HistoryEntry | undefined;
    return row || null;
  }

  delete(id: number): boolean {
    const info = this.db.prepare(`DELETE FROM scans WHERE id = ?`).run(id);
    return info.changes > 0;
  }

  deleteAll(): number {
    const info = this.db.prepare(`DELETE FROM scans`).run();
    return info.changes;
  }
}
