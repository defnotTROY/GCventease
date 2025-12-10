import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LocationSearchComponent } from '../../../../shared/components/location-search/location-search.component';
import { AuthService } from '../../../../core/services/auth.service';
import { EventsService } from '../../../../core/services/events.service';
import { StorageService } from '../../../../core/services/storage.service';
import { ToastService } from '../../../../core/services/toast.service';
import { VerificationService } from '../../../../core/services/verification.service';
import { AuthUser } from '../../../../core/services/supabase.service';
import { GORDON_COLLEGE_DEPARTMENTS } from '../../../../core/config/gordon-college.config';

@Component({
  selector: 'app-event-creation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LocationSearchComponent
  ],
  templateUrl: './event-creation.component.html',
  styleUrl: './event-creation.component.css'
})
export class EventCreationComponent implements OnInit {
  currentStep = 1;
  eventForm: FormGroup;
  loading = false;
  imagePreview: string | null = null;
  imageFile: File | null = null;
  imageUploading = false;
  user: AuthUser | null = null;
  tags: string[] = [];

  // AI Suggestions (Static for now, matching React)
  aiSuggestions = [
    'Consider adding networking breaks for better engagement',
    'Based on similar events, 2-4 PM has highest attendance',
    'Include interactive elements like Q&A sessions',
    'Central locations see 25% higher registration rates'
  ];

  categories = GORDON_COLLEGE_DEPARTMENTS;

  // Time options
  hours = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  minutes = ['00', '15', '30', '45'];
  periods = ['AM', 'PM'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private eventsService: EventsService,
    private storageService: StorageService,
    private toastService: ToastService,
    private verificationService: VerificationService
  ) {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      date: ['', [Validators.required, this.futureDateValidator]],
      timeHour: ['09', Validators.required],
      timeMinute: ['00', Validators.required],
      timePeriod: ['AM', Validators.required],
      endTimeHour: ['11', Validators.required],
      endTimeMinute: ['00', Validators.required],
      endTimePeriod: ['AM', Validators.required],
      location: ['', Validators.required],
      maxParticipants: [''],
      category: ['', Validators.required],
      tagInput: [''], // Temporary control for adding tags
      isVirtual: [false],
      virtualLink: [''],
      requirements: [''],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: ['']
    });
  }

  async ngOnInit() {
    this.user = await this.authService.getCurrentUser();
    if (!this.user) {
      this.toastService.error('Authentication Error', 'You must be logged in to create an event.');
      this.router.navigate(['/login']);
      return;
    }

    // Role check logic matching React
    const role = this.user.user_metadata?.role;
    const isOrganizerOrAdmin = role === 'Organizer' || role === 'organizer' ||
      role === 'Administrator' || role === 'admin' || role === 'Admin';

    if (!isOrganizerOrAdmin) {
      this.toastService.error('Access Denied', 'Only organizers can create events.');
      this.router.navigate(['/events']);
      return;
    }

    // Verification check for organizers (admins bypassed)
    // Verification check removed by user request
    // const isAdmin = role === 'Administrator' || role === 'Admin' || role === 'admin';
    // if (!isAdmin) {
    //   const isVerified = await this.verificationService.isVerified(this.user.id);
    //   if (!isVerified) {
    //     this.toastService.warning('Verification Required', 'Please verify your identity before creating events.');
    //     this.router.navigate(['/settings']);
    //     return;
    //   }
    // }

    // Auto-fill contact email from user
    if (this.user.email) {
      this.eventForm.patchValue({ contactEmail: this.user.email });
    }
  }

  // Custom Validator
  futureDateValidator(control: any) {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // React code says: tomorrow or later. 
    // "Events must be scheduled for tomorrow or later"
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (selectedDate < tomorrow) {
      return { pastDate: true };
    }
    return null;
  }

  get minDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  // Steps Navigation
  nextStep() {
    if (this.currentStep < 4) {
      // Basic validation per step
      if (this.currentStep === 1) {
        const fields = ['title', 'description', 'date', 'category'];
        if (!this.validateFields(fields)) return;
      } else if (this.currentStep === 2) {
        if (!this.eventForm.get('location')?.valid) {
          this.eventForm.get('location')?.markAsTouched();
          return;
        }
      } else if (this.currentStep === 3) {
        if (!this.eventForm.get('contactEmail')?.valid) {
          this.eventForm.get('contactEmail')?.markAsTouched();
          return;
        }
      }

      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  validateFields(fieldNames: string[]): boolean {
    let isValid = true;
    fieldNames.forEach(field => {
      const control = this.eventForm.get(field);
      if (control && !control.valid) {
        control.markAsTouched();
        isValid = false;
      }
    });
    return isValid;
  }

  // Tags
  addTag(event: Event) {
    event.preventDefault();
    const input = this.eventForm.get('tagInput');
    const value = input?.value?.trim();

    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
      input?.reset();
    }
  }

  removeTag(tag: string) {
    this.tags = this.tags.filter(t => t !== tag);
  }

  // Image Upload
  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toastService.error('Invalid File', 'Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toastService.error('File Too Large', 'Image size must be less than 5MB');
      return;
    }

    this.imageFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.imageFile = null;
    this.imagePreview = null;
  }

  // Submit
  async onSubmit() {
    if (!this.eventForm.valid) {
      this.toastService.error('Validation Error', 'Please check all required fields.');
      return;
    }

    this.loading = true;
    try {
      let imageUrl = null;

      // Upload Image
      if (this.imageFile && this.user) {
        this.toastService.info('Uploading', 'Uploading event image...');
        const { data, error } = await this.storageService.uploadEventImage(
          this.imageFile,
          this.user.id,
          'temp'
        );
        if (error) throw error;
        imageUrl = data!.publicUrl;
      }

      // Format Times
      const formData = this.eventForm.value;

      const formatTime = (h: string, m: string, p: string) => {
        let hour = parseInt(h);
        if (p === 'PM' && hour !== 12) hour += 12;
        if (p === 'AM' && hour === 12) hour = 0;
        return `${hour.toString().padStart(2, '0')}:${m}`;
      };

      const time = formatTime(formData.timeHour, formData.timeMinute, formData.timePeriod);
      const endTime = formatTime(formData.endTimeHour, formData.endTimeMinute, formData.endTimePeriod);

      const eventData: Partial<any> = {
        user_id: this.user?.id,
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: time,
        end_time: endTime,
        location: formData.location,
        max_participants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        category: formData.category,
        status: 'upcoming',
        is_virtual: formData.isVirtual,
        image_url: imageUrl || undefined
      };

      this.toastService.info('Creating Event', 'Please wait...');
      const { error } = await this.eventsService.createEvent(eventData);

      if (error) throw error;

      this.toastService.success('Success', 'Event created successfully!');
      setTimeout(() => {
        this.router.navigate(['/events']);
      }, 1500);

    } catch (error: any) {
      console.error('Error creating event:', error);
      this.toastService.error('Error', error.message || 'Failed to create event');
    } finally {
      this.loading = false;
    }
  }

  // Helpers for Template
  get f() { return this.eventForm.controls; }
}
