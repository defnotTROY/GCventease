import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { EventsService, Event } from '../../../../core/services/events.service';

@Component({
  selector: 'app-event-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-edit.component.html',
  styleUrl: './event-edit.component.css'
})
export class EventEditComponent implements OnInit {
  eventForm!: FormGroup;
  loading = true;
  saving = false;
  error: string | null = null;
  success = false;
  user: any = null;
  eventId: string = '';
  originalEvent: Event | null = null;

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
    private route: ActivatedRoute,
    public router: Router,
    private authService: AuthService,
    private eventsService: EventsService
  ) { }

  async ngOnInit() {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.eventId) {
      this.router.navigate(['/events']);
      return;
    }

    this.user = await this.authService.getCurrentUser();
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    this.initForm();
    await this.loadEvent();
  }

  initForm() {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      date: ['', Validators.required],
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

  async loadEvent() {
    try {
      this.loading = true;
      const { data, error } = await this.eventsService.getEventById(this.eventId);

      if (error) throw error;

      if (!data) {
        this.error = 'Event not found';
        return;
      }

      // Check if user owns this event
      if (data.user_id !== this.user.id) {
        this.error = 'You do not have permission to edit this event';
        return;
      }

      this.originalEvent = data;

      // Populate form with existing data
      this.eventForm.patchValue({
        title: data.title || '',
        description: data.description || '',
        date: data.date || '',
        time: data.time || '',
        end_time: data.end_time || '',
        location: data.location || '',
        category: data.category || '',
        max_participants: data.max_participants || '',
        is_virtual: data.is_virtual || false,
        virtual_link: data.virtual_link || '',
        image_url: data.image_url || ''
      });

      if (data.image_url) {
        this.imagePreview = data.image_url;
      }

    } catch (error: any) {
      console.error('Error loading event:', error);
      this.error = error.message || 'Failed to load event';
    } finally {
      this.loading = false;
    }
  }

  selectedFile: File | null = null;
  imagePreview: string | null = null;

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

  async onSubmit() {
    if (this.eventForm.invalid) {
      this.markFormGroupTouched(this.eventForm);
      return;
    }

    try {
      this.saving = true;
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
        max_participants: this.eventForm.value.max_participants ? parseInt(this.eventForm.value.max_participants) : null
      };

      const { error } = await this.eventsService.updateEvent(this.eventId, eventData);

      if (error) throw error;

      this.success = true;
      setTimeout(() => {
        this.router.navigate(['/events', this.eventId]);
      }, 1500);

    } catch (error: any) {
      console.error('Error updating event:', error);
      this.error = error.message || 'Failed to update event';
    } finally {
      this.saving = false;
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
    this.router.navigate(['/events', this.eventId]);
  }
}
