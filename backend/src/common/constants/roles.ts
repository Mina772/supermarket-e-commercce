/** Role-Based Access Control roles. */
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CUSTOMER: 'customer',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: Role[] = Object.values(ROLES);

/** Staff roles that can access the admin dashboard. */
export const STAFF_ROLES: Role[] = [ROLES.ADMIN, ROLES.MANAGER];

/**
 * Granular permissions used by the RBAC middleware.
 * A permission map keeps role->capabilities explicit and testable.
 */
export const PERMISSIONS = {
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  ORDER_READ_ALL: 'order:read:all',
  ORDER_UPDATE_STATUS: 'order:update:status',
  ORDER_REFUND: 'order:refund',
  USER_MANAGE: 'user:manage',
  COUPON_MANAGE: 'coupon:manage',
  REVIEW_MODERATE: 'review:moderate',
  INVENTORY_MANAGE: 'inventory:manage',
  ANALYTICS_READ: 'analytics:read',
  SETTINGS_MANAGE: 'settings:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MANAGER]: [
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.ORDER_READ_ALL,
    PERMISSIONS.ORDER_UPDATE_STATUS,
    PERMISSIONS.REVIEW_MODERATE,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.COUPON_MANAGE,
  ],
  [ROLES.CUSTOMER]: [],
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
