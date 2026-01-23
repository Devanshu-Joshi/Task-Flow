import { PermissionKey } from "./PermissionKey";

export interface UserModel {
    id: string
    createdAt: string;
    name: string;
    avatar: string;
    email: string;
    password: string;
    parentId: string;
    permissions: PermissionKey[];
}