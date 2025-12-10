import { Component, EventEmitter, Input, OnInit, Output, ElementRef, HostListener, ViewChild, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { debounceTime, switchMap, catchError, takeUntil, tap } from 'rxjs/operators';

export interface LocationSearchResult {
    id: number;
    displayName: string;
    fullDisplayName: string;
    address: any;
    addressLine: string;
    specificName: string;
    venue: string;
    building: string;
    street: string;
    streetNumber: string;
    city: string;
    province: string;
    barangay: string;
    latitude: number;
    longitude: number;
    postcode: string;
    placeType: string;
}

@Component({
    selector: 'app-location-search',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './location-search.component.html',
    styleUrls: ['./location-search.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => LocationSearchComponent),
            multi: true
        }
    ]
})
export class LocationSearchComponent implements OnInit, ControlValueAccessor {
    @Input() placeholder: string = "Search for specific venues, buildings, or addresses in the Philippines...";
    @Input() required: boolean = false;
    @Output() locationSelected = new EventEmitter<LocationSearchResult>();

    searchQuery: string = '';
    suggestions: LocationSearchResult[] = [];
    loading: boolean = false;
    showSuggestions: boolean = false;
    apiAvailable: boolean = true;
    apiError: boolean = false;
    isFocused: boolean = false;

    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

    private onChange: (value: string) => void = () => { };
    private onTouched: () => void = () => { };

    constructor(private http: HttpClient, private eRef: ElementRef) { }

    ngOnInit() {
        this.searchSubject.pipe(
            debounceTime(500),
            takeUntil(this.destroy$),
            switchMap(query => {
                if (!query || query.length < 3) {
                    return of([]);
                }
                return this.searchLocations(query);
            })
        ).subscribe(results => {
            this.suggestions = results;
            this.showSuggestions = results.length > 0;
            this.loading = false;
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ControlValueAccessor methods
    writeValue(value: string): void {
        this.searchQuery = value || '';
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        // Implement if needed
    }

    onInput(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.searchQuery = value;
        this.onChange(value);

        if (value.length >= 3) {
            this.loading = true;
            this.searchSubject.next(value);
        } else {
            this.suggestions = [];
            this.showSuggestions = false;
        }
    }

    onFocus() {
        this.isFocused = true;
        if (this.suggestions.length > 0) {
            this.showSuggestions = true;
        }
    }

    onBlur() {
        this.onTouched();
        // Delay hiding suggestions to allow click event
        setTimeout(() => {
            this.isFocused = false;
            this.showSuggestions = false;
        }, 200);
    }

    handleClear() {
        this.searchQuery = '';
        this.suggestions = [];
        this.onChange('');
        this.showSuggestions = false;
    }

    selectLocation(location: LocationSearchResult) {
        this.searchQuery = location.fullDisplayName || location.displayName;
        this.onChange(this.searchQuery);
        this.showSuggestions = false;
        this.locationSelected.emit(location);
    }

    private searchLocations(query: string) {
        if (!this.apiAvailable) return of([]);

        const url = `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(query)}` +
            `&countrycodes=ph` +
            `&format=json` +
            `&addressdetails=1` +
            `&limit=8`;

        return this.http.get<any[]>(url).pipe(
            catchError(error => {
                console.warn('Location search error:', error);
                this.apiError = true;
                this.apiAvailable = false;
                return of([]);
            }),
            switchMap(data => {
                if (!Array.isArray(data)) return of([]);

                const formattedSuggestions = data.map((place: any) => {
                    const addr = place.address || {};

                    const specificName = place.name ||
                        addr.name ||
                        addr.amenity ||
                        addr.building ||
                        addr.road ||
                        addr.house_number ||
                        '';

                    const street = addr.road || '';
                    const streetNumber = addr.house_number || '';
                    const building = addr.building || '';
                    const venue = addr.amenity || addr.tourism || addr.shop || '';

                    let addressLine = '';
                    if (streetNumber && street) {
                        addressLine = `${streetNumber} ${street}`;
                    } else if (street) {
                        addressLine = street;
                    } else if (building) {
                        addressLine = building;
                    } else if (venue) {
                        addressLine = venue;
                    }

                    const city = addr.city || addr.town || addr.municipality || addr.village || '';
                    const province = addr.state || addr.province || addr.region || '';
                    const barangay = addr.suburb || addr.neighbourhood || addr.city_district || '';

                    let displayName = specificName || addressLine || place.display_name;

                    const contextParts = [];
                    if (addressLine && addressLine !== displayName) contextParts.push(addressLine);
                    if (barangay) contextParts.push(barangay);
                    if (city) contextParts.push(city);
                    if (province) contextParts.push(province);

                    const context = contextParts.length > 0 ? contextParts.join(', ') : '';

                    return {
                        id: place.place_id,
                        displayName: displayName,
                        fullDisplayName: context ? `${displayName}, ${context}` : displayName,
                        address: place.address,
                        addressLine: addressLine,
                        specificName: specificName,
                        venue: venue,
                        building: building,
                        street: street,
                        streetNumber: streetNumber,
                        city: city,
                        province: province,
                        barangay: barangay,
                        latitude: parseFloat(place.lat),
                        longitude: parseFloat(place.lon),
                        postcode: addr.postcode || '',
                        placeType: place.type || place.class || 'location'
                    };
                });

                // Sort: prioritize venues/buildings
                formattedSuggestions.sort((a, b) => {
                    const aScore = (a.venue ? 3 : 0) + (a.building ? 2 : 0) + (a.addressLine ? 1 : 0);
                    const bScore = (b.venue ? 3 : 0) + (b.building ? 2 : 0) + (b.addressLine ? 1 : 0);
                    return bScore - aScore;
                });

                return of(formattedSuggestions);
            })
        );
    }

    @HostListener('document:click', ['$event'])
    clickout(event: Event) {
        if (!this.eRef.nativeElement.contains(event.target)) {
            this.showSuggestions = false;
        }
    }
    formatLocationContext(location: any): string {
        return [location.barangay, location.city, location.province, 'Philippines']
            .filter(Boolean)
            .join(', ');
    }
}
