import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, QrCode, Camera, CheckCircle, XCircle, AlertCircle, RefreshCw, Calendar, Users, Search, Filter, Shield, Clock, Mail, Phone, ArrowUp, ArrowDown, LogOut } from 'lucide-angular';
import { EventsService } from '../../../../core/services/events.service';
import { AuthService } from '../../../../core/services/auth.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ToastService } from '../../../../core/services/toast.service';
import { QRCodeService } from '../../../../core/services/qrcode.service';
import { QRCodeScannerComponent } from '../../../../shared/components/qr-code-scanner/qr-code-scanner.component';

@Component({
    selector: 'app-admin-qr-checkin',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, QRCodeScannerComponent],
    templateUrl: './admin-qr-checkin.component.html',
    styleUrl: './admin-qr-checkin.component.css'
})
export class AdminQRCheckInComponent implements OnInit {
    // Icons
    readonly QrCodeIcon = QrCode;
    readonly CameraIcon = Camera;
    readonly CheckCircleIcon = CheckCircle;
    readonly XCircleIcon = XCircle;
    readonly AlertCircleIcon = AlertCircle;
    readonly RefreshCwIcon = RefreshCw;
    readonly CalendarIcon = Calendar;
    readonly UsersIcon = Users;
    readonly SearchIcon = Search;
    readonly FilterIcon = Filter;
    readonly ShieldIcon = Shield;
    readonly ClockIcon = Clock;
    readonly MailIcon = Mail;
    readonly PhoneIcon = Phone;
    readonly ArrowUpIcon = ArrowUp;
    readonly ArrowDownIcon = ArrowDown;
    readonly LogOutIcon = LogOut;

    events: any[] = [];
    selectedEventId: string = '';
    selectedEvent: any = null;
    loading = true;
    user: any = null;

    participants: any[] = [];
    checkedInParticipants: any[] = [];
    filteredParticipants: any[] = []; // Calculated

    searchQuery = '';
    statusFilter = 'all';
    sortBy = 'time';

    scannerOpen = false;

    // Manual check-in modal
    showManualCheckInModal = false;
    manualCheckIn = {
        email: '',
        firstName: '',
        lastName: '',
        phone: ''
    };
    manualCheckInSubmitting = false;

    constructor(
        private eventsService: EventsService,
        private authService: AuthService,
        private supabase: SupabaseService,
        private toastService: ToastService,
        private qrCodeService: QRCodeService,
        private cdr: ChangeDetectorRef
    ) { }

    async ngOnInit() {
        this.user = await this.authService.getCurrentUser();
        if (this.user) {
            await this.loadEvents();
        }
    }

    async loadEvents() {
        try {
            this.loading = true;
            // In a real app, logic for admin vs organizer would filter this
            const { data } = await this.eventsService.getAllEvents();

            // Filter checkable events (today/ongoing/upcoming-soon)
            // Simplification: Showing all non-completed/cancelled for now, or just all
            this.events = data || [];

            // Sort: Ongoing/Today first
            this.events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            this.loading = false;
        } catch (error) {
            console.error('Error loading events:', error);
            this.toastService.error('Failed to load events');
            this.loading = false;
        }
    }

    onEventSelect() {
        this.selectedEvent = this.events.find(e => e.id === this.selectedEventId);
        if (this.selectedEventId) {
            this.loadParticipants();
        } else {
            this.participants = [];
            this.checkedInParticipants = [];
            this.updateFilteredParticipants();
        }
    }

    async loadParticipants() {
        if (!this.selectedEventId) return;

        try {
            const { data } = await this.eventsService.getEventParticipantsDetails(this.selectedEventId);
            this.participants = data || [];

            // Filter checked in
            this.checkedInParticipants = this.participants.filter(p => p.status === 'attended' || p.status === 'checked-in');

            this.updateFilteredParticipants();
        } catch (error) {
            console.error('Error loading participants:', error);
            this.toastService.error('Failed to load participants');
        }
    }

    updateFilteredParticipants() {
        let filtered = [...this.checkedInParticipants];

        // Search
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                (p.email && p.email.toLowerCase().includes(q)) ||
                (p.first_name && p.first_name.toLowerCase().includes(q)) ||
                (p.last_name && p.last_name.toLowerCase().includes(q))
            );
        }

        // Sort
        if (this.sortBy === 'time') {
            // Sort by updated_at or check-in-time
            filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        } else if (this.sortBy === 'name') {
            filtered.sort((a, b) => (a.first_name || '').localeCompare(b.first_name || ''));
        }

        this.filteredParticipants = filtered;
        this.cdr.detectChanges();
    }

    onScan(data: any) {
        if (data && data.type === 'user_profile' && data.email) {
            this.handleCheckIn(data.email, data.userId);
        } else {
            this.toastService.error('Invalid QR Code Type');
        }
    }

    async handleCheckIn(email: string, userId?: string) {
        if (!this.selectedEventId) {
            this.toastService.warning('Select an event first');
            return;
        }

        // Find participant
        let participant = this.participants.find(p => p.email.toLowerCase() === email.toLowerCase());

        // Logic from React: Check if exists, if so update to 'attended'. if check-in time logic needed, add it.

        try {
            if (participant) {
                if (participant.status === 'attended') {
                    this.toastService.warning(`${email} is already checked in.`);
                    return;
                }

                // Update
                const { error } = await this.eventsService.updateParticipantStatusById(participant.id, 'attended');
                if (error) throw error;

                this.toastService.success(`Checked in: ${participant.first_name} ${participant.last_name}`);
                await this.loadParticipants(); // Reload to refresh list
            } else {
                this.toastService.error(`Participant with email ${email} not found in this event.`);
            }
        } catch (error) {
            console.error('Check-in error:', error);
            this.toastService.error('Failed to check in participant');
        }
    }

    // Manual Check-in
    openManualCheckIn() {
        this.showManualCheckInModal = true;
    }

    closeManualCheckIn() {
        this.showManualCheckInModal = false;
        this.manualCheckIn = { email: '', firstName: '', lastName: '', phone: '' };
    }

    async submitManualCheckIn() {
        if (!this.manualCheckIn.email) return;
        this.manualCheckInSubmitting = true;
        await this.handleCheckIn(this.manualCheckIn.email); // Re-use logic
        this.manualCheckInSubmitting = false;
        this.closeManualCheckIn();
    }
}
