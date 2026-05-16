import { HistoryService } from '../../../src/history/history.service';

jest.mock('better-sqlite3', () => ({
  default: jest.fn(),
}));

function createStatement() {
  return {
    run: jest.fn().mockReturnValue({ lastInsertRowid: 1, changes: 1 }),
    get: jest.fn().mockReturnValue({ count: 0 }),
    all: jest.fn().mockReturnValue([]),
  };
}

describe('HistoryService', () => {
  let service: HistoryService;
  let mockDb: any;
  let prepareMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    prepareMock = jest.fn(createStatement);

    mockDb = {
      pragma: jest.fn(),
      exec: jest.fn(),
      prepare: prepareMock,
    };

    const betterSqlite3 = require('better-sqlite3');
    betterSqlite3.default.mockReturnValue(mockDb);

    service = new HistoryService();
    service.onModuleInit();
  });

  describe('onModuleInit', () => {
    it('initializes the database with WAL mode', () => {
      expect(mockDb.pragma).toHaveBeenCalledWith('journal_mode = WAL');
    });

    it('creates the scans table', () => {
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS scans'),
      );
    });

    it('creates the timestamp index', () => {
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_scans_timestamp'),
      );
    });
  });

  describe('save', () => {
    it('returns an object with id, url, score, grade, and timestamp', () => {
      const result = service.save(
        'https://example.com',
        85,
        'B',
        '2024-01-15T10:30:00.000Z',
        { some: 'data' },
      );

      expect(result).toMatchObject({
        id: 1,
        url: 'https://example.com',
        score: 85,
        grade: 'B',
        timestamp: '2024-01-15T10:30:00.000Z',
      });
    });

    it('stringifies the result object to JSON', () => {
      const data = { url: 'https://example.com', headers: [] };
      service.save('https://example.com', 85, 'B', '2024-01-15T10:30:00.000Z', data);

      const stmt = prepareMock.mock.results[0].value;
      expect(stmt.run).toHaveBeenCalledWith(
        'https://example.com',
        85,
        'B',
        '2024-01-15T10:30:00.000Z',
        JSON.stringify(data),
      );
    });
  });

  describe('list', () => {
    it('returns an object with entries and total', () => {
      const result = service.list();
      expect(result).toHaveProperty('entries');
      expect(result).toHaveProperty('total');
    });

    it('returns total count from the database', () => {
      const stmt = createStatement();
      stmt.get.mockReturnValue({ count: 42 });
      prepareMock.mockReturnValue(stmt);

      const result = service.list();
      expect(result.total).toBe(42);
    });

    it('accepts limit and offset parameters', () => {
      const stmt = createStatement();
      stmt.get.mockReturnValue({ count: 100 });
      stmt.all.mockReturnValue([
        { id: 1, url: 'https://example.com', score: 85, grade: 'B', timestamp: '2024-01-15T10:30:00.000Z' },
      ]);
      prepareMock.mockReturnValue(stmt);

      const result = service.list(5, 10);

      expect(stmt.all).toHaveBeenCalledWith(5, 10);
      expect(result.entries).toHaveLength(1);
      expect(result.total).toBe(100);
    });
  });

  describe('getById', () => {
    it('returns null for non-existent id', () => {
      const stmt = createStatement();
      stmt.get.mockReturnValue(undefined);
      prepareMock.mockReturnValue(stmt);

      const result = service.getById(999);
      expect(result).toBeNull();
    });

    it('returns the entry when found', () => {
      const entry = {
        id: 1,
        url: 'https://example.com',
        score: 85,
        grade: 'B',
        timestamp: '2024-01-15T10:30:00.000Z',
        result: '{"url":"https://example.com"}',
      };
      const stmt = createStatement();
      stmt.get.mockReturnValue(entry);
      prepareMock.mockReturnValue(stmt);

      const result = service.getById(1);
      expect(result).toEqual(entry);
    });
  });

  describe('delete', () => {
    it('returns true when record exists', () => {
      const stmt = createStatement();
      stmt.run.mockReturnValue({ lastInsertRowid: 1, changes: 1 });
      prepareMock.mockReturnValue(stmt);

      const result = service.delete(1);
      expect(result).toBe(true);
    });

    it('returns false when record does not exist', () => {
      const stmt = createStatement();
      stmt.run.mockReturnValue({ lastInsertRowid: 0, changes: 0 });
      prepareMock.mockReturnValue(stmt);

      const result = service.delete(999);
      expect(result).toBe(false);
    });
  });

  describe('deleteAll', () => {
    it('returns number of deleted records', () => {
      const stmt = createStatement();
      stmt.run.mockReturnValue({ lastInsertRowid: 0, changes: 7 });
      prepareMock.mockReturnValue(stmt);

      const result = service.deleteAll();
      expect(result).toBe(7);
    });

    it('returns 0 when there are no records', () => {
      const stmt = createStatement();
      stmt.run.mockReturnValue({ lastInsertRowid: 0, changes: 0 });
      prepareMock.mockReturnValue(stmt);

      const result = service.deleteAll();
      expect(result).toBe(0);
    });
  });
});
