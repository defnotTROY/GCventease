import { Component, EventEmitter, OnDestroy, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, QrCode, Camera, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-angular';
// @ts-ignore
import jsqr from 'jsqr';
import { QRCodeService } from '../../../core/services/qrcode.service';

@Component({
    selector: 'app-qr-code-scanner',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './qr-code-scanner.component.html',
    styleUrl: './qr-code-scanner.component.css'
})
export class QRCodeScannerComponent implements OnDestroy {
    @Output() scan = new EventEmitter<any>();
    @Output() scanError = new EventEmitter<string>(); // Renamed from error to avoid conflict
    @Output() close = new EventEmitter<void>();

    @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
    @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

    isScanning = false;
    scannedData: any = null;
    error: string | null = null;
    hasPermission: boolean | null = null;
    stream: MediaStream | null = null;
    scanInterval: any = null;

    // Icons
    readonly QrCodeIcon = QrCode;
    readonly CameraIcon = Camera;
    readonly CheckCircleIcon = CheckCircle;
    readonly XCircleIcon = XCircle;
    readonly AlertCircleIcon = AlertCircle;
    readonly RefreshCwIcon = RefreshCw;

    constructor(private qrCodeService: QRCodeService) { }

    ngOnDestroy() {
        this.stopScanning();
    }

    async startScanning() {
        try {
            this.error = null;
            this.isScanning = true;

            // Request camera permission (using any for navigator constraints compatibility)
            const constraints: any = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            this.hasPermission = true;
            this.stream = stream;

            setTimeout(() => {
                if (this.videoRef && this.videoRef.nativeElement) {
                    const video = this.videoRef.nativeElement;
                    video.srcObject = stream;
                    video.setAttribute('playsinline', 'true'); // Required for iOS

                    video.onloadedmetadata = () => {
                        video.play().catch(e => console.error('Error playing video:', e));
                        // Start detection loop
                        this.detectQRCode();
                    };
                }
            }, 100);

        } catch (err) {
            console.error('Error accessing camera:', err);
            this.error = 'Camera access denied or not available';
            this.hasPermission = false;
            this.isScanning = false;
        }
    }

    stopScanning() {
        this.isScanning = false;

        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.videoRef && this.videoRef.nativeElement) {
            this.videoRef.nativeElement.srcObject = null;
        }
    }

    detectQRCode() {
        if (!this.videoRef?.nativeElement || !this.canvasRef?.nativeElement) return;

        const video = this.videoRef.nativeElement;
        const canvas = this.canvasRef.nativeElement;
        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (!context) return;

        this.scanInterval = setInterval(() => {
            if (!this.isScanning || video.readyState !== video.HAVE_ENOUGH_DATA) return;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

            const code = jsqr(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                console.log('QR Code detected:', code.data);
                this.processScannedData(code.data);
                // Pause scanning temporarily
                clearInterval(this.scanInterval);
            }
        }, 200);
    }

    processScannedData(data: string) {
        try {
            const parsedData = this.qrCodeService.parseQRCodeData(data);

            if (this.qrCodeService.validateQRCodeData(parsedData)) {
                this.scannedData = parsedData;
                this.error = null;
                this.scan.emit(parsedData);

                // Resume scanning after delay if needed, or wait for user action
                // For now, we keep it paused until "Scan Another" or "Done"
            } else {
                this.error = 'Invalid QR code format';
                this.scanError.emit('Invalid QR code format');
                // Resume scanning after error delay
                setTimeout(() => {
                    this.error = null;
                    if (this.isScanning) this.detectQRCode();
                }, 2000);
            }
        } catch (err) {
            this.error = 'Failed to parse QR code data';
            this.scanError.emit('Failed to parse QR code data');
            setTimeout(() => {
                this.error = null;
                if (this.isScanning) this.detectQRCode();
            }, 2000);
        }
    }

    resetScanner() {
        this.scannedData = null;
        this.error = null;
        // If stream is still active, just restart detection
        if (this.stream && this.stream.active) {
            this.detectQRCode();
        } else {
            this.startScanning();
        }
    }

    handleManualInput() {
        const qrData = prompt('Enter QR code data manually:');
        if (qrData) {
            this.processScannedData(qrData);
        }
    }

    getQRCodeTypeInfo(data: any) {
        if (data.type === 'user_profile') {
            return {
                title: 'User Profile',
                description: `User: ${data.email}`,
                icon: 'user', // We might need to map this to an icon component
                color: 'blue'
            };
        } else if (data.type === 'event_checkin') {
            return {
                title: 'Event Check-in',
                description: `Event: ${data.eventTitle}`,
                icon: 'ticket',
                color: 'green'
            };
        }
        return {
            title: 'Unknown QR Code',
            description: 'QR code type not recognized',
            icon: 'help-circle',
            color: 'gray'
        };
    }
}
