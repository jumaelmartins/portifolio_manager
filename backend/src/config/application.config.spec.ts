import { parseAllowedOrigins } from './application.config';

describe('parseAllowedOrigins', () => {
  it('trims and removes empty origins', () => {
    expect(
      parseAllowedOrigins('http://localhost:3001, https://portfolio.test, '),
    ).toEqual(['http://localhost:3001', 'https://portfolio.test']);
  });
});
