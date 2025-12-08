import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { appConfig } from '../../../../config/app.config';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-white">
      <!-- Navigation Bar -->
      <nav class="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center">
              <svg class="h-8 w-8 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="text-2xl font-bold text-gray-900">{{ appName }}</span>
            </div>
            <div class="flex items-center space-x-4">
              <a routerLink="/login" class="text-gray-700 hover:text-primary-600 px-4 py-2 font-medium transition-colors">
                Sign In
              </a>
              <a routerLink="/signup" class="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-medium transition-colors">
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="relative bg-gradient-to-br from-primary-50 via-white to-primary-50 py-20 lg:py-32">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center">
            <div class="flex justify-center mb-6">
              <div class="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                </svg>
                Smart Event Management Platform
              </div>
            </div>
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Smart Event Management
              <br />
              <span class="text-primary-600">Made Simple</span>
            </h1>
            <p class="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {{ appDescription }}
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                routerLink="/signup"
                class="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Get Started Now
                <svg class="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </a>
              <a
                routerLink="/login"
                class="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-50 font-semibold text-lg transition-all"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Events
            </h2>
            <p class="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make event management effortless and efficient
            </p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div *ngFor="let feature of features" class="p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-all border border-gray-200 hover:border-primary-300">
              <div class="bg-primary-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg class="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" [attr.d]="feature.icon"/>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ feature.title }}</h3>
              <p class="text-gray-600">{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-20 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Events?
          </h2>
          <p class="text-xl mb-8 text-primary-100">
            Start managing your events today with {{ appName }}
          </p>
          <a
            routerLink="/signup"
            class="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 rounded-lg hover:bg-gray-100 font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
          >
            Get Started Free
            <svg class="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </a>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-gray-900 text-white py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center">
            <div class="flex items-center justify-center mb-4">
              <svg class="h-6 w-6 text-primary-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="text-xl font-bold">{{ appName }}</span>
            </div>
            <p class="text-gray-400 text-sm mb-4">{{ appDescription }}</p>
            <p class="text-gray-500 text-sm">&copy; {{ currentYear }} {{ appName }}. All rights reserved.</p>
            <p class="text-gray-500 text-sm mt-2">Powered by AI & Cloud</p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: []
})
export class LandingComponent {
  appName = appConfig.name;
  appDescription = appConfig.description;
  currentYear = new Date().getFullYear();

  features = [
    {
      title: 'Event Management',
      description: 'Create, edit, and manage events with details like date, time, location, and capacity.',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    },
    {
      title: 'QR Code Check-in',
      description: 'Permanent QR codes for users, admin scanner for check-ins, and CSV export capabilities.',
      icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z'
    },
    {
      title: 'AI Recommendations',
      description: 'Get personalized event suggestions based on your preferences and history with confidence scores.',
      icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
    },
    {
      title: 'Analytics & Insights',
      description: 'Track event performance, engagement rates, and get data-driven insights for improvement.',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    },
    {
      title: 'Participant Management',
      description: 'Track registrations, manage participant status, and view detailed participant lists.',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
    },
    {
      title: 'AI Event Scheduler',
      description: 'Automatically generate professional schedules that balance sessions, breaks, and networking time.',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  ];
}
