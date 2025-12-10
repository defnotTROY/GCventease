import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface DashboardStats {
    totalEvents: number;
    totalParticipants: number;
    engagementRate: number;
    upcomingEvents: number;
    activeEvents?: number;
    completedEvents?: number;
    eventGrowth: number | null;
    participantGrowth: number | null;
    engagementChange: number | null;
    upcomingChange: number | null;
    totalAttended?: number;
    registeredEvents?: number;
    attendedEvents?: number;
    upcomingRegistrations?: number;
}

export interface DashboardEvent {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    participants: number;
    status: string;
    description: string;
    category: string;
    created_at?: string;
    registration_status?: string;
    registration_date?: string;
}

export interface DashboardInsight {
    title: string;
    description: string;
    recommendation: string;
    icon: string;
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    constructor(private supabase: SupabaseService) { }

    // Get dashboard overview statistics based on user role
    async getDashboardStats(userId: string | null = null, userRole: string = 'user'): Promise<DashboardStats> {
        try {
            const { user } = await this.supabase.getCurrentUser();
            if (!user) throw new Error('User not authenticated');

            const activeUserId = userId || user.id;
            const isOrganizer = userRole === 'Organizer' || userRole === 'organizer';
            const isAdmin = userRole === 'Administrator' || userRole === 'Admin';

            // For regular users - get stats about events they're REGISTERED for
            if (!isOrganizer && !isAdmin) {
                return await this.getUserStats(activeUserId);
            }

            // For organizers/admins - get stats about events they CREATED
            return await this.getOrganizerStats(activeUserId);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    }

    // Get stats for regular users (events they're registered for)
    private async getUserStats(userId: string): Promise<DashboardStats> {
        try {
            const { data: registrations, error: regError } = await this.supabase.client
                .from('participants')
                .select(`
          id,
          status,
          event_id,
          events (
            id,
            status,
            date,
            time
          )
        `)
                .eq('user_id', userId);

            if (regError) throw regError;

            // Filter active registrations
            const activeRegistrations = (registrations || []).filter((r: any) =>
                !r.status || r.status === 'registered' || r.status === 'confirmed' || r.status === 'attended'
            );

            const registeredEvents = activeRegistrations.length;
            const attendedEvents = activeRegistrations.filter((r: any) => r.status === 'attended').length;

            const upcomingRegistrations = activeRegistrations.filter((r: any) => {
                if (!r.events) return false;
                const accurateStatus = this.calculateAccurateStatus(r.events);
                return accurateStatus === 'upcoming' || accurateStatus === 'ongoing';
            }).length;

            return {
                registeredEvents,
                attendedEvents,
                upcomingRegistrations,
                totalEvents: registeredEvents,
                totalParticipants: 0,
                engagementRate: registeredEvents > 0 ? Math.round((attendedEvents / registeredEvents) * 100) : 0,
                upcomingEvents: upcomingRegistrations,
                eventGrowth: null,
                participantGrowth: null,
                engagementChange: null,
                upcomingChange: null
            };
        } catch (error) {
            console.error('Error fetching user stats:', error);
            return {
                registeredEvents: 0,
                attendedEvents: 0,
                upcomingRegistrations: 0,
                totalEvents: 0,
                totalParticipants: 0,
                engagementRate: 0,
                upcomingEvents: 0,
                eventGrowth: null,
                participantGrowth: null,
                engagementChange: null,
                upcomingChange: null
            };
        }
    }

    // Get stats for organizers/admins (events they created)
    private async getOrganizerStats(userId: string): Promise<DashboardStats> {
        try {
            const { data: events, error: eventsError } = await this.supabase.client
                .from('events')
                .select('*')
                .eq('user_id', userId);

            if (eventsError) throw eventsError;

            const totalEvents = events?.length || 0;
            const upcomingEvents = events?.filter((e: any) => this.calculateAccurateStatus(e) === 'upcoming').length || 0;
            const activeEvents = events?.filter((e: any) => this.calculateAccurateStatus(e) === 'ongoing').length || 0;
            const completedEvents = events?.filter((e: any) => this.calculateAccurateStatus(e) === 'completed').length || 0;

            let totalParticipants = 0;
            let totalAttended = 0;

            if (events && events.length > 0) {
                for (const event of events) {
                    const { data: participants, error: participantsError } = await this.supabase.client
                        .from('participants')
                        .select('status')
                        .eq('event_id', event.id);

                    if (!participantsError && participants) {
                        totalParticipants += participants.length;
                        totalAttended += participants.filter((p: any) => p.status === 'attended').length;
                    }
                }
            }

            const engagementRate = totalParticipants > 0 ? Math.round((totalAttended / totalParticipants) * 100) : 0;

            // Calculate growth
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: previousEvents } = await this.supabase.client
                .from('events')
                .select('*')
                .eq('user_id', userId)
                .lt('created_at', thirtyDaysAgo.toISOString());

            const previousEventCount = previousEvents?.length || 0;
            let previousParticipants = 0;
            let previousAttended = 0;

            if (previousEvents && previousEvents.length > 0) {
                for (const event of previousEvents) {
                    const { data: participants } = await this.supabase.client
                        .from('participants')
                        .select('status')
                        .eq('event_id', event.id);

                    if (participants) {
                        previousParticipants += participants.length;
                        previousAttended += participants.filter((p: any) => p.status === 'attended').length;
                    }
                }
            }

            const previousEngagementRate = previousParticipants > 0
                ? Math.round((previousAttended / previousParticipants) * 100)
                : null;

            const eventGrowth = previousEventCount > 0
                ? Math.round(((totalEvents - previousEventCount) / previousEventCount) * 100)
                : null;

            const participantGrowth = previousParticipants > 0
                ? Math.round(((totalParticipants - previousParticipants) / previousParticipants) * 100)
                : null;

            const engagementChange = previousEngagementRate !== null
                ? engagementRate - previousEngagementRate
                : null;

            const previousUpcomingEvents = previousEvents?.filter((e: any) => this.calculateAccurateStatus(e) === 'upcoming').length || 0;
            const upcomingChange = previousUpcomingEvents > 0
                ? Math.round(((upcomingEvents - previousUpcomingEvents) / previousUpcomingEvents) * 100)
                : null;

            return {
                totalEvents,
                totalParticipants,
                engagementRate,
                upcomingEvents,
                activeEvents,
                completedEvents,
                eventGrowth,
                participantGrowth,
                engagementChange,
                upcomingChange,
                totalAttended
            };
        } catch (error) {
            console.error('Error fetching organizer stats:', error);
            throw error;
        }
    }

    // Get today's date as a string in YYYY-MM-DD format (LOCAL timezone)
    getLocalDateString(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Get all events for the events tab based on user role
    async getAllEvents(userRole: string = 'user'): Promise<DashboardEvent[]> {
        try {
            const { user } = await this.supabase.getCurrentUser();
            if (!user) throw new Error('User not authenticated');

            const isOrganizer = userRole === 'Organizer' || userRole === 'organizer';
            const isAdmin = userRole === 'Administrator' || userRole === 'Admin';

            let events: any[] = [];

            if (isOrganizer || isAdmin) {
                const { data: createdEvents, error: eventsError } = await this.supabase.client
                    .from('events')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (eventsError) throw eventsError;
                events = createdEvents || [];
            } else {
                const { data: registrations, error: regError } = await this.supabase.client
                    .from('participants')
                    .select(`
            event_id,
            status,
            registration_date,
            events (*)
          `)
                    .eq('user_id', user.id);

                if (regError) throw regError;

                const activeRegistrations = (registrations || []).filter((r: any) =>
                    !r.status || r.status === 'registered' || r.status === 'confirmed' || r.status === 'attended'
                );

                events = activeRegistrations
                    .filter((r: any) => r.events)
                    .map((r: any) => ({
                        ...r.events,
                        registration_status: r.status,
                        registration_date: r.registration_date
                    }));
            }

            // Get participant counts and calculate accurate status
            const eventsWithParticipants = await Promise.all(
                events.map(async (event: any) => {
                    const { data: participants } = await this.supabase.client
                        .from('participants')
                        .select('id')
                        .eq('event_id', event.id);

                    const participantCount = participants?.length || 0;
                    const accurateStatus = this.calculateAccurateStatus(event);

                    return {
                        id: event.id,
                        title: event.title,
                        date: event.date,
                        time: event.time,
                        location: event.location,
                        participants: participantCount,
                        status: accurateStatus,
                        description: event.description,
                        category: event.category,
                        created_at: event.created_at,
                        registration_status: event.registration_status,
                        registration_date: event.registration_date
                    };
                })
            );

            if (isOrganizer || isAdmin) {
                return eventsWithParticipants.sort((a, b) =>
                    new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
                );
            } else {
                return eventsWithParticipants.sort((a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                );
            }
        } catch (error) {
            console.error('Error fetching all events:', error);
            throw error;
        }
    }

    // Calculate accurate status based on current date
    calculateAccurateStatus(event: any): string {
        if (event.status === 'cancelled') {
            return 'cancelled';
        }

        const now = new Date();
        const eventDateStr = event.date;
        const eventStart = new Date(eventDateStr + 'T00:00:00');

        if (event.time) {
            const timeParts = event.time.match(/(\d+):(\d+)/);
            if (timeParts) {
                eventStart.setHours(parseInt(timeParts[1]), parseInt(timeParts[2]), 0, 0);
            }
        }

        const eventEnd = new Date(eventStart);
        eventEnd.setHours(eventEnd.getHours() + 2);

        if (now < eventStart) {
            return 'upcoming';
        } else if (now >= eventStart && now <= eventEnd) {
            return 'ongoing';
        } else {
            return 'completed';
        }
    }

    // Get AI insights based on user role
    async getDashboardInsights(userId: string | null = null, userRole: string = 'user'): Promise<DashboardInsight[]> {
        try {
            const { user } = await this.supabase.getCurrentUser();
            if (!user) throw new Error('User not authenticated');

            const activeUserId = userId || user.id;
            const isOrganizer = userRole === 'Organizer' || userRole === 'organizer';
            const isAdmin = userRole === 'Administrator' || userRole === 'Admin';

            const stats = await this.getDashboardStats(activeUserId, userRole);
            const insights: DashboardInsight[] = [];

            if (isOrganizer || isAdmin) {
                // ORGANIZER/ADMIN INSIGHTS
                if (stats.totalEvents > 0) {
                    insights.push({
                        title: 'Event Creation Pattern',
                        description: `You've created ${stats.totalEvents} events with ${stats.totalParticipants} total registrations`,
                        recommendation: stats.totalEvents > 5 ? 'Consider creating interactive workshops or networking events to increase engagement' : 'Keep creating events to build your audience',
                        icon: 'calendar'
                    });
                } else {
                    insights.push({
                        title: 'Get Started',
                        description: "You haven't created any events yet",
                        recommendation: 'Create your first event to start building your audience!',
                        icon: 'calendar'
                    });
                }

                if (stats.engagementRate > 80) {
                    insights.push({
                        title: 'High Attendance Rate',
                        description: `Your events have an ${stats.engagementRate}% attendance rate`,
                        recommendation: 'Your events are performing well! Consider expanding successful formats',
                        icon: 'trending-up'
                    });
                } else if (stats.engagementRate < 50 && stats.totalParticipants > 0) {
                    insights.push({
                        title: 'Attendance Improvement',
                        description: `Your events have a ${stats.engagementRate}% attendance rate`,
                        recommendation: 'Send reminders before events or follow up with registered participants',
                        icon: 'trending-up'
                    });
                }

                if (stats.upcomingEvents > 0) {
                    insights.push({
                        title: 'Upcoming Events',
                        description: `You have ${stats.upcomingEvents} upcoming events scheduled`,
                        recommendation: 'Prepare materials and send reminders to participants',
                        icon: 'clock'
                    });
                }
            } else {
                // REGULAR USER INSIGHTS
                if (stats.registeredEvents && stats.registeredEvents > 0) {
                    insights.push({
                        title: 'Your Event Activity',
                        description: `You're registered for ${stats.registeredEvents} events`,
                        recommendation: stats.upcomingRegistrations && stats.upcomingRegistrations > 0
                            ? `Don't forget - you have ${stats.upcomingRegistrations} upcoming events to attend!`
                            : 'Browse more events to find ones that match your interests',
                        icon: 'calendar'
                    });
                } else {
                    insights.push({
                        title: 'Get Started',
                        description: "You haven't registered for any events yet",
                        recommendation: 'Explore events and register for ones that match your interests!',
                        icon: 'calendar'
                    });
                }

                if (stats.registeredEvents && stats.registeredEvents > 0) {
                    const attendanceRate = stats.attendedEvents && stats.registeredEvents > 0
                        ? Math.round((stats.attendedEvents / stats.registeredEvents) * 100)
                        : 0;

                    if (attendanceRate >= 80) {
                        insights.push({
                            title: 'Great Attendance!',
                            description: `You've attended ${stats.attendedEvents} of ${stats.registeredEvents} events (${attendanceRate}%)`,
                            recommendation: 'Keep up the great engagement! Your participation makes events better',
                            icon: 'trending-up'
                        });
                    } else if (stats.attendedEvents === 0 && stats.registeredEvents > 0) {
                        insights.push({
                            title: 'Time to Attend!',
                            description: `You're registered for ${stats.registeredEvents} events but haven't attended any yet`,
                            recommendation: 'Make sure to show up to events you register for - organizers are counting on you!',
                            icon: 'users'
                        });
                    }
                }

                if (stats.upcomingRegistrations && stats.upcomingRegistrations > 0) {
                    insights.push({
                        title: 'Upcoming Events',
                        description: `You have ${stats.upcomingRegistrations} upcoming events on your schedule`,
                        recommendation: "Check the dates and mark your calendar so you don't miss them!",
                        icon: 'clock'
                    });
                }
            }

            return insights;
        } catch (error) {
            console.error('Error generating dashboard insights:', error);
            return [];
        }
    }

    // Format date for display
    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
}
