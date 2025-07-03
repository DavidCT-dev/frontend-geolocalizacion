import { type User } from "./user";

export interface GeneralUser extends User {
    ci: string;
    phone: string;
    status?: boolean;
    createdAt: Date;
}