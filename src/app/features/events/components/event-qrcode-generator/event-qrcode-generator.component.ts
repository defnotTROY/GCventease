import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QRCodeService } from '../../../../core/services/qrcode.service';

@Component({
    selector: 'app-event-qrcode-generator',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './event-qrcode-generator.component.html',
    styles: []
})
export class EventQRCodeGeneratorComponent implements OnChanges {
    @Input() eventId: string | undefined;
    @Input() eventTitle: string | undefined;
    @Output() close = new EventEmitter<void>();

    qrCodeData: any = null;
    loading: boolean = true;
    error: string | null = null;
    copied: boolean = false;
    customMessage: string = '';

    constructor(private qrCodeService: QRCodeService) { }

    ngOnChanges(changes: SimpleChanges): void {
        if ((changes['eventId'] || changes['eventTitle']) && this.eventId && this.eventTitle) {
            this.generateEventQRCode();
        }
    }

    async generateEventQRCode() {
        if (!this.eventId || !this.eventTitle) return;

        try {
            this.loading = true;
            this.error = null;

            const qrData = await this.qrCodeService.generateEventCheckInQRCode(
                this.eventId,
                this.eventTitle
            );

            this.qrCodeData = qrData;
        } catch (error) {
            console.error('Error generating event QR code:', error);
            this.error = 'Failed to generate QR code';
        } finally {
            this.loading = false;
        }
    }

    async generateCustomQRCode() {
        if (!this.customMessage.trim()) {
            this.error = 'Please enter a custom message';
            return;
        }

        if (!this.eventId || !this.eventTitle) return;

        try {
            this.loading = true;
            this.error = null;

            const customData = {
                eventId: this.eventId,
                eventTitle: this.eventTitle,
                customMessage: this.customMessage,
                type: 'custom_event_message',
                timestamp: new Date().toISOString()
            };

            const qrData = await this.qrCodeService.generateStyledQRCode(customData);

            this.qrCodeData = {
                dataURL: qrData,
                data: JSON.stringify(customData),
                eventData: customData
            };
        } catch (error) {
            console.error('Error generating custom QR code:', error);
            this.error = 'Failed to generate custom QR code';
        } finally {
            this.loading = false;
        }
    }

    handleDownload() {
        if (this.qrCodeData) {
            const safeTitle = this.eventTitle?.replace(/[^a-zA-Z0-9]/g, '-') || 'event';
            this.qrCodeService.downloadQRCode(
                this.qrCodeData.dataURL,
                `eventease-event-qr-${safeTitle}.png`
            );
        }
    }

    async handleCopyData() {
        if (this.qrCodeData) {
            try {
                await navigator.clipboard.writeText(this.qrCodeData.data);
                this.copied = true;
                setTimeout(() => this.copied = false, 2000);
            } catch (error) {
                console.error('Error copying QR data:', error);
            }
        }
    }

    handleRefresh() {
        this.generateEventQRCode();
    }

    onClose(event?: Event) {
        if (event) {
            event.stopPropagation();
        }
        this.close.emit();
    }
}
