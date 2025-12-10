import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';
import { EventsService, Event } from '../../../../core/services/events.service';
import { StatusService } from '../../../../core/services/status.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthUser } from '../../../../core/services/supabase.service';
import { GORDON_COLLEGE_DEPARTMENTS } from '../../../../core/config/gordon-college.config';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,

  ],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css'
})
export class EventsComponent implements OnInit {
  // Sidebar state
  isSidebarCollapsed = false;
  currentPage = 'Events';

  // Filters
  private _searchQuery = '';
  private _selectedCategory = 'all';
  private _selectedStatus = 'all';
  private _viewMode: 'grid' | 'list' = 'grid';

  get searchQuery(): string { return this._searchQuery; }
  set searchQuery(value: string) {
    this._searchQuery = value;
    this.updateFilteredEvents();
  }

  get selectedCategory(): string { return this._selectedCategory; }
  set selectedCategory(value: string) {
    this._selectedCategory = value;
    this.updateFilteredEvents();
  }

  get selectedStatus(): string { return this._selectedStatus; }
  set selectedStatus(value: string) {
    this._selectedStatus = value;
    this.updateFilteredEvents();
  }

  get viewMode(): 'grid' | 'list' { return this._viewMode; }
  set viewMode(value: 'grid' | 'list') {
    this._viewMode = value;
    this.updateFilteredEvents();
  }

  // Data
  events: Event[] = [];
  filteredEvents: Event[] = [];
  loading = true;
  error: string | null = null;
  user: AuthUser | null = null;
  userRole: string | null = null;
  participantCounts: { [key: string]: number } = {};
  selectedEvent: Event | null = null;

  categoryOptions: string[] = ['all'];
  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private eventsService: EventsService,
    private statusService: StatusService,
    private toastService: ToastService
  ) { }

  async ngOnInit() {
    await this.getCurrentUser();
    if (this.user) {
      await this.loadEvents();
    }
  }

  async getCurrentUser() {
    try {
      this.user = await this.authService.getCurrentUser();
      this.userRole = this.user?.user_metadata?.role || null;
    } catch (error) {
      console.error('Error getting user:', error);
      this.error = 'Failed to load user data';
    }
  }

  async loadEvents() {
    try {
      this.loading = true;
      const { data, error } = await this.eventsService.getAllEvents();

      if (error) throw error;

      this.events = data || [];

      // Extract unique categories from events and merge with predefined list
      const uniqueCategories = new Set<string>(GORDON_COLLEGE_DEPARTMENTS);
      this.events.forEach(event => {
        if (event?.category) {
          uniqueCategories.add(event.category);
        }
      });

      // Convert to array and sort (keeping 'all' at the start)
      this.categoryOptions = ['all', ...Array.from(uniqueCategories).sort()];

      // Load participant counts
      if (data && data.length > 0) {
        const counts: { [key: string]: number } = {};
        for (const event of data) {
          const { data: count } = await this.eventsService.getEventParticipants(event.id);
          counts[event.id] = count || 0;
        }
        this.participantCounts = counts;
      }
    } catch (error) {
      console.error('Error loading events:', error);
      this.error = 'Failed to load events. Please try again.';
    } finally {
      this.loading = false;
      this.updateFilteredEvents();
    }
  }

  private updateFilteredEvents() {
    // Update filtered list
    this.filteredEvents = this.events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(this._searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(this._searchQuery.toLowerCase());
      const matchesCategory = this._selectedCategory === 'all' || event.category === this._selectedCategory;
      const eventStatus = this.eventsService.calculateEventStatus(event);
      const matchesStatus = this._selectedStatus === 'all' || eventStatus === this._selectedStatus || event.status === this._selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Update selection if in list mode
    if (this._viewMode !== 'list') return;

    if (this.filteredEvents.length === 0) {
      this.selectedEvent = null;
      return;
    }

    // If currently selected event is still in the list, keep it.
    // Otherwise, select the first one.
    if (!this.selectedEvent || !this.filteredEvents.find(e => e.id === this.selectedEvent?.id)) {
      this.selectedEvent = this.filteredEvents[0];
    }
  }

  async handleAutoUpdateStatuses() {
    if (!this.user) return;

    try {
      this.toastService.info('Updating Statuses', 'Checking for event status updates...', 3000);
      const { data, error } = await this.statusService.autoUpdateAllStatuses(this.user.id);

      if (error) throw error;

      // Reload events
      await this.loadEvents();

      if (data && data.updated > 0) {
        this.toastService.success(
          'Statuses Updated',
          `Successfully updated ${data.updated} event status${data.updated === 1 ? '' : 'es'} automatically.`
        );
      } else {
        this.toastService.info('Up to Date', 'All event statuses are already up to date.');
      }
    } catch (error) {
      console.error('Error auto-updating event statuses:', error);
      this.toastService.error('Update Failed', 'Unable to update event statuses at this time.');
    }
  }

  async handleDeleteEvent(eventId: string) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;

    try {
      const { error } = await this.eventsService.deleteEvent(eventId);
      if (error) throw error;

      this.toastService.success('Event Deleted', 'The event has been successfully deleted.');
      await this.loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      this.toastService.error('Delete Failed', 'Unable to delete the event at this time.');
    }
  }

  canManageEvent(event: Event): boolean {
    if (!this.user) return false;
    const isOrganizerOrAdmin = this.userRole === 'Organizer' || this.userRole === 'organizer' ||
      this.userRole === 'Administrator' || this.userRole === 'admin';
    const isEventOwner = event.user_id === this.user.id;
    return isOrganizerOrAdmin || isEventOwner;
  }

  formatDate(dateString: string): string {
    return this.eventsService.formatDate(dateString);
  }

  formatTime(timeString: string): string {
    return this.eventsService.formatTime(timeString);
  }

  formatTimeRange(startTime: string, endTime?: string): string {
    if (!startTime) return 'TBD';
    const start = this.formatTime(startTime);
    if (!endTime) return start;
    const end = this.formatTime(endTime);
    return `${start} - ${end}`;
  }

  getEventImageUrl(event: Event, size: number = 400): string {
    return this.eventsService.getEventImageUrl(event, size);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getParticipantPercentage(current: number, max?: number): number {
    if (!max) return 0;
    const percentage = Math.round((current / max) * 100);
    return Number.isFinite(percentage) ? Math.min(Math.max(percentage, 0), 100) : 0;
  }

  calculateEventStatus(event: Event): string {
    return this.eventsService.calculateEventStatus(event);
  }

  selectEvent(event: Event) {
    this.selectedEvent = event;
  }

  navigateToEvent(eventId: string) {
    this.router.navigate(['/events', eventId]);
  }

  navigateToEditEvent(eventId: string) {
    this.router.navigate(['/events', eventId, 'edit']);
  }

  // Sidebar methods
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  navigateTo(page: string, route: string) {
    this.currentPage = page;
    this.router.navigate([route]);
  }

  async logout() {
    const result = await this.authService.signOut();
    if (result.success) {
      this.router.navigate(['/landing']);
    }
  }

  get userDisplayName(): string {
    if (!this.user) return 'User';
    const firstName = this.user.user_metadata?.first_name;
    const lastName = this.user.user_metadata?.last_name;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return this.user.email || 'User';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get isOrganizerOrAdmin(): boolean {
    const role = this.userRole?.toLowerCase();
    return role === 'admin' || role === 'organizer' || role === 'administrator';
  }
}
