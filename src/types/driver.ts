import { type User } from "./user";

export interface Driver extends User {
    ci: string;
    phone: string;
    carDescription: string;
    carId: string;
    createdAt: Date;
}