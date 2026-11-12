export type UserRole = 
  | 'Super Admin' 
  | 'Admin' 
  | 'Supply Officer' 
  | 'IT Officer' 
  | 'Department Head' 
  | 'Approver' 
  | 'General User' 
  | 'Auditor'
  | (string & {});

export interface UserProfile {
  id: string;
  username?: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  departmentId: string;
  position: string;
  phone: string;
  avatarUrl?: string;
  status: 'Active' | 'Inactive';
}

export interface Department {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: string;
  headName: string;
  phone: string;
}

export interface AssetCategory {
  id: string;
  code: string;
  name: string;
  defaultUsefulLife: number; // years
  salvageValuePercent: number; // percentage of purchase price
  prefix: string;
}

export type AssetStatus = 
  | 'พร้อมใช้งาน' 
  | 'กำลังใช้งาน' 
  | 'ว่าง' 
  | 'ยืมใช้งาน' 
  | 'กำลังซ่อม' 
  | 'ชำรุด' 
  | 'จำหน่าย' 
  | 'สูญหาย';

export interface Asset {
  id: string;
  assetCode: string; // e.g., AST-IT-2568-001
  name: string;
  categoryId: string;
  brand: string;
  model: string;
  serialNumber: string;
  receivedDate: string;
  inspectionDate: string;
  purchasePrice: number;
  poNumber: string;
  inspectionNo: string;
  budgetSource: 'งบแผ่นดิน' | 'งบรายได้' | 'งบเงินอุดหนุน' | 'บริจาค';
  usefulLife: number; // years
  acquisitionMethod: 'จัดซื้อปกติ' | 'วิธีประกวดราคา' | 'วิธีเฉพาะเจาะจง' | 'รับบริจาค' | 'โอนย้าย';
  location: string;
  departmentId: string;
  assignedUserId?: string;
  responsiblePerson?: string;
  vendorName?: string;
  vendorPhone?: string;
  warrantyExpiryDate?: string;
  specifications?: string;
  status: AssetStatus;
  imageUrl?: string;
  documentUrl?: string;
  notes?: string;
  salvageValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryCategory {
  id: string;
  code: string;
  name: string;
}

export interface InventoryItem {
  id: string;
  itemCode: string; // e.g., INV-INK-001
  name: string;
  categoryId: string;
  unit: string; // e.g., ตลับ, กล่อง, เส้น, ชิ้น
  unitPrice: number;
  stockQty: number;
  minQty: number; // Reorder point
  location: string;
  supplier: string;
  lastReceivedDate: string;
  expiryDate?: string;
  notes?: string;
}

export type InventoryTransactionType = 'รับเข้าสต็อก' | 'เบิกวัสดุ' | 'คืนวัสดุ' | 'ปรับปรุงยอด';

export interface InventoryTransaction {
  id: string;
  itemId: string;
  transactionType: InventoryTransactionType;
  quantity: number;
  remainingQty: number;
  userId: string;
  departmentId: string;
  referenceNo?: string;
  notes: string;
  createdAt: string;
}

export type BorrowStatus = 'รอตรวจสอบ' | 'รออนุมัติ' | 'อนุมัติ/จ่ายพัสดุ' | 'ยืมใช้งาน' | 'คืนแล้ว' | 'เกินกำหนด' | 'ปฏิเสธ';

export interface BorrowRequest {
  id: string;
  requestNo: string;
  userId: string;
  departmentId: string;
  assetIds: string[];
  borrowDate: string;
  dueDate: string;
  actualReturnDate?: string;
  purpose: string;
  approverId?: string;
  status: BorrowStatus;
  conditionBefore?: string;
  conditionAfter?: string;
  notes?: string;
  createdAt: string;
}

export type RepairStatus = 
  | 'รอรับเรื่อง' 
  | 'รอตรวจสอบ' 
  | 'รอดำเนินการ'
  | 'กำลังดำเนินการ' 
  | 'ส่งซ่อมภายนอก' 
  | 'รออะไหล่' 
  | 'ซ่อมเสร็จ' 
  | 'ดำเนินการเสร็จ'
  | 'ไม่สามารถซ่อมได้' 
  | 'ปิดงาน';

export interface RepairPart {
  id: string;
  partName: string;
  qty: number;
  unitPrice: number;
}

export interface RepairRequest {
  id: string;
  repairNo: string;
  assetId: string;
  reporterId: string;
  departmentId: string;
  issueDescription: string;
  urgency: 'ปกติ' | 'ด่วน' | 'ด่วนมาก / ฉุกเฉิน';
  status: RepairStatus;
  technicianId?: string;
  repairMethod?: string;
  spareParts: RepairPart[];
  laborCost: number;
  partsCost: number;
  totalCost: number;
  sentDate?: string;
  acceptedDate?: string;
  completedDate?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface BudgetPlan {
  id: string;
  fiscalYear: string; // e.g., "2569"
  departmentId: string;
  category: 'ครุภัณฑ์คอมพิวเตอร์' | 'วัสดุสิ้นเปลือง' | 'ซ่อมบำรุง';
  itemName: string;
  estimatedQty: number;
  estimatedUnitPrice: number;
  totalBudget: number;
  priority: 'สูงมาก' | 'สูง' | 'ปานกลาง' | 'ต่ำ';
  justification: string;
  status: 'ร่างแผน' | 'เสนอขออนุมัติ' | 'อนุมัติงบ' | 'จัดซื้อแล้ว' | 'ยกเลิก';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  isRead: boolean;
  linkModule?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'TRANSFER' | 'DISPENSE' | 'REPAIR';
  module: string;
  recordId: string;
  description: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  createdAt: string;
}

export interface SystemSettings {
  appName: string;
  organizationName: string;
  orgAddress: string;
  orgPhone: string;
  taxId: string;
  fiscalYear: string;
  lowStockThreshold: number;
  logoUrl: string;
  emblemUrl: string;
  signerName: string;
  signerPosition: string;
  approverName: string;
  approverPosition: string;
  lineOaChannelAccessToken?: string;
  lineOaChannelSecret?: string;
  lineOaBasicId?: string;
  lineOaWebhookUrl?: string;
  lineOaEnabled?: boolean;
  lineNotifyToken?: string;
  lineProxyUrl?: string;
}

export interface AssetTransferRecord {
  id: string;
  transferNo: string;
  assetId: string;
  fromDepartmentId: string;
  toDepartmentId: string;
  fromUserId?: string;
  toUserId?: string;
  reason: string;
  transferDate: string;
  senderName: string;
  receiverName: string;
  status: 'รอยืนยัน' | 'โอนย้ายสำเร็จ' | 'ยกเลิก';
  createdAt: string;
}

export interface PhysicalInventoryAudit {
  id: string;
  auditNo: string;
  fiscalYear: string;
  departmentId: string;
  auditorId: string;
  totalAssetsCount: number;
  foundCount: number;
  missingCount: number;
  damagedCount: number;
  status: 'กำลังดำเนินการ' | 'เสร็จสิ้น';
  notes: string;
  createdAt: string;
}
