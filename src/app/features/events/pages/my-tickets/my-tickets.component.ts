import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, QrCode, Calendar, MapPin, Clock, Download, ExternalLink } from 'lucide-angular';
import { AuthService } from '../../../../core/services/auth.service';
import { EventsService } from '../../../../core/services/events.service';
import { QRCodeService } from '../../../../core/services/qrcode.service'; // Correct import path
import { AuthUser } from '../../../../core/services/supabase.service';

@Component({
    selector: 'app-my-tickets',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './my-tickets.component.html',
    styleUrls: ['./my-tickets.component.css']
})
export class MyTicketsComponent implements OnInit {
    user: AuthUser | null = null;
    qrCodeDataUrl: string | null = null;
    loading = true;
    loadingQr = true;

    // Events
    upcomingEvents: any[] = [];
    pastEvents: any[] = [];

    // Icons
    readonly QrCodeIcon = QrCode;
    readonly CalendarIcon = Calendar;
    readonly MapPinIcon = MapPin;
    readonly ClockIcon = Clock;
    readonly DownloadIcon = Download;
    readonly ExternalLinkIcon = ExternalLink;

    constructor(
        private authService: AuthService,
        private eventsService: EventsService,
        private qrCodeService: QRCodeService
    ) { }

    async ngOnInit() {
        this.user = await this.authService.getCurrentUser();
        if (this.user) {
            this.generateQrCode();
            this.loadMyEvents();
        } else {
            this.loading = false;
        }
    }

    async generateQrCode() {
        if (!this.user || !this.user.email) return;

        try {
            this.loadingQr = true;
            // Generate 'user_profile' type QR code
            const result = await this.qrCodeService.generateUserQRCode(this.user.id, this.user.email);
            this.qrCodeDataUrl = result.dataURL;
        } catch (error) {
            console.error('Error generating user QR:', error);
        } finally {
            this.loadingQr = false;
        }
    }

    async loadMyEvents() {
        if (!this.user) return;

        try {
            this.loading = true;
            const { data, error } = await this.eventsService.getUserRegistrations(this.user.id);

            if (error) throw error;

            if (data) {
                // Map and filter
                const allEvents = data.map((p: any) => ({
                    ...p.events,
                    participation_status: p.status
                })).filter(e => e !== null);

                this.upcomingEvents = allEvents.filter(e => {
                    const eventDate = new Date(e.date + 'T' + (e.time || '00:00'));
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return eventDate >= today;
                }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                this.pastEvents = allEvents.filter(e => {
                    const eventDate = new Date(e.date + 'T' + (e.time || '00:00'));
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return eventDate < today;
                });
            }

        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            this.loading = false;
        }
    }

    downloadQr() {
        if (this.qrCodeDataUrl) {
            this.qrCodeService.downloadQRCode(this.qrCodeDataUrl, `gcventease-qr-${this.user?.id}.png`);
        }
    }

    formatDate(date: string) {
        return this.eventsService.formatDate(date);
    }

    formatTime(time: string) {
        return this.eventsService.formatTime(time);
    }
}
