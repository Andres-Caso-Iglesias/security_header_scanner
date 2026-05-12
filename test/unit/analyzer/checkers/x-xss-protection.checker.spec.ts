import { XXssProtectionChecker } from '../../../../src/analyzer/checkers/x-xss-protection.checker';

describe('XXssProtectionChecker', () => {
  let checker: XXssProtectionChecker;

  beforeEach(() => {
    checker = new XXssProtectionChecker();
  });

  it('should return grade 1.0 when missing (deprecated, CSP preferred)', () => {
    const result = checker.analyze(undefined);
    expect(result.present).toBe(false);
    expect(result.grade).toBe(1.0);
  });

  it('should return grade 1.0 for explicit disable (0)', () => {
    const result = checker.analyze('0');
    expect(result.grade).toBe(1.0);
  });

  it('should grade deprecated enable mode as low', () => {
    const result = checker.analyze('1; mode=block');
    expect(result.grade).toBe(0.3);
  });

  it('should have correct metadata', () => {
    expect(checker.name).toBe('X-XSS-Protection');
    expect(checker.severity).toBe('low');
    expect(checker.weight).toBe(5);
  });
});
