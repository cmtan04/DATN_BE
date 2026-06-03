export enum UserStatus {
  ACTIVE = 0,
  INACTIVE = 1,
  BLOCKED = 2,
}

export enum UserRole {
  ADMIN = 0,
  OWNER = 1,
  USER = 2,
}

export enum OwnerRequestStatus {
  NONE = 0,
  PENDING = 1,
  APPROVED = 2,
  REJECTED = 3,
}
