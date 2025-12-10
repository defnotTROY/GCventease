import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService, Notification } from '../../services/notification.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit {
  isSidebarCollapsed = false;
  currentPage = 'Dashboard';
  user: any = null;

  // Dropdown states
  isUserMenuOpen = false;
  isNotificationsOpen = false;

  // Notifications
  notifications: Notification[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    private elementRef: ElementRef
  ) {
    // Track route changes to update page title
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updatePageTitle(event.url);
    });
  }

  async ngOnInit() {
    this.user = await this.authService.getCurrentUser();
    this.updatePageTitle(this.router.url);

    if (this.user) {
      this.notifications = await this.notificationService.getNotifications(this.user.id);
    }
  }

  updatePageTitle(url: string) {
    if (url.includes('/dashboard')) this.currentPage = 'Dashboard';
    else if (url.includes('/events/create')) this.currentPage = 'Create Event';
    else if (url.includes('/events')) this.currentPage = 'Events';
    else if (url.includes('/participants')) this.currentPage = 'Participants';
    else if (url.includes('/analytics')) this.currentPage = 'Analytics';
    else if (url.includes('/settings')) this.currentPage = 'Settings';
    else if (url.includes('/qr-checkin')) this.currentPage = 'QR Check-In';
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleUserMenu(event?: Event) {
    if (event) event.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;
    this.isNotificationsOpen = false;
  }

  toggleNotifications(event?: Event) {
    if (event) event.stopPropagation();
    this.isNotificationsOpen = !this.isNotificationsOpen;
    this.isUserMenuOpen = false;
  }

  markAllRead() {
    this.notifications.forEach(n => n.read = true);
  }

  clearNotifications() {
    this.notifications = [];
    this.isNotificationsOpen = false;
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  async logout() {
    await this.authService.signOut();
  }

  // Close dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isUserMenuOpen = false;
      this.isNotificationsOpen = false;
    } else {
      // If click is inside component but not on toggle buttons, we might still want to close
      // (Handled by specific toggle methods using stopPropagation)
      // But if clicking *content* of dropdown, don't close? 
      // Simple click outside strategy is usually enough if toggles stop propagation.

      // Let's modify to close if not clicking inside the specific menus
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu') && !target.closest('.notification-container')) {
        this.isUserMenuOpen = false;
        this.isNotificationsOpen = false;
      }
    }
  }

  get userDisplayName(): string {
    if (!this.user) return 'User';
    const firstName = this.user.user_metadata?.first_name;
    const lastName = this.user.user_metadata?.last_name;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    return this.user.email?.split('@')[0] || 'User';
  }

  get userRole(): string {
    return this.user?.user_metadata?.role || 'User';
  }

  get canManageEvents(): boolean {
    const role = this.userRole?.toLowerCase();
    return role === 'admin' || role === 'organizer' || role === 'administrator';
  }

  get isAdmin(): boolean {
    const role = this.userRole?.toLowerCase();
    return role === 'admin' || role === 'administrator';
  }
}
