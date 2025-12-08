import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
    const supabaseService = inject(SupabaseService);
    const router = inject(Router);

    const { user } = await supabaseService.getCurrentUser();

    if (!user) {
        // Not authenticated, redirect to login
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
    }

    // Check if email is verified
    if (!user.email_confirmed_at) {
        router.navigate(['/verify-email']);
        return false;
    }

    return true;
};
