import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { EventsService, Event } from '../../../../core/services/events.service';

@Component({
  selector: 'app-event-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './event-view.component.html',
  styleUrl: './event-view.component.css'
})
export class EventViewComponent implements OnInit {
  event: Event | null = null;
  loading = true;
  error: string | null = null;
  user: any = null;
  participantCount = 0;
  isRegistered = false;
  eventId: string = '';

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private authService: AuthService,
    private eventsService: EventsService
  ) { }

  async ngOnInit() {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.eventId) {
      this.router.navigate(['/events']);
      return;
    }

    await this.loadEvent();
  }

  async loadEvent() {
    try {
      this.loading = true;
      this.user = await this.authService.getCurrentUser();

      if (!this.user) {
        this.router.navigate(['/login']);
        return;
      }

      const { data, error } = await this.eventsService.getEventById(this.eventId);
      if (error) throw error;

      if (!data) {
        this.error = 'Event not found';
        return;
      }

      this.event = data;

      const { data: count } = await this.eventsService.getEventParticipants(this.eventId);
      this.participantCount = count || 0;

      // Check if user is registered
      if (this.user) {
        const { isRegistered } = await this.eventsService.isUserRegistered(this.eventId, this.user.id);
        this.isRegistered = isRegistered;
      }

    } catch (error: any) {
      console.error('Error loading event:', error);
      this.error = error.message || 'Failed to load event';
    } finally {
      this.loading = false;
    }
  }

  async deleteEvent() {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await this.eventsService.deleteEvent(this.eventId);
      if (error) throw error;
      this.router.navigate(['/events']);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  }

  get isOwner(): boolean {
    return this.user && this.event ? this.event.user_id === this.user.id : false;
  }

  get currentStatus(): string {
    return this.event ? this.eventsService.calculateEventStatus(this.event) : '';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    return this.eventsService.formatDate(dateString);
  }

  formatTime(timeString: string): string {
    return this.eventsService.formatTime(timeString);
  }

  getEventImageUrl(size: number = 800): string {
    return this.event ? this.eventsService.getEventImageUrl(this.event, size) : '';
  }

  async joinEvent() {
    if (!this.event || !this.user) return;

    if (this.isOwner) {
      alert('You cannot join your own event.');
      return;
    }

    if (this.isRegistered) {
      alert('You are already registered for this event.');
      return;
    }

    try {
      // 1. Check for time conflicts
      const { hasConflict, conflictingEvent, error: conflictError } = await this.eventsService.checkParticipantTimeConflict(this.user.id, this.event);

      if (conflictError) throw conflictError;

      if (hasConflict) {
        alert(`You cannot join this event because it conflicts with another event you are attending: "${conflictingEvent.title}" (${this.eventsService.formatDate(conflictingEvent.date)} at ${this.eventsService.formatTime(conflictingEvent.time)})`);
        return;
      }

      // 2. Proceed with registration
      const { error } = await this.eventsService.joinEvent(this.event.id, this.user.id);

      if (error) throw error;

      alert('Successfully joined the event!');
      this.isRegistered = true;
      this.participantCount++;

    } catch (error: any) {
      console.error('Error joining event:', error);
      alert(error.message || 'Failed to join event. Please try again.');
    }
  }
}
