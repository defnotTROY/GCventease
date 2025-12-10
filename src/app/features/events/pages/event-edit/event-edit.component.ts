import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LocationSearchComponent } from '../../../../shared/components/location-search/location-search.component';
import { AuthService } from '../../../../core/services/auth.service';
import { EventsService } from '../../../../core/services/events.service';
import { StorageService } from '../../../../core/services/storage.service';
import { ToastService } from '../../../../core/services/toast.service';
import { VerificationService } from '../../../../core/services/verification.service';
import { AuthUser } from '../../../../core/services/supabase.service';
import { GORDON_COLLEGE_DEPARTMENTS } from '../../../../core/config/gordon-college.config';

@Component({
  selector: 'app-event-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LocationSearchComponent
  ],
  templateUrl: './event-edit.component.html',
  styleUrl: './event-edit.component.css'
})
export class EventEditComponent implements OnInit {
  currentStep = 1;
  eventForm: FormGroup;
  loading = true;
  saving = false;
  imagePreview: string | null = null;
  imageFile: File | null = null;
  user: AuthUser | null = null;
  tags: string[] = [];
  eventId: string | null = null;
  originalEventDate: string | null = null;

  categories = GORDON_COLLEGE_DEPARTMENTS;

  // Time options
  hours = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  minutes = ['00', '15', '30', '45'];
  periods = ['AM', 'PM'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private eventsService: EventsService,
    private storageService: StorageService,
    private toastService: ToastService
  ) {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      date: ['', Validators.required], // Custom validator added dynamically or check in submit
      timeHour: ['09', Validators.required],
      timeMinute: ['00', Validators.required],
      timePeriod: ['AM', Validators.required],
      endTimeHour: ['11', Validators.required],
      endTimeMinute: ['00', Validators.required],
      endTimePeriod: ['AM', Validators.required],
      location: ['', Validators.required],
      maxParticipants: [''],
      category: ['', Validators.required],
      tagInput: [''],
      isVirtual: [false],
      virtualLink: [''],
      requirements: [''],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: ['']
    });
  }

  async ngOnInit() {
    this.eventId = this.route.snapshot.paramMap.get('id');
    if (!this.eventId) {
      this.toastService.error('Error', 'No event ID provided');
      this.router.navigate(['/events']);
      return;
    }

    this.user = await this.authService.getCurrentUser();
    if (!this.user) {
      this.toastService.error('Authentication Error', 'You must be logged in to edit an event.');
      this.router.navigate(['/login']);
      return;
    }

    await this.loadEventData(this.eventId);
  }

  async loadEventData(id: string) {
    try {
      this.loading = true;
      const { data: event, error } = await this.eventsService.getEventById(id);

      if (error) throw error;
      if (!event) {
        this.toastService.error('Error', 'Event not found');
        this.router.navigate(['/events']);
        return;
      }

      // Check permission
      if (event.user_id !== this.user?.id) {
        // Check if admin
        const role = this.user?.user_metadata?.role;
        const isAdmin = role === 'Administrator' || role === 'Admin' || role === 'admin';

        if (!isAdmin) {
          this.toastService.error('Access Denied', 'You do not have permission to edit this event');
          this.router.navigate(['/events']);
          return;
        }
      }

      this.originalEventDate = event.date;
      this.tags = event.tags || [];
      this.imagePreview = event.image_url || null;

      // Parse Times
      const parseTime = (timeStr: string) => {
        if (!timeStr) return { hour: '09', minute: '00', period: 'AM' };

        let hour = '09';
        let minute = '00';
        let period = 'AM';

        // Try AM/PM format first "09:00 AM"
        const ampmMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (ampmMatch) {
          hour = ampmMatch[1].padStart(2, '0');
          minute = ampmMatch[2];
          period = ampmMatch[3].toUpperCase();
        } else {
          // Try 24 hour format "14:00"
          const militaryMatch = timeStr.match(/^(\d{1,2}):(\d{2})(:00)?$/);
          if (militaryMatch) {
            let h = parseInt(militaryMatch[1], 10);
            minute = militaryMatch[2];
            if (h === 0) { hour = '12'; period = 'AM'; }
            else if (h < 12) { hour = h.toString().padStart(2, '0'); period = 'AM'; }
            else if (h === 12) { hour = '12'; period = 'PM'; }
            else { hour = (h - 12).toString().padStart(2, '0'); period = 'PM'; }
          }
        }
        return { hour, minute, period };
      };

      const startTime = parseTime(event.time);
      const endTime = parseTime(event.end_time || '');

      this.eventForm.patchValue({
        title: event.title,
        description: event.description,
        date: event.date,
        timeHour: startTime.hour,
        timeMinute: startTime.minute,
        timePeriod: startTime.period,
        endTimeHour: endTime.hour,
        endTimeMinute: endTime.minute,
        endTimePeriod: endTime.period,
        location: event.location,
        maxParticipants: event.max_participants,
        category: event.category,
        isVirtual: event.is_virtual,
        virtualLink: event.virtual_link,
        requirements: event.requirements,
        contactEmail: event.contact_email,
        contactPhone: event.contact_phone
      });

    } catch (error: any) {
      console.error('Error loading event:', error);
      this.toastService.error('Error', error.message || 'Failed to load event');
    } finally {
      this.loading = false;
    }
  }

  get minDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  getDateValidationMessage(): string | null {
    if (!this.f['date'].value) return null;

    const selected = new Date(this.f['date'].value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);

    // If keeping original date, it's fine even if in past
    if (this.originalEventDate && this.f['date'].value === this.originalEventDate) {
      return null;
    }

    // For new dates, must be tomorrow or later
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (selected < tomorrow) {
      return 'New dates must be scheduled for tomorrow or later';
    }

    return null;
  }

  nextStep() {
    if (this.currentStep < 4) {
      if (this.currentStep === 1) {
        if (!this.validateFields(['title', 'description', 'date', 'category'])) return;
        if (this.getDateValidationMessage()) {
          this.eventForm.get('date')?.setErrors({ invalidDate: true });
          return;
        }
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
    // Note: If user removes image, we might want to flag it to delete from DB or just replace with null
    // For now, if they select nothing new, we keep old one, unless they explicitly clear it?
    // In this UI implementation, removing preview implies clearing the image.
    // Logic in submit will handle this.
  }

  async onSubmit() {
    if (!this.eventForm.valid) {
      this.toastService.error('Validation Error', 'Please check all required fields.');
      return;
    }

    if (this.getDateValidationMessage()) {
      this.toastService.error('Validation Error', 'Please check the date.');
      return;
    }

    this.saving = true;
    try {
      let imageUrl = this.imagePreview; // Keep existing by default

      // Upload New Image if selected
      if (this.imageFile && this.user) {
        this.toastService.info('Uploading', 'Uploading new event image...');
        const { data, error } = await this.storageService.uploadEventImage(
          this.imageFile,
          this.user.id,
          this.eventId
        );
        if (error) throw error;
        imageUrl = data!.publicUrl;
      } else if (this.imagePreview === null) {
        // Explicitly removed
        imageUrl = null; // or undefined, but null clears it? Supabase might need null to clear.
        // If interface says string | undefined, then we can't pass null.
        // Let's assume we pass undefined to skip update, or null to clear.
        // If existing is string | undefined, null might be invalid.
        // Let's stick to undefined for SAFETY, unless we want to clear.
        imageUrl = null;
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

      const eventData: Partial<any> = { // Use Partial<any> to bypass strict checking if needed, or stick to proper types
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: time,
        end_time: endTime,
        location: formData.location,
        max_participants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        category: formData.category,
        is_virtual: formData.isVirtual,
        image_url: imageUrl || undefined // undefined to skipping or keeping
      };

      this.toastService.info('Saving', 'Updating event...');
      const { error } = await this.eventsService.updateEvent(this.eventId!, eventData);

      if (error) throw error;

      this.toastService.success('Success', 'Event updated successfully!');
      setTimeout(() => {
        this.router.navigate(['/events']);
      }, 1500);

    } catch (error: any) {
      console.error('Error updating event:', error);
      this.toastService.error('Error', error.message || 'Failed to update event');
    } finally {
      this.saving = false;
    }
  }

  get f() { return this.eventForm.controls; }
}
