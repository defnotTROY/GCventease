import { Injectable } from '@angular/core';

export enum UserRole {
    ADMIN = 'admin',
    ORGANIZER = 'organizer',
    USER = 'user'
}

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    /**
     * Check if user has a specific role
     */
    hasRole(user: any, role: UserRole): boolean {
        if (!user) return false;

        const userRole = user.user_metadata?.role?.toLowerCase();

        // Support both legacy and new role formats
        if (role === UserRole.ADMIN) {
            return userRole === 'admin' || userRole === 'administrator';
        }

        return userRole === role.toLowerCase();
    }

    /**
     * Check if user is Admin
     */
    isAdmin(user: any): boolean {
        return this.hasRole(user, UserRole.ADMIN);
    }

    /**
     * Check if user is Event Organizer
     */
    isOrganizer(user: any): boolean {
        return this.hasRole(user, UserRole.ORGANIZER);
    }

    /**
     * Check if user is Regular User
     */
    isUser(user: any): boolean {
        return this.hasRole(user, UserRole.USER);
    }

    /**
     * Check if user can create events
     * Only Admins and Organizers can create events
     */
    canCreateEvents(user: any): boolean {
        return this.isAdmin(user) || this.isOrganizer(user);
    }

    /**
     * Check if user can access analytics
     * Only Admins and Organizers can access analytics
     */
    canAccessAnalytics(user: any): boolean {
        return this.isAdmin(user) || this.isOrganizer(user);
    }

    /**
     * Check if user can manage participants
     * Only Admins and Organizers can manage participants
     */
    canManageParticipants(user: any): boolean {
        return this.isAdmin(user) || this.isOrganizer(user);
    }

    /**
     * Check if user can manage all events (Admin only)
     */
    canManageAllEvents(user: any): boolean {
        return this.isAdmin(user);
    }

    /**
     * Get user's display role name
     */
    getUserRoleName(user: any): string {
        if (!user) return 'Guest';

        const role = user.user_metadata?.role?.toLowerCase();

        if (role === 'admin' || role === 'administrator') return 'Administrator';
        if (role === 'organizer') return 'Event Organizer';
        if (role === 'user') return 'Regular User';

        // Default to Event Organizer if no role specified (backwards compatibility)
        return 'Event Organizer';
    }

    /**
     * Get user's role for database/signup
     */
    getUserRole(user: any): UserRole | null {
        if (!user) return null;

        const role = user.user_metadata?.role?.toLowerCase();

        if (role === 'admin' || role === 'administrator') return UserRole.ADMIN;
        if (role === 'organizer') return UserRole.ORGANIZER;
        if (role === 'user') return UserRole.USER;

        // Default to organizer for backwards compatibility
        return UserRole.ORGANIZER;
    }
}
