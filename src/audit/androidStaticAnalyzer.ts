import type { DecodedComponent, DecodedManifest } from '../../mocks/data/androidApp.js';
import { findSecrets } from './secretPatterns.js';
import { buildAuditReport, type AuditFinding, type AuditReport, type Severity } from './types.js';

/**
 * Static analyzer for a decoded Android manifest + string-resource dump —
 * the mobile half of the audit POCs (docs/AUDIT-POC.md, POC 2). Takes the
 * already-decoded shape `rea inspect-android-package` /
 * `rea decode-android-resources` produce for a real APK (see the doc for the
 * field mapping); never executes or installs anything.
 */
const DANGEROUS_PERMISSION_SEVERITY: Record<string, Severity> = {
  'android.permission.READ_SMS': 'high',
  'android.permission.RECEIVE_SMS': 'high',
  'android.permission.READ_CALL_LOG': 'high',
  'android.permission.RECORD_AUDIO': 'high',
  'android.permission.SYSTEM_ALERT_WINDOW': 'high',
  'android.permission.ACCESS_BACKGROUND_LOCATION': 'high',
  'android.permission.READ_CONTACTS': 'medium',
  'android.permission.CAMERA': 'medium',
  'android.permission.ACCESS_FINE_LOCATION': 'medium',
};

const COMPONENT_BASE_SEVERITY: Record<DecodedComponent['type'], Severity> = {
  provider: 'critical',
  service: 'high',
  receiver: 'medium',
  activity: 'medium',
};

export function flagDangerousPermissions(manifest: DecodedManifest): AuditFinding[] {
  return manifest.permissions
    .filter((permission) => permission in DANGEROUS_PERMISSION_SEVERITY)
    .map((permission) => ({
      id: `dangerous-permission:${manifest.packageName}:${permission}`,
      category: 'dangerous-permission',
      severity: DANGEROUS_PERMISSION_SEVERITY[permission],
      title: `Dangerous permission declared: ${permission}`,
      description: 'This permission grants access to sensitive user data or device capabilities.',
      location: manifest.packageName,
      evidence: permission,
    }));
}

export function flagExportedComponents(manifest: DecodedManifest): AuditFinding[] {
  return manifest.components
    .filter((component) => component.exported)
    .map((component) => {
      const looksLikeDeepLink = component.type === 'activity' && component.hasIntentFilter;
      const severity: Severity = looksLikeDeepLink
        ? 'info'
        : COMPONENT_BASE_SEVERITY[component.type];
      const description = looksLikeDeepLink
        ? 'Exported with an intent filter — the expected shape for a deep-link/launcher entry point. Still worth verifying it never trusts caller-supplied data without validation.'
        : `Exported ${component.type} with no intent filter: any app on the device can invoke it directly.`;

      return {
        id: `exported-component:${manifest.packageName}:${component.type}:${component.name}`,
        category: 'exported-component',
        severity,
        title: `Exported ${component.type}: ${component.name}`,
        description,
        location: manifest.packageName,
        evidence: `${component.type} ${component.name} exported=true intentFilter=${component.hasIntentFilter}`,
      };
    });
}

export function flagCleartextTraffic(manifest: DecodedManifest): AuditFinding[] {
  if (!manifest.usesCleartextTraffic) {
    return [];
  }
  return [
    {
      id: `cleartext-traffic:${manifest.packageName}`,
      category: 'cleartext-traffic',
      severity: 'high',
      title: 'android:usesCleartextTraffic is true',
      description:
        'The app may send network traffic over plain HTTP, exposed to on-path tampering/eavesdropping.',
      location: manifest.packageName,
      evidence: 'usesCleartextTraffic=true',
    },
  ];
}

export function flagDebuggableBuild(manifest: DecodedManifest): AuditFinding[] {
  if (!manifest.debuggable) {
    return [];
  }
  return [
    {
      id: `debuggable-build:${manifest.packageName}`,
      category: 'debuggable-build',
      severity: 'high',
      title: 'android:debuggable is true',
      description:
        'A debugger can attach to this build on a device, inspecting memory and bypassing client-side checks.',
      location: manifest.packageName,
      evidence: 'debuggable=true',
    },
  ];
}

export function flagHardcodedSecrets(
  packageName: string,
  strings: readonly string[],
): AuditFinding[] {
  return strings.flatMap((entry, index) =>
    findSecrets(entry).map((match) => ({
      id: `hardcoded-secret:${packageName}:${match.kind}:${index}`,
      category: 'hardcoded-secret',
      severity: 'critical' as const,
      title: `${match.label} hardcoded in string resources`,
      description: `A ${match.label} was found in a decoded string resource instead of being fetched/configured at runtime.`,
      location: packageName,
      evidence: entry,
    })),
  );
}

export function auditAndroidPackage(
  manifest: DecodedManifest,
  strings: readonly string[],
): AuditReport {
  const findings: AuditFinding[] = [
    ...flagDangerousPermissions(manifest),
    ...flagExportedComponents(manifest),
    ...flagCleartextTraffic(manifest),
    ...flagDebuggableBuild(manifest),
    ...flagHardcodedSecrets(manifest.packageName, strings),
  ];

  return buildAuditReport(`Android package — ${manifest.packageName}`, findings);
}
