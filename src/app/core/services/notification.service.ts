import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: 'info' | 'success' | 'warning';
    link?: string;
    timestamp: number; // for sorting
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    constructor(private supabase: SupabaseService) { }

    async getNotifications(userId: string): Promise<Notification[]> {
        const notifications: Notification[] = [];
        const now = new Date();

        try {
            // 1. Get recent registrations (last 7 days)
            const { data: registrations } = await this.supabase.client
                .from('participants')
                .select(`
                id,
                status,
                registration_date,
                events (
                    id,
                    title,
                    date,
                    time
                )
            `)
                .eq('user_id', userId)
                .order('registration_date', { ascending: false })
                .limit(5);

            if (registrations) {
                registrations.forEach((reg: any) => {
                    if (!reg.events) return;

                    // Registration confirmation
                    if (reg.status === 'registered') {
                        notifications.push({
                            id: `reg-${reg.id}`,
                            title: 'Registration Confirmed',
                            message: `You are registered for "${reg.events.title}".`,
                            time: this.getTimeAgo(new Date(reg.registration_date)),
                            read: false,
                            type: 'success',
                            link: `/events`,
                            timestamp: new Date(reg.registration_date).getTime()
                        });
                    }

                    // Check for upcoming (within 24 hours)
                    const eventDate = new Date(`${reg.events.date}T${reg.events.time || '00:00'}`);
                    const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

                    if (diffHours > 0 && diffHours < 24) {
                        notifications.push({
                            id: `rem-24h-${reg.events.id}`,
                            title: 'Upcoming Event Reminder',
                            message: `"${reg.events.title}" is starting soon!`,
                            time: 'Coming up',
                            read: false,
                            type: 'warning',
                            link: `/events`,
                            timestamp: now.getTime() // Top priority
                        });
                    }
                });
            }

            // 2. New Events available (created last 3 days)
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(now.getDate() - 3);

            const { data: newEvents } = await this.supabase.client
                .from('events')
                .select('id, title, created_at')
                .gt('created_at', threeDaysAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(3);

            if (newEvents) {
                newEvents.forEach((event: any) => {
                    // Don't show if user created it (if we checked user_id, but here simple logic)
                    notifications.push({
                        id: `new-${event.id}`,
                        title: 'New Event Available',
                        message: `Check out "${event.title}" - just added!`,
                        time: this.getTimeAgo(new Date(event.created_at)),
                        read: false,
                        type: 'info',
                        link: `/events/${event.id}`,
                        timestamp: new Date(event.created_at).getTime()
                    });
                });
            }

            // If empty, add welcome
            if (notifications.length === 0) {
                notifications.push({
                    id: 'welcome',
                    title: 'Welcome to GCventease',
                    message: 'We are glad to have you here! Browse events to get started.',
                    time: 'Just now',
                    read: false,
                    type: 'info',
                    link: '/events',
                    timestamp: now.getTime()
                });
            }

        } catch (e) {
            console.error("Error generating notifications", e);
        }

        // Sort by timestamp desc, remove timestamp from interface if needed but keep for sort
        return notifications.sort((a, b) => b.timestamp - a.timestamp);
    }

    private getTimeAgo(date: Date): string {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;

        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return "Just now";
    }
}
