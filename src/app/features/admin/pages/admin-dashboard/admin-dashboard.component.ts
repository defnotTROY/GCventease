import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p class="text-gray-600">System overview and management</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-gray-500 text-sm font-medium">Total Users</h3>
            <span class="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </span>
          </div>
          <div class="text-2xl font-bold text-gray-900">{{ userCount || '—' }}</div>
          <p class="text-xs text-green-600 mt-1" *ngIf="userCount">+{{ newUsers }} new this week</p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-gray-500 text-sm font-medium">Total Events</h3>
            <span class="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </span>
          </div>
          <div class="text-2xl font-bold text-gray-900">{{ eventCount }}</div>
          <p class="text-xs text-gray-500 mt-1">{{ activeEvents }} active events</p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-gray-500 text-sm font-medium">Total Participants</h3>
            <span class="p-2 bg-green-100 text-green-600 rounded-lg">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                 <circle cx="9" cy="7" r="4" />
               </svg>
            </span>
          </div>
          <div class="text-2xl font-bold text-gray-900">{{ participantCount }}</div>
           <p class="text-xs text-gray-500 mt-1">Across all events</p>
        </div>
      </div>

      <!-- Quick Links -->
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Management</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a routerLink="/admin/users" class="group block p-6 bg-white border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-blue-50 text-blue-600 rounded-full group-hover:bg-blue-100 transition-colors">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                 <circle cx="9" cy="7" r="4" />
               </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">User Management</h3>
              <p class="text-sm text-gray-500">Manage users and roles</p>
            </div>
          </div>
        </a>

        <a routerLink="/admin/events" class="group block p-6 bg-white border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-purple-50 text-purple-600 rounded-full group-hover:bg-purple-100 transition-colors">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <rect x="3" y="4" width="18" height="18" rx="2" />
               </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">Event Oversight</h3>
              <p class="text-sm text-gray-500">Monitor and manage all events</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  userCount = 0;
  newUsers = 0;
  eventCount = 0;
  activeEvents = 0;
  participantCount = 0;

  constructor(private supabase: SupabaseService) { }

  async ngOnInit() {
    await this.loadStats();
  }

  async loadStats() {
    // Events Stats
    const { data: events } = await this.supabase.client
      .from('events')
      .select('id, status, created_at');

    if (events) {
      this.eventCount = events.length;
      this.activeEvents = events.filter((e: any) => e.status === 'ongoing' || e.status === 'upcoming').length;
    }

    // Participants Stats
    const { count } = await this.supabase.client
      .from('participants')
      .select('id', { count: 'exact', head: true });

    if (count !== null) this.participantCount = count;

    // Users Stats (If simple connection is possible via participants unique count as proxy for now)
    // Real user count requires 'profiles' table or admin API
    // We'll use unique participants as a proxy for "Active Users" if no profiles table
    // Try to select from 'profiles' first
    const { count: profilesCount, error } = await this.supabase.client
      .from('profiles') // Assuming profiles table exists?
      .select('id', { count: 'exact', head: true });

    if (!error && profilesCount !== null) {
      this.userCount = profilesCount;
    } else {
      // Fallback: Count unique user_ids in participants + events
      // Not efficient, but works for mock/small scale
      // For now, let's leave userCount as 0 or a placeholder string if error
      this.userCount = 0; // "—" in template
    }
  }
}
