import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    end_time?: string;
    location: string;
    category: string;
    status: string;
    max_participants?: number;
    is_virtual: boolean;
    virtual_link?: string;
    user_id: string;
    created_at: string;
    image_url?: string;
}

@Injectable({
    providedIn: 'root'
})
export class EventsService {
    constructor(private supabase: SupabaseService) { }

    // Get all public events
    async getAllEvents(): Promise<{ data: Event[] | null; error: any }> {
        try {
            const { data, error } = await this.supabase.client
                .from('events')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching all events:', error);
            return { data: null, error };
        }
    }

    // Get event by ID
    async getEventById(eventId: string): Promise<{ data: Event | null; error: any }> {
        try {
            const { data, error } = await this.supabase.client
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching event:', error);
            return { data: null, error };
        }
    }

    // Get participant count for an event
    async getEventParticipants(eventId: string): Promise<{ data: number; error: any }> {
        try {
            const { data, error } = await this.supabase.client
                .from('participants')
                .select('id')
                .eq('event_id', eventId);

            if (error) throw error;
            return { data: data?.length || 0, error: null };
        } catch (error) {
            console.error('Error fetching participants:', error);
            return { data: 0, error };
        }
    }

    // Create event
    async createEvent(eventData: Partial<Event>): Promise<{ data: Event | null; error: any }> {
        try {
            const { data, error } = await this.supabase.client
                .from('events')
                .insert([eventData])
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error creating event:', error);
            return { data: null, error };
        }
    }

    // Update event
    async updateEvent(eventId: string, eventData: Partial<Event>): Promise<{ data: Event | null; error: any }> {
        try {
            const { data, error } = await this.supabase.client
                .from('events')
                .update(eventData)
                .eq('id', eventId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error updating event:', error);
            return { data: null, error };
        }
    }

    // Delete event
    async deleteEvent(eventId: string): Promise<{ error: any }> {
        try {
            const { error } = await this.supabase.client
                .from('events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Error deleting event:', error);
            return { error };
        }
    }

    // Format date
    formatDate(dateString: string): string {
        if (!dateString) return 'TBD';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Format time
    formatTime(timeString: string): string {
        if (!timeString) return 'TBD';
        if (timeString.includes('AM') || timeString.includes('PM')) {
            return timeString;
        }
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    // Calculate event status
    calculateEventStatus(event: Event): string {
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

    // Get event image URL
    getEventImageUrl(event: Event, size: number = 400): string {
        if (event?.image_url) {
            return event.image_url;
        }

        const seed = encodeURIComponent(event?.title || event?.id || 'event');
        return `https://source.boringavatars.com/marble/${size}/${seed}?colors=0D9488,14B8A6,2DD4BF,5EEAD4,99F6E4`;
    }

    // Get detailed participant information for an event
    async getEventParticipantsDetails(eventId: string): Promise<{ data: any[] | null; error: any }> {
        try {
            const { data, error } = await this.supabase.client
                .from('participants')
                .select('*')
                .eq('event_id', eventId);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching participant details:', error);
            return { data: null, error };
        }
    }

    // Upload event image
    async uploadEventImage(file: File): Promise<{ publicUrl: string | null; error: any }> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await this.supabase.client.storage
                .from('events')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = this.supabase.client.storage
                .from('events')
                .getPublicUrl(filePath);

            return { publicUrl: data.publicUrl, error: null };
        } catch (error) {
            console.error('Error uploading image:', error);
            return { publicUrl: null, error };
        }
    }

    // Check for time conflicts
    async checkParticipantTimeConflict(userId: string, targetEvent: Event): Promise<{ hasConflict: boolean; conflictingEvent?: any; error: any }> {
        try {
            // Get all events user is participating in
            // Use inner join via filter if possible, or just fetch participant records and then events
            // Supabase approach: select event_id from participants

            const { data: participations, error: partError } = await this.supabase.client
                .from('participants')
                .select(`
                    event_id,
                    events (
                        id,
                        title,
                        date,
                        time,
                        end_time
                    )
                `)
                .eq('user_id', userId);

            if (partError) throw partError;

            if (!participations || participations.length === 0) {
                return { hasConflict: false, error: null };
            }

            const targetDate = targetEvent.date;

            // Helper to parsing time
            const parseTime = (dateStr: string, timeStr: string): Date => {
                const d = new Date(dateStr + 'T00:00:00');
                if (timeStr) {
                    const parts = timeStr.match(/(\d+):(\d+)/);
                    if (parts) {
                        d.setHours(parseInt(parts[1]), parseInt(parts[2]), 0, 0);
                    }
                }
                return d;
            };

            const getEndTime = (start: Date, endTimeStr?: string): Date => {
                if (endTimeStr) {
                    const end = new Date(start);
                    const parts = endTimeStr.match(/(\d+):(\d+)/);
                    if (parts) {
                        end.setHours(parseInt(parts[1]), parseInt(parts[2]), 0, 0);
                        // Handle crossing midnight if needed, but assuming same day events for simplicity
                        if (end < start) end.setDate(end.getDate() + 1);
                        return end;
                    }
                }
                // Default 2 hours if no end time
                const end = new Date(start);
                end.setHours(end.getHours() + 2);
                return end;
            };

            const targetStart = parseTime(targetEvent.date, targetEvent.time);
            const targetEnd = getEndTime(targetStart, targetEvent.end_time);

            for (const p of participations) {
                const eventData: any = p.events;
                const existingEvent = Array.isArray(eventData) ? eventData[0] : eventData;

                // Only active events (optional check status?)
                if (!existingEvent) continue;

                if (existingEvent.id === targetEvent.id) continue; // Already joined this one?

                if (existingEvent.date === targetDate) {
                    const existingStart = parseTime(existingEvent.date, existingEvent.time);
                    const existingEnd = getEndTime(existingStart, existingEvent.end_time);

                    // Check overlap
                    // Overlap if (StartA < EndB) and (EndA > StartB)
                    if (targetStart < existingEnd && targetEnd > existingStart) {
                        return { hasConflict: true, conflictingEvent: existingEvent, error: null };
                    }
                }
            }

            return { hasConflict: false, error: null };

        } catch (error) {
            console.error('Error checking time conflict:', error);
            return { hasConflict: false, error };
        }
    }

    // Join event
    async joinEvent(eventId: string, userId: string): Promise<{ error: any }> {
        try {
            const { error } = await this.supabase.client
                .from('participants')
                .insert([
                    { event_id: eventId, user_id: userId, status: 'confirmed', registered_at: new Date().toISOString() }
                ]);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Error joining event:', error);
            return { error };
        }
    }

    // Check if user is registered
    async isUserRegistered(eventId: string, userId: string): Promise<{ isRegistered: boolean; error: any }> {
        try {
            const { data, error } = await this.supabase.client
                .from('participants')
                .select('id')
                .eq('event_id', eventId)
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found" (0 results)

            return { isRegistered: !!data, error: null };
        } catch (error) {
            console.error('Error checking registration:', error);
            return { isRegistered: false, error };
        }
    }
}
