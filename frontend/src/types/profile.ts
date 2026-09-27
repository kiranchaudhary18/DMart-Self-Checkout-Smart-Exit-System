export interface UserProfile {
  id: number;
  email: string;
  name: string;
  phone: string;
  profile_picture?: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  profile_picture?: File | null;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  confirm_password: string;
}
