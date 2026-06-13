import { isValidOauthState, renderOauthHandoff } from './oauth-handoff';

describe('isValidOauthState', () => {
  it.each([undefined, '', '   '])(
    'rejects missing or empty state: %p',
    (state) => {
      expect(isValidOauthState(state)).toBe(false);
    },
  );

  it('accepts a non-empty state', () => {
    expect(isValidOauthState('oauth-state')).toBe(true);
  });
});

describe('renderOauthHandoff', () => {
  it('posts the token and state without placing them in the action URL', () => {
    const html = renderOauthHandoff({
      callbackUrl: 'http://localhost:3001/api/auth/google/callback',
      token: 'jwt<&',
      state: 'state<&',
      nonce: 'nonce-value',
    });
    expect(html).toContain('method="post"');
    expect(html).toContain(
      'action="http://localhost:3001/api/auth/google/callback"',
    );
    expect(html).toContain('value="jwt&lt;&amp;"');
    expect(html).toContain('value="state&lt;&amp;"');
    expect(html).not.toContain('?token=');
  });
});
