import { HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from '../../../../src/common/filters/http-exception.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockGetResponse: jest.Mock;
  let mockGetRequest: jest.Mock;
  let mockHttpArgumentsHost: jest.Mock;
  let mockArgumentsHost: { switchToHttp: jest.Mock };

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
    mockGetRequest = jest.fn().mockReturnValue({ url: '/test' });
    mockHttpArgumentsHost = jest.fn().mockReturnValue({
      getResponse: mockGetResponse,
      getRequest: mockGetRequest,
    });
    mockArgumentsHost = { switchToHttp: mockHttpArgumentsHost };

    filter = new AllExceptionsFilter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns proper JSON structure with statusCode, message, error, timestamp, path', () => {
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockArgumentsHost as any);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Not found',
        error: 'HttpException',
        path: '/test',
      }),
    );

    const callArg = mockJson.mock.calls[0][0];
    expect(callArg).toHaveProperty('timestamp');
    expect(typeof callArg.timestamp).toBe('string');
  });

  it('preserves the original HttpException status code', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    filter.catch(exception, mockArgumentsHost as any);

    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 }),
    );
  });

  it('includes the exception message', () => {
    const exception = new HttpException('Custom error message', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockArgumentsHost as any);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Custom error message' }),
    );
  });

  it('includes the request path', () => {
    mockGetRequest.mockReturnValue({ url: '/api/users' });
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockArgumentsHost as any);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/users' }),
    );
  });

  it('has a timestamp in ISO format', () => {
    const exception = new HttpException('Error', HttpStatus.INTERNAL_SERVER_ERROR);

    filter.catch(exception, mockArgumentsHost as any);

    const callArg = mockJson.mock.calls[0][0];
    expect(callArg.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('handles non-HttpException errors gracefully with 500', () => {
    const error = new Error('Something went wrong');

    filter.catch(error, mockArgumentsHost as any);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      }),
    );
  });

  it('handles HttpException with object response including custom message and error', () => {
    const exception = new HttpException(
      { message: 'Validation failed', error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockArgumentsHost as any);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Validation failed',
        error: 'Bad Request',
      }),
    );
  });

  it('handles HttpException with string response correctly', () => {
    const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    filter.catch(exception, mockArgumentsHost as any);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Unauthorized',
        error: 'HttpException',
      }),
    );
  });

  it('includes a valid ISO timestamp in the response', () => {
    const exception = new HttpException('OK', HttpStatus.OK);

    filter.catch(exception, mockArgumentsHost as any);

    const callArg = mockJson.mock.calls[0][0];

    expect(() => new Date(callArg.timestamp)).not.toThrow();
    expect(new Date(callArg.timestamp).toISOString()).toBe(callArg.timestamp);
  });
});
