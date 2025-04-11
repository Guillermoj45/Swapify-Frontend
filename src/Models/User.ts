export class User {
    constructor(
        public nickname: string = '',
        public name: string = '',
        public email: string = '',
        public birthdate: string = '',
        public password: string = '',
        public profileImage?: string,
        public rol: string = 'USER'
    ) {}

    static fromFormData(formData: {
        nickname: string;
        name: string;
        email: string;
        bornDate: string;
        password: string;
        rol?: string;
    }, profileImage?: string): User {
        return new User(
            formData.nickname,
            formData.name,
            formData.email,
            formData.bornDate,
            formData.password,
            profileImage,
            formData.rol || 'USER'
        );
    }

    static async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    toPayload() {
        const { nickname, name, email, birthdate, password, rol, profileImage } = this;
        return {
            nickname,
            name,
            email,
            bornDate: birthdate,
            password,
            rol,
            ...(profileImage && { profileImage })
        };
    }
}
