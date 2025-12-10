import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { EventsService } from '../../../../core/services/events.service';
import { StatusService } from '../../../../core/services/status.service';
import { VerificationService } from '../../../../core/services/verification.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthUser } from '../../../../core/services/supabase.service';
import { EventQRCodeGeneratorComponent } from '../../components/event-qrcode-generator/event-qrcode-generator.component';

@Component({
  selector: 'app-event-view',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, EventQRCodeGeneratorComponent],
  templateUrl: './event-view.component.html',
  styleUrl: './event-view.component.css'
})
export class EventViewComponent implements OnInit {
  event: any = null;
  loading: boolean = true;
  error: string | null = null;
  user: AuthUser | null = null;
  participantCount: number = 0;

  showQRCode: boolean = false;
  showRegistrationForm: boolean = false;
  showVerificationModal: boolean = false;

  isRegistered: boolean = false;
  isVerified: boolean | null = null;
  isAdmin: boolean = false;
  isOrganizerUser: boolean = false;
  isOwner: boolean = false;

  registrationData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };
  registering: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private authService: AuthService,
    private eventsService: EventsService,
    private statusService: StatusService,
    private verificationService: VerificationService,
    private toastService: ToastService
  ) { }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEventData(id);
    }
  }

  async loadEventData(id: string) {
    try {
      this.loading = true;

      // Get current user
      this.user = await this.authService.getCurrentUser();

      // Check roles
      if (this.user) {
        const role = this.user.user_metadata?.role;
        this.isAdmin = role === 'Administrator' || role === 'Admin' || role === 'admin';
        this.isOrganizerUser = role === 'Organizer' || role === 'organizer';
      }

      // Load event
      const { data: eventData, error } = await this.eventsService.getEventById(id);
      if (error) throw error;

      if (!eventData) {
        this.error = 'Event not found';
        return;
      }

      this.event = eventData;
      this.isOwner = this.user ? this.event.user_id === this.user.id : false;

      // Load participant count
      const { data: count } = await this.eventsService.getEventParticipants(id);
      this.participantCount = count || 0;

      if (this.user) {
        // Check registration
        const { isRegistered } = await this.eventsService.isUserRegistered(id, this.user.id);
        this.isRegistered = isRegistered;

        // Check verification (skip for admins)
        if (!this.isAdmin) {
          this.isVerified = await this.verificationService.isVerified(this.user.id);
        } else {
          this.isVerified = true;
        }

        // Pre-populate registration form
        this.registrationData = {
          firstName: this.user.user_metadata?.first_name || '',
          lastName: this.user.user_metadata?.last_name || '',
          email: this.user.email || '',
          phone: this.user.user_metadata?.phone || ''
        };
      }

    } catch (error: any) {
      console.error('Error loading event:', error);
      this.error = error.message || 'Failed to load event';
    } finally {
      this.loading = false;
    }
  }

  // ... (existing getters)

  navigateToSettings() {
    this.showVerificationModal = false;
    this.router.navigate(['/settings'], { queryParams: { tab: 'verification' } });
  }

  get currentStatus(): string {
    if (!this.event) return '';
    return this.statusService.calculateEventStatus(this.event);
  }

  async handleDeleteEvent() {
    const confirmed = confirm('Are you sure you want to delete this event? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const { error } = await this.eventsService.deleteEvent(this.event.id);
      if (error) throw error;

      this.toastService.success('Deleted', 'Event deleted successfully');
      this.router.navigate(['/events']);
    } catch (error: any) {
      console.error('Error deleting event:', error);
      this.toastService.error('Error', 'Unable to delete the event at this time.');
    }
  }

  async handleShareEvent() {
    const eventUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: this.event.title,
          text: this.event.description,
          url: eventUrl
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(eventUrl);
        this.toastService.success('Copied', 'Event link has been copied to your clipboard.');
      } catch (error) {
        console.error('Failed to copy fallback:', error);
      }
    }
  }

  async handleRegisterClick() {
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isAdmin) {
      this.toastService.info('Admin Access', 'Administrators cannot register for events.');
      return;
    }

    if (this.isOrganizerUser) {
      this.toastService.info('Organizer Access', 'Organizers cannot register for events (attendee only).');
      return;
    }

    if (this.event.status === 'completed' || this.event.status === 'cancelled') {
      this.toastService.warning('Closed', `Registration is closed. Event is ${this.event.status}.`);
      return;
    }

    // Verification check removed by user request
    /*
    if (this.isVerified === false) {
      this.showVerificationModal = true;
      return;
    }

    // Double check if null/undetermined
    if (this.isVerified === null && this.user) {
      const verified = await this.verificationService.isVerified(this.user.id);
      this.isVerified = verified;
      if (!verified) {
        this.showVerificationModal = true;
        return;
      }
    }
    */

    this.showRegistrationForm = true;
  }

  async handleRegistrationSubmit() {
    if (this.event && (this.event.status === 'completed' || this.event.status === 'cancelled')) {
      this.showRegistrationForm = false;
      this.toastService.error('Closed', `Cannot register. Event is ${this.event.status}.`);
      return;
    }

    if (!this.registrationData.firstName || !this.registrationData.lastName || !this.registrationData.email) {
      this.toastService.warning('Required Fields', 'Please complete all required fields.');
      return;
    }

    // Check verification again
    // Check verification again - REMOVED
    /*
    if (!this.isAdmin && this.isVerified === false) {
      this.showRegistrationForm = false;
      this.showVerificationModal = true;
      return;
    }
    */

    try {
      this.registering = true;

      const { error } = await this.eventsService.registerForEvent(this.event.id, {
        userId: this.user!.id,
        firstName: this.registrationData.firstName,
        lastName: this.registrationData.lastName,
        email: this.registrationData.email,
        phone: this.registrationData.phone
      });

      if (error) throw error;

      // Update count
      const { data: count } = await this.eventsService.getEventParticipants(this.event.id);
      this.participantCount = count || this.participantCount + 1;

      this.isRegistered = true;
      this.showRegistrationForm = false;

      this.toastService.success('Registered!', 'You have been successfully registered for this event.');

    } catch (error: any) {
      console.error('Error registering:', error);
      this.toastService.error('Registration Failed', error.message || 'Unable to complete registration.');
    } finally {
      this.registering = false;
    }
  }

  goBack() {
    this.router.navigate(['/events']);
  }
}
