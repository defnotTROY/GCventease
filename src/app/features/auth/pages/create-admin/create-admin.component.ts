import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Shield, AlertCircle, FileText, Key, CheckCircle } from 'lucide-angular';

@Component({
    selector: 'app-create-admin',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './create-admin.component.html',
    styleUrl: './create-admin.component.css'
})
export class CreateAdminComponent {
    readonly ShieldIcon = Shield;
    readonly AlertCircleIcon = AlertCircle;
    readonly FileTextIcon = FileText;
    readonly KeyIcon = Key;
    readonly CheckCircleIcon = CheckCircle;
}
