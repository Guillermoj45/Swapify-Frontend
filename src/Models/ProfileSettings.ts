export class ProfileSettings {
    nickname?: string;
    email?: string;
    avatar?: string;
    premium?: string;
    preferencias?: {
        notifications?: boolean;
        darkMode?: boolean;
    };
}