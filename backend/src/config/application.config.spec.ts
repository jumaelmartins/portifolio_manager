import {
  parseAllowedOrigins,
  setUploadSecurityHeaders,
} from './application.config';

describe('parseAllowedOrigins', () => {
  it('trims and removes empty origins', () => {
    expect(
      parseAllowedOrigins('http://localhost:3001, https://portfolio.test, '),
    ).toEqual(['http://localhost:3001', 'https://portfolio.test']);
  });
});

describe('setUploadSecurityHeaders', () => {
  it('prevents MIME sniffing and document execution for public uploads', () => {
    const response = { setHeader: jest.fn() };

    setUploadSecurityHeaders(response);

    expect(response.setHeader).toHaveBeenCalledWith(
      'X-Content-Type-Options',
      'nosniff',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      "sandbox; default-src 'none'",
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Referrer-Policy',
      'no-referrer',
    );
  });
});
