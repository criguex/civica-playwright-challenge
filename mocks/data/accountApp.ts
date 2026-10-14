/**
 * Fixture for the web-exposure audit POC (docs/AUDIT-POC.md, POC 1).
 *
 * A fictitious "account dashboard" with two API responses that model the two
 * ends of the same bug class: `profile` leaks PII/secrets and ships with none
 * of the baseline security headers or cookie flags; `safe` is the same shape
 * with the fix applied. Running the scanner over both is the demonstration —
 * loud findings on one, a clean report on the other. All values are
 * fabricated (test card, example.com email) per the repo's public-repo rule.
 */
export const fictitiousCustomer = {
  fullName: 'Jordan Rivera',
  email: 'jordan.rivera@example.com',
  phone: '+1 555-0147',
  documentId: 'DOC-20451178',
  cardNumber: '4111 1111 1111 1111',
  debugToken: 'sk_test_FAKE1234567890abcdef',
  debugJwt: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZW1vLXVzZXIiLCJyb2xlIjoiYWRtaW4ifQ.FAKESIGNATURE',
};

export const INSECURE_RESPONSE_HEADERS: Readonly<Record<string, string>> = {
  'content-type': 'application/json; charset=utf-8',
};

export const SECURE_RESPONSE_HEADERS: Readonly<Record<string, string>> = {
  'content-type': 'application/json; charset=utf-8',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  'x-content-type-options': 'nosniff',
};

export const INSECURE_COOKIE_NAME = 'session_id';
export const INSECURE_COOKIE = `${INSECURE_COOKIE_NAME}=9f8a7b6c5d4e3f2a1b0c; Path=/`;

export const SECURE_COOKIE_NAME = 'safe_session';
export const SECURE_COOKIE = `${SECURE_COOKIE_NAME}=1c0b2a1e3f4d5c6b7a8f; Path=/; Secure; HttpOnly; SameSite=Strict`;

/** The vulnerable response: raw PII and a debug token/JWT in the body. */
export function renderProfileResponse(): string {
  return JSON.stringify({
    fullName: fictitiousCustomer.fullName,
    email: fictitiousCustomer.email,
    phone: fictitiousCustomer.phone,
    documentId: fictitiousCustomer.documentId,
    cardNumber: fictitiousCustomer.cardNumber,
    debugToken: fictitiousCustomer.debugToken,
    debugJwt: fictitiousCustomer.debugJwt,
  });
}

/** The fixed response: masked card, no raw PII, no debug fields. */
export function renderSafeResponse(): string {
  return JSON.stringify({
    fullName: fictitiousCustomer.fullName,
    maskedCard: '**** **** **** 1111',
    status: 'ok',
  });
}

/** Dashboard document: triggers both API calls; its status text flips once both resolve. */
export function renderDashboardHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Account dashboard (demo)</title>
  </head>
  <body>
    <h1>Account dashboard</h1>
    <p id="status">loading…</p>
    <script>
      Promise.all([fetch('/api/account/profile'), fetch('/api/account/safe')]).then(() => {
        document.getElementById('status').textContent = 'loaded';
      });
    </script>
  </body>
</html>`;
}
