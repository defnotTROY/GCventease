import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

// Lazy load components
const LandingComponent = () => import('./features/landing/pages/landing/landing.component').then(m => m.LandingComponent);
const LoginComponent = () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent);
const SignupComponent = () => import('./features/auth/pages/signup/signup.component').then(m => m.SignupComponent);
const ForgotPasswordComponent = () => import('./features/auth/pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent);
const ResetPasswordComponent = () => import('./features/auth/pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent);
const DashboardComponent = () => import('./features/dashboard/pages/dashboard/dashboard.component').then(m => m.DashboardComponent);
const EventsComponent = () => import('./features/events/pages/events/events.component').then(m => m.EventsComponent);
const EventViewComponent = () => import('./features/events/pages/event-view/event-view.component').then(m => m.EventViewComponent);
const EventCreationComponent = () => import('./features/events/pages/event-creation/event-creation.component').then(m => m.EventCreationComponent);
const EventEditComponent = () => import('./features/events/pages/event-edit/event-edit.component').then(m => m.EventEditComponent);
const ParticipantsComponent = () => import('./features/events/pages/participants/participants.component').then(m => m.ParticipantsComponent);
const AnalyticsComponent = () => import('./features/analytics/pages/analytics/analytics.component').then(m => m.AnalyticsComponent);

export const routes: Routes = [
    // Public routes
    { path: '', loadComponent: LandingComponent },
    { path: 'landing', loadComponent: LandingComponent },

    // Auth routes
    { path: 'login', loadComponent: LoginComponent },
    { path: 'signup', loadComponent: SignupComponent },
    { path: 'forgot-password', loadComponent: ForgotPasswordComponent },
    { path: 'reset-password', loadComponent: ResetPasswordComponent },
    { path: 'create-admin', loadComponent: () => import('./features/auth/pages/create-admin/create-admin.component').then(m => m.CreateAdminComponent) },
    { path: 'verification', loadComponent: () => import('./features/auth/pages/email-verification/email-verification.component').then(m => m.EmailVerificationComponent) },

    // Protected routes (Wrapped in Main Layout)
    {
        path: '',
        loadComponent: () => import('./core/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
        canActivate: [authGuard],
        children: [
            { path: 'dashboard', loadComponent: DashboardComponent },
            {
                path: 'admin',
                loadComponent: () => import('./features/admin/pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
                canActivate: [roleGuard],
                data: { roles: ['admin', 'administrator'] }
            },
            {
                path: 'admin/users',
                loadComponent: () => import('./features/admin/pages/user-management/user-management.component').then(m => m.UserManagementComponent),
                canActivate: [roleGuard],
                data: { roles: ['admin', 'administrator'] }
            },
            {
                path: 'admin/events',
                loadComponent: () => import('./features/admin/pages/admin-event-management/admin-event-management.component').then(m => m.AdminEventManagementComponent),
                canActivate: [roleGuard],
                data: { roles: ['admin', 'administrator'] }
            },
            {
                path: 'admin/checkin',
                loadComponent: () => import('./features/admin/pages/admin-qr-checkin/admin-qr-checkin.component').then(m => m.AdminQRCheckInComponent),
                canActivate: [roleGuard],
                data: { roles: ['admin', 'administrator', 'organizer'] } // Organizer logic allowed
            },
            { path: 'events', loadComponent: EventsComponent },
            { path: 'events/create', loadComponent: EventCreationComponent },
            { path: 'events/:id/edit', loadComponent: EventEditComponent },
            { path: 'events/:id', loadComponent: EventViewComponent },
            { path: 'participants', loadComponent: ParticipantsComponent },
            { path: 'analytics', loadComponent: AnalyticsComponent },
            { path: 'settings', loadComponent: () => import('./features/settings/pages/settings/settings.component').then(m => m.SettingsComponent) },
        ]
    },

    // Fallback
    { path: '**', redirectTo: 'dashboard' }
];
