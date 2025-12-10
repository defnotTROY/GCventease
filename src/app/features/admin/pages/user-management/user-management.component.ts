import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase.service';

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
           <nav class="text-sm text-gray-500 mb-1">
             <a routerLink="/admin" class="hover:text-primary-600">Admin</a> / Users
           </nav>
           <h1 class="text-2xl font-bold text-gray-900">User Management</h1>
        </div>
        <button class="btn-primary" (click)="loadUsers()">Refresh List</button>
      </div>

      <!-- Warning if no profiles table -->
      <div *ngIf="error" class="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
        {{ error }}
        <p class="text-sm mt-2">Note: To manage users, ensure a 'profiles' public table exists and is synced with auth.users.</p>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let user of users">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
                    {{ (user.first_name?.[0] || user.email?.[0] || 'U') | uppercase }}
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ user.first_name }} {{ user.last_name }}</div>
                    <div class="text-sm text-gray-500">{{ user.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      [ngClass]="getRoleClass(user.role)">
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(user.created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                 <button class="text-primary-600 hover:text-primary-900 mr-4">Edit</button>
              </td>
            </tr>
            <tr *ngIf="users.length === 0 && !loading">
               <td colspan="4" class="px-6 py-12 text-center text-gray-500">
                  No users found or lack of permissions to view users.
               </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class UserManagementComponent implements OnInit {
    users: any[] = [];
    loading = false;
    error: string | null = null;

    constructor(private supabase: SupabaseService) { }

    async ngOnInit() {
        await this.loadUsers();
    }

    async loadUsers() {
        this.loading = true;
        this.error = null;
        try {
            // Try getting profiles
            const { data, error } = await this.supabase.client
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.users = data || [];
        } catch (e: any) {
            console.error('Error loading users:', e);
            this.error = "Could not load users. " + e.message;

            // Fallback: If current user is admin, maybe show just them?
            // Or if we have a mock list for demo
        } finally {
            this.loading = false;
        }
    }

    getRoleClass(role: string): string {
        switch (role?.toLowerCase()) {
            case 'admin':
            case 'administrator':
                return 'bg-purple-100 text-purple-800';
            case 'organizer':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-green-100 text-green-800';
        }
    }

    formatDate(date: string): string {
        if (!date) return '-';
        return new Date(date).toLocaleDateString();
    }
}
