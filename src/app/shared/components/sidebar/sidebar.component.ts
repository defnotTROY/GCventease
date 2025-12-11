import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div
      class="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden transition-opacity"
      [class.opacity-0]="!isOpen"
      [class.pointer-events-none]="!isOpen"
      (click)="close()"
    ></div>

    <aside
      class="fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0"
      [class.-translate-x-full]="!isOpen"
    >
      <!-- Logo -->
      <div class="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <div class="flex items-center space-x-2">
          <svg class="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span class="text-xl font-bold text-gray-900">EventEase</span>
        </div>
        <button (click)="close()" class="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <a
          *ngFor="let item of menuItems"
          [routerLink]="item.path"
          routerLinkActive="bg-primary-50 text-primary-600"
          [routerLinkActiveOptions]="{exact: item.exact}"
          class="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          (click)="onMobileNavigate()"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" [attr.d]="item.icon"/>
          </svg>
          <span class="font-medium">{{ item.label }}</span>
        </a>

        <!-- Admin Section -->
        <div *ngIf="isAdmin" class="pt-4">
          <div class="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase">Admin</div>
          <a
            *ngFor="let item of adminMenuItems"
            [routerLink]="item.path"
            routerLinkActive="bg-primary-50 text-primary-600"
            class="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            (click)="onMobileNavigate()"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" [attr.d]="item.icon"/>
            </svg>
            <span class="font-medium">{{ item.label }}</span>
          </a>
        </div>
      </nav>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-200">
        <div class="text-xs text-gray-500 text-center">
          EventEase v2.0<br>
          Powered by AI & Cloud
        </div>
      </div>
    </aside>
  `,
  styles: []
})
export class SidebarComponent implements OnInit, OnDestroy {
  isOpen = false;
  isAdmin = false;
  private destroy$ = new Subject<void>();

  menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', exact: true },
    { label: 'Events', path: '/events', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', exact: false },
    { label: 'My Tickets', path: '/my-tickets', icon: 'M15 5v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2zM15 17v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 012-2h8a2 2 0 012 2zM15 11v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 012-2h8a2 2 0 012 2z', exact: true },
    { label: 'Create Event', path: '/create-event', icon: 'M12 4v16m8-8H4', exact: false },
    { label: 'Analytics', path: '/analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', exact: false },
    { label: 'Participants', path: '/participants', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', exact: false },
    { label: 'Settings', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', exact: false },
  ];

  adminMenuItems = [
    { label: 'Admin Dashboard', path: '/admin', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', exact: true },
    { label: 'User Management', path: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', exact: false },
    { label: 'Event Management', path: '/admin/events', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', exact: false },
    { label: 'QR Check-in', path: '/admin/qr-checkin', icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z', exact: false },
  ];

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) { }

  ngOnInit() {
    // Listen for sidebar toggle events
    window.addEventListener('toggle-sidebar', () => {
      this.isOpen = !this.isOpen;
    });

    // Check user role
    this.supabase.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        const role = user?.user_metadata?.role || '';
        this.isAdmin = role.toLowerCase() === 'admin' || role.toLowerCase() === 'administrator';
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  close() {
    this.isOpen = false;
  }

  onMobileNavigate() {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      this.close();
    }
  }
}
