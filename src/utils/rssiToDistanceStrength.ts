export function rssiToDistanceStrength(rssi: number) {
    const RSSI_NEAR = -30;  // strongest
    const RSSI_FAR = -70;   // weakest

    // Clamp value so output always stays between 0–100
    const strength = ((rssi - RSSI_FAR) / (RSSI_NEAR - RSSI_FAR)) * 100;
    return Math.max(0, Math.min(100, strength));
}