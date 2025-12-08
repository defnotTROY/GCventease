/**
 * Application Configuration
 * Centralized configuration for app metadata and versioning
 */

export const appConfig = {
    name: 'EventEase',
    version: '2.0.0', // Angular version
    description: 'A Smart Event Management and Engagement Platform Using AI and Cloud Integration',
    features: {
        aiEnabled: true,
        cloudEnabled: true,
        aiProvider: 'gemini' // Changed from OpenAI to Gemini
    },
    qrCode: {
        useTimestamp: true,
        fallbackVersion: '2.0'
    }
};

export function getAppVersion(): string {
    return `v${appConfig.version}`;
}

export function getFooterText(): string {
    const features = [];
    if (appConfig.features.aiEnabled) features.push('AI');
    if (appConfig.features.cloudEnabled) features.push('Cloud');

    return features.length > 0
        ? `Powered by ${features.join(' & ')}`
        : 'Powered by EventEase';
}

export function getQRCodeVersion(): string {
    if (appConfig.qrCode.useTimestamp) {
        return new Date().toISOString();
    }
    return appConfig.qrCode.fallbackVersion;
}
