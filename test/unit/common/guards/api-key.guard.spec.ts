import { UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from '../../../../src/common/guards/api-key.guard';

jest.mock('../../../../src/common/config/security.config', () => {
  const actual = jest.requireActual('../../../../src/common/config/security.config');
  return {
    SECURITY: {
      ...actual.SECURITY,
      get API_KEY() { return process.env.API_KEY || ''; },
    },
  };
});

function createMockContext(headers: Record<string, string> = {}): any {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  };
}

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;

  beforeEach(() => {
    delete process.env.API_KEY;
    guard = new ApiKeyGuard();
  });

  describe('when API_KEY is not configured (empty)', () => {
    it('allows all requests', () => {
      const result = guard.canActivate(createMockContext({}));
      expect(result).toBe(true);
    });

    it('allows requests without any headers', () => {
      const result = guard.canActivate(createMockContext());
      expect(result).toBe(true);
    });
  });

  describe('when API_KEY is configured', () => {
    beforeEach(() => {
      process.env.API_KEY = 'my-secret-key';
    });

    it('blocks requests with missing X-API-Key header', () => {
      expect(() => guard.canActivate(createMockContext({}))).toThrow(UnauthorizedException);
    });

    it('blocks requests with incorrect X-API-Key header', () => {
      expect(() =>
        guard.canActivate(createMockContext({ 'x-api-key': 'wrong-key' })),
      ).toThrow(UnauthorizedException);
    });

    it('allows requests with matching X-API-Key header', () => {
      const result = guard.canActivate(createMockContext({ 'x-api-key': 'my-secret-key' }));
      expect(result).toBe(true);
    });
  });
});
