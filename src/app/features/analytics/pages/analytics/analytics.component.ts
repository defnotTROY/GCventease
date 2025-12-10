import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { EventsService } from '../../../../core/services/events.service';
import { DashboardService } from '../../../../core/services/dashboard.service';

interface AnalyticsData {
  totalEvents: number;
  totalParticipants: number;
  upcomingEvents: number;
  completedEvents: number;
  averageParticipants: number;
  topEvents: any[];
  eventsByCategory: { [key: string]: number };
  participantTrend: { month: string; count: number }[];
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent implements OnInit {
  // Data
  analytics: AnalyticsData | null = null;
  loading = true;
  error: string | null = null;
  user: any = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private eventsService: EventsService,
    private dashboardService: DashboardService
  ) { }

  async ngOnInit() {
    await this.loadAnalytics();
  }

  async loadAnalytics() {
    try {
      this.loading = true;

      this.user = await this.authService.getCurrentUser();
      if (!this.user) {
        this.router.navigate(['/login']);
        return;
      }

      const { data: events } = await this.eventsService.getAllEvents();

      if (!events || events.length === 0) {
        this.analytics = {
          totalEvents: 0,
          totalParticipants: 0,
          upcomingEvents: 0,
          completedEvents: 0,
          averageParticipants: 0,
          topEvents: [],
          eventsByCategory: {},
          participantTrend: []
        };
        this.loading = false;
        return;
      }

      // Calculate analytics
      const totalEvents = events.length;
      let totalParticipants = 0;
      const eventsByCategory: { [key: string]: number } = {};
      const topEvents: any[] = [];

      // Get participant counts for each event
      for (const event of events) {
        const { data: count } = await this.eventsService.getEventParticipants(event.id);
        const participantCount = count || 0;
        totalParticipants += participantCount;

        // Track by category
        if (event.category) {
          eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
        }

        // Add to top events
        topEvents.push({
          ...event,
          participantCount
        });
      }

      // Sort top events by participants
      topEvents.sort((a, b) => b.participantCount - a.participantCount);

      // Calculate status counts
      const upcomingEvents = events.filter(e => this.eventsService.calculateEventStatus(e) === 'upcoming').length;
      const completedEvents = events.filter(e => this.eventsService.calculateEventStatus(e) === 'completed').length;

      // Calculate average
      const averageParticipants = totalEvents > 0 ? Math.round(totalParticipants / totalEvents) : 0;

      // Generate participant trend (last 6 months)
      const participantTrend = this.generateParticipantTrend(events);

      this.analytics = {
        totalEvents,
        totalParticipants,
        upcomingEvents,
        completedEvents,
        averageParticipants,
        topEvents: topEvents.slice(0, 5),
        eventsByCategory,
        participantTrend
      };

    } catch (error: any) {
      console.error('Error loading analytics:', error);
      this.error = 'Failed to load analytics. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  generateParticipantTrend(events: any[]): { month: string; count: number }[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      count: Math.floor(Math.random() * 100) + 20 // Placeholder data
    }));
  }

  getCategoryPercentage(category: string): number {
    if (!this.analytics) return 0;
    const total = this.analytics.totalEvents;
    const count = this.analytics.eventsByCategory[category] || 0;
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }

  get categoryEntries(): [string, number][] {
    if (!this.analytics) return [];
    return Object.entries(this.analytics.eventsByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }

  formatDate(dateString: string): string {
    return this.eventsService.formatDate(dateString);
  }
}
