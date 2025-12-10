import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-ai-recommendations',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center">
          <svg class="text-primary-600 mr-3" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2"/>
          </svg>
          <h3 class="text-lg font-semibold text-gray-900">AI Event Recommendations</h3>
        </div>
        <button class="btn-secondary text-sm">
          <svg class="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2"/>
          </svg>
          Refresh
        </button>
      </div>

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 class="font-medium text-blue-900 mb-2">AI Insights</h4>
        <p class="text-blue-800 text-sm">
          No upcoming events available for recommendations at this time. Check back later for new events!
        </p>
        <p class="text-blue-700 text-sm mt-2 italic">
          Create and attend more events to get better recommendations!
        </p>
      </div>
    </div>
  `,
    styles: []
})
export class AiRecommendationsComponent {
    @Input() user: any = null;
}
