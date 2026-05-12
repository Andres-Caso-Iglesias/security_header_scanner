import { SetCookieChecker } from '../../../../src/analyzer/checkers/set-cookie.checker';

describe('SetCookieChecker', () => {
  let checker: SetCookieChecker;

  beforeEach(() => {
    checker = new SetCookieChecker();
  });

  it('should return grade 1.0 when no cookies present', () => {
    const result = checker.analyze(undefined);
    expect(result.grade).toBe(1.0);
    expect(result.present).toBe(false);
  });

  it('should return grade 1.0 for fully secure cookies', () => {
    const result = checker.analyze('sessionId=abc123; Secure; HttpOnly; SameSite=Lax');
    expect(result.grade).toBe(1.0);
  });

  it('should flag missing Secure flag', () => {
    const result = checker.analyze('sessionId=abc123; HttpOnly; SameSite=Lax');
    expect(result.grade).toBeLessThan(1.0);
    expect(result.finding).toContain('Secure');
  });

  it('should flag missing HttpOnly flag', () => {
    const result = checker.analyze('sessionId=abc123; Secure; SameSite=Lax');
    expect(result.grade).toBeLessThan(1.0);
  });

  it('should handle cookies with comma in expiration date', () => {
    const cookieWithDate = 'sessionId=abc123; Expires=Thu, 01 Jan 2026 00:00:00 GMT; Secure; HttpOnly; SameSite=Lax';
    const result = checker.analyze(cookieWithDate);
    expect(result.grade).toBe(1.0);
  });

  it('should have correct severity and weight', () => {
    expect(checker.severity).toBe('high');
    expect(checker.weight).toBe(15);
  });
});
