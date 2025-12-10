import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
    severity: 'low' | 'medium' | 'high';
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {

    constructor(private supabase: SupabaseService) { }

    // Get total users count
    async getTotalUsers(): Promise<number> {
        try {
            // Method 1: RPC
            const { data: rpcCount, error: rpcError } = await this.supabase.client
                .rpc('get_user_count');

            if (!rpcError && rpcCount !== null && typeof rpcCount === 'number' && rpcCount > 0) {
                return rpcCount;
            }
        } catch (e) {
            console.log('RPC get_user_count failed, using fallback');
        }

        // Method 2: Aggregate
        try {
            const userSet = new Set<string>();

            // From Events
            const { data: events } = await this.supabase.client
                .from('events')
                .select('user_id');

            events?.forEach(e => {
                if (e.user_id) userSet.add(e.user_id);
            });

            // From Participants
            const { data: participants } = await this.supabase.client
                .from('participants')
                .select('user_id');

            participants?.forEach(p => {
                if (p.user_id) userSet.add(p.user_id);
            });

            // From Profiles (if exists)
            const { data: profiles } = await this.supabase.client
                .from('profiles')
                .select('id');

            profiles?.forEach(p => {
                if (p.id) userSet.add(p.id);
            });

            return userSet.size;
        } catch (error) {
            console.error('Error calculating total users:', error);
            return 0;
        }
    }

    // Get recent registrations
    async getRecentRegistrations(limit: number = 10): Promise<any[]> {
        try {
            // In Supabase Auth, we can't easily query users without admin key or RPC.
            // We will infer from events created or generic activity if RPC fails, 
            // but strictly speaking, "Registrations" usually means Auth Users.
            // React code used 'events' grouping as a proxy for "Active Users recently"? 
            // React code: fetches 'events' and groups by user_id to find "Recent Registrations"? 
            // That seems like "Recent Creators".
            // React code logic:
            // fetch events -> group by user_id -> sort by oldest created_at? No, newest.
            // Actually it's finding users who recently interacted?
            // Let's stick to the React logic: generic "Recent User Activity" disguised as registrations
            // OR better: use RPC if available.

            const { data: recentEvents, error } = await this.supabase.client
                .from('events')
                .select('user_id, created_at, title')
                .order('created_at', { ascending: false })
                .limit(limit * 2);

            if (error) throw error;

            const userActivityMap = new Map();
            recentEvents?.forEach(event => {
                if (!userActivityMap.has(event.user_id) ||
                    new Date(event.created_at) > new Date(userActivityMap.get(event.user_id).created_at)) {
                    userActivityMap.set(event.user_id, {
                        user_id: event.user_id,
                        created_at: event.created_at,
                        last_event: event.title
                    });
                }
            });

            return Array.from(userActivityMap.values())
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, limit);

        } catch (error) {
            console.error('Error getting recent registrations:', error);
            return [];
        }
    }

    // Get recent activity
    async getRecentActivity(limit: number = 10): Promise<any[]> {
        try {
            const activities: any[] = [];

            // Events
            const { data: recentEvents, error: eventsError } = await this.supabase.client
                .from('events')
                .select('id, title, status, created_at, user_id')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (!eventsError && recentEvents) {
                recentEvents.forEach(event => {
                    activities.push({
                        id: `event-${event.id}`,
                        type: event.status === 'completed' ? 'event_completed' : 'event_created',
                        message: event.status === 'completed'
                            ? `Event completed: ${event.title}`
                            : `New event created: ${event.title}`,
                        time: this.formatTimeAgo(new Date(event.created_at)),
                        timestamp: new Date(event.created_at),
                        icon: event.status === 'completed' ? 'CheckCircle' : 'Calendar'
                    });
                });
            }

            // Participants
            const { data: recentParticipants, error: partError } = await this.supabase.client
                .from('participants')
                .select('id, event_id, created_at') // Minimal fields
                .order('created_at', { ascending: false })
                .limit(limit * 2);

            if (!partError && recentParticipants) {
                const eventIds = [...new Set(recentParticipants.map(p => p.event_id))];
                const { data: events } = await this.supabase.client
                    .from('events')
                    .select('id, title')
                    .in('id', eventIds);

                const eventTitleMap = new Map();
                events?.forEach(e => eventTitleMap.set(e.id, e.title));

                const participantsByEvent = new Map();
                recentParticipants.forEach(p => {
                    const eid = p.event_id;
                    const title = eventTitleMap.get(eid) || 'Event';
                    if (!participantsByEvent.has(eid)) {
                        participantsByEvent.set(eid, {
                            event_title: title,
                            count: 0,
                            timestamp: new Date(p.created_at || new Date())
                        });
                    }
                    const item = participantsByEvent.get(eid);
                    item.count++;
                    const pTime = new Date(p.created_at);
                    if (pTime > item.timestamp) item.timestamp = pTime;
                });

                participantsByEvent.forEach((info, key) => {
                    activities.push({
                        id: `participants-${key}`,
                        type: 'participant_registered',
                        message: `${info.count} new participant${info.count > 1 ? 's' : ''} registered for ${info.event_title}`,
                        time: this.formatTimeAgo(info.timestamp),
                        timestamp: info.timestamp,
                        icon: 'Users'
                    });
                });
            }

            return activities
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, limit);

        } catch (error) {
            console.error('Error getting recent activity:', error);
            return [];
        }
    }

    async getSystemHealth(): Promise<SystemHealth> {
        try {
            const { error } = await this.supabase.client
                .from('events')
                .select('id')
                .limit(1);

            if (error) {
                return { status: 'degraded', message: 'Database connection issues', severity: 'medium' };
            }
            return { status: 'healthy', message: 'All systems operational', severity: 'low' };
        } catch {
            return { status: 'unhealthy', message: 'System error detected', severity: 'high' };
        }
    }

    private formatTimeAgo(date: Date): string {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
        const diffInWeeks = Math.floor(diffInDays / 7);
        return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
    }

    // User Management
    async getAllUsers(): Promise<any[]> {
        try {
            // Method 1: RPC 'get_all_users'
            // Just mocking the logic flow from React
            const { data: rpcUsers, error: rpcError } = await this.supabase.client
                .rpc('get_all_users');

            if (!rpcError && rpcUsers) {
                // Process rpcUsers...
                return rpcUsers; // Simplify for now
            }

            console.log('Using fallback for getAllUsers');

            // Method 2: Fallback (Map from events/participants)
            const usersMap = new Map<string, any>();

            // From Events
            const { data: events } = await this.supabase.client.from('events').select('*');
            events?.forEach(e => {
                if (e.user_id) {
                    if (!usersMap.has(e.user_id)) {
                        usersMap.set(e.user_id, {
                            id: e.user_id,
                            email: 'N/A', // Cannot get email without RPC or Profiles
                            role: 'Organizer',
                            events_created: 0,
                            created_at: e.created_at
                        });
                    }
                    const u = usersMap.get(e.user_id);
                    u.events_created++;
                }
            });

            // From Participants
            // If we want emails, participants table has them!
            const { data: participants } = await this.supabase.client.from('participants').select('*');
            participants?.forEach(p => {
                if (p.user_id) {
                    if (!usersMap.has(p.user_id)) {
                        usersMap.set(p.user_id, {
                            id: p.user_id,
                            email: p.email || 'N/A',
                            role: 'User',
                            events_created: 0,
                            created_at: p.created_at || p.registration_date
                        });
                    }
                    const u = usersMap.get(p.user_id);
                    if (u.email === 'N/A' && p.email) u.email = p.email;
                }
            });

            return Array.from(usersMap.values());
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }

    async updateUserRole(userId: string, newRole: string) {
        // Typically via RPC
        return this.supabase.client.rpc('update_user_role', { user_id: userId, new_role: newRole });
    }

    async updateUserStatus(userId: string, status: string) {
        return this.supabase.client.rpc('update_user_status', { user_id: userId, status: status });
    }

    async deleteUser(userId: string) {
        return this.supabase.client.rpc('delete_user', { user_id: userId });
    }
}
