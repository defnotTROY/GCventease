import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SearchService, SearchResult } from '../../../../core/services/search.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LucideAngularModule, Search, Calendar, Users, MapPin, Clock, Eye, Loader2, Bookmark, FolderOpen } from 'lucide-angular';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.css'
})
export class SearchPageComponent implements OnInit {
  searchQuery = '';
  searchResults: SearchResult | null = null;
  isSearching = false;
  user: any = null;

  // Icons
  readonly SearchIcon = Search;
  readonly CalendarIcon = Calendar;
  readonly UsersIcon = Users;
  readonly MapPinIcon = MapPin;
  readonly ClockIcon = Clock;
  readonly EyeIcon = Eye;
  readonly Loader2Icon = Loader2;
  readonly BookmarkIcon = Bookmark;
  readonly FolderOpenIcon = FolderOpen;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private searchService: SearchService,
    private authService: AuthService
  ) { }

  async ngOnInit() {
    this.user = await this.authService.getCurrentUser();

    this.route.queryParams.subscribe(params => {
      const q = params['q'];
      if (q) {
        this.searchQuery = q;
        this.performSearch();
      }
    });
  }

  async performSearch() {
    if (!this.searchQuery.trim() || !this.user) return;

    this.isSearching = true;
    try {
      const userRole = this.user.user_metadata?.role;
      this.searchResults = await this.searchService.globalSearch(this.user.id, this.searchQuery, userRole);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      this.isSearching = false;
    }
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { q: this.searchQuery },
        queryParamsHandling: 'merge'
      });
    }
  }

  handleEventClick(eventId: string) {
    this.router.navigate(['/events', eventId]);
  }

  isEventPast(event: any): boolean {
    if (!event.date) return false;
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate < today;
  }
}
