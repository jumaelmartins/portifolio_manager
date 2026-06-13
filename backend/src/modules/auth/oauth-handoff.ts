export type OauthHandoffInput = {
  callbackUrl: string;
  token: string;
  state: string;
  nonce: string;
};

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function renderOauthHandoff({
  callbackUrl,
  token,
  state,
  nonce,
}: OauthHandoffInput): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Completing sign in</title></head>
<body>
<form id="oauth-handoff" method="post" action="${escapeAttribute(callbackUrl)}">
<input type="hidden" name="token" value="${escapeAttribute(token)}">
<input type="hidden" name="state" value="${escapeAttribute(state)}">
<noscript><button type="submit">Continue</button></noscript>
</form>
<script nonce="${escapeAttribute(nonce)}">document.getElementById("oauth-handoff").submit();</script>
</body>
</html>`;
}
