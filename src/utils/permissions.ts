export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Super Admin': ['dashboard', 'assets', 'inventory', 'qrcode', 'borrow', 'repair', 'depreciation', 'budget', 'reports', 'settings'],
  'Admin': ['dashboard', 'assets', 'inventory', 'qrcode', 'borrow', 'repair', 'depreciation', 'budget', 'reports', 'settings'],
  'Supply Officer': ['dashboard', 'assets', 'inventory', 'qrcode', 'borrow', 'depreciation', 'budget', 'reports'],
  'IT Officer': ['dashboard', 'assets', 'inventory', 'qrcode', 'borrow', 'repair', 'reports'],
  'Department Head': ['dashboard', 'assets', 'borrow', 'repair', 'budget', 'reports'],
  'Approver': ['dashboard', 'assets', 'borrow', 'repair', 'budget', 'reports'],
  'Auditor': ['dashboard', 'assets', 'inventory', 'depreciation', 'reports'],
  'General User': ['dashboard', 'qrcode', 'borrow', 'repair']
};

export const getRoleAllowedTabs = (role: string): string[] => {
  return ROLE_PERMISSIONS[role] || ['dashboard', 'qrcode', 'borrow', 'repair'];
};

export const hasPermission = (role: string, tabId: string): boolean => {
  const allowed = getRoleAllowedTabs(role);
  return allowed.includes(tabId);
};
