import { supabase } from './supabaseClient';
import {
  Asset,
  AssetCategory,
  BudgetPlan,
  RepairRequest,
  BorrowRequest,
  InventoryItem,
  InventoryTransaction,
  Department,
  UserProfile,
  SystemSettings,
  AuditLog
} from '../types';

const REPAIR_META_PREFIX = '[[REPAIR_META:';
const ASSET_META_PREFIX = '[[ASSET_META:';
const META_SUFFIX = ']]';

const toNullableDate = (val?: string | null): string | null => {
  if (!val) return null;
  const trimmed = String(val).trim();
  if (!trimmed) return null;
  // Normalize ISO timestamps or YYYY-MM-DD to YYYY-MM-DD for Postgres DATE columns
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  return trimmed;
};

const parseNotesWithMeta = (
  rawNotes: any,
  prefix: string
): { cleanNotes: string; meta: Record<string, any> } => {
  if (!rawNotes || typeof rawNotes !== 'string') {
    return { cleanNotes: '', meta: {} };
  }
  const idx = rawNotes.lastIndexOf(prefix);
  if (idx === -1) {
    return { cleanNotes: rawNotes, meta: {} };
  }
  const endIdx = rawNotes.indexOf(META_SUFFIX, idx + prefix.length);
  if (endIdx === -1) {
    return { cleanNotes: rawNotes, meta: {} };
  }
  const jsonStr = rawNotes.slice(idx + prefix.length, endIdx);
  const before = rawNotes.slice(0, idx).replace(/\n+$/, '');
  const after = rawNotes.slice(endIdx + META_SUFFIX.length).replace(/^\n+/, '');
  const cleanNotes = [before, after].filter(Boolean).join('\n');
  try {
    const parsed = JSON.parse(jsonStr);
    return { cleanNotes, meta: parsed && typeof parsed === 'object' ? parsed : {} };
  } catch {
    return { cleanNotes: rawNotes, meta: {} };
  }
};

const buildNotesWithMeta = (
  cleanNotes: string | undefined | null,
  prefix: string,
  meta: Record<string, any>
): string | null => {
  const filtered: Record<string, any> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v !== undefined && v !== null && v !== '') {
      filtered[k] = v;
    }
  }
  const base = (cleanNotes || '').trim();
  if (Object.keys(filtered).length === 0) {
    return base || null;
  }
  const tag = `${prefix}${JSON.stringify(filtered)}${META_SUFFIX}`;
  return base ? `${base}\n${tag}` : tag;
};

/**
 * Upsert row into Supabase table, automatically stripping any columns
 * not present in the remote PostgREST schema cache (PGRST204) and retrying.
 */
const upsertWithSchemaFallback = async (
  table: string,
  payload: Record<string, any>,
  options?: {
    onConflict?: string;
    select?: boolean;
    onSchemaMismatch?: (strippedCols: string[], currentPayload: Record<string, any>) => void;
  }
): Promise<{ success: boolean; data?: any; error?: any }> => {
  const current = { ...payload };
  const stripped: string[] = [];

  for (let attempt = 0; attempt < 35; attempt++) {
    const query = supabase
      .from(table)
      .upsert(current, options?.onConflict ? { onConflict: options.onConflict } : undefined);
    const { data, error } = options?.select ? await query.select() : await query;

    if (!error) {
      return { success: true, data };
    }

    if (error.code === 'PGRST204' && typeof error.message === 'string') {
      const match = error.message.match(/Could not find the '([^']+)' column/);
      if (match && match[1] && Object.prototype.hasOwnProperty.call(current, match[1])) {
        const missingCol = match[1];
        delete current[missingCol];
        stripped.push(missingCol);
        if (options?.onSchemaMismatch) {
          options.onSchemaMismatch(stripped, current);
        }
        continue;
      }
    }

    console.error(`Supabase upsert failed [${table}]:`, error);
    return { success: false, error };
  }

  return { success: false, error: new Error(`Exceeded schema fallback attempts for ${table}`) };
};

/**
 * Fetch all data from Supabase tables
 */
export const fetchAllSupabaseData = async () => {
  try {
    const [
      assetsRes,
      repairsRes,
      borrowsRes,
      inventoryRes,
      transactionsRes,
      budgetsRes,
      departmentsRes,
      usersRes,
      categoriesRes,
      auditLogsRes,
      settingsRes
    ] = await Promise.all([
      supabase.from('assets').select('*'),
      supabase.from('repair_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('borrow_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('inventory_items').select('*'),
      supabase.from('inventory_transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('budget_plans').select('*').order('created_at', { ascending: false }),
      supabase.from('departments').select('*'),
      supabase.from('users').select('*'),
      supabase.from('asset_categories').select('*'),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('system_settings').select('*').eq('id', 1).maybeSingle()
    ]);

    const queryErrors: string[] = [];
    const checkErr = (name: string, err: any) => {
      if (err) {
        console.warn(`Supabase fetch warning [${name}]:`, err.message || err);
        queryErrors.push(`${name}: ${err.message || err}`);
      }
    };
    checkErr('assets', assetsRes.error);
    checkErr('repair_requests', repairsRes.error);
    checkErr('borrow_requests', borrowsRes.error);
    checkErr('inventory_items', inventoryRes.error);
    checkErr('inventory_transactions', transactionsRes.error);
    checkErr('budget_plans', budgetsRes.error);
    checkErr('departments', departmentsRes.error);
    checkErr('users', usersRes.error);
    checkErr('asset_categories', categoriesRes.error);
    checkErr('audit_logs', auditLogsRes.error);
    checkErr('system_settings', settingsRes.error);

    const assets: Asset[] = (assetsRes.data || []).map((row: any) => {
      const { cleanNotes, meta } = parseNotesWithMeta(row.notes, ASSET_META_PREFIX);
      return {
        id: row.id,
        assetCode: row.asset_code || row.assetCode,
        name: row.name,
        categoryId: row.category_id || row.categoryId,
        brand: row.brand || '',
        model: row.model || '',
        serialNumber: row.serial_number || row.serialNumber || '',
        receivedDate: row.received_date || row.receivedDate || '',
        inspectionDate: row.inspection_date || row.inspectionDate || '',
        purchasePrice: Number(row.purchase_price ?? row.purchasePrice ?? 0),
        salvageValue: Number(row.salvage_value ?? row.salvageValue ?? 1),
        usefulLife: Number(row.useful_life ?? row.usefulLife ?? 5),
        poNumber: row.po_number || row.poNumber || '',
        inspectionNo: row.inspection_no || row.inspectionNo || '',
        budgetSource: row.budget_source || row.budgetSource || 'งบแผ่นดิน',
        acquisitionMethod: row.acquisition_method || row.acquisitionMethod || 'จัดซื้อปกติ',
        location: row.location || '',
        departmentId: row.department_id || row.departmentId || '',
        assignedUserId: row.assigned_user_id || row.assignedUserId || meta.assignedUserId,
        responsiblePerson: row.responsible_person || row.responsiblePerson || '',
        vendorName: row.vendor_name || row.vendorName || '',
        vendorPhone: row.vendor_phone || row.vendorPhone || '',
        warrantyExpiryDate: row.warranty_expiry_date || row.warrantyExpiryDate || '',
        status: row.status || 'พร้อมใช้งาน',
        imageUrl: row.image_url || row.imageUrl || meta.imageUrl,
        documentUrl: row.document_url || row.documentUrl || meta.documentUrl,
        specifications: row.specifications || '',
        notes: cleanNotes || undefined,
        createdAt: row.created_at || row.createdAt || new Date().toISOString(),
        updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
      };
    });

    const repairRequests: RepairRequest[] = (repairsRes.data || []).map((row: any) => {
      const { cleanNotes, meta } = parseNotesWithMeta(row.notes, REPAIR_META_PREFIX);
      return {
        id: row.id,
        repairNo: row.repair_no || row.repairNo,
        assetId: row.asset_id || row.assetId,
        reporterId: row.reporter_id || row.reporterId,
        departmentId: row.department_id || row.departmentId,
        issueDescription: row.issue_description || row.issueDescription,
        urgency: row.urgency || 'ปกติ',
        repairMethod: row.repair_method || row.repairMethod || undefined,
        laborCost: Number(row.labor_cost ?? row.laborCost ?? 0),
        partsCost: Number(row.parts_cost ?? row.partsCost ?? 0),
        totalCost: Number(row.total_cost ?? row.totalCost ?? 0),
        spareParts: Array.isArray(row.spare_parts) ? row.spare_parts : (row.spareParts || []),
        status: row.status || 'รอหัวหน้าอนุมัติ',
        technicianId: row.technician_id || row.technicianId || undefined,
        sentDate: row.sent_date || row.sentDate || meta.sentDate,
        acceptedDate: row.accepted_date || row.acceptedDate || meta.acceptedDate,
        completedDate: row.completed_date || row.completedDate || meta.completedDate,
        beforeImageUrl: row.before_image_url || row.beforeImageUrl || meta.beforeImageUrl,
        afterImageUrl: row.after_image_url || row.afterImageUrl || meta.afterImageUrl,
        notes: cleanNotes || undefined,

        // Workflow approvals mapping (supports native columns and notes metadata fallback)
        departmentHeadApproved: row.department_head_approved ?? row.departmentHeadApproved ?? meta.departmentHeadApproved,
        departmentHeadApprovedBy: row.department_head_approved_by || row.departmentHeadApprovedBy || meta.departmentHeadApprovedBy,
        departmentHeadApprovedAt: row.department_head_approved_at || row.departmentHeadApprovedAt || meta.departmentHeadApprovedAt,
        headOpinion: row.head_opinion || row.headOpinion || meta.headOpinion,
        headPosition: row.head_position || row.headPosition || meta.headPosition,

        supplyOfficerApproved: row.supply_officer_approved ?? row.supplyOfficerApproved ?? meta.supplyOfficerApproved,
        supplyOfficerApprovedBy: row.supply_officer_approved_by || row.supplyOfficerApprovedBy || meta.supplyOfficerApprovedBy,
        supplyOfficerApprovedAt: row.supply_officer_approved_at || row.supplyOfficerApprovedAt || meta.supplyOfficerApprovedAt,
        supplyPosition: row.supply_position || row.supplyPosition || meta.supplyPosition,

        directorApproved: row.director_approved ?? row.directorApproved ?? meta.directorApproved,
        directorApprovedBy: row.director_approved_by || row.directorApprovedBy || meta.directorApprovedBy,
        directorApprovedAt: row.director_approved_at || row.directorApprovedAt || meta.directorApprovedAt,
        approverComments: row.approver_comments || row.approverComments || meta.approverComments,

        technicianApproved: row.technician_approved ?? row.technicianApproved ?? meta.technicianApproved,
        technicianApprovedBy: row.technician_approved_by || row.technicianApprovedBy || meta.technicianApprovedBy,
        maintCompletedBy: row.maint_completed_by || row.maintCompletedBy || meta.maintCompletedBy,
        maintCompletedAt: row.maint_completed_at || row.maintCompletedAt || meta.maintCompletedAt,

        itemReceived: row.item_received ?? row.itemReceived ?? meta.itemReceived,
        itemReceivedBy: row.item_received_by || row.itemReceivedBy || meta.itemReceivedBy,
        itemReceivedAt: row.item_received_at || row.itemReceivedAt || meta.itemReceivedAt,

        memoData: row.memo_data || row.memoData || meta.memoData,

        createdAt: row.created_at || row.createdAt || new Date().toISOString()
      };
    });

    const borrowRequests: BorrowRequest[] = (borrowsRes.data || []).map((row: any) => ({
      id: row.id,
      requestNo: row.request_no || row.requestNo,
      userId: row.user_id || row.borrower_id || row.userId || 'usr-1',
      departmentId: row.department_id || row.departmentId || '',
      assetIds: Array.isArray(row.asset_ids) ? row.asset_ids : (row.assetIds || []),
      borrowDate: row.borrow_date || row.borrowDate || '',
      dueDate: row.expected_return_date || row.due_date || row.dueDate || '',
      actualReturnDate: row.return_date || row.actual_return_date || row.actualReturnDate || undefined,
      status: row.status || 'รอตรวจสอบ',
      purpose: row.purpose || '',
      approverId: row.approver_id || row.approverId || undefined,
      conditionBefore: row.condition_before || row.conditionBefore || undefined,
      conditionAfter: row.condition_after || row.conditionAfter || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at || row.createdAt || new Date().toISOString()
    }));

    const inventoryItems: InventoryItem[] = (inventoryRes.data || []).map((row: any) => ({
      id: row.id,
      itemCode: row.item_code || row.itemCode,
      name: row.name,
      categoryId: row.category_id || row.categoryId || 'inv-cat-1',
      stockQty: Number(row.stock_qty ?? row.stockQty ?? 0),
      minQty: Number(row.min_qty ?? row.minQty ?? 5),
      unit: row.unit || 'ชิ้น',
      unitPrice: Number(row.unit_price ?? row.unitPrice ?? 0),
      location: row.location || '',
      supplier: row.supplier || '',
      lastReceivedDate: row.last_received_date || row.lastReceivedDate || '',
      expiryDate: row.expiry_date || row.expiryDate || undefined,
      notes: row.notes || undefined
    }));

    const inventoryTransactions: InventoryTransaction[] = (transactionsRes.data || []).map((row: any) => ({
      id: row.id,
      itemId: row.item_id || row.itemId,
      transactionType: row.transaction_type || row.transactionType || 'เบิกวัสดุ',
      quantity: Number(row.quantity ?? 0),
      remainingQty: Number(row.remaining_qty ?? row.remainingQty ?? 0),
      userId: row.user_id || row.userId || '',
      departmentId: row.department_id || row.departmentId || '',
      referenceNo: row.reference_no || row.referenceNo || undefined,
      notes: row.notes || '',
      createdAt: row.created_at || row.createdAt || new Date().toISOString()
    }));

    const budgetPlans: BudgetPlan[] = (budgetsRes.data || []).map((row: any) => ({
      id: row.id,
      fiscalYear: String(row.fiscal_year ?? row.fiscalYear ?? '2568'),
      departmentId: row.department_id || row.departmentId || '',
      category: (row.category_id || row.category || 'ครุภัณฑ์คอมพิวเตอร์') as BudgetPlan['category'],
      itemName: row.item_name || row.itemName || '',
      estimatedQty: Number(row.quantity ?? row.estimated_qty ?? row.estimatedQty ?? 1),
      estimatedUnitPrice: Number(row.unit_price ?? row.estimated_unit_price ?? row.estimatedUnitPrice ?? 0),
      totalBudget: Number(row.total_budget ?? row.totalBudget ?? 0),
      priority: (row.urgency_level || row.priority || 'ปานกลาง') as BudgetPlan['priority'],
      justification: row.justification || '',
      status: (row.status || 'ร่างแผน') as BudgetPlan['status'],
      createdAt: row.created_at || row.createdAt || new Date().toISOString()
    }));

    const departments: Department[] = (departmentsRes.data || []).map((row: any) => ({
      id: row.id,
      name: row.name ?? '',
      code: row.code ?? '',
      building: row.building ?? '',
      floor: row.floor ?? '',
      headName: row.head_name ?? row.headName ?? '',
      phone: row.phone ?? ''
    }));

    const users: UserProfile[] = (usersRes.data || []).map((row: any) => ({
      id: row.id,
      username: row.username || row.email?.split('@')[0],
      name: row.name,
      email: row.email,
      role: row.role,
      departmentId: row.department_id || row.departmentId || '',
      position: row.position || 'เจ้าหน้าที่',
      phone: row.phone || '',
      avatarUrl: row.avatar_url || row.avatarUrl || undefined,
      status: row.status || 'Active'
    }));

    const assetCategories: AssetCategory[] = (categoriesRes.data || []).map((row: any) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      defaultUsefulLife: Number(row.default_useful_life ?? row.defaultUsefulLife ?? 5),
      salvageValuePercent: Number(row.salvage_value_percent ?? row.salvageValuePercent ?? 10),
      prefix: row.prefix || 'AST'
    }));

    const auditLogs: AuditLog[] = (auditLogsRes.data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id || row.userId || '',
      userName: row.user_name || row.userName || '',
      action: row.action,
      module: row.module,
      recordId: row.record_id || row.recordId || '',
      description: row.description || '',
      createdAt: row.created_at || row.createdAt || new Date().toISOString()
    }));

    const settingsRow = settingsRes.data;
    const settings: Partial<SystemSettings> | null = settingsRow
      ? Object.fromEntries(
          Object.entries({
            organizationName: settingsRow.organization_name ?? settingsRow.organizationName,
            logoUrl: settingsRow.logo_url ?? settingsRow.logoUrl,
            emblemUrl: settingsRow.emblem_url ?? settingsRow.emblemUrl,
            fiscalYear: settingsRow.fiscal_year != null ? String(settingsRow.fiscal_year) : undefined,
            lineOaEnabled: settingsRow.line_oa_enabled ?? settingsRow.lineOaEnabled,
            lineOaBasicId: settingsRow.line_oa_basic_id ?? settingsRow.lineOaBasicId,
            lineOaChannelAccessToken:
              settingsRow.line_oa_channel_access_token ?? settingsRow.lineOaChannelAccessToken,
            lineOaChannelSecret:
              settingsRow.line_oa_channel_secret ?? settingsRow.lineOaChannelSecret,
            lineOaWebhookUrl: settingsRow.line_oa_webhook_url ?? settingsRow.lineOaWebhookUrl,
            lineNotifyToken: settingsRow.line_notify_token ?? settingsRow.lineNotifyToken
          }).filter(([, v]) => v !== undefined && v !== null)
        )
      : null;

    return {
      assets,
      repairRequests,
      borrowRequests,
      inventoryItems,
      inventoryTransactions,
      budgetPlans,
      departments,
      users,
      assetCategories,
      auditLogs,
      settings,
      assetsOk: !assetsRes.error,
      repairsOk: !repairsRes.error,
      borrowsOk: !borrowsRes.error,
      inventoryOk: !inventoryRes.error,
      transactionsOk: !transactionsRes.error,
      budgetsOk: !budgetsRes.error,
      departmentsOk: !departmentsRes.error,
      usersOk: !usersRes.error,
      categoriesOk: !categoriesRes.error,
      auditLogsOk: !auditLogsRes.error,
      settingsOk: !settingsRes.error,
      queryErrors
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
    const extraMeta: Record<string, any> = {};
    const payload: Record<string, any> = {
      id: asset.id,
      asset_code: asset.assetCode,
      name: asset.name,
      category_id: asset.categoryId,
      brand: asset.brand || null,
      model: asset.model || null,
      serial_number: asset.serialNumber || null,
      received_date: toNullableDate(asset.receivedDate),
      inspection_date: toNullableDate(asset.inspectionDate),
      purchase_price: Number(asset.purchasePrice || 0),
      salvage_value: Number(asset.salvageValue ?? 1),
      useful_life: Number(asset.usefulLife || 5),
      po_number: asset.poNumber || null,
      inspection_no: asset.inspectionNo || null,
      budget_source: asset.budgetSource || 'งบแผ่นดิน',
      acquisition_method: asset.acquisitionMethod || 'จัดซื้อปกติ',
      location: asset.location || null,
      department_id: asset.departmentId || null,
      assigned_user_id: asset.assignedUserId || null,
      responsible_person: asset.responsiblePerson || null,
      vendor_name: asset.vendorName || null,
      vendor_phone: asset.vendorPhone || null,
      warranty_expiry_date: toNullableDate(asset.warrantyExpiryDate),
      status: asset.status || 'พร้อมใช้งาน',
      image_url: asset.imageUrl || null,
      document_url: asset.documentUrl || null,
      specifications: asset.specifications || null,
      notes: asset.notes || null,
      updated_at: new Date().toISOString()
    };

    return await upsertWithSchemaFallback('assets', payload, {
      onConflict: 'id',
      onSchemaMismatch: (strippedCols, currentPayload) => {
        if (strippedCols.includes('assigned_user_id') && asset.assignedUserId) {
          extraMeta.assignedUserId = asset.assignedUserId;
        }
        if (strippedCols.includes('image_url') && asset.imageUrl && asset.imageUrl.length < 150000) {
          extraMeta.imageUrl = asset.imageUrl;
        }
        if (strippedCols.includes('document_url') && asset.documentUrl && asset.documentUrl.length < 150000) {
          extraMeta.documentUrl = asset.documentUrl;
        }
        if (Object.keys(extraMeta).length > 0) {
          currentPayload.notes = buildNotesWithMeta(asset.notes, ASSET_META_PREFIX, extraMeta);
        }
      }
    });
  } catch (e) {
    console.error('Failed to sync asset to Supabase:', e);
    return { success: false, error: e };
  }
};

/**
 * Delete asset from Supabase
 */
export const deleteAssetFromSupabase = async (id: string) => {
  try {
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) console.error('Failed to delete asset from Supabase:', error);
  } catch (e) {
    console.error('Failed to delete asset from Supabase:', e);
  }
};

/**
 * Upsert repair request to Supabase (with full workflow approval fields & notes metadata fallback)
 */
export const syncRepairRequestToSupabase = async (repair: RepairRequest) => {
  try {
    const workflowMeta: Record<string, any> = {
      sentDate: repair.sentDate,
      acceptedDate: repair.acceptedDate,
      completedDate: repair.completedDate,
      beforeImageUrl: repair.beforeImageUrl && repair.beforeImageUrl.length < 150000 ? repair.beforeImageUrl : undefined,
      afterImageUrl: repair.afterImageUrl && repair.afterImageUrl.length < 150000 ? repair.afterImageUrl : undefined,
      departmentHeadApproved: repair.departmentHeadApproved,
      departmentHeadApprovedBy: repair.departmentHeadApprovedBy,
      departmentHeadApprovedAt: repair.departmentHeadApprovedAt,
      headOpinion: repair.headOpinion,
      headPosition: repair.headPosition,
      supplyOfficerApproved: repair.supplyOfficerApproved,
      supplyOfficerApprovedBy: repair.supplyOfficerApprovedBy,
      supplyOfficerApprovedAt: repair.supplyOfficerApprovedAt,
      supplyPosition: repair.supplyPosition,
      directorApproved: repair.directorApproved,
      directorApprovedBy: repair.directorApprovedBy,
      directorApprovedAt: repair.directorApprovedAt,
      approverComments: repair.approverComments,
      technicianApproved: repair.technicianApproved,
      technicianApprovedBy: repair.technicianApprovedBy,
      maintCompletedBy: repair.maintCompletedBy,
      maintCompletedAt: repair.maintCompletedAt,
      itemReceived: repair.itemReceived,
      itemReceivedBy: repair.itemReceivedBy,
      itemReceivedAt: repair.itemReceivedAt,
      memoData: repair.memoData
    };

    const payload: Record<string, any> = {
      id: repair.id,
      repair_no: repair.repairNo,
      asset_id: repair.assetId,
      reporter_id: repair.reporterId,
      department_id: repair.departmentId || null,
      issue_description: repair.issueDescription,
      urgency: repair.urgency || 'ปกติ',
      repair_method: repair.repairMethod || null,
      labor_cost: Number(repair.laborCost || 0),
      parts_cost: Number(repair.partsCost || 0),
      total_cost: Number(repair.totalCost || 0),
      spare_parts: repair.spareParts || [],
      status: repair.status,
      technician_id: repair.technicianId || null,
      before_image_url: repair.beforeImageUrl || null,
      after_image_url: repair.afterImageUrl || null,
      notes: repair.memoData
        ? buildNotesWithMeta(repair.notes, REPAIR_META_PREFIX, workflowMeta)
        : (repair.notes || null),

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

      created_at: repair.createdAt || new Date().toISOString()
    };

    return await upsertWithSchemaFallback('repair_requests', payload, {
      onConflict: 'id',
      onSchemaMismatch: (_stripped, currentPayload) => {
        // Persist workflow approval fields safely in notes if dedicated DB columns don't exist yet
        currentPayload.notes = buildNotesWithMeta(repair.notes, REPAIR_META_PREFIX, workflowMeta);
      }
    });
  } catch (e) {
    console.error('Failed to sync repair request to Supabase:', e);
    return { success: false, error: e };
  }
};

/**
 * Upsert borrow request to Supabase
 */
export const syncBorrowRequestToSupabase = async (borrow: BorrowRequest) => {
  try {
    const payload: Record<string, any> = {
      id: borrow.id,
      request_no: borrow.requestNo,
      borrower_id: borrow.userId,
      department_id: borrow.departmentId || null,
      asset_ids: borrow.assetIds || [],
      borrow_date: toNullableDate(borrow.borrowDate),
      expected_return_date: toNullableDate(borrow.dueDate),
      return_date: toNullableDate(borrow.actualReturnDate),
      status: borrow.status,
      purpose: borrow.purpose || null,
      approver_id: borrow.approverId || null,
      condition_before: borrow.conditionBefore || null,
      condition_after: borrow.conditionAfter || null,
      notes: borrow.notes || null,
      created_at: borrow.createdAt || new Date().toISOString()
    };

    return await upsertWithSchemaFallback('borrow_requests', payload, { onConflict: 'id' });
  } catch (e) {
    console.error('Failed to sync borrow request to Supabase:', e);
    return { success: false, error: e };
  }
};

/**
 * Upsert inventory item to Supabase
 */
export const syncInventoryItemToSupabase = async (item: InventoryItem) => {
  try {
    const payload: Record<string, any> = {
      id: item.id,
      item_code: item.itemCode,
      name: item.name,
      category_id: item.categoryId || null,
      stock_qty: Number(item.stockQty || 0),
      min_qty: Number(item.minQty ?? 5),
      unit: item.unit || 'ชิ้น',
      unit_price: Number(item.unitPrice || 0),
      location: item.location || null,
      supplier: item.supplier || null,
      last_received_date: toNullableDate(item.lastReceivedDate),
      expiry_date: toNullableDate(item.expiryDate),
      notes: item.notes || null
    };

    return await upsertWithSchemaFallback('inventory_items', payload, { onConflict: 'id' });
  } catch (e) {
    console.error('Failed to sync inventory item to Supabase:', e);
    return { success: false, error: e };
  }
};

export const deleteInventoryItemFromSupabase = async (id: string) => {
  try {
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (error) console.error('Failed to delete inventory item from Supabase:', error);
  } catch (e) {
    console.error('Failed to delete inventory item from Supabase:', e);
  }
};

/**
 * Upsert inventory transaction to Supabase
 */
export const syncInventoryTransactionToSupabase = async (trx: InventoryTransaction) => {
  try {
    const payload: Record<string, any> = {
      id: trx.id,
      item_id: trx.itemId,
      transaction_type: trx.transactionType,
      quantity: Number(trx.quantity || 0),
      remaining_qty: Number(trx.remainingQty || 0),
      user_id: trx.userId || null,
      department_id: trx.departmentId || null,
      notes: trx.notes || null,
      created_at: trx.createdAt || new Date().toISOString()
    };

    return await upsertWithSchemaFallback('inventory_transactions', payload, { onConflict: 'id' });
  } catch (e) {
    console.error('Failed to sync inventory transaction to Supabase:', e);
    return { success: false, error: e };
  }
};

/**
 * Upsert budget plan to Supabase
 */
export const syncBudgetPlanToSupabase = async (plan: BudgetPlan) => {
  try {
    const payload: Record<string, any> = {
      id: plan.id,
      fiscal_year: parseInt(String(plan.fiscalYear || '2568'), 10) || 2568,
      item_name: plan.itemName,
      category_id: plan.category || null,
      quantity: Number(plan.estimatedQty || 1),
      unit_price: Number(plan.estimatedUnitPrice || 0),
      total_budget: Number(plan.totalBudget || 0),
      department_id: plan.departmentId || null,
      urgency_level: plan.priority || 'ปานกลาง',
      justification: plan.justification || null,
      status: plan.status || 'ร่างแผน',
      created_at: plan.createdAt || new Date().toISOString()
    };

    return await upsertWithSchemaFallback('budget_plans', payload, { onConflict: 'id' });
  } catch (e) {
    console.error('Failed to sync budget plan to Supabase:', e);
    return { success: false, error: e };
  }
};

/**
 * Upsert asset category to Supabase
 */
export const syncAssetCategoryToSupabase = async (cat: AssetCategory) => {
  try {
    const payload: Record<string, any> = {
      id: cat.id,
      code: cat.code,
      name: cat.name,
      default_useful_life: Number(cat.defaultUsefulLife || 5),
      salvage_value_percent: Number(cat.salvageValuePercent ?? 10),
      prefix: cat.prefix || 'AST'
    };
    return await upsertWithSchemaFallback('asset_categories', payload, { onConflict: 'id' });
  } catch (e) {
    console.error('Failed to sync asset category to Supabase:', e);
    return { success: false, error: e };
  }
};

export const deleteAssetCategoryFromSupabase = async (id: string) => {
  try {
    const { error } = await supabase.from('asset_categories').delete().eq('id', id);
    if (error) console.error('Failed to delete asset category from Supabase:', error);
  } catch (e) {
    console.error('Failed to delete asset category from Supabase:', e);
  }
};

/**
 * Upsert department to Supabase
 */
export const syncDepartmentToSupabase = async (dept: Department) => {
  try {
    const payload: Record<string, any> = {
      id: dept.id,
      code: dept.code,
      name: dept.name,
      building: dept.building || null,
      floor: dept.floor || null,
      head_name: dept.headName || null,
      phone: dept.phone || null
    };
    return await upsertWithSchemaFallback('departments', payload, { onConflict: 'id' });
  } catch (e) {
    console.error('Failed to sync department to Supabase:', e);
    return { success: false, error: e };
  }
};

export const deleteDepartmentFromSupabase = async (id: string) => {
  try {
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) console.error('Failed to delete department from Supabase:', error);
  } catch (e) {
    console.error('Failed to delete department from Supabase:', e);
  }
};

/**
 * Upsert user profile to Supabase
 */
export const syncUserToSupabase = async (user: UserProfile) => {
  try {
    const payload: Record<string, any> = {
      id: user.id,
      username: user.username || user.email?.split('@')[0],
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.departmentId || null,
      position: user.position || null,
      phone: user.phone || null,
      avatar_url: user.avatarUrl || null,
      status: user.status || 'Active'
    };
    return await upsertWithSchemaFallback('users', payload, { onConflict: 'id' });
  } catch (e) {
    console.error('Failed to sync user to Supabase:', e);
    return { success: false, error: e };
  }
};

export const deleteUserFromSupabase = async (id: string) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) console.error('Failed to delete user from Supabase:', error);
  } catch (e) {
    console.error('Failed to delete user from Supabase:', e);
  }
};

/**
 * Upsert system settings to Supabase
 */
export const syncSettingsToSupabase = async (
  settings: SystemSettings
): Promise<{ success: boolean; data?: any; error?: any }> => {
  try {
    const payload = {
      id: 1,
      organization_name: settings.organizationName || 'โรงพยาบาลสังขละบุรี (SANGKHLABURI HOSPITAL)',
      logo_url: settings.logoUrl || './assets/aistudio/Logo_SK_26693d5e.png',
      emblem_url: settings.emblemUrl || './assets/aistudio/________3cm_fbf2f514.png',
      fiscal_year: parseInt(String(settings.fiscalYear || '2568'), 10) || 2568,
      line_oa_enabled: typeof settings.lineOaEnabled === 'boolean' ? settings.lineOaEnabled : true,
      line_oa_basic_id: settings.lineOaBasicId || '@765satuz',
      line_oa_channel_access_token: settings.lineOaChannelAccessToken || '',
      line_oa_channel_secret: settings.lineOaChannelSecret || '',
      line_oa_webhook_url: settings.lineOaWebhookUrl || '',
      line_notify_token: settings.lineNotifyToken || null,
      updated_at: new Date().toISOString()
    };

    return await upsertWithSchemaFallback('system_settings', payload, {
      onConflict: 'id',
      select: true
    });
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
    const { error } = await supabase.from('audit_logs').insert({
      id: log.id,
      user_id: log.userId,
      user_name: log.userName,
      action: log.action,
      module: log.module,
      record_id: log.recordId,
      description: log.description,
      created_at: log.createdAt
    });
    if (error) console.error('Failed to sync audit log to Supabase:', error);
  } catch (e) {
    console.error('Failed to sync audit log to Supabase:', e);
  }
};

/**
 * Push all local dataset up to Supabase in batch (Seeding / Syncing live tables)
 */
export const seedAllDataToSupabase = async (dataset: {
  assets: Asset[];
  repairRequests: RepairRequest[];
  borrowRequests: BorrowRequest[];
  inventoryItems: InventoryItem[];
  inventoryTransactions?: InventoryTransaction[];
  budgetPlans?: BudgetPlan[];
  assetCategories?: AssetCategory[];
  departments: Department[];
  users: UserProfile[];
  settings: SystemSettings;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const failures: string[] = [];
    const track = (label: string, res: { success: boolean; error?: any } | undefined) => {
      if (res && !res.success) {
        failures.push(`${label}: ${res.error?.message || res.error}`);
      }
    };

    if (dataset.assetCategories) {
      for (const c of dataset.assetCategories) {
        track(`category(${c.code})`, await syncAssetCategoryToSupabase(c));
      }
    }
    for (const d of dataset.departments) {
      track(`department(${d.code})`, await syncDepartmentToSupabase(d));
    }
    for (const u of dataset.users) {
      track(`user(${u.email})`, await syncUserToSupabase(u));
    }
    for (const a of dataset.assets) {
      track(`asset(${a.assetCode})`, await syncAssetToSupabase(a));
    }
    for (const r of dataset.repairRequests) {
      track(`repair(${r.repairNo})`, await syncRepairRequestToSupabase(r));
    }
    for (const b of dataset.borrowRequests) {
      track(`borrow(${b.requestNo})`, await syncBorrowRequestToSupabase(b));
    }
    for (const i of dataset.inventoryItems) {
      track(`inventory(${i.itemCode})`, await syncInventoryItemToSupabase(i));
    }
    if (dataset.inventoryTransactions) {
      for (const t of dataset.inventoryTransactions) {
        track(`trx(${t.id})`, await syncInventoryTransactionToSupabase(t));
      }
    }
    if (dataset.budgetPlans) {
      for (const p of dataset.budgetPlans) {
        track(`budget(${p.itemName})`, await syncBudgetPlanToSupabase(p));
      }
    }
    track('system_settings', await syncSettingsToSupabase(dataset.settings));

    if (failures.length > 0) {
      return {
        success: false,
        message: `ซิงค์ข้อมูลบางรายการไม่สำเร็จ (${failures.length} รายการ): ${failures[0]}`
      };
    }
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
      const { error } = await supabase.from(table).delete().neq('id', '__non_existent__');
      if (error) {
        console.warn(`Clear table warning [${table}]:`, error.message);
      }
    }
    return { success: true, message: 'ล้างข้อมูลปฏิบัติการทั้งหมดใน Supabase เรียบร้อยแล้ว' };
  } catch (err: any) {
    return { success: false, message: `ไม่สามารถล้างข้อมูลใน Supabase ได้: ${err?.message || err}` };
  }
};
