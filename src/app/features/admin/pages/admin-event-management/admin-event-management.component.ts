import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventsService } from '../../../../core/services/events.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LucideAngularModule, Calendar, Edit, Eye, Users, MapPin, Clock, Shield, Loader2, RefreshCw, BarChart3, Search, Filter } from 'lucide-angular';

@Component({
  selector: 'app-admin-event-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-event-management.component.html',
  styleUrl: './admin-event-management.component.css'
})
export class AdminEventManagementComponent implements OnInit {
  loading = true;
  isAdmin = false;
  events: any[] = [];
  filteredEvents: any[] = [];
  participantCounts: { [key: string]: number } = {};

  // Search & Filter
  searchQuery = '';
  statusFilter = 'all';

  // Icons
  readonly CalendarIcon = Calendar;
  readonly EditIcon = Edit;
  readonly EyeIcon = Eye;
  readonly UsersIcon = Users;
  readonly MapPinIcon = MapPin;
  readonly ClockIcon = Clock;
  readonly ShieldIcon = Shield;
  readonly Loader2Icon = Loader2;
  readonly RefreshCwIcon = RefreshCw;
  readonly BarChart3Icon = BarChart3;
  readonly SearchIcon = Search;
  readonly FilterIcon = Filter;

  constructor(
    private eventsService: EventsService,
    private authService: AuthService,
    private router: Router
  ) { }

  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    const role = user?.user_metadata?.role;
    this.isAdmin = role === 'admin' || role === 'Admin' || role === 'Administrator';

    if (!this.isAdmin) {
      this.loading = false;
      return;
    }

    await this.loadEvents();
  }

  async loadEvents() {
    try {
      this.loading = true;
      const { data, error } = await this.eventsService.getAllEvents();
      if (error) throw error;

      this.events = data || [];
      this.applyFilters();

      // Load participant counts
      // We'll do this in the background to avoid blocking UI too long if list is huge,
      // but strictly we should probably wait or use the existing patterns.
      // We will perform it now.
      const counts: { [key: string]: number } = {};

      // Parallelize requests for speed
      const promises = this.events.map(event =>
        this.eventsService.getEventParticipants(event.id)
          .then(res => ({ id: event.id, count: res.data || 0 }))
      );

      const results = await Promise.all(promises);
      results.forEach(r => counts[r.id] = r.count);

      this.participantCounts = counts;

    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      this.loading = false;
    }
  }

  applyFilters() {
    let filtered = this.events;

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(q) ||
        (event.description && event.description.toLowerCase().includes(q)) ||
        (event.location && event.location.toLowerCase().includes(q))
      );
    }

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(event => event.status === this.statusFilter);
    }

    this.filteredEvents = filtered;
  }

  onSearch() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getParticipantPercentage(current: number, max: number): number {
    if (!max || max === 0) return 0;
    return Math.round((current / max) * 100);
  }

  get totalParticipants(): number {
    return Object.values(this.participantCounts).reduce((a, b) => a + b, 0);
  }

  get activeEventsCount(): number {
    return this.events.filter(e => e.status === 'ongoing').length;
  }

  get averageAttendance(): number {
    if (this.events.length === 0) return 0;
    return Math.round(this.totalParticipants / this.events.length);
  }
}
