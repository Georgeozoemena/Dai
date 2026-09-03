export interface Profile {
  id: string;
  userId: string; // Google user ID - links local profile to cloud identity
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}