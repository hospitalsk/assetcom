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
      brand: row.brand || '',
      model: row.model || '',
      serialNumber: row.serial_number || row.serialNumber || '',
      receivedDate: row.received_date || row.receivedDate || '',
      inspectionDate: row.inspection_date || row.inspectionDate || '',
      purchasePrice: Number(row.purchase_price || row.purchasePrice || 0),
      salvageValue: Number(row.salvage_value || row.salvageValue || 1),
      usefulLife: Number(row.useful_life || row.usefulLife || 5),
      poNumber: row.po_number || row.poNumber || '',
      inspectionNo: row.inspection_no || row.inspectionNo || '',
      budgetSource: row.budget_source || row.budgetSource || 'งบแผ่นดิน',
      acquisitionMethod: row.acquisition_method || row.acquisitionMethod || 'จัดซื้อปกติ',
      location: row.location || '',
      departmentId: row.department_id || row.departmentId,
      assignedUserId: row.assigned_user_id || row.assignedUserId,
      responsiblePerson: row.responsible_person || row.responsiblePerson,
      vendorName: row.vendor_name || row.vendorName,
      vendorPhone: row.vendor_phone || row.vendorPhone,
      warrantyExpiryDate: row.warranty_expiry_date || row.warrantyExpiryDate,
      status: row.status || 'พร้อมใช้งาน',
      imageUrl: row.image_url || row.imageUrl,
      documentUrl: row.document_url || row.documentUrl,
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
      beforeImageUrl: row.before_image_url || row.beforeImageUrl,
      afterImageUrl: row.after_image_url || row.afterImageUrl,
      notes: row.notes,

      // Workflow approvals mapping (supports snake_case and camelCase)
      departmentHeadApproved: row.department_head_approved ?? row.departmentHeadApproved,
      departmentHeadApprovedBy: row.department_head_approved_by || row.departmentHeadApprovedBy,
      departmentHeadApprovedAt: row.department_head_approved_at || row.departmentHeadApprovedAt,
      headOpinion: row.head_opinion || row.headOpinion,
      headPosition: row.head_position || row.headPosition,

      supplyOfficerApproved: row.supply_officer_approved ?? row.supplyOfficerApproved,
      supplyOfficerApprovedBy: row.supply_officer_approved_by || row.supplyOfficerApprovedBy,
      supplyOfficerApprovedAt: row.supply_officer_approved_at || row.supplyOfficerApprovedAt,
      supplyPosition: row.supply_position || row.supplyPosition,

      directorApproved: row.director_approved ?? row.directorApproved,
      directorApprovedBy: row.director_approved_by || row.directorApprovedBy,
      directorApprovedAt: row.director_approved_at || row.directorApprovedAt,
      approverComments: row.approver_comments || row.approverComments,

      technicianApproved: row.technician_approved ?? row.technicianApproved,
      technicianApprovedBy: row.technician_approved_by || row.technicianApprovedBy,
      maintCompletedBy: row.maint_completed_by || row.maintCompletedBy,
      maintCompletedAt: row.maint_completed_at || row.maintCompletedAt,

      itemReceived: row.item_received ?? row.itemReceived,
      itemReceivedBy: row.item_received_by || row.itemReceivedBy,
      itemReceivedAt: row.item_received_at || row.itemReceivedAt,

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
      approverId: row.approver_id || row.approverId,
      conditionBefore: row.condition_before || row.conditionBefore,
      conditionAfter: row.condition_after || row.conditionAfter,
      notes: row.notes,
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
      lastReceivedDate: row.last_received_date || row.lastReceivedDate || new Date().toISOString().split('T')[0],
      expiryDate: row.expiry_date || row.expiryDate,
      notes: row.notes
    }));

    const departments: Department[] = (departmentsRes.data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      building: row.building || 'อาคารอำนวยการ',
      floor: row.floor || 'ชั้น 1',
      headName: row.head_name || row.headName || 'หัวหน้าหน่วยงาน',
      phone: row.phone || '034-595000'
    }));

    const users: UserProfile[] = (usersRes.data || []).map((row: any) => ({
      id: row.id,
      username: row.username || row.email?.split('@')[0],
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
      settings,
      assetsOk: !assetsRes.error,
      repairsOk: !repairsRes.error,
      borrowsOk: !borrowsRes.error,
      inventoryOk: !inventoryRes.error
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
      assigned_user_id: asset.assignedUserId || null,
      responsible_person: asset.responsiblePerson || null,
      vendor_name: asset.vendorName || null,
      vendor_phone: asset.vendorPhone || null,
      warranty_expiry_date: asset.warrantyExpiryDate || null,
      status: asset.status,
      image_url: asset.imageUrl || null,
      document_url: asset.documentUrl || null,
      specifications: asset.specifications || null,
      notes: asset.notes || null,
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
 * Upsert repair request to Supabase (with full workflow approval fields)
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
      repair_method: repair.repairMethod || null,
      labor_cost: repair.laborCost,
      parts_cost: repair.partsCost,
      total_cost: repair.totalCost,
      spare_parts: repair.spareParts || [],
      status: repair.status,
      technician_id: repair.technicianId || null,
      before_image_url: repair.beforeImageUrl || null,
      after_image_url: repair.afterImageUrl || null,
      notes: repair.notes || null,

      department_head_approved: repair.departmentHeadApproved ?? null,
      department_head_approved_by: repair.departmentHeadApprovedBy || null,
      department_head_approved_at: repair.departmentHeadApprovedAt || null,
      head_opinion: repair.headOpinion || null,
      head_position: repair.headPosition || null,

      supply_officer_approved: repair.supplyOfficerApproved ?? null,
      supply_officer_approved_by: repair.supplyOfficerApprovedBy || null,
      supply_officer_approved_at: repair.supplyOfficerApprovedAt || null,
      supply_position: repair.supplyPosition || null,

      director_approved: repair.directorApproved ?? null,
      director_approved_by: repair.directorApprovedBy || null,
      director_approved_at: repair.directorApprovedAt || null,
      approver_comments: repair.approverComments || null,

      technician_approved: repair.technicianApproved ?? null,
      technician_approved_by: repair.technicianApprovedBy || null,
      maint_completed_by: repair.maintCompletedBy || null,
      maint_completed_at: repair.maintCompletedAt || null,

      item_received: repair.itemReceived ?? null,
      item_received_by: repair.itemReceivedBy || null,
      item_received_at: repair.itemReceivedAt || null,

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
      actual_return_date: borrow.actualReturnDate || null,
      status: borrow.status,
      purpose: borrow.purpose,
      approver_id: borrow.approverId || null,
      condition_before: borrow.conditionBefore || null,
      condition_after: borrow.conditionAfter || null,
      notes: borrow.notes || null,
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
      last_received_date: item.lastReceivedDate,
      expiry_date: item.expiryDate || null,
      notes: item.notes || null
    });
  } catch (e) {
    console.error('Failed to sync inventory item to Supabase:', e);
  }
};

/**
 * Upsert department to Supabase
 */
export const syncDepartmentToSupabase = async (dept: Department) => {
  try {
    await supabase.from('departments').upsert({
      id: dept.id,
      code: dept.code,
      name: dept.name,
      building: dept.building,
      floor: dept.floor,
      head_name: dept.headName,
      phone: dept.phone
    });
  } catch (e) {
    console.error('Failed to sync department to Supabase:', e);
  }
};

export const deleteDepartmentFromSupabase = async (id: string) => {
  try {
    await supabase.from('departments').delete().eq('id', id);
  } catch (e) {
    console.error('Failed to delete department from Supabase:', e);
  }
};

/**
 * Upsert user profile to Supabase
 */
export const syncUserToSupabase = async (user: UserProfile) => {
  try {
    await supabase.from('users').upsert({
      id: user.id,
      username: user.username || user.email?.split('@')[0],
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.departmentId,
      position: user.position,
      phone: user.phone,
      avatar_url: user.avatarUrl || null,
      status: user.status
    });
  } catch (e) {
    console.error('Failed to sync user to Supabase:', e);
  }
};

export const deleteUserFromSupabase = async (id: string) => {
  try {
    await supabase.from('users').delete().eq('id', id);
  } catch (e) {
    console.error('Failed to delete user from Supabase:', e);
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
      emblem_url: settings.emblemUrl || './assets/aistudio/________3cm_fbf2f514.png',
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

/**
 * Push all local initial dataset up to Supabase in batch (Seeding live tables)
 */
export const seedAllDataToSupabase = async (dataset: {
  assets: Asset[];
  repairRequests: RepairRequest[];
  borrowRequests: BorrowRequest[];
  inventoryItems: InventoryItem[];
  departments: Department[];
  users: UserProfile[];
  settings: SystemSettings;
}): Promise<{ success: boolean; message: string }> => {
  try {
    // 1. Departments
    for (const d of dataset.departments) {
      await syncDepartmentToSupabase(d);
    }
    // 2. Users
    for (const u of dataset.users) {
      await syncUserToSupabase(u);
    }
    // 3. Assets
    for (const a of dataset.assets) {
      await syncAssetToSupabase(a);
    }
    // 4. Repairs
    for (const r of dataset.repairRequests) {
      await syncRepairRequestToSupabase(r);
    }
    // 5. Borrows
    for (const b of dataset.borrowRequests) {
      await syncBorrowRequestToSupabase(b);
    }
    // 6. Inventory
    for (const i of dataset.inventoryItems) {
      await syncInventoryItemToSupabase(i);
    }
    // 7. Settings
    await syncSettingsToSupabase(dataset.settings);

    return { success: true, message: 'ส่งและซิงค์ข้อมูลทั้งหมดไปยัง Supabase สำเร็จเรียบร้อยแล้ว' };
  } catch (err: any) {
    return { success: false, message: `เกิดข้อผิดพลาดในการซิงค์ไปยัง Supabase: ${err.message || err}` };
  }
};

/**
 * Clear all operational records in Supabase tables
 */
export const clearOperationalDataInSupabase = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const tables = [
      'repair_requests',
      'borrow_requests',
      'inventory_transactions',
      'inventory_items',
      'budget_plans',
      'audit_logs',
      'assets'
    ];
    for (const table of tables) {
      await supabase.from(table).delete().neq('id', '__non_existent__');
    }
    return { success: true, message: 'ล้างข้อมูลปฏิบัติการทั้งหมดใน Supabase เรียบร้อยแล้ว' };
  } catch (err: any) {
    return { success: false, message: `ไม่สามารถล้างข้อมูลใน Supabase ได้: ${err?.message || err}` };
  }
};
