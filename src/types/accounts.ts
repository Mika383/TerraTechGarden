export interface Account {
  id: number;
  userId: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  roleId: number;
  status: string;
  createdAt: string;
}

export interface AccountPayload {
  username: string;
  password: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  roleId: number;
}
