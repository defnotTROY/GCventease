import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

// Lazy load components
const LandingComponent = () => import('./features/landing/pages/landing/landing.component').then(m => m.LandingComponent);

export const routes: Routes = [
    // Public routes
    { path: '', loadComponent: LandingComponent },
    { path: 'landing', loadComponent: LandingComponent },

    // Auth routes (to be created)
    // { path: 'login', loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent) },
    // { path: 'signup', loadComponent: () => import('./features/auth/pages/signup/signup.component').then(m => m.SignupComponent) },

    // Protected routes (to be created)
    // { path: 'dashboard', loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },

    // Fallback
    { path: '**', redirectTo: '' }
];
