import { supabase } from './supabaseClient';
import { 
  Asset, 
  RepairRequest, 
  BorrowRequest, 
  InventoryItem, 
  Department, 
  UserProfile, 
  SystemSettings, 
  AuditLog 
} from '../types';

/**
 * Fetch all initial data from Supabase tables
 */
export const fetchAllSupabaseData = async () => {
  try {
    const [
      assetsRes,
      repairsRes,
      borrowsRes,
      inventoryRes,
      departmentsRes,
      usersRes,
      settingsRes
    ] = await Promise.all([
      supabase.from('assets').select('*'),
      supabase.from('repair_requests').select('*'),
      supabase.from('borrow_requests').select('*'),
      supabase.from('inventory_items').select('*'),
      supabase.from('departments').select('*'),
      supabase.from('users').select('*'),
      supabase.from('system_settings').select('*').eq('id', 1).maybeSingle()
    ]);

    const assets: Asset[] = (assetsRes.data || []).map((row: any) => ({
      id: row.id,
      assetCode: row.asset_code || row.assetCode,
      name: row.name,
      categoryId: row.category_id || row.categoryId,
      brand: row.brand,
      model: row.model,
      serialNumber: row.serial_number || row.serialNumber,
      receivedDate: row.received_date || row.receivedDate,
      inspectionDate: row.inspection_date || row.inspectionDate,
      purchasePrice: Number(row.purchase_price || row.purchasePrice || 0),
      salvageValue: Number(row.salvage_value || row.salvageValue || 1),
      usefulLife: Number(row.useful_life || row.usefulLife || 5),
      poNumber: row.po_number || row.poNumber || '',
      inspectionNo: row.inspection_no || row.inspectionNo || '',
      budgetSource: row.budget_source || row.budgetSource || 'งบแผ่นดิน',
      acquisitionMethod: row.acquisition_method || row.acquisitionMethod || 'จัดซื้อปกติ',
      location: row.location || '',
      departmentId: row.department_id || row.departmentId,
      responsiblePerson: row.responsible_person || row.responsiblePerson,
      vendorName: row.vendor_name || row.vendorName,
      vendorPhone: row.vendor_phone || row.vendorPhone,
      warrantyExpiryDate: row.warranty_expiry_date || row.warrantyExpiryDate,
      status: row.status || 'พร้อมใช้งาน',
      specifications: row.specifications,
      notes: row.notes,
      createdAt: row.created_at || row.createdAt || new Date().toISOString(),
      updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
    }));

    const repairRequests: RepairRequest[] = (repairsRes.data || []).map((row: any) => ({
      id: row.id,
      repairNo: row.repair_no || row.repairNo,
      assetId: row.asset_id || row.assetId,
      reporterId: row.reporter_id || row.reporterId,
      departmentId: row.department_id || row.departmentId,
      issueDescription: row.issue_description || row.issueDescription,
      urgency: row.urgency || 'ปกติ',
      repairMethod: row.repair_method || row.repairMethod,
      laborCost: Number(row.labor_cost || row.laborCost || 0),
      partsCost: Number(row.parts_cost || row.partsCost || 0),
      totalCost: Number(row.total_cost || row.totalCost || 0),
      spareParts: row.spare_parts || row.spareParts || [],
      status: row.status || 'รอรับเรื่อง',
      technicianId: row.technician_id || row.technicianId,
      notes: row.notes,
      createdAt: row.created_at || row.createdAt || new Date().toISOString()
    }));

    const borrowRequests: BorrowRequest[] = (borrowsRes.data || []).map((row: any) => ({
      id: row.id,
      requestNo: row.request_no || row.requestNo,
      userId: row.user_id || row.borrower_id || row.userId || 'usr-1',
      departmentId: row.department_id || row.departmentId,
      assetIds: row.asset_ids || row.assetIds || [],
      borrowDate: row.borrow_date || row.borrowDate,
      dueDate: row.due_date || row.expected_return_date || row.dueDate || '',
      actualReturnDate: row.actual_return_date || row.return_date || row.actualReturnDate,
      status: row.status || 'รอตรวจสอบ',
      purpose: row.purpose || '',
      createdAt: row.created_at || row.createdAt || new Date().toISOString()
    }));

    const inventoryItems: InventoryItem[] = (inventoryRes.data || []).map((row: any) => ({
      id: row.id,
      itemCode: row.item_code || row.itemCode,
      name: row.name,
      categoryId: row.category_id || row.categoryId,
      stockQty: Number(row.stock_qty || row.stockQty || 0),
      minQty: Number(row.min_qty || row.minQty || 5),
      unit: row.unit || 'ชิ้น',
      unitPrice: Number(row.unit_price || row.unitPrice || 0),
      location: row.location || '',
      supplier: row.supplier || 'บริษัท ซัพพลายเออร์ จำกัด',
      lastReceivedDate: row.last_received_date || row.lastReceivedDate || new Date().toISOString().split('T')[0]
    }));

    const departments: Department[] = (departmentsRes.data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      building: row.building || 'อาคารอำนวยการ',
      floor: row.floor || 'ชั้น 1',
      headName: row.head_name || 'หัวหน้าหน่วยงาน',
      phone: row.phone || '034-595000'
    }));

    const users: UserProfile[] = (usersRes.data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      departmentId: row.department_id || row.departmentId,
      position: row.position || 'เจ้าหน้าที่',
      phone: row.phone || '081-234-5678',
      avatarUrl: row.avatar_url || row.avatarUrl,
      status: row.status || 'Active'
    }));

    const settingsRow = settingsRes.data;
    const settings: Partial<SystemSettings> | null = settingsRow ? {
      organizationName: settingsRow.organization_name || settingsRow.organizationName,
      logoUrl: settingsRow.logo_url || settingsRow.logoUrl,
      emblemUrl: settingsRow.emblem_url || settingsRow.emblemUrl,
      fiscalYear: String(settingsRow.fiscal_year || settingsRow.fiscalYear || '2568'),
      lineOaEnabled: settingsRow.line_oa_enabled ?? settingsRow.lineOaEnabled ?? true,
      lineOaBasicId: settingsRow.line_oa_basic_id || settingsRow.lineOaBasicId,
      lineOaChannelAccessToken: settingsRow.line_oa_channel_access_token || settingsRow.lineOaChannelAccessToken,
      lineOaChannelSecret: settingsRow.line_oa_channel_secret || settingsRow.lineOaChannelSecret,
      lineOaWebhookUrl: settingsRow.line_oa_webhook_url || settingsRow.lineOaWebhookUrl,
      lineNotifyToken: settingsRow.line_notify_token || settingsRow.lineNotifyToken
    } : null;

    return {
      assets,
      repairRequests,
      borrowRequests,
      inventoryItems,
      departments,
      users,
      settings
    };
  } catch (error) {
    console.warn('Error loading from Supabase, falling back to local memory data:', error);
    return null;
  }
};

/**
 * Upsert asset to Supabase
 */
export const syncAssetToSupabase = async (asset: Asset) => {
  try {
    await supabase.from('assets').upsert({
      id: asset.id,
      asset_code: asset.assetCode,
      name: asset.name,
      category_id: asset.categoryId,
      brand: asset.brand,
      model: asset.model,
      serial_number: asset.serialNumber,
      received_date: asset.receivedDate,
      inspection_date: asset.inspectionDate,
      purchase_price: asset.purchasePrice,
      salvage_value: asset.salvageValue,
      useful_life: asset.usefulLife,
      po_number: asset.poNumber,
      inspection_no: asset.inspectionNo,
      budget_source: asset.budgetSource,
      acquisition_method: asset.acquisitionMethod,
      location: asset.location,
      department_id: asset.departmentId,
      responsible_person: asset.responsiblePerson,
      vendor_name: asset.vendorName,
      vendor_phone: asset.vendorPhone,
      warranty_expiry_date: asset.warrantyExpiryDate,
      status: asset.status,
      specifications: asset.specifications,
      notes: asset.notes,
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('Failed to sync asset to Supabase:', e);
  }
};

/**
 * Delete asset from Supabase
 */
export const deleteAssetFromSupabase = async (id: string) => {
  try {
    await supabase.from('assets').delete().eq('id', id);
  } catch (e) {
    console.error('Failed to delete asset from Supabase:', e);
  }
};

/**
 * Upsert repair request to Supabase
 */
export const syncRepairRequestToSupabase = async (repair: RepairRequest) => {
  try {
    await supabase.from('repair_requests').upsert({
      id: repair.id,
      repair_no: repair.repairNo,
      asset_id: repair.assetId,
      reporter_id: repair.reporterId,
      department_id: repair.departmentId,
      issue_description: repair.issueDescription,
      urgency: repair.urgency,
      repair_method: repair.repairMethod,
      labor_cost: repair.laborCost,
      parts_cost: repair.partsCost,
      total_cost: repair.totalCost,
      spare_parts: repair.spareParts,
      status: repair.status,
      technician_id: repair.technicianId,
      notes: repair.notes,
      created_at: repair.createdAt
    });
  } catch (e) {
    console.error('Failed to sync repair request to Supabase:', e);
  }
};

/**
 * Upsert borrow request to Supabase
 */
export const syncBorrowRequestToSupabase = async (borrow: BorrowRequest) => {
  try {
    await supabase.from('borrow_requests').upsert({
      id: borrow.id,
      request_no: borrow.requestNo,
      user_id: borrow.userId,
      department_id: borrow.departmentId,
      asset_ids: borrow.assetIds,
      borrow_date: borrow.borrowDate,
      due_date: borrow.dueDate,
      actual_return_date: borrow.actualReturnDate,
      status: borrow.status,
      purpose: borrow.purpose,
      created_at: borrow.createdAt
    });
  } catch (e) {
    console.error('Failed to sync borrow request to Supabase:', e);
  }
};

/**
 * Upsert inventory item to Supabase
 */
export const syncInventoryItemToSupabase = async (item: InventoryItem) => {
  try {
    await supabase.from('inventory_items').upsert({
      id: item.id,
      item_code: item.itemCode,
      name: item.name,
      category_id: item.categoryId,
      stock_qty: item.stockQty,
      min_qty: item.minQty,
      unit: item.unit,
      unit_price: item.unitPrice,
      location: item.location,
      supplier: item.supplier,
      last_received_date: item.lastReceivedDate
    });
  } catch (e) {
    console.error('Failed to sync inventory item to Supabase:', e);
  }
};

/**
 * Upsert system settings to Supabase
 */
export const syncSettingsToSupabase = async (settings: SystemSettings): Promise<{ success: boolean; data?: any; error?: any }> => {
  try {
    const payload = {
      id: 1,
      organization_name: settings.organizationName || 'โรงพยาบาลสังขละบุรี (SANGKHLABURI HOSPITAL)',
      logo_url: settings.logoUrl || './assets/aistudio/Logo_SK_26693d5e.png',
      emblem_url: settings.emblemUrl || './assets/aistudio/Logo_SK_26693d5e.png',
      fiscal_year: parseInt(String(settings.fiscalYear || '2568'), 10),
      line_oa_enabled: typeof settings.lineOaEnabled === 'boolean' ? settings.lineOaEnabled : true,
      line_oa_basic_id: settings.lineOaBasicId || '@765satuz',
      line_oa_channel_access_token: settings.lineOaChannelAccessToken || '',
      line_oa_channel_secret: settings.lineOaChannelSecret || '',
      line_oa_webhook_url: settings.lineOaWebhookUrl || '',
      line_notify_token: settings.lineNotifyToken || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('system_settings')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Failed to sync settings to Supabase:', error);
      return { success: false, error };
    }
    console.log('Successfully saved system settings to Supabase (id=1):', data);
    return { success: true, data };
  } catch (e: any) {
    console.error('Failed to sync settings to Supabase:', e);
    return { success: false, error: e };
  }
};

/**
 * Insert audit log to Supabase
 */
export const syncAuditLogToSupabase = async (log: AuditLog) => {
  try {
    await supabase.from('audit_logs').insert({
      id: log.id,
      user_id: log.userId,
      user_name: log.userName,
      action: log.action,
      module: log.module,
      record_id: log.recordId,
      description: log.description,
      created_at: log.createdAt
    });
  } catch (e) {
    console.error('Failed to sync audit log to Supabase:', e);
  }
};
