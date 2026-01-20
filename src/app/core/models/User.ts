export interface UserModel {
    id: string
    createdAt: string;
    name: string;
    avatar: string;
    email: string;
    password: string;
    parent_id: string;
    permissions: []
}