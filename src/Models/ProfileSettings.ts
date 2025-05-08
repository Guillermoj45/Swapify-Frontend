export class ProfileSettings {
    nickname?: string;
    email?: string;
    avatar?: string;
    premium?: string;
    preferencias?: {
        notificaciones?: boolean;
        modo_oscuro?: boolean;
    };
}