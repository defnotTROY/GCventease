import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Calendar, Users, QrCode, BarChart3, ShieldCheck, CheckCircle, ArrowRight, Sparkles, Clock, TrendingUp, Sparkle, CalendarClock } from 'lucide-angular';
import { gordonCollegeConfig } from '../../../../core/config/gordon-college.config';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  config = gordonCollegeConfig;
  currentYear = new Date().getFullYear();

  // Icons
  readonly CalendarIcon = Calendar;
  readonly UsersIcon = Users;
  readonly QrCodeIcon = QrCode;
  readonly BarChart3Icon = BarChart3;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly CheckCircleIcon = CheckCircle;
  readonly ArrowRightIcon = ArrowRight;
  readonly SparklesIcon = Sparkles;
  readonly ClockIcon = Clock;
  readonly TrendingUpIcon = TrendingUp;
  readonly SparkleIcon = Sparkle;
  readonly CalendarClockIcon = CalendarClock;

  features = [
    {
      icon: Calendar,
      title: 'Event Management',
      description: 'Create, edit, and manage events with details like date, time, location, and capacity. Automatic status updates keep your events organized.'
    },
    {
      icon: QrCode,
      title: 'QR Code Check-in',
      description: 'Permanent QR codes for users, admin scanner for check-ins, and manual check-in options. Export check-in lists as CSV.'
    },
    {
      icon: Sparkle,
      title: 'AI Personalized Event Recommendations',
      description: 'Get personalized event suggestions based on your preferences, history, and interests. Our AI analyzes your behavior to recommend events you\'ll love with confidence scores.'
    },
    {
      icon: CalendarClock,
      title: 'AI Event Scheduler',
      description: 'Automatically generate professional event schedules that balance sessions, breaks, and networking time. Adapts to event type and participant count for optimal flow.'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Track event performance, engagement rates, participant demographics, and get data-driven insights for improvement.'
    },
    {
      icon: Users,
      title: 'Participant Management',
      description: 'Track registrations, manage participant status (registered/attended/cancelled), and view detailed participant lists.'
    }
  ];

  howItWorks = [
    {
      step: 1,
      title: 'Sign Up & Verify',
      description: 'Create your account and complete verification to ensure secure access.',
      icon: ShieldCheck
    },
    {
      step: 2,
      title: 'Create Events',
      description: 'Set up your events with all the details - date, time, location, and more.',
      icon: Calendar
    },
    {
      step: 3,
      title: 'Manage Participants',
      description: 'Track registrations, check-ins, and engagement with real-time updates.',
      icon: Users
    },
    {
      step: 4,
      title: 'Analyze & Improve',
      description: 'View analytics, track engagement, and use insights to optimize your future events.',
      icon: TrendingUp
    }
  ];

  benefits = [
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Automate repetitive tasks and focus on what matters most.'
    },
    {
      icon: TrendingUp,
      title: 'Increase Engagement',
      description: 'Boost participant engagement with smart features and insights.'
    },
    {
      icon: ShieldCheck,
      title: 'Secure Platform',
      description: 'Built with security and verification at its core.'
    },
    {
      icon: BarChart3,
      title: 'Data-Driven',
      description: 'Make informed decisions with comprehensive analytics and insights.'
    }
  ];
}
