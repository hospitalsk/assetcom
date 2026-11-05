export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Super Admin': ['dashboard', 'assets', 'inventory', 'qrcode', 'borrow', 'repair', 'depreciation', 'budget', 'reports', 'settings'],
  'Admin': ['dashboard', 'assets', 'inventory', 'qrcode', 'borrow', 'repair', 'depreciation', 'budget', 'reports', 'settings'],
  'Supply Officer': ['dashboard', 'assets', 'inventory', 'qrcode', 'borrow', 'repair', 'depreciation', 'budget', 'reports'],
  'IT Officer': ['dashboard', 'assets', 'inventory', 'qrcode', 'borrow', 'repair', 'reports'],
  'Department Head': ['dashboard', 'assets', 'borrow', 'repair', 'budget', 'reports'],
  'Approver': ['dashboard', 'assets', 'borrow', 'repair', 'budget', 'reports'],
  'Auditor': ['dashboard', 'assets', 'inventory', 'repair', 'depreciation', 'reports'],
  'General Mechanic': ['dashboard', 'repair'],
  'General User': ['dashboard', 'qrcode', 'borrow', 'repair']
};

export const getRoleAllowedTabs = (role: string): string[] => {
  if (!role) return ['dashboard', 'repair'];
  const r = role.toLowerCase().trim();
  
  // General mechanic restriction: ONLY dashboard and repair
  if (r === 'general mechanic' || r === 'general_mechanic' || r === 'ช่างทั่วไป' || r === 'ช่าง') {
    return ['dashboard', 'repair'];
  }

  // Exact match or fallback
  if (ROLE_PERMISSIONS[role]) {
    return ROLE_PERMISSIONS[role];
  }

  // Key-based fallback
  if (r.includes('super admin')) return ROLE_PERMISSIONS['Super Admin'];
  if (r.includes('admin')) return ROLE_PERMISSIONS['Admin'];
  if (r.includes('supply')) return ROLE_PERMISSIONS['Supply Officer'];
  if (r.includes('it')) return ROLE_PERMISSIONS['IT Officer'];
  if (r.includes('head')) return ROLE_PERMISSIONS['Department Head'];
  if (r.includes('approver')) return ROLE_PERMISSIONS['Approver'];
  if (r.includes('auditor')) return ROLE_PERMISSIONS['Auditor'];

  return ['dashboard', 'qrcode', 'borrow', 'repair'];
};

export const hasPermission = (role: string, tabId: string): boolean => {
  const allowed = getRoleAllowedTabs(role);
  return allowed.includes(tabId);
};

export const canManageRepairStatus = (role: string): boolean => {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return (
    r === 'admin' ||
    r === 'super admin' ||
    r === 'it officer' ||
    r === 'general mechanic' ||
    r.includes('admin') ||
    r.includes('it officer') ||
    r.includes('general mechanic') ||
    r.includes('mechanic') ||
    r === 'ช่างทั่วไป' ||
    r === 'ช่าง'
  );
};
