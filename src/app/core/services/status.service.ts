import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
    providedIn: 'root'
})
export class StatusService {
    constructor(private supabase: SupabaseService) { }

    /**
     * Calculate event status based on current date and event dates
     */
    calculateEventStatus(event: any): string {
        const now = new Date();
        const eventDate = new Date(event.date);

        let eventStart = new Date(eventDate);
        eventStart.setHours(0, 0, 0, 0);

        if (event.time) {
            const startTime = this.parseTime(event.time);
            eventStart = new Date(eventDate);
            eventStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
        }

        // Default to 2-hour duration
        const eventEnd = new Date(eventStart);
        eventEnd.setHours(eventStart.getHours() + 2);

        // Determine status based on current time
        if (event.status === 'cancelled') {
            return 'cancelled';
        }

        if (now < eventStart) {
            return 'upcoming';
        } else if (now >= eventStart && now <= eventEnd) {
            return 'ongoing';
        } else {
            return 'completed';
        }
    }

    /**
     * Enhanced time parsing to handle more formats
     */
    parseTime(timeString: string): Date {
        const time = new Date();

        if (!timeString) {
            return time;
        }

        // Handle different time formats
        if (timeString.includes('AM') || timeString.includes('PM')) {
            // 12-hour format: "9:00 AM", "2:30 PM", etc.
            const [timePart, period] = timeString.split(' ');
            const [hoursStr, minutesStr] = timePart.split(':');
            const hours = parseInt(hoursStr);
            const minutes = parseInt(minutesStr || '0');

            let hour24 = hours;
            if (period === 'PM' && hours !== 12) {
                hour24 += 12;
            } else if (period === 'AM' && hours === 12) {
                hour24 = 0;
            }

            time.setHours(hour24, minutes);
        } else if (timeString.includes(':')) {
            // 24-hour format: "09:00", "14:30", etc.
            const [hoursStr, minutesStr] = timeString.split(':');
            const hours = parseInt(hoursStr);
            const minutes = parseInt(minutesStr || '0');
            time.setHours(hours, minutes);
        } else if (timeString.includes('-')) {
            // Time range format: "9:00 AM - 6:00 PM" - use start time
            const startTime = timeString.split(' - ')[0].trim();
            return this.parseTime(startTime);
        } else {
            // Try to parse as a number (hours)
            const hours = parseInt(timeString);
            if (!isNaN(hours)) {
                time.setHours(hours, 0);
            }
        }

        return time;
    }

    /**
     * Update event status in database
     */
    async updateEventStatus(eventId: string, newStatus: string): Promise<{ data: any; error: any }> {
        try {
            console.log('StatusService: Updating event', eventId, 'to status', newStatus);

            if (!eventId) {
                throw new Error('Event ID is required');
            }
            if (!newStatus || !['upcoming', 'ongoing', 'completed', 'cancelled'].includes(newStatus)) {
                throw new Error('Invalid status provided');
            }

            const user = await this.supabase.getCurrentUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            const { data, error } = await this.supabase.client
                .from('events')
                .update({ status: newStatus })
                .eq('id', eventId)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) {
                console.error('StatusService: Supabase error:', error);
                throw new Error(`Database error: ${error.message}`);
            }

            if (!data) {
                throw new Error('Event not found or you do not have permission to update it');
            }

            console.log('StatusService: Update successful:', data);
            return { data, error: null };
        } catch (error) {
            console.error('StatusService: Error updating event status:', error);
            return { data: null, error };
        }
    }

    /**
     * Get status options for dropdown
     */
    getStatusOptions() {
        return [
            { value: 'upcoming', label: 'Upcoming', color: 'bg-blue-100 text-blue-800' },
            { value: 'ongoing', label: 'Ongoing', color: 'bg-green-100 text-green-800' },
            { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-800' },
            { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
        ];
    }

    /**
     * Get status color class
     */
    getStatusColor(status: string): string {
        const option = this.getStatusOptions().find(opt => opt.value === status);
        return option ? option.color : 'bg-gray-100 text-gray-800';
    }
}
