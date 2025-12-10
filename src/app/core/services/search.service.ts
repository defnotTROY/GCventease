import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface SearchResult {
    events: any[];
    participants: any[];
    registeredEvents: any[];
    myEvents: any[];
    total: number;
    isOrganizerOrAdmin: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    constructor(private supabase: SupabaseService) { }

    async globalSearch(userId: string, query: string, userRole: string): Promise<SearchResult> {
        const results: SearchResult = {
            events: [],
            participants: [],
            registeredEvents: [],
            myEvents: [],
            total: 0,
            isOrganizerOrAdmin: false
        };

        if (!query.trim()) return results;

        try {
            const isAdmin = userRole === 'model' || userRole === 'admin' || userRole === 'Administrator';
            const isOrganizer = userRole === 'organizer' || userRole === 'Event Organizer';
            results.isOrganizerOrAdmin = isAdmin || isOrganizer;

            const term = `%${query.trim()}%`;

            // 1. Search Events (Global)
            // If admin/organizer, search all. If user, maybe only public? React code implies all "Discover" events.
            const { data: events } = await this.supabase.client
                .from('events')
                .select('*')
                .or(`title.ilike.${term},description.ilike.${term},location.ilike.${term}`)
                .order('date', { ascending: true })
                .limit(20);

            if (events) results.events = events;

            // 2. Search My Registrations (All users)
            const { data: myRegistrations } = await this.supabase.client
                .from('participants')
                .select(`
                    event_id,
                    events:events (*)
                `)
                .eq('user_id', userId);

            if (myRegistrations) {
                // Filter locally for query match in title/desc
                const q = query.toLowerCase();
                results.registeredEvents = myRegistrations
                    .map((r: any) => r.events)
                    .filter((e: any) => e && (e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)));
            }

            // 3. Search My Created Events (Organizer/Admin)
            if (isAdmin || isOrganizer) {
                const { data: myCreated } = await this.supabase.client
                    .from('events')
                    .select('*')
                    .eq('user_id', userId)
                    .or(`title.ilike.${term},description.ilike.${term}`);

                if (myCreated) results.myEvents = myCreated;
            }

            // 4. Search Participants (Organizer/Admin)
            if (isAdmin || isOrganizer) {
                // This is tricky without a join on events I own. 
                // For now, let's search participants table globally if admin, or join if possible.
                // React code does a global search on participants table.

                let partQuery = this.supabase.client
                    .from('participants')
                    .select(`
                        id, first_name, last_name, email, event_id,
                        events:events (title)
                    `)
                    .or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`)
                    .limit(20);

                // Ideally filter by events I own if organizer... 
                // But simplified for now to match React's likely behavior (or improve).

                const { data: participants } = await partQuery;
                if (participants) results.participants = participants;
            }

            // Calculate total unique items found (rough count)
            results.total = results.events.length + results.registeredEvents.length + results.myEvents.length + results.participants.length;

            return results;
        } catch (error) {
            console.error('Global search error:', error);
            return results;
        }
    }
}
