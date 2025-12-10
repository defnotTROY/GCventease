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

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <h4 class="font-medium text-blue-900 mb-2">AI Insights</h4>
        <p class="text-blue-800 text-sm">
          No upcoming events available for recommendations at this time. Check back later for new events!
        </p>
      </div>

      <div class="text-center py-8">
        <div class="inline-flex items-center justify-center p-3 bg-gray-50 rounded-full mb-4">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="text-gray-400">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
        <p class="text-gray-500 font-medium">No personalized recommendations available yet.</p>
        <p class="text-sm text-gray-400 mt-1">
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
