import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filterUsers',
    standalone: true
})
export class FilterUsersPipe implements PipeTransform {
    transform(users: any[], criteria: any): any[] {
        if (!users) return [];
        return users.filter(u => {
            for (let key in criteria) {
                if (u[key] !== criteria[key]) return false;
            }
            return true;
        });
    }
}
