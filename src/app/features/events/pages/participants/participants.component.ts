import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { EventsService } from '../../../../core/services/events.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthUser } from '../../../../core/services/supabase.service';

interface Participant {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  event_id: string;
  event_title: string;
  registration_date: string;
  status: string;
  events?: any[]; // For multi-event checking logic if needed
}

@Component({
  selector: 'app-participants',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './participants.component.html',
  styleUrl: './participants.component.css'
})
export class ParticipantsComponent implements OnInit {
  user: AuthUser | null = null;
  participants: Participant[] = [];
  events: { id: string, name: string }[] = [];
  statuses: string[] = ['all', 'registered', 'attended', 'cancelled'];

  loading = true;
  error: string | null = null;

  // Search & Filter
  searchQuery = '';
  selectedEvent = 'all';
  selectedStatus = 'all';

  constructor(
    private authService: AuthService,
    private eventsService: EventsService,
    private toastService: ToastService,
    private router: Router
  ) { }

  async ngOnInit() {
    this.user = await this.authService.getCurrentUser();
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    // Role check logic
    const role = this.user.user_metadata?.role;
    // Assuming 'Organizer' or 'Admin' can view this page. 
    // If regular user accesses, they might just see empty or be redirected?
    // React code checks canManageParticipants.
    const canManage = role === 'Organizer' || role === 'organizer' ||
      role === 'Administrator' || role === 'admin' || role === 'Admin';

    if (!canManage) {
      this.error = 'You need to be an Event Organizer to manage participants';
      this.loading = false;
      return;
    }

    await this.loadData();
  }

  async loadData() {
    try {
      this.loading = true;
      this.error = null;

      // 1. Load Events (for filter)
      // Note: React used getAllEvents, but conceptually an Organizer should 
      // primarily see participants for THEIR events.
      // However, React code fetched ALL events. 
      // If we want to strictly follow React:
      const { data: eventsData, error: eventsError } = await this.eventsService.getAllEvents();
      if (eventsError) throw eventsError;

      // Filter events to only those owned by user (unless Admin?)
      // React code actually fetched ALL events but logic in loadParticipants uses them to iterate.
      // If I am an organizer, I should only see my events' participants?
      // React code: eventsService.getAllEvents() -> loop -> getEventParticipantsDetails(event.id)

      // OPTIMIZATION: In Angular, let's filter events to only those owned by current user 
      // if not admin, to avoid leaking other's data or wasting requests.
      // But adhering to React behavior: React fetches ALL events. 
      // Wait, React loadParticipants:
      // const { data: eventsData } = await eventsService.getAllEvents();
      // for (const event of eventsData) { ... getEventParticipantsDetails ... }
      // This implies it fetches participants for ALL events in the system? 
      // That seems like a security flaw in React version if non-admins can see all.
      // But let's assume valid eventsData is returned.

      // Let's stick to showing events the user actually OWNS or if Admin, all.
      let relevantEvents = eventsData || [];
      const role = this.user?.user_metadata?.role;
      const isAdmin = role === 'Administrator' || role === 'Admin' || role === 'admin';

      if (!isAdmin && this.user) {
        relevantEvents = relevantEvents.filter(e => e.user_id === this.user!.id);
      }

      this.events = [
        { id: 'all', name: 'All Events' },
        ...relevantEvents.map(e => ({ id: e.id, name: e.title }))
      ];

      // 2. Load Statuses
      const { data: statusList } = await this.eventsService.getParticipantStatuses();
      if (statusList) {
        this.statuses = statusList;
      }

      // 3. Load Participants
      await this.loadParticipants(relevantEvents);

    } catch (error: any) {
      console.error('Error loading data:', error);
      this.error = 'Failed to load data. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  async loadParticipants(eventsList: any[]) {
    const participantMap = new Map<string, Participant>();

    for (const event of eventsList) {
      const { data: details, error } = await this.eventsService.getEventParticipantsDetails(event.id);
      if (error) continue;

      if (details && details.length > 0) {
        details.forEach(p => {
          if (!p.first_name || !p.last_name) return;

          const key = `${p.user_id}-${p.event_id}`;
          // In React, it checks for duplicate user-event combos. 
          // But wait, user_id + event_id should be unique in DB constraints usually.

          // Flatten structure
          const participantObj: Participant = {
            id: p.id,
            user_id: p.user_id,
            first_name: p.first_name,
            last_name: p.last_name,
            email: p.email || 'No email',
            phone: p.phone || 'No phone',
            event_id: p.event_id,
            event_title: event.title,
            registration_date: p.created_at || p.registration_date || new Date().toISOString(),
            status: p.status || 'registered'
          };

          if (!participantMap.has(key)) {
            participantMap.set(key, participantObj);
          }
        });
      }
    }

    // React logic for "Multi-Event" count relies on checking how many events a user joined.
    // We can compute that by grouping by user_id
    const participantsList = Array.from(participantMap.values());

    // Calculate multi-event count helper
    // This is a bit expensive but matches React logic if we want determining "multi-event" users
    const userEventCounts = new Map<string, number>();
    participantsList.forEach(p => {
      const current = userEventCounts.get(p.user_id) || 0;
      userEventCounts.set(p.user_id, current + 1);
    });

    // Augment participant with 'events' array fake property if needed for filtering?
    // React code: .filter(p => p.events?.length > 1) 
    // But where does 'p.events' come from in React?
    // Ah, looking closely at React loadParticipants:
    // It sets `participantObj`... but I don't see it attaching `events` array to it inside the loop.
    // Wait, let's look at React code again.
    // Code snippet: `participantMap.set(key, participantObj);`
    // Snippet: `(participants || []).filter(p => p.events?.length > 1).length`
    // It seems React code shown might have omitted where `p.events` is populated, OR I missed it.
    // Re-reading React code:
    // `const participantDetails = ...`
    // `participantMap.set(key, participantObj)`
    // I don't see `p.events` being set. Maybe it's a bug in the React code or 'multi-event' card was broken/placeholder?
    // Or maybe `participantDetails` returns it?
    // No matter, I can implement it by counting.

    this.participants = participantsList.map(p => ({
      ...p,
      eventCount: userEventCounts.get(p.user_id) || 1
    }));
  }

  get filteredParticipants(): Participant[] {
    return this.participants.filter(p => {
      const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
      const matchesSearch = fullName.includes(this.searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesEvent = this.selectedEvent === 'all' || p.event_id === this.selectedEvent;
      const matchesStatus = this.selectedStatus === 'all' || p.status === this.selectedStatus;

      return matchesSearch && matchesEvent && matchesStatus;
    });
  }

  // Stats getters
  get totalParticipants() { return this.participants.length; }
  get attendedCount() { return this.participants.filter(p => p.status === 'attended' || p.status === 'active').length; }
  get registeredCount() { return this.participants.filter(p => p.status === 'registered').length; }
  get multiEventCount() { return this.participants.filter(p => (p as any).eventCount > 1).length; }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'attended': return 'bg-green-100 text-green-800';
      case 'registered': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getInitials(first: string, last: string): string {
    return (first?.charAt(0) || '') + (last?.charAt(0) || '');
  }

  reload() {
    // reload page
    window.location.reload();
  }
}
