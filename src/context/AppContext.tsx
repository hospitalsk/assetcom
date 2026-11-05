import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Department,
  AssetCategory,
  UserProfile,
  Asset,
  InventoryCategory,
  InventoryItem,
  InventoryTransaction,
  BorrowRequest,
  RepairRequest,
  BudgetPlan,
  NotificationItem,
  AuditLog,
  SystemSettings,
  UserRole
} from '../types';
import {
  initialDepartments,
  initialAssetCategories,
  initialUsers,
  initialAssets,
  initialInventoryCategories,
  initialInventoryItems,
  initialInventoryTransactions,
  initialBorrowRequests,
  initialRepairRequests,
  initialBudgetPlans,
  initialNotifications,
  initialAuditLogs,
  initialRoles,
  initialBudgetSources,
  initialAcquisitionMethods,
  initialAssetStatuses,
  initialAssetLocations,
  defaultSystemSettings
} from '../data/initialData';
import { dispatchLineOaNotification } from '../utils/lineOaService';
import { 
  fetchAllSupabaseData, 
  syncAssetToSupabase, 
  deleteAssetFromSupabase, 
  syncRepairRequestToSupabase, 
  syncBorrowRequestToSupabase, 
  syncInventoryItemToSupabase, 
  syncSettingsToSupabase, 
  syncAuditLogToSupabase 
} from '../utils/supabaseService';
import { checkSupabaseConnection } from '../utils/supabaseClient';

interface AppContextType {
  supabaseStatus: 'connecting' | 'connected' | 'offline';
  currentUser: UserProfile;
  isLoggedIn: boolean;
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  users: UserProfile[];
  roles: string[];
  addRole: (role: string) => void;
  updateRole: (oldRole: string, newRole: string) => void;
  deleteRole: (role: string) => void;
  departments: Department[];
  assetCategories: AssetCategory[];
  assets: Asset[];
  inventoryCategories: InventoryCategory[];
  inventoryItems: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  borrowRequests: BorrowRequest[];
  repairRequests: RepairRequest[];
  budgetPlans: BudgetPlan[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Actions
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAsset: (id: string, asset: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;

  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  processInventoryTransaction: (itemId: string, type: 'รับเข้าสต็อก' | 'เบิกวัสดุ' | 'ปรับปรุงยอด', qty: number, unitPrice?: number, departmentId?: string, notes?: string, newMinQty?: number) => void;

  addBorrowRequest: (req: Omit<BorrowRequest, 'id' | 'requestNo' | 'createdAt' | 'status'>) => void;
  updateBorrowStatus: (id: string, status: BorrowRequest['status']) => void;

  addRepairRequest: (req: Omit<RepairRequest, 'id' | 'repairNo' | 'createdAt' | 'status' | 'totalCost'>) => RepairRequest;
  updateRepairRequest: (id: string, req: Partial<RepairRequest>) => void;
  getActiveRepairForAsset: (assetId: string) => RepairRequest | undefined;

  addBudgetPlan: (plan: Omit<BudgetPlan, 'id' | 'createdAt'>) => void;
  updateBudgetPlan: (id: string, plan: Partial<BudgetPlan>) => void;

  addDepartment: (dept: Omit<Department, 'id'>) => void;
  updateDepartment: (id: string, dept: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;

  budgetSources: string[];
  acquisitionMethods: string[];
  assetStatuses: string[];
  assetLocations: string[];

  addUser: (user: Omit<UserProfile, 'id'>) => void;
  updateUser: (id: string, user: Partial<UserProfile>) => void;
  deleteUser: (id: string) => void;

  addAssetCategory: (cat: Omit<AssetCategory, 'id'>) => void;
  updateAssetCategory: (id: string, cat: Partial<AssetCategory>) => void;
  deleteAssetCategory: (id: string) => void;

  addBudgetSource: (source: string) => void;
  updateBudgetSource: (oldSource: string, newSource: string) => void;
  deleteBudgetSource: (source: string) => void;

  addAcquisitionMethod: (method: string) => void;
  updateAcquisitionMethod: (oldMethod: string, newMethod: string) => void;
  deleteAcquisitionMethod: (method: string) => void;

  addAssetStatus: (status: string) => void;
  updateAssetStatus: (oldStatus: string, newStatus: string) => void;
  deleteAssetStatus: (status: string) => void;

  addAssetLocation: (location: string) => void;
  updateAssetLocation: (oldLocation: string, newLocation: string) => void;
  deleteAssetLocation: (location: string) => void;

  markNotificationAsRead: (id: string) => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  saveSettingsToSupabase: (newSettings: Partial<SystemSettings>) => Promise<{ success: boolean; data?: any; error?: any }>;
  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const loadStorage = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(`smart_asset_${key}`);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  // Must always require login on entry - defaults to false
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => loadStorage('current_user', initialUsers[0]));
  const [users, setUsers] = useState<UserProfile[]>(() => loadStorage('users', initialUsers));
  const [roles, setRoles] = useState<string[]>(() => loadStorage('roles', initialRoles));
  const [departments, setDepartments] = useState<Department[]>(() => loadStorage('departments', initialDepartments));
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>(() => loadStorage('asset_categories', initialAssetCategories));
  const [budgetSources, setBudgetSources] = useState<string[]>(() => loadStorage('budget_sources', initialBudgetSources));
  const [acquisitionMethods, setAcquisitionMethods] = useState<string[]>(() => loadStorage('acquisition_methods', initialAcquisitionMethods));
  const [assetStatuses, setAssetStatuses] = useState<string[]>(() => loadStorage('asset_statuses', initialAssetStatuses));
  const [assetLocations, setAssetLocations] = useState<string[]>(() => loadStorage('asset_locations', initialAssetLocations));
  
  const [assets, setAssets] = useState<Asset[]>(() => loadStorage('assets', initialAssets));
  const [inventoryCategories] = useState<InventoryCategory[]>(initialInventoryCategories);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => loadStorage('inventory_items', initialInventoryItems));
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>(() => loadStorage('inventory_transactions', initialInventoryTransactions));
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>(() => loadStorage('borrow_requests', initialBorrowRequests));
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>(() => loadStorage('repair_requests', initialRepairRequests));
  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>(() => loadStorage('budget_plans', initialBudgetPlans));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadStorage('notifications', initialNotifications));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadStorage('audit_logs', initialAuditLogs));
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const loaded = loadStorage('settings', defaultSystemSettings);
    // If previous placeholder logo was stored in localStorage, automatically update to new attached logo
    if (!loaded.logoUrl || loaded.logoUrl.includes('unsplash') || loaded.logoUrl.includes('placeholder') || loaded.logoUrl.startsWith('/assets/')) {
      return { ...loaded, logoUrl: './assets/aistudio/Logo_SK_26693d5e.png', emblemUrl: './assets/aistudio/Logo_SK_26693d5e.png', organizationName: defaultSystemSettings.organizationName };
    }
    return loaded;
  });

  const [supabaseStatus, setSupabaseStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');

  // Load initial dataset from Supabase if online
  useEffect(() => {
    let isMounted = true;
    const initSupabase = async () => {
      const isOnline = await checkSupabaseConnection();
      if (!isMounted) return;
      if (isOnline) {
        setSupabaseStatus('connected');
        const data = await fetchAllSupabaseData();
        if (data && isMounted) {
          if (data.assets && data.assets.length > 0) setAssets(data.assets);
          if (data.repairRequests && data.repairRequests.length > 0) setRepairRequests(data.repairRequests);
          if (data.borrowRequests && data.borrowRequests.length > 0) setBorrowRequests(data.borrowRequests);
          if (data.inventoryItems && data.inventoryItems.length > 0) setInventoryItems(data.inventoryItems);
          if (data.departments && data.departments.length > 0) setDepartments(data.departments);
          if (data.users && data.users.length > 0) setUsers(data.users);
          if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
        }
      } else {
        setSupabaseStatus('offline');
      }
    };
    initSupabase();
    return () => { isMounted = false; };
  }, []);

  // Sync to Storage
  useEffect(() => { 
    try {
      sessionStorage.setItem('smart_asset_session_logged_in', isLoggedIn ? 'true' : 'false');
    } catch {
      // ignore
    }
  }, [isLoggedIn]);

  useEffect(() => { localStorage.setItem('smart_asset_current_user', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('smart_asset_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('smart_asset_roles', JSON.stringify(roles)); }, [roles]);
  useEffect(() => { localStorage.setItem('smart_asset_departments', JSON.stringify(departments)); }, [departments]);
  useEffect(() => { localStorage.setItem('smart_asset_asset_categories', JSON.stringify(assetCategories)); }, [assetCategories]);
  useEffect(() => { localStorage.setItem('smart_asset_budget_sources', JSON.stringify(budgetSources)); }, [budgetSources]);
  useEffect(() => { localStorage.setItem('smart_asset_acquisition_methods', JSON.stringify(acquisitionMethods)); }, [acquisitionMethods]);
  useEffect(() => { localStorage.setItem('smart_asset_asset_statuses', JSON.stringify(assetStatuses)); }, [assetStatuses]);
  useEffect(() => { localStorage.setItem('smart_asset_asset_locations', JSON.stringify(assetLocations)); }, [assetLocations]);
  useEffect(() => { localStorage.setItem('smart_asset_assets', JSON.stringify(assets)); }, [assets]);
  useEffect(() => { localStorage.setItem('smart_asset_inventory_items', JSON.stringify(inventoryItems)); }, [inventoryItems]);
  useEffect(() => { localStorage.setItem('smart_asset_inventory_transactions', JSON.stringify(inventoryTransactions)); }, [inventoryTransactions]);
  useEffect(() => { localStorage.setItem('smart_asset_borrow_requests', JSON.stringify(borrowRequests)); }, [borrowRequests]);
  useEffect(() => { localStorage.setItem('smart_asset_repair_requests', JSON.stringify(repairRequests)); }, [repairRequests]);
  useEffect(() => { localStorage.setItem('smart_asset_budget_plans', JSON.stringify(budgetPlans)); }, [budgetPlans]);
  useEffect(() => { localStorage.setItem('smart_asset_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('smart_asset_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('smart_asset_settings', JSON.stringify(settings)); }, [settings]);

  const login = (email: string, password?: string): boolean => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      if (found.password && password && found.password !== password) {
        return false;
      }
      setCurrentUser(found);
      setActiveTab('dashboard');
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setActiveTab('dashboard');
    try {
      sessionStorage.removeItem('smart_asset_session_logged_in');
    } catch {
      // ignore
    }
  };

  let idCounter = useRef(0);
  const generateUniqueId = (prefix: string) => {
    idCounter.current = (idCounter.current + 1) % 10000;
    return `${prefix}-${Date.now()}-${idCounter.current}-${Math.floor(Math.random() * 10000)}`;
  };

  const addAuditLog = (action: AuditLog['action'], module: string, recordId: string, description: string) => {
    const newLog: AuditLog = {
      id: generateUniqueId('log'),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      module,
      recordId,
      description,
      createdAt: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
    syncAuditLogToSupabase(newLog);
  };

  const addNotification = (title: string, message: string, type: NotificationItem['type'], linkModule?: string) => {
    const notif: NotificationItem = {
      id: generateUniqueId('notif'),
      title,
      message,
      type,
      isRead: false,
      linkModule,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const addAsset = (assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAsset: Asset = {
      ...assetData,
      id: generateUniqueId('ast'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAssets(prev => [newAsset, ...prev]);
    syncAssetToSupabase(newAsset);
    addAuditLog('CREATE', 'Asset Management', newAsset.id, `เพิ่มครุภัณฑ์ใหม่ ${newAsset.assetCode} - ${newAsset.name}`);
    addNotification('เพิ่มครุภัณฑ์สำเร็จ', `บันทึกครุภัณฑ์ ${newAsset.assetCode} ลงในระบบเรียบร้อย`, 'success', 'assets');
  };

  const updateAsset = (id: string, updatedFields: Partial<Asset>) => {
    setAssets(prev => prev.map(a => {
      if (a.id === id) {
        const updated = { ...a, ...updatedFields, updatedAt: new Date().toISOString() };
        syncAssetToSupabase(updated);
        addAuditLog('UPDATE', 'Asset Management', id, `แก้ไขข้อมูลครุภัณฑ์ ${updated.assetCode}`);
        return updated;
      }
      return a;
    }));
  };

  const deleteAsset = (id: string) => {
    const target = assets.find(a => a.id === id);
    setAssets(prev => prev.filter(a => a.id !== id));
    deleteAssetFromSupabase(id);
    if (target) {
      addAuditLog('DELETE', 'Asset Management', id, `ลบครุภัณฑ์ ${target.assetCode}`);
    }
  };

  const addInventoryItem = (itemData: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: generateUniqueId('item')
    };
    setInventoryItems(prev => [...prev, newItem]);
    syncInventoryItemToSupabase(newItem);
    addAuditLog('CREATE', 'IT Inventory', newItem.id, `เพิ่มวัสดุใหม่ ${newItem.itemCode}`);
  };

  const updateInventoryItem = (id: string, updatedFields: Partial<InventoryItem>) => {
    setInventoryItems(prev => prev.map(i => {
      if (i.id === id) {
        const updated = { ...i, ...updatedFields };
        syncInventoryItemToSupabase(updated);
        return updated;
      }
      return i;
    }));
  };

  const deleteInventoryItem = (id: string) => {
    setInventoryItems(prev => prev.filter(i => i.id !== id));
  };

  const processInventoryTransaction = (
    itemId: string, 
    type: 'รับเข้าสต็อก' | 'เบิกวัสดุ' | 'ปรับปรุงยอด', 
    qty: number, 
    unitPrice?: number, 
    departmentId?: string, 
    notes?: string,
    newMinQty?: number
  ) => {
    const item = inventoryItems.find(i => i.id === itemId);
    if (!item) return;

    let newQty = item.stockQty;
    let finalUnitPrice = item.unitPrice;

    if (type === 'รับเข้าสต็อก') {
      newQty += qty;
      if (unitPrice !== undefined) finalUnitPrice = unitPrice;
    } else if (type === 'เบิกวัสดุ') {
      if (item.stockQty < qty) {
        alert('จำนวนวัสดุในสต็อกไม่เพียงพอสำหรับการเบิก');
        return;
      }
      newQty -= qty;
    } else if (type === 'ปรับปรุงยอด') {
      newQty = qty;
    }

    const updatedItem = {
      ...item,
      stockQty: newQty,
      unitPrice: finalUnitPrice,
      minQty: (type === 'รับเข้าสต็อก' && newMinQty !== undefined && newMinQty >= 0) ? newMinQty : item.minQty,
      lastReceivedDate: type === 'รับเข้าสต็อก' ? new Date().toISOString().split('T')[0] : item.lastReceivedDate
    };

    setInventoryItems(prev => prev.map(i => i.id === itemId ? updatedItem : i));
    syncInventoryItemToSupabase(updatedItem);

    const trx: InventoryTransaction = {
      id: generateUniqueId('trx'),
      itemId,
      transactionType: type,
      quantity: qty,
      remainingQty: newQty,
      userId: currentUser.id,
      departmentId: departmentId || currentUser.departmentId,
      notes: notes || `${type} จำนวน ${qty} ${item.unit} (ราคารวม: ฿${(qty * finalUnitPrice).toLocaleString()})`,
      createdAt: new Date().toISOString()
    };
    setInventoryTransactions(prev => [trx, ...prev]);
    addAuditLog('DISPENSE', 'IT Inventory', trx.id, `${type}วัสดุ ${item.name} จำนวน ${qty} ${item.unit}`);

    if (type === 'เบิกวัสดุ') {
      const deptName = departments.find(d => d.id === (departmentId || currentUser.departmentId))?.name || 'กลุ่มงานทั่วไป';
      addNotification(
        'แจ้งเตือนเบิกวัสดุ (ส่งถึง IT)',
        `ผู้เบิก: ${currentUser.name} | แผนก: ${deptName} | วัสดุ: ${item.name} (${item.itemCode}) | จำนวน: ${qty} ${item.unit}`,
        'info',
        'inventory'
      );
    }

    if (newQty <= item.minQty) {
      addNotification('วัสดุใกล้หมดสต็อก', `วัสดุ ${item.name} (${item.itemCode}) คงเหลือ ${newQty} ${item.unit}`, 'warning', 'inventory');
    }
  };

  const addBorrowRequest = (reqData: Omit<BorrowRequest, 'id' | 'requestNo' | 'createdAt' | 'status'>) => {
    const newReq: BorrowRequest = {
      ...reqData,
      id: generateUniqueId('bor'),
      requestNo: `BOR-${new Date().getFullYear() + 543}-${Math.floor(100 + Math.random() * 900)}`,
      status: 'รอตรวจสอบ',
      createdAt: new Date().toISOString()
    };
    setBorrowRequests(prev => [newReq, ...prev]);
    syncBorrowRequestToSupabase(newReq);
    addAuditLog('CREATE', 'Borrow/Return', newReq.id, `สร้างคำขอยืมครุภัณฑ์เลขที่ ${newReq.requestNo}`);
  };

  const updateBorrowStatus = (id: string, status: BorrowRequest['status']) => {
    setBorrowRequests(prev => prev.map(b => {
      if (b.id === id) {
        const updated = { ...b, status };
        syncBorrowRequestToSupabase(updated);
        return updated;
      }
      return b;
    }));
    addAuditLog('APPROVE', 'Borrow/Return', id, `เปลี่ยนสถานะคำขอยืมเป็น ${status}`);
  };

  const getActiveRepairForAsset = (assetId: string): RepairRequest | undefined => {
    return repairRequests.find(
      r => r.assetId === assetId && 
      r.status !== 'ซ่อมเสร็จ' && 
      r.status !== 'ปิดงาน' && 
      r.status !== 'ดำเนินการเสร็จ'
    );
  };

  const addRepairRequest = (reqData: Omit<RepairRequest, 'id' | 'repairNo' | 'createdAt' | 'status' | 'totalCost'>): RepairRequest => {
    const existingActive = getActiveRepairForAsset(reqData.assetId);
    if (existingActive) {
      alert(`⚠️ ป้องกันการส่งซ่อมซ้ำ!\nครุภัณฑ์ชิ้นนี้มีใบแจ้งซ่อมเลขที่ [${existingActive.repairNo}] ที่กำลังดำเนินการอยู่แล้ว (สถานะ: ${existingActive.status})\nไม่สามารถส่งแจ้งซ่อมซ้ำได้ จนกว่าใบแจ้งซ่อมเดิมจะถูกปิดงานหรือซ่อมเสร็จ`);
      throw new Error(`Duplicate repair request for asset: ${reqData.assetId}. Existing repair: ${existingActive.repairNo}`);
    }

    const partsCost = reqData.spareParts.reduce((sum, p) => sum + (p.qty * p.unitPrice), 0);
    const totalCost = partsCost + reqData.laborCost;
    const newRep: RepairRequest = {
      ...reqData,
      id: generateUniqueId('rep'),
      repairNo: `REP-${new Date().getFullYear() + 543}-${Math.floor(100 + Math.random() * 900)}`,
      status: 'รอตรวจสอบ', // Requires Approver approval first before alerting LINE OA
      totalCost,
      createdAt: new Date().toISOString()
    };
    setRepairRequests(prev => [newRep, ...prev]);
    syncRepairRequestToSupabase(newRep);
    updateAsset(newRep.assetId, { status: 'กำลังซ่อม' });
    addAuditLog('REPAIR', 'Repair Management', newRep.id, `ยื่นใบแจ้งซ่อมครุภัณฑ์เลขที่ ${newRep.repairNo} (รอ Approver อนุมัติ)`);

    const targetAsset = assets.find(a => a.id === newRep.assetId);

    // Notify Approver(s) for approval requirement
    addNotification(
      'คำขอแจ้งซ่อมรอการอนุมัติ', 
      `สร้างใบแจ้งซ่อม ${newRep.repairNo} (${targetAsset?.name || 'ครุภัณฑ์'}) เรียบร้อยแล้ว (รอผู้มีอำนาจ Approver กดอนุมัติก่อนส่ง LINE OA ไปยังช่าง)`, 
      'warning', 
      'repair'
    );
    return newRep;
  };

  const updateRepairRequest = (id: string, updatedFields: Partial<RepairRequest>) => {
    setRepairRequests(prev => prev.map(r => {
      if (r.id === id) {
        const merged = { ...r, ...updatedFields };
        const partsCost = merged.spareParts.reduce((sum: number, p: any) => sum + (p.qty * p.unitPrice), 0);
        const totalCost = partsCost + merged.laborCost;
        const finalized = { ...merged, totalCost };
        
        syncRepairRequestToSupabase(finalized);

        // If status transitions from 'รอตรวจสอบ' (Pending Approval) to 'รอรับเรื่อง' / 'กำลังดำเนินการ' (Approved)
        if (r.status === 'รอตรวจสอบ' && (finalized.status === 'รอรับเรื่อง' || finalized.status === 'กำลังดำเนินการ')) {
          const targetAsset = assets.find(a => a.id === finalized.assetId);
          const reporter = users.find(u => u.id === finalized.reporterId);
          const dept = departments.find(d => d.id === finalized.departmentId);

          dispatchLineOaNotification(
            settings,
            finalized,
            targetAsset?.name || 'ครุภัณฑ์',
            targetAsset?.assetCode || '-',
            reporter?.name || currentUser.name,
            dept?.name || 'กลุ่มงานทั่วไป'
          );

          addNotification(
            'อนุมัติคำขอแจ้งซ่อมแล้ว', 
            `ใบแจ้งซ่อม ${finalized.repairNo} ได้รับการอนุมัติเรียบร้อยแล้ว และระบบได้ส่งสัญญาณแจ้งเตือนไปยัง LINE OA ของช่างแล้ว`, 
            'success', 
            'repair'
          );
        }

        if (finalized.status === 'ซ่อมเสร็จ' || finalized.status === 'ปิดงาน' || finalized.status === 'ดำเนินการเสร็จ') {
          updateAsset(finalized.assetId, { status: 'พร้อมใช้งาน' });
        }
        return finalized;
      }
      return r;
    }));
  };

  const addBudgetPlan = (planData: Omit<BudgetPlan, 'id' | 'createdAt'>) => {
    const newPlan: BudgetPlan = {
      ...planData,
      id: generateUniqueId('bud'),
      createdAt: new Date().toISOString()
    };
    setBudgetPlans(prev => [newPlan, ...prev]);
    addAuditLog('CREATE', 'Budget & Planning', newPlan.id, `เพิ่มแผนงบประมาณ ${newPlan.itemName}`);
  };

  const updateBudgetPlan = (id: string, updatedFields: Partial<BudgetPlan>) => {
    setBudgetPlans(prev => prev.map(b => b.id === id ? { ...b, ...updatedFields } : b));
  };

  const addDepartment = (dept: Omit<Department, 'id'>) => {
    const newDept = { ...dept, id: generateUniqueId('dept') };
    setDepartments(prev => [...prev, newDept]);
    addAuditLog('CREATE', 'Settings', newDept.id, `เพิ่มหน่วยงาน ${newDept.name}`);
  };

  const updateDepartment = (id: string, dept: Partial<Department>) => {
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...dept } : d));
  };

  const deleteDepartment = (id: string) => {
    setDepartments(prev => prev.filter(d => d.id !== id));
  };

  const addUser = (user: Omit<UserProfile, 'id'>) => {
    const newUser = { ...user, id: generateUniqueId('usr') };
    setUsers(prev => [...prev, newUser]);
    addAuditLog('CREATE', 'Settings', newUser.id, `เพิ่มผู้ใช้งาน ${newUser.name}`);
  };

  const updateUser = (id: string, user: Partial<UserProfile>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const updated = { ...u, ...user };
        addAuditLog('UPDATE', 'Settings', id, `แก้ไขผู้ใช้งาน ${updated.name}`);
        return updated;
      }
      return u;
    }));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const addRole = (roleName: string) => {
    const trimmed = roleName.trim();
    if (!trimmed || roles.includes(trimmed)) return;
    setRoles(prev => [...prev, trimmed]);
    addAuditLog('CREATE', 'Settings', generateUniqueId('role'), `เพิ่มบทบาทสิทธิ์ใหม่ [${trimmed}]`);
  };

  const updateRole = (oldRole: string, newRole: string) => {
    const trimmed = newRole.trim();
    if (!trimmed || trimmed === oldRole) return;
    setRoles(prev => prev.map(r => r === oldRole ? trimmed : r));
    // Also update any users currently having this role
    setUsers(prev => prev.map(u => u.role === oldRole ? { ...u, role: trimmed } : u));
    if (currentUser.role === oldRole) {
      setCurrentUser(prev => ({ ...prev, role: trimmed }));
    }
    addAuditLog('UPDATE', 'Settings', generateUniqueId('role'), `แก้ไขบทบาทสิทธิ์จาก [${oldRole}] เป็น [${trimmed}]`);
  };

  const deleteRole = (roleToDelete: string) => {
    if (roles.length <= 1) {
      alert('ไม่สามารถลบบทบาทสิทธิ์ทั้งหมดได้');
      return;
    }
    setRoles(prev => prev.filter(r => r !== roleToDelete));
    // Assign any users with deleted role to a fallback role
    const fallback = roles.find(r => r !== roleToDelete) || 'General User';
    setUsers(prev => prev.map(u => u.role === roleToDelete ? { ...u, role: fallback } : u));
    if (currentUser.role === roleToDelete) {
      setCurrentUser(prev => ({ ...prev, role: fallback }));
    }
    addAuditLog('DELETE', 'Settings', generateUniqueId('role'), `ลบบทบาทสิทธิ์ [${roleToDelete}]`);
  };

  const addAssetCategory = (cat: Omit<AssetCategory, 'id'>) => {
    const newCat = { ...cat, id: generateUniqueId('cat') };
    setAssetCategories(prev => [...prev, newCat]);
    addAuditLog('CREATE', 'Settings', newCat.id, `เพิ่มประเภทครุภัณฑ์ [${newCat.name}]`);
  };

  const updateAssetCategory = (id: string, cat: Partial<AssetCategory>) => {
    setAssetCategories(prev => prev.map(c => c.id === id ? { ...c, ...cat } : c));
    addAuditLog('UPDATE', 'Settings', id, `แก้ไขประเภทครุภัณฑ์ [${cat.name || id}]`);
  };

  const deleteAssetCategory = (id: string) => {
    const cat = assetCategories.find(c => c.id === id);
    if (assetCategories.length <= 1) {
      alert('ไม่สามารถลบประเภทครุภัณฑ์ทั้งหมดได้');
      return;
    }
    setAssetCategories(prev => prev.filter(c => c.id !== id));
    addAuditLog('DELETE', 'Settings', id, `ลบประเภทครุภัณฑ์ [${cat?.name || id}]`);
  };

  const addBudgetSource = (source: string) => {
    const trimmed = source.trim();
    if (!trimmed || budgetSources.includes(trimmed)) return;
    setBudgetSources(prev => [...prev, trimmed]);
    addAuditLog('CREATE', 'Settings', generateUniqueId('bs'), `เพิ่มแหล่งงบประมาณ [${trimmed}]`);
  };

  const updateBudgetSource = (oldSource: string, newSource: string) => {
    const trimmed = newSource.trim();
    if (!trimmed || trimmed === oldSource) return;
    setBudgetSources(prev => prev.map(s => s === oldSource ? trimmed : s));
    setAssets(prev => prev.map(a => a.budgetSource === (oldSource as any) ? { ...a, budgetSource: trimmed as any } : a));
    addAuditLog('UPDATE', 'Settings', generateUniqueId('bs'), `แก้ไขแหล่งงบประมาณ [${oldSource}] เป็น [${trimmed}]`);
  };

  const deleteBudgetSource = (source: string) => {
    if (budgetSources.length <= 1) {
      alert('ไม่สามารถลบแหล่งงบประมาณทั้งหมดได้');
      return;
    }
    setBudgetSources(prev => prev.filter(s => s !== source));
    addAuditLog('DELETE', 'Settings', generateUniqueId('bs'), `ลบแหล่งงบประมาณ [${source}]`);
  };

  const addAcquisitionMethod = (method: string) => {
    const trimmed = method.trim();
    if (!trimmed || acquisitionMethods.includes(trimmed)) return;
    setAcquisitionMethods(prev => [...prev, trimmed]);
    addAuditLog('CREATE', 'Settings', generateUniqueId('acq'), `เพิ่มวิธีการได้มา [${trimmed}]`);
  };

  const updateAcquisitionMethod = (oldMethod: string, newMethod: string) => {
    const trimmed = newMethod.trim();
    if (!trimmed || trimmed === oldMethod) return;
    setAcquisitionMethods(prev => prev.map(m => m === oldMethod ? trimmed : m));
    setAssets(prev => prev.map(a => a.acquisitionMethod === (oldMethod as any) ? { ...a, acquisitionMethod: trimmed as any } : a));
    addAuditLog('UPDATE', 'Settings', generateUniqueId('acq'), `แก้ไขวิธีการได้มา [${oldMethod}] เป็น [${trimmed}]`);
  };

  const deleteAcquisitionMethod = (method: string) => {
    if (acquisitionMethods.length <= 1) {
      alert('ไม่สามารถลบวิธีการได้มาทั้งหมดได้');
      return;
    }
    setAcquisitionMethods(prev => prev.filter(m => m !== method));
    addAuditLog('DELETE', 'Settings', generateUniqueId('acq'), `ลบวิธีการได้มา [${method}]`);
  };

  const addAssetStatus = (status: string) => {
    const trimmed = status.trim();
    if (!trimmed || assetStatuses.includes(trimmed)) return;
    setAssetStatuses(prev => [...prev, trimmed]);
    addAuditLog('CREATE', 'Settings', generateUniqueId('st'), `เพิ่มสถานะครุภัณฑ์ [${trimmed}]`);
  };

  const updateAssetStatus = (oldStatus: string, newStatus: string) => {
    const trimmed = newStatus.trim();
    if (!trimmed || trimmed === oldStatus) return;
    setAssetStatuses(prev => prev.map(s => s === oldStatus ? trimmed : s));
    setAssets(prev => prev.map(a => a.status === (oldStatus as any) ? { ...a, status: trimmed as any } : a));
    addAuditLog('UPDATE', 'Settings', generateUniqueId('st'), `แก้ไขสถานะครุภัณฑ์ [${oldStatus}] เป็น [${trimmed}]`);
  };

  const deleteAssetStatus = (status: string) => {
    if (assetStatuses.length <= 1) {
      alert('ไม่สามารถลบสถานะครุภัณฑ์ทั้งหมดได้');
      return;
    }
    setAssetStatuses(prev => prev.filter(s => s !== status));
    addAuditLog('DELETE', 'Settings', generateUniqueId('st'), `ลบสถานะครุภัณฑ์ [${status}]`);
  };

  const addAssetLocation = (location: string) => {
    const trimmed = location.trim();
    if (!trimmed || assetLocations.includes(trimmed)) return;
    setAssetLocations(prev => [...prev, trimmed]);
    addAuditLog('CREATE', 'Settings', generateUniqueId('loc'), `เพิ่มสถานที่จัดเก็บ [${trimmed}]`);
  };

  const updateAssetLocation = (oldLocation: string, newLocation: string) => {
    const trimmed = newLocation.trim();
    if (!trimmed || trimmed === oldLocation) return;
    setAssetLocations(prev => prev.map(l => l === oldLocation ? trimmed : l));
    setAssets(prev => prev.map(a => a.location === oldLocation ? { ...a, location: trimmed } : a));
    addAuditLog('UPDATE', 'Settings', `loc-${Date.now()}`, `แก้ไขสถานที่จัดเก็บ [${oldLocation}] เป็น [${trimmed}]`);
  };

  const deleteAssetLocation = (location: string) => {
    if (assetLocations.length <= 1) {
      alert('ไม่สามารถลบสถานที่จัดเก็บทั้งหมดได้');
      return;
    }
    setAssetLocations(prev => prev.filter(l => l !== location));
    addAuditLog('DELETE', 'Settings', `loc-${Date.now()}`, `ลบสถานที่จัดเก็บ [${location}]`);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      syncSettingsToSupabase(updated);
      return updated;
    });
    addNotification('บันทึกการตั้งค่า', 'อัปเดตการตั้งค่าระบบเรียบร้อยแล้ว', 'success', 'settings');
  };

  const saveSettingsToSupabase = async (newSettings: Partial<SystemSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('smart_asset_settings', JSON.stringify(updated));
    const result = await syncSettingsToSupabase(updated);
    addNotification('บันทึกการตั้งค่า', 'บันทึกลง Supabase สำเร็จ', 'success', 'settings');
    return result;
  };

  const resetToDefaultData = () => {
    const roleClean = (currentUser?.role || '').toLowerCase().trim();
    if (roleClean !== 'admin' && !roleClean.includes('admin')) {
      alert('⚠️ สิทธิ์ไม่เพียงพอ! ปุ่มรีเซ็ตข้อมูลสามารถใช้ได้โดยผู้ดูแลระบบ (Admin) เท่านั้น');
      return;
    }
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  return (
    <AppContext.Provider value={{
      supabaseStatus,
      saveSettingsToSupabase,
      currentUser,
      isLoggedIn,
      login,
      logout,
      users,
      roles,
      addRole,
      updateRole,
      deleteRole,
      departments,
      assetCategories,
      budgetSources,
      acquisitionMethods,
      assetStatuses,
      assetLocations,
      assets,
      inventoryCategories,
      inventoryItems,
      inventoryTransactions,
      borrowRequests,
      repairRequests,
      budgetPlans,
      notifications,
      auditLogs,
      settings,
      activeTab,
      setActiveTab,
      addAsset,
      updateAsset,
      deleteAsset,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      processInventoryTransaction,
      addBorrowRequest,
      updateBorrowStatus,
      addRepairRequest,
      updateRepairRequest,
      getActiveRepairForAsset,
      addBudgetPlan,
      updateBudgetPlan,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      addUser,
      updateUser,
      deleteUser,
      addAssetCategory,
      updateAssetCategory,
      deleteAssetCategory,
      addBudgetSource,
      updateBudgetSource,
      deleteBudgetSource,
      addAcquisitionMethod,
      updateAcquisitionMethod,
      deleteAcquisitionMethod,
      addAssetStatus,
      updateAssetStatus,
      deleteAssetStatus,
      addAssetLocation,
      updateAssetLocation,
      deleteAssetLocation,
      markNotificationAsRead,
      updateSettings,
      resetToDefaultData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
