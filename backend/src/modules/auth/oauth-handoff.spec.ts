import { renderOauthHandoff } from './oauth-handoff';

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
