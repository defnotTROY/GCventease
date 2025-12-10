import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScheduleService, ScheduleEvent } from '../../../core/services/schedule.service';

@Component({
    selector: 'app-user-schedule',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-gray-900">My Schedule</h2>
          <p class="text-sm text-gray-600 mt-1">
            {{ isOrganizer ? 'Events you are managing' : 'Events you are registered for' }}
          </p>
        </div>
        <a routerLink="/events" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
          View All
        </a>
      </div>

      <div *ngIf="loading" class="text-center py-8">
        <p class="text-gray-600">Loading schedule...</p>
      </div>

      <div *ngIf="error" class="text-center py-8 text-red-600">
        {{ error }}
      </div>

      <div *ngIf="!loading && !error && scheduleDates.length === 0" class="text-center py-12">
        <svg class="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
          <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2"/>
        </svg>
        <p class="text-gray-600 font-medium mb-2">No upcoming events</p>
        <p class="text-sm text-gray-500">
          {{ isOrganizer ? 'Create your first event to see it here' : 'Register for events to see them in your schedule' }}
        </p>
      </div>

      <div *ngIf="!loading && !error && scheduleDates.length > 0" class="space-y-6">
        <div *ngFor="let date of scheduleDates" class="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            {{ formatDate(date) }}
          </h3>
          <div class="space-y-4">
            <a *ngFor="let event of groupedSchedule[date]" 
               [routerLink]="['/events', event.id]"
               class="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all group">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <h4 class="font-semibold text-base text-gray-900 group-hover:text-primary-600 transition-colors mb-2">
                    {{ event.title }}
                  </h4>
                  
                  <div class="space-y-2">
                    <div *ngIf="event.time" class="flex items-center text-sm text-gray-600">
                      <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2"/>
                      </svg>
                      <span>{{ scheduleService.formatTime(event.time) }}</span>
                    </div>
                    
                    <div *ngIf="event.location" class="flex items-start text-sm text-gray-600">
                      <svg class="h-4 w-4 mr-2 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
                        <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
                      </svg>
                      <span>{{ event.location }}</span>
                    </div>

                    <div *ngIf="event.category" class="flex items-center">
                      <span class="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {{ event.category }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col items-end text-right gap-2">
                  <div *ngIf="isOrganizer && event.participant_count !== null" class="flex items-center text-sm text-gray-600">
                    <svg class="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2"/>
                      <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <span>{{ event.participant_count }}</span>
                    <span *ngIf="event.max_participants" class="text-gray-400">/{{ event.max_participants }}</span>
                  </div>
                  
                  <span [ngClass]="{
                    'bg-blue-100 text-blue-800': event.status === 'upcoming',
                    'bg-green-100 text-green-800': event.status === 'ongoing',
                    'bg-gray-100 text-gray-800': event.status === 'completed'
                  }" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ event.status }}
                  </span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: []
})
export class UserScheduleComponent implements OnInit {
    @Input() scheduleData: ScheduleEvent[] | null = null;
    @Input() user: any = null;
    @Input() userRole: string = 'user';

    schedule: ScheduleEvent[] = [];
    loading = false;
    error: string | null = null;
    groupedSchedule: { [key: string]: ScheduleEvent[] } = {};
    scheduleDates: string[] = [];
    isOrganizer = false;

    constructor(public scheduleService: ScheduleService) { }

    async ngOnInit() {
        if (this.scheduleData) {
            this.schedule = this.scheduleData;
            this.groupSchedule();
        }

        this.isOrganizer = this.userRole === 'organizer' || this.userRole === 'Organizer' ||
            this.userRole === 'admin' || this.userRole === 'Administrator' ||
            this.userRole === 'Admin';
    }

    ngOnChanges() {
        if (this.scheduleData) {
            this.schedule = this.scheduleData;
            this.groupSchedule();
        }
    }

    private groupSchedule() {
        this.groupedSchedule = this.scheduleService.groupScheduleByDate(this.schedule);
        this.scheduleDates = Object.keys(this.groupedSchedule).sort((a, b) =>
            new Date(a).getTime() - new Date(b).getTime()
        );
    }

    formatDate(dateString: string): string {
        return this.scheduleService.formatDate(dateString);
    }
}
