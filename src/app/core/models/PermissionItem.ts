import { PermissionKey } from "./PermissionKey";

export interface PermissionItem {
    key: PermissionKey;
    label: string;
    group: string;
    description: string;
}