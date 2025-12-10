/**
 * Application Configuration
 * Centralized configuration for app metadata and versioning
 */

export const appConfig = {
    name: 'EventEase',
    version: '1.0.0', // In Angular we might get this from package.json or environment, but hardcoding for parity
    description: 'A Smart Event Management and Engagement Platform Using AI and Cloud Integration',
    features: {
        aiEnabled: true,
        cloudEnabled: true
    },
    qrCode: {
        // Use timestamp for QR code versioning to ensure uniqueness
        useTimestamp: true,
        // Fallback version if timestamp not used
        fallbackVersion: '1.0'
    }
};

// Get formatted version string
export const getAppVersion = (): string => {
    return `v${appConfig.version}`;
};

// Get footer text
export const getFooterText = (): string => {
    const features: string[] = [];
    if (appConfig.features.aiEnabled) features.push('AI');
    if (appConfig.features.cloudEnabled) features.push('Cloud');

    return features.length > 0
        ? `Powered by ${features.join(' & ')}`
        : 'Powered by EventEase';
};

// Get QR code version
export const getQRCodeVersion = (): string => {
    if (appConfig.qrCode.useTimestamp) {
        return new Date().toISOString();
    }
    return appConfig.qrCode.fallbackVersion;
};
