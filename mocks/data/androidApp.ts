/**
 * Fixtures for the mobile-audit POC (docs/AUDIT-POC.md, POC 2) — the shape a
 * decoded manifest/resources dump takes once `rea inspect-android-package` /
 * `rea decode-android-resources` has run against a real APK (see the doc for
 * the exact mapping). `sampleVulnerableManifest` plants one issue per check
 * the analyzer knows about; `sampleHardenedManifest` is the fixed baseline
 * POC 3 mutates to measure the analyzer's kill rate. Package/strings are
 * entirely fictitious.
 */
export interface DecodedComponent {
  readonly type: 'activity' | 'service' | 'receiver' | 'provider';
  readonly name: string;
  readonly exported: boolean;
  readonly hasIntentFilter: boolean;
}

export interface DecodedManifest {
  readonly packageName: string;
  readonly versionName: string;
  readonly debuggable: boolean;
  readonly usesCleartextTraffic: boolean;
  readonly permissions: readonly string[];
  readonly components: readonly DecodedComponent[];
}

export const sampleVulnerableManifest: DecodedManifest = {
  packageName: 'com.example.ficticia.walletdemo',
  versionName: '1.4.2-demo',
  debuggable: true,
  usesCleartextTraffic: true,
  permissions: [
    'android.permission.INTERNET',
    'android.permission.READ_SMS',
    'android.permission.READ_CONTACTS',
    'android.permission.CAMERA',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.SYSTEM_ALERT_WINDOW',
  ],
  components: [
    { type: 'activity', name: '.MainActivity', exported: true, hasIntentFilter: true },
    { type: 'activity', name: '.debug.AdminPanelActivity', exported: true, hasIntentFilter: false },
    {
      type: 'service',
      name: '.sync.BackgroundSyncService',
      exported: true,
      hasIntentFilter: false,
    },
    {
      type: 'provider',
      name: '.data.WalletContentProvider',
      exported: true,
      hasIntentFilter: false,
    },
    {
      type: 'receiver',
      name: '.boot.BootCompletedReceiver',
      exported: false,
      hasIntentFilter: true,
    },
  ],
};

export const sampleVulnerableStrings: readonly string[] = [
  'app_name=Wallet Demo (ficticio)',
  'api_base_url=http://api.walletdemo.example.com',
  'support_email=support@walletdemo.example.com',
  'aws_access_key=AKIAFAKEEXAMPLE123456',
  'stripe_secret=sk_test_FAKE1234567890abcdef',
  'debug_jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZW1vIn0.FAKESIGNATURE123',
  'privacy_policy_url=https://walletdemo.example.com/privacy',
];

/** The same fictitious app, hardened — the baseline POC 3's mutants start from. */
export const sampleHardenedManifest: DecodedManifest = {
  packageName: 'com.example.ficticia.walletdemo',
  versionName: '2.0.0-demo',
  debuggable: false,
  usesCleartextTraffic: false,
  permissions: ['android.permission.INTERNET'],
  components: [
    { type: 'activity', name: '.MainActivity', exported: true, hasIntentFilter: true },
    {
      type: 'service',
      name: '.sync.BackgroundSyncService',
      exported: false,
      hasIntentFilter: false,
    },
    {
      type: 'provider',
      name: '.data.WalletContentProvider',
      exported: false,
      hasIntentFilter: false,
    },
    {
      type: 'receiver',
      name: '.boot.BootCompletedReceiver',
      exported: false,
      hasIntentFilter: true,
    },
  ],
};

export const sampleHardenedStrings: readonly string[] = [
  'app_name=Wallet Demo (ficticio)',
  'api_base_url=https://api.walletdemo.example.com',
  'support_email=support@walletdemo.example.com',
  'privacy_policy_url=https://walletdemo.example.com/privacy',
];
