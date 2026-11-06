export const UpdateUserDTO = {
    from: (data) => ({
        name: data.name !== undefined ? data.name : undefined,
        lastName: data.lastName !== undefined ? data.lastName : undefined,
        phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : undefined,
        address: data.address !== undefined ? data.address : undefined,
        profilePicUrl: data.profilePicUrl !== undefined ? data.profilePicUrl : undefined,
    }),

    validate: (dto) => {
        const allowedFields = ['name', 'lastName', 'phoneNumber', 'address', 'profilePicUrl'];
        const providedFields = Object.keys(dto).filter((key) => dto[key] !== undefined);
        const hasValidFields = providedFields.some((field) => allowedFields.includes(field));

        if (!hasValidFields) {
            return {
                valid: false,
                errors: [
                    `No valid fields provided for update. Allowed: ${allowedFields.join(', ')}`,
                ],
            };
        }
        return { valid: true, errors: [] };
    },

    sanitize: (dto) => Object.fromEntries(Object.entries(dto).filter(([_, v]) => v !== undefined)),
};
