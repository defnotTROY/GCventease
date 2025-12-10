import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AdminService, SystemHealth } from '../../../../core/services/admin.service';
import { AuthService } from '../../../../core/services/auth.service';
import { EventsService } from '../../../../core/services/events.service';
import { StatusService } from '../../../../core/services/status.service';
import { LucideAngularModule, Activity, Users, Calendar, Settings, CheckCircle, TrendingUp, Clock, RefreshCw, BarChart3, Shield } from 'lucide-angular';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  loading = true;
  isAdmin = false;

  stats = {
    totalUsers: 0,
    totalEvents: 0,
    totalParticipants: 0,
    activeEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    recentRegistrations: 0,
    systemHealth: 'healthy' as 'healthy' | 'degraded' | 'unhealthy'
  };

  recentActivity: any[] = [];

  // Icons
  readonly ActivityIcon = Activity;
  readonly UsersIcon = Users;
  readonly CalendarIcon = Calendar;
  readonly SettingsIcon = Settings;
  readonly CheckCircleIcon = CheckCircle;
  readonly TrendingUpIcon = TrendingUp;
  readonly ClockIcon = Clock;
  readonly RefreshCwIcon = RefreshCw;
  readonly ShieldIcon = Shield;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private eventsService: EventsService,
    private statusService: StatusService,
    private router: Router
  ) { }

  async ngOnInit() {
    // Check Admin Access
    const user = await this.authService.getCurrentUser();
    const role = user?.user_metadata?.role;
    // Accept 'admin', 'Admin', 'Administrator'
    this.isAdmin = role === 'admin' || role === 'Admin' || role === 'Administrator';

    if (!this.isAdmin) {
      // If role guard didn't catch it
      this.loading = false;
      return;
    }

    await this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      this.loading = true;

      // 1. Events Stats
      const { data: events, error } = await this.eventsService.getAllEvents();
      if (error) throw error;

      const allEvents = events || [];
      this.stats.totalEvents = allEvents.length;

      this.stats.activeEvents = allEvents.filter(e => this.statusService.calculateEventStatus(e) === 'ongoing').length;
      this.stats.upcomingEvents = allEvents.filter(e => this.statusService.calculateEventStatus(e) === 'upcoming').length;
      this.stats.completedEvents = allEvents.filter(e => this.statusService.calculateEventStatus(e) === 'completed').length;

      // 2. Participants Stats
      let totalParticipants = 0;
      // We can parallelize or just use the loop if not too many
      // Optimisation: getAllParticipants count from a service if available, else loop
      // We will loop a few or use event participants sums
      // Note: React did a loop over *all* events. If events are many, this is slow.
      // But AdminService might have a smarter way if we added one. 
      // AdminService had `getTotalUsers`. 

      // Let's emulate React's loop for Total Participants for now but careful with perf.
      // Actually we can query table count directly? getEventParticipants in existing service returns count for one event.
      // We don't have a "get TOTAL participants system wide" method.
      // We'll iterate for now, maybe only active events? No React did all.
      // Let's optimize: fetch all participants table rows count?
      // Supabase count is cheap.
      // Let's add that to AdminService or just do it here via a quick hack if needed?
      // No, let's stick to standard service method usage or safe loop.
      // If events > 50, this is bad.
      // Actually, let's skip the loop if > 50 events and just use 0 or estimate?
      // Or just count rows in 'participants' table using supabase client directly if we could.
      // But we are in Component.
      // Let's just Loop.

      for (const event of allEvents) {
        // This is potentially N requests. 
        // TODO: Add getSystemStats to AdminService later for single-query fetch.
      }
      // Actually, let's assume AdminService logic for totalUsers covered some of this? No.

      // I'll skip fine-grained participant count for *every* event in this blocking call to avoid timeout.
      // I will implement a simpler 'count' in AdminService? 
      // Let's just implement `getGlobalParticipantCount` in AdminService locally?
      // I can't easily modify AdminService while in this file writing step.
      // I'll leave it as 0 for now or try to estimate from filtered events.

      const health = await this.adminService.getSystemHealth();
      this.stats.systemHealth = health.status;

      this.stats.totalUsers = await this.adminService.getTotalUsers();

      const registrations = await this.adminService.getRecentRegistrations(10);
      this.stats.recentRegistrations = registrations.length;

      // Activity
      this.recentActivity = await this.adminService.getRecentActivity(10);

      // Correction: AdminService might not be perfectly mirroring all React logic for participants count
      // Reuse the loop logic properly if I want 1:1 match
      /*
      for (const event of allEvents) {
          const { data: count } = await this.eventsService.getEventParticipants(event.id);
          totalParticipants += count || 0;
      }
      this.stats.totalParticipants = totalParticipants;
      */
      // I'll omit the loop for performance scaling, user didn't explicitly demand exact parity on that metric if it kills performance.
      // But wait, user said "functional parity".
      // Okay, I will include it but wrapped in Promise.all to be faster or just efficient.
      const participantCountsPromises = allEvents.map(e => this.eventsService.getEventParticipants(e.id));
      const counts = await Promise.all(participantCountsPromises);
      this.stats.totalParticipants = counts.reduce((acc, curr) => acc + (curr.data || 0), 0);

    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    } finally {
      this.loading = false;
    }
  }

  getActivityIcon(type: string) {
    switch (type) {
      case 'user_registration': return Users;
      case 'event_created': return Calendar;
      case 'participant_registered': return Users;
      case 'event_completed': return CheckCircle;
      default: return Activity;
    }
  }
}
