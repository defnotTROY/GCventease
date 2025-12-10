import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthUser } from '../../../../core/services/supabase.service';
import { DashboardService, DashboardStats, DashboardEvent, DashboardInsight } from '../../../../core/services/dashboard.service';
import { ScheduleService, ScheduleEvent } from '../../../../core/services/schedule.service';
import { UserScheduleComponent } from '../../../../shared/components/user-schedule/user-schedule.component';
import { AiRecommendationsComponent } from '../../../../shared/components/ai-recommendations/ai-recommendations.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, UserScheduleComponent, AiRecommendationsComponent],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    currentUser: AuthUser | null = null;
    isSidebarCollapsed = false;
    currentPage = 'Dashboard';
    activeTab: 'overview' | 'events' | 'insights' = 'overview';

    // Data state
    stats: DashboardStats | null = null;
    allEvents: DashboardEvent[] = [];
    insights: DashboardInsight[] = [];
    scheduleData: ScheduleEvent[] = [];
    isLoading = true;
    dataLoading = false;
    error: string | null = null;

    constructor(
        private authService: AuthService,
        private router: Router,
        private dashboardService: DashboardService,
        private scheduleService: ScheduleService
    ) { }

    async ngOnInit() {
        this.currentUser = await this.authService.getCurrentUser();
        if (!this.currentUser) {
            this.router.navigate(['/login']);
            return;
        }

        // Load dashboard data
        await this.loadData();
        this.isLoading = false;
    }

    async loadData() {
        try {
            this.error = null;
            this.dataLoading = true;

            if (!this.currentUser) return;

            const userRole = this.currentUser.user_metadata?.role || 'user';

            console.log('Loading dashboard data for user:', this.currentUser.id, 'role:', userRole);

            // Load all data in parallel
            const [dashboardStats, allEventsData, insightsData, scheduleDataResult] = await Promise.all([
                this.dashboardService.getDashboardStats(this.currentUser.id, userRole),
                this.dashboardService.getAllEvents(userRole),
                this.dashboardService.getDashboardInsights(this.currentUser.id, userRole),
                this.scheduleService.getUserSchedule(this.currentUser.id, userRole)
            ]);

            console.log('Schedule data loaded:', scheduleDataResult);

            this.stats = dashboardStats;
            this.allEvents = allEventsData;
            this.insights = insightsData;
            this.scheduleData = scheduleDataResult;

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.error = 'Failed to load dashboard data. Please try again.';
        } finally {
            this.dataLoading = false;
        }
    }

    toggleSidebar() {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }

    async logout() {
        const result = await this.authService.signOut();
        if (result.success) {
            this.router.navigate(['/landing']);
        }
    }

    navigateTo(page: string, route: string) {
        this.currentPage = page;
        this.router.navigate([route]);
    }

    setActiveTab(tab: 'overview' | 'events' | 'insights') {
        this.activeTab = tab;
    }

    getChangeDisplay(change: number | null, suffix: string = '%'): { label: string, className: string } {
        if (change === null || change === undefined) {
            return {
                label: '—',
                className: 'text-gray-400'
            };
        }

        const numericChange = Number(change);
        if (Number.isNaN(numericChange)) {
            return {
                label: '—',
                className: 'text-gray-400'
            };
        }

        const sign = numericChange > 0 ? '+' : numericChange < 0 ? '' : '';
        const className = numericChange > 0
            ? 'text-green-600'
            : numericChange < 0
                ? 'text-red-600'
                : 'text-gray-500';

        return {
            label: `${sign}${numericChange}${suffix}`,
            className
        };
    }

    formatDate(dateString: string): string {
        return this.dashboardService.formatDate(dateString);
    }

    get userDisplayName(): string {
        if (!this.currentUser) return 'User';
        const firstName = this.currentUser.user_metadata?.first_name;
        const lastName = this.currentUser.user_metadata?.last_name;
        if (firstName && lastName) {
            return `${firstName} ${lastName}`;
        }
        return this.currentUser.email || 'User';
    }

    get userRole(): string {
        return this.currentUser?.user_metadata?.role || 'User';
    }

    get isAdmin(): boolean {
        return this.authService.isAdmin;
    }

    get isOrganizerOrAdmin(): boolean {
        const role = this.currentUser?.user_metadata?.role || 'user';
        return role === 'Organizer' || role === 'organizer' || role === 'Administrator' || role === 'Admin';
    }
}

