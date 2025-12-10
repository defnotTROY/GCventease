import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { EventsService } from '../../../../core/services/events.service';
import { RoleService } from '../../../../core/services/role.service';

interface Participant {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  event_id: string;
  event_title: string;
  registration_date: string;
  status: string;
}

@Component({
  selector: 'app-participants',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './participants.component.html',
  styleUrl: './participants.component.css'
})
export class ParticipantsComponent implements OnInit {
  // Data
  searchQuery = '';
  selectedEvent = 'all';
  selectedStatus = 'all';
  participants: Participant[] = [];
  events: any[] = [];
  statuses = ['all', 'registered', 'attended', 'cancelled'];
  loading = true;
  error: string | null = null;
  user: any = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private eventsService: EventsService,
    private roleService: RoleService
  ) { }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      this.loading = true;

      this.user = await this.authService.getCurrentUser();
      if (!this.user) {
        this.router.navigate(['/login']);
        return;
      }

      if (!this.roleService.canManageParticipants(this.user)) {
        this.error = 'You need to be an Event Organizer to manage participants';
        this.loading = false;
        return;
      }

      const { data: eventsData } = await this.eventsService.getAllEvents();
      this.events = [
        { id: 'all', title: 'All Events' },
        ...(eventsData || [])
      ];

      await this.loadParticipants();

    } catch (error: any) {
      console.error('Error loading data:', error);
      this.error = 'Failed to load data. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  async loadParticipants() {
    try {
      const { data: eventsData } = await this.eventsService.getAllEvents();

      if (!eventsData || eventsData.length === 0) {
        this.participants = [];
        return;
      }

      const participantMap = new Map<string, Participant>();

      for (const event of eventsData) {
        const { data: participantDetails } = await this.eventsService.getEventParticipantsDetails(event.id);

        if (participantDetails && participantDetails.length > 0) {
          participantDetails.forEach((participant: any) => {
            if (!participant.first_name || !participant.last_name) return;

            const key = `${participant.user_id}-${participant.event_id}`;
            if (!participantMap.has(key)) {
              participantMap.set(key, {
                id: participant.id,
                user_id: participant.user_id,
                first_name: participant.first_name,
                last_name: participant.last_name,
                email: participant.email || 'No email',
                phone: participant.phone,
                event_id: participant.event_id,
                event_title: event.title,
                registration_date: participant.created_at || new Date().toISOString(),
                status: participant.status || 'registered'
              });
            }
          });
        }
      }

      this.participants = Array.from(participantMap.values());
    } catch (error) {
      console.error('Error loading participants:', error);
      this.error = 'Failed to load participants. Please try again.';
    }
  }

  get filteredParticipants(): Participant[] {
    return this.participants.filter(participant => {
      const fullName = `${participant.first_name} ${participant.last_name}`.toLowerCase();
      const matchesSearch = fullName.includes(this.searchQuery.toLowerCase()) ||
        participant.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesEvent = this.selectedEvent === 'all' || participant.event_id === this.selectedEvent;
      const matchesStatus = this.selectedStatus === 'all' || participant.status === this.selectedStatus;

      return matchesSearch && matchesEvent && matchesStatus;
    });
  }

  get totalParticipants(): number {
    return this.participants.length;
  }

  get attendedCount(): number {
    return this.participants.filter(p => p.status === 'attended').length;
  }

  get registeredCount(): number {
    return this.participants.filter(p => p.status === 'registered').length;
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'attended': return 'bg-green-100 text-green-800';
      case 'registered': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  onSearchChange(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
  }

  onEventFilterChange(event: Event) {
    this.selectedEvent = (event.target as HTMLSelectElement).value;
  }

  onStatusFilterChange(event: Event) {
    this.selectedStatus = (event.target as HTMLSelectElement).value;
  }
}
