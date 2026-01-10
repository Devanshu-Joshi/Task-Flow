import { AbstractControl, ValidationErrors } from '@angular/forms';

export function passwordStrengthValidator(
    control: AbstractControl
): ValidationErrors | null {
    const value = control.value;

    if (!value) return null;

    const errors: ValidationErrors = {};

    if (!/[A-Z]/.test(value)) {
        errors['uppercase'] = true;
    }

    if (!/[\W_]/.test(value)) {
        errors['specialChar'] = true;
    }

    if (!/\d/.test(value)) {
        errors['number'] = true;
    }

    return Object.keys(errors).length ? errors : null;
}