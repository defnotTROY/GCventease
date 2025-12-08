import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SupabaseService } from './core/services/supabase.service';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    SidebarComponent,
    ToastContainerComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Toast notifications -->
      <app-toast-container></app-toast-container>

      <!-- Show navbar and sidebar only for authenticated routes -->
      <app-navbar *ngIf="showLayout"></app-navbar>
      <app-sidebar *ngIf="showLayout"></app-sidebar>

      <!-- Main content -->
      <div [class.lg:ml-64]="showLayout" [class.pt-16]="showLayout">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  title = 'EventEase';
  showLayout = false;

  // Routes that should NOT show navbar/sidebar
  private publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/', '/landing'];

  constructor(
    private router: Router,
    private supabase: SupabaseService
  ) { }

  ngOnInit() {
    // Determine if we should show layout based on route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.showLayout = !this.publicRoutes.includes(event.url.split('?')[0]);
      });

    // Initial check
    const currentUrl = this.router.url.split('?')[0];
    this.showLayout = !this.publicRoutes.includes(currentUrl);
  }
}

