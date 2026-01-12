import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const confirmPasswordValidator = (
    passwordKey: string,
    confirmPasswordKey: string
) => {
    return (group: AbstractControl) => {
        const password = group.get(passwordKey);
        const confirm = group.get(confirmPasswordKey);

        if (!password || !confirm) return null;

        if (password.value !== confirm.value) {
            confirm.setErrors({ passwordMismatch: true });
        } else {
            if (confirm.hasError('passwordMismatch')) {
                confirm.setErrors(null);
            }
        }

        return null;
    };
};