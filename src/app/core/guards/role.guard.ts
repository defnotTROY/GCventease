import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const roleGuard: CanActivateFn = async (route, state) => {
    const supabaseService = inject(SupabaseService);
    const router = inject(Router);

    const { user } = await supabaseService.getCurrentUser();

    if (!user) {
        router.navigate(['/login']);
        return false;
    }

    // Get required roles from route data
    const requiredRoles = route.data['roles'] as string[];
    if (!requiredRoles || requiredRoles.length === 0) {
        return true; // No role requirement
    }

    // Get user role
    const userRole = user.user_metadata?.role || 'user';

    // Check if user has required role
    const hasRole = requiredRoles.some(role =>
        userRole.toLowerCase() === role.toLowerCase()
    );

    if (!hasRole) {
        // User doesn't have required role, redirect to dashboard
        router.navigate(['/dashboard']);
        return false;
    }

    return true;
};
