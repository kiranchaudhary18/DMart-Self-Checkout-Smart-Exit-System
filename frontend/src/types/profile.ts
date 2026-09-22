export interface UserProfile {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  confirm_password: string;
}
