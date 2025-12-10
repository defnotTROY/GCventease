import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { EventsService } from '../../../../core/services/events.service';

@Component({
    selector: 'app-admin-event-management',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
           <nav class="text-sm text-gray-500 mb-1">
             <a routerLink="/admin" class="hover:text-primary-600">Admin</a> / Events
           </nav>
           <h1 class="text-2xl font-bold text-gray-900">Event Management</h1>
        </div>
        <div class="flex gap-3">
             <div class="relative">
                <input type="text" placeholder="Search events..." [(ngModel)]="searchQuery" (input)="filterEvents()"
                       class="pl-8 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <svg class="absolute left-2.5 top-2.5 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="M21 21l-4.35-4.35"></path>
                </svg>
             </div>
             <button class="btn-primary" routerLink="/events/create">+ Create Event</button>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let event of filteredEvents">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                     <img [src]="getEventImage(event)" class="h-full w-full object-cover">
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 line-clamp-1 max-w-xs" title="{{event.title}}">{{ event.title }}</div>
                    <div class="text-xs text-gray-500">{{ event.location }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(event.date) }} <br>
                <span class="text-xs">{{ formatTime(event.time) }}</span>
              </td>
               <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      [ngClass]="getStatusClass(event)">
                  {{ getStatusLabel(event) | uppercase }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                 {{ event.participant_count || 0 }} / {{ event.max_participants || '∞' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                 <a [routerLink]="['/events', event.id]" class="text-blue-600 hover:text-blue-900 mr-3">View</a>
                 <a [routerLink]="['/events', event.id, 'edit']" class="text-green-600 hover:text-green-900 mr-3">Edit</a>
                 <button (click)="deleteEvent(event.id)" class="text-red-600 hover:text-red-900">Delete</button>
              </td>
            </tr>
             <tr *ngIf="filteredEvents.length === 0 && !loading">
               <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                  No events found.
               </td>
            </tr>
             <tr *ngIf="loading">
               <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                  Loading events...
               </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminEventManagementComponent implements OnInit {
    events: any[] = [];
    filteredEvents: any[] = [];
    loading = false;
    searchQuery = '';

    constructor(
        private eventsService: EventsService,
        private supabase: SupabaseService
    ) { }

    async ngOnInit() {
        await this.loadEvents();
    }

    async loadEvents() {
        this.loading = true;
        try {
            const { data, error } = await this.eventsService.getAllEvents();
            if (error) throw error;

            // Enhance with participant counts if needed
            // Assuming getAllEvents returns basic info
            this.events = data || [];

            // Fetch participant counts for display if not in initial query
            // This might be slow for many events (N+1), but for admin panel usually fine or paginate
            for (let event of this.events) {
                const { data: count } = await this.eventsService.getEventParticipants(event.id);
                event.participant_count = count;
            }

            this.filteredEvents = [...this.events];
        } catch (e) {
            console.error("Error loading events", e);
        } finally {
            this.loading = false;
        }
    }

    filterEvents() {
        const query = this.searchQuery.toLowerCase();
        this.filteredEvents = this.events.filter(e =>
            e.title.toLowerCase().includes(query) ||
            e.location.toLowerCase().includes(query)
        );
    }

    async deleteEvent(id: string) {
        if (!confirm("Are you sure you want to permanently delete this event?")) return;

        const { error } = await this.eventsService.deleteEvent(id);
        if (!error) {
            this.events = this.events.filter(e => e.id !== id);
            this.filterEvents();
        } else {
            alert("Failed to delete event.");
        }
    }

    formatDate(date: string): string {
        return this.eventsService.formatDate(date);
    }

    formatTime(time: string): string {
        return this.eventsService.formatTime(time);
    }

    getEventImage(event: any): string {
        return this.eventsService.getEventImageUrl(event, 100);
    }

    getStatusClass(event: any): string {
        const status = this.eventsService.calculateEventStatus(event);
        switch (status) {
            case 'upcoming': return 'bg-blue-100 text-blue-800';
            case 'ongoing': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    getStatusLabel(event: any): string {
        return this.eventsService.calculateEventStatus(event);
    }
}
