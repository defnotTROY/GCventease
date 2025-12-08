import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <nav class="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 lg:left-64">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Mobile menu button -->
          <button
            (click)="onMenuClick()"
            class="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          <!-- Search bar (desktop) -->
          <div class="hidden lg:flex flex-1 max-w-2xl">
            <div class="relative w-full">
              <input
                type="text"
                placeholder="Search events..."
                class="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                (keyup.enter)="onSearch($event)"
              />
              <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          </div>

          <!-- Right side -->
          <div class="flex items-center space-x-4">
            <!-- Notifications -->
            <button class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full relative">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <span class="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            <!-- User menu -->
            <div class="relative">
              <button
                (click)="toggleUserMenu()"
                class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
              >
                <div class="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                  {{ getUserInitials() }}
                </div>
                <span class="hidden md:block text-sm font-medium text-gray-700">
                  {{ getUserName() }}
                </span>
                <svg class="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              <!-- Dropdown menu -->
              <div
                *ngIf="showUserMenu"
                class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
              >
                <a routerLink="/settings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Settings
                </a>
                <a routerLink="/dashboard#my-schedule" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  My Schedule
                </a>
                <hr class="my-1">
                <button
                  (click)="onLogout()"
                  class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
    styles: []
})
export class NavbarComponent implements OnInit, OnDestroy {
    showUserMenu = false;
    user: any = null;
    private destroy$ = new Subject<void>();

    constructor(
        private supabase: SupabaseService,
        private router: Router
    ) { }

    ngOnInit() {
        this.supabase.currentUser$
            .pipe(takeUntil(this.destroy$))
            .subscribe(user => {
                this.user = user;
            });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onMenuClick() {
        // Emit event to parent to open sidebar
        window.dispatchEvent(new CustomEvent('toggle-sidebar'));
    }

    toggleUserMenu() {
        this.showUserMenu = !this.showUserMenu;
    }

    getUserInitials(): string {
        if (!this.user) return 'U';
        const firstName = this.user.user_metadata?.first_name || '';
        const lastName = this.user.user_metadata?.last_name || '';
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
    }

    getUserName(): string {
        if (!this.user) return 'User';
        const firstName = this.user.user_metadata?.first_name || '';
        const lastName = this.user.user_metadata?.last_name || '';
        return `${firstName} ${lastName}`.trim() || 'User';
    }

    onSearch(event: any) {
        const query = event.target.value;
        if (query) {
            this.router.navigate(['/search'], { queryParams: { q: query } });
        }
    }

    async onLogout() {
        await this.supabase.signOut();
        this.router.navigate(['/login']);
    }
}
