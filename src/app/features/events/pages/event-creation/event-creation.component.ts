import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { EventsService } from '../../../../core/services/events.service';

@Component({
  selector: 'app-event-creation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './event-creation.component.html',
  styleUrl: './event-creation.component.css'
})
export class EventCreationComponent implements OnInit {
  // Sidebar state
  isSidebarCollapsed = false;
  currentPage = 'Create Event';

  // Form
  eventForm!: FormGroup;
  loading = false;
  error: string | null = null;
  user: any = null;

  categories = [
    'Academic',
    'Sports',
    'Cultural',
    'Technology',
    'Community Service',
    'Workshop',
    'Seminar',
    'Social',
    'Other'
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private eventsService: EventsService
  ) { }

  async ngOnInit() {
    this.user = await this.authService.getCurrentUser();
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    this.initForm();
  }

  initForm() {
    this.eventForm = this.fb.group({
      title: [''],
      description: ['', Validators.required],
      date: ['', [Validators.required, this.futureDateValidator]],
      time: ['', Validators.required],
      end_time: [''],
      location: ['', Validators.required],
      category: ['', Validators.required],
      max_participants: [''],
      is_virtual: [false],
      virtual_link: [''],
      image_url: ['']
    });
  }

  selectedFile: File | null = null;
  imagePreview: string | null = null;

  async onSubmit() {
    if (this.eventForm.invalid) {
      this.markFormGroupTouched(this.eventForm);
      return;
    }

    try {
      this.loading = true;
      this.error = null;

      let imageUrl = this.eventForm.get('image_url')?.value;

      if (this.selectedFile) {
        const { publicUrl, error: uploadError } = await this.eventsService.uploadEventImage(this.selectedFile);
        if (uploadError) throw uploadError;
        imageUrl = publicUrl;
      }

      const eventData = {
        ...this.eventForm.value,
        image_url: imageUrl,
        user_id: this.user.id,
        status: 'upcoming',
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.eventsService.createEvent(eventData);

      if (error) throw error;

      alert('Event created successfully!');
      this.router.navigate(['/events', data?.id]);
    } catch (error: any) {
      console.error('Error creating event:', error);
      this.error = error.message || 'Failed to create event. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get f() {
    return this.eventForm.controls;
  }

  cancel() {
    this.router.navigate(['/events']);
  }

  // Sidebar methods
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  navigateTo(page: string, route: string) {
    this.currentPage = page;
    this.router.navigate([route]);
  }

  async logout() {
    const result = await this.authService.signOut();
    if (result.success) {
      this.router.navigate(['/landing']);
    }
  }

  get userDisplayName(): string {
    if (!this.user) return 'User';
    const firstName = this.user.user_metadata?.first_name;
    const lastName = this.user.user_metadata?.last_name;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return this.user.email || 'User';
  }

  // Validator to ensure date is at least tomorrow
  futureDateValidator(control: any) {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if less than tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (selectedDate < tomorrow) {
      return { futureDate: true };
    }
    return null;
  }

  get userRole(): string {
    return this.user?.user_metadata?.role || 'User';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }
}
