import { RoleEnum } from "@prisma/client";

export const PERMISSIONS = {
  // Product management
  VIEW_PRODUCTS: "view_products",
  CREATE_PRODUCTS: "create_products",
  UPDATE_PRODUCTS: "update_products",
  DELETE_PRODUCTS: "delete_products",

  // Orders
  VIEW_ORDERS: "view_orders",
  UPDATE_ORDERS: "update_orders",

  // Inventory
  VIEW_INVENTORY: "view_inventory",
  UPDATE_INVENTORY: "update_inventory",

  // Customers
  VIEW_CUSTOMERS: "view_customers",

  // CMS & Marketing
  MANAGE_BANNERS: "manage_banners",
  MANAGE_CATEGORIES: "manage_categories",
  MANAGE_BRANDS: "manage_brands",
  MANAGE_COUPONS: "manage_coupons",
  MANAGE_COLLECTIONS: "manage_collections",
  MANAGE_REVIEWS: "manage_reviews",

  // Analytics & Security
  VIEW_REPORTS: "view_reports",
  MANAGE_USERS: "manage_users",
  MANAGE_ROLES: "manage_roles",
} as const;

export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Mapping roles to allowed permissions
export const ROLE_PERMISSIONS: Record<RoleEnum, string[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  ADMIN: Object.values(PERMISSIONS),
  PRODUCT_MANAGER: [
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.UPDATE_PRODUCTS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.MANAGE_BRANDS,
    PERMISSIONS.MANAGE_COLLECTIONS,
    PERMISSIONS.MANAGE_REVIEWS,
  ],
  INVENTORY_MANAGER: [
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.UPDATE_INVENTORY,
  ],
  ORDER_MANAGER: [
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.UPDATE_ORDERS,
    PERMISSIONS.VIEW_CUSTOMERS,
  ],
  CONTENT_MANAGER: [
    PERMISSIONS.MANAGE_BANNERS,
    PERMISSIONS.MANAGE_COLLECTIONS,
    PERMISSIONS.MANAGE_REVIEWS,
  ],
  CUSTOMER: [],
};

export function hasRole(userRole: RoleEnum, allowedRoles: RoleEnum[]): boolean {
  return allowedRoles.includes(userRole);
}

export function hasPermission(userRole: RoleEnum, permission: string): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}
