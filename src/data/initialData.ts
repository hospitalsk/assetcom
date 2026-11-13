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
  SystemSettings,
  NotificationItem,
  AuditLog
} from '../types';

export const initialRoles: string[] = [
  'Super Admin',
  'Admin',
  'Supply Officer',
  'IT Officer',
  'Department Head',
  'Approver',
  'General User',
  'Auditor'
];

export const initialDepartments: Department[] = [
  { id: 'dept-1', code: 'IT', name: 'ศูนย์เทคโนโลยีสารสนเทศ', building: 'อาคารอำนวยการ ชั้น 3', floor: '3', headName: 'ดร. สมชาย ใจดี', phone: '02-123-4561' },
  { id: 'dept-2', code: 'ACC', name: 'กลุ่มงานการเงินและบัญชี', building: 'อาคารอำนวยการ ชั้น 2', floor: '2', headName: 'นางสาวน에รัตน์ รักดี', phone: '02-123-4562' },
  { id: 'dept-3', code: 'MED', name: 'กลุ่มงานเวชระเบียนและสถิติ', building: 'อาคารผู้ป่วยนอก ชั้น 1', floor: '1', headName: 'นายวิชัย มั่นคง', phone: '02-123-4563' },
  { id: 'dept-4', code: 'HR', name: 'กลุ่มงานทรัพยากรบุคคล', building: 'อาคารอำนวยการ ชั้น 1', floor: '1', headName: 'นางศิริพร สุขสวัสดิ์', phone: '02-123-4564' },
  { id: 'dept-5', code: 'ER', name: 'กลุ่มงานอุบัติเหตุและฉุกเฉิน', building: 'อาคารอุบัติเหตุ ชั้น 1', floor: '1', headName: 'นพ. ปิยะ ชาญวิทย์', phone: '02-123-4565' },
];

export const initialAssetCategories: AssetCategory[] = [
  { id: 'cat-1', code: 'AST-PC', name: 'เครื่องคอมพิวเตอร์แม่ข่าย (Server)', defaultUsefulLife: 5, salvageValuePercent: 10, prefix: 'SRV' },
  { id: 'cat-2', code: 'AST-DESK', name: 'คอมพิวเตอร์ประมวลผล (Desktop PC)', defaultUsefulLife: 5, salvageValuePercent: 10, prefix: 'COM' },
  { id: 'cat-3', code: 'AST-NOTE', name: 'คอมพิวเตอร์พกพา (Notebook)', defaultUsefulLife: 5, salvageValuePercent: 10, prefix: 'NTB' },
  { id: 'cat-4', code: 'AST-PRN', name: 'เครื่องพิมพ์และอุปกรณ์สแกน (Printer/Scanner)', defaultUsefulLife: 5, salvageValuePercent: 10, prefix: 'PRN' },
  { id: 'cat-5', code: 'AST-NET', name: 'อุปกรณ์เครือข่าย (Network Switch/Router)', defaultUsefulLife: 8, salvageValuePercent: 5, prefix: 'NET' },
  { id: 'cat-6', code: 'AST-UPS', name: 'เครื่องสำรองไฟฟ้า (UPS)', defaultUsefulLife: 5, salvageValuePercent: 10, prefix: 'UPS' },
];

export const initialBudgetSources: string[] = [
  'งบแผ่นดิน',
  'งบรายได้',
  'งบเงินอุดหนุน',
  'บริจาค',
  'งบกองทุนหลักประกันสุขภาพ',
  'งบเงินบำรุงโรงพยาบาล'
];

export const initialAcquisitionMethods: string[] = [
  'จัดซื้อปกติ',
  'วิธีประกวดราคา',
  'วิธีเฉพาะเจาะจง',
  'วิธีคัดเลือก',
  'รับบริจาค',
  'โอนย้าย'
];

export const initialAssetStatuses: string[] = [
  'พร้อมใช้งาน',
  'กำลังใช้งาน',
  'ว่าง',
  'ยืมใช้งาน',
  'กำลังซ่อม',
  'ชำรุด',
  'จำหน่าย',
  'สูญหาย'
];

export const initialAssetLocations: string[] = [
  'ห้องเซิร์ฟเวอร์ ชั้น 3 ศูนย์ไอที',
  'อาคารอำนวยการ ชั้น 1',
  'อาคารอำนวยการ ชั้น 2',
  'อาคารอำนวยการ ชั้น 3 ห้อง 301',
  'อาคารผู้ป่วยนอก เคาน์เตอร์เวชระเบียน',
  'อาคารอุบัติเหตุและฉุกเฉิน (ER)',
  'กลุ่มงานการเงินและบัญชี',
  'กลุ่มงานพัสดุและบำรุงรักษา',
  'ห้องประชุมใหญ่ ชั้น 4'
];

export const initialUsers: UserProfile[] = [
  { id: 'usr-7', username: 'user', name: 'พัชราภรณ์ สุขใจ (ผู้ใช้งานทั่วไป)', email: 'user@hospital.go.th', role: 'General User', departmentId: 'dept-1', position: 'เจ้าหน้าที่ธุรการ / พนักงานทั่วไป', phone: '087-777-7777', status: 'Active', password: '123456' },
  { id: 'usr-1', username: 'admin', name: 'สมชาย ผู้ดูแลระบบ', email: 'admin@hospital.go.th', role: 'Super Admin', departmentId: 'dept-1', position: 'นักวิชาการคอมพิวเตอร์ชำนาญการพิเศษ', phone: '081-111-1111', status: 'Active', password: '123456' },
  { id: 'usr-2', username: 'supply', name: 'วิชัย พัสดุดี', email: 'supply@hospital.go.th', role: 'Supply Officer', departmentId: 'dept-1', position: 'เจ้าพนักงานพัสดุชำนาญงาน', phone: '082-222-2222', status: 'Active', password: '123456' },
  { id: 'usr-3', username: 'it', name: 'ธนากร ไอทีซัพพอร์ต', email: 'it@hospital.go.th', role: 'IT Officer', departmentId: 'dept-1', position: 'นักวิชาการคอมพิวเตอร์ปฏิบัติการ', phone: '083-333-3333', status: 'Active', password: '123456' },
  { id: 'usr-4', username: 'doctor', name: 'พญ. วarda การแพทย์', email: 'doctor@hospital.go.th', role: 'Department Head', departmentId: 'dept-5', position: 'นายแพทย์ชำนาญการ', phone: '084-444-4444', status: 'Active', password: '123456' },
  { id: 'usr-5', username: 'director', name: 'กนกวรรณ อนุมัติงบ', email: 'director@hospital.go.th', role: 'Approver', departmentId: 'dept-2', position: 'ผู้อำนวยการกองคลัง', phone: '085-555-5555', status: 'Active', password: '123456' },
  { id: 'usr-6', username: 'auditor', name: 'สุรชัย ตรวจสอบภายใน', email: 'auditor@hospital.go.th', role: 'Auditor', departmentId: 'dept-4', position: 'นักตรวจสอบภายใน', phone: '086-666-6666', status: 'Active', password: '123456' },
];

export const initialAssets: Asset[] = [];

export const initialInventoryCategories: InventoryCategory[] = [
  { id: 'inv-cat-1', code: 'INK', name: 'ตลับหมึกพิมพ์ (Toner & Ink)' },
  { id: 'inv-cat-2', code: 'PRT', name: 'อุปกรณ์ต่อพ่วง (Mouse & Keyboard)' },
  { id: 'inv-cat-3', code: 'CAB', name: 'สายสัญญาณและหัวต่อ (Cable & Connectors)' },
  { id: 'inv-cat-4', code: 'ACC', name: 'อุปกรณ์ฮาร์ดแวร์เสริม (SSD, RAM, UPS Battery)' },
];

export const initialInventoryItems: InventoryItem[] = [];

export const initialInventoryTransactions: InventoryTransaction[] = [];

export const initialBorrowRequests: BorrowRequest[] = [];

export const initialRepairRequests: RepairRequest[] = [];

export const initialBudgetPlans: BudgetPlan[] = [];

export const initialNotifications: NotificationItem[] = [];

export const initialAuditLogs: AuditLog[] = [];

export const defaultSystemSettings: SystemSettings = {
  appName: 'Smart Asset & IT Inventory',
  organizationName: 'โรงพยาบาลสังขละบุรี (SANGKHLABURI HOSPITAL)',
  orgAddress: 'หมู่ 3 ตำบลหนองลู อำเภอสังขละบุรี จังหวัดกาญจนบุรี 71240',
  orgPhone: '034-595033',
  taxId: '0-99-40001-65-8',
  fiscalYear: '2568',
  lowStockThreshold: 5,
  logoUrl: './assets/aistudio/Logo_SK_26693d5e.png',
  emblemUrl: './assets/aistudio/________3cm_fbf2f514.png',
  signerName: 'นายสมชาย ใจดี',
  signerPosition: 'นักวิชาการคอมพิวเตอร์ชำนาญการพิเศษ',
  approverName: 'นพ. กฤษดา วุฒิการณ์',
  approverPosition: 'ผู้อำนวยการโรงพยาบาลสังขละบุรี',
  lineOaChannelAccessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJjaGFubmVsSWQiOiIyMDA2NTQzMjEwIn0.SK_HOSPITAL_LINE_OA_TOKEN',
  lineOaChannelSecret: '8a91c0e392b4f5718a2910c4d29381ea',
  lineOaBasicId: '@765satuz',
  lineOaWebhookUrl: 'https://ais-dev-ngnwk27rcrrjxtrwkcr3lu-843482220752.asia-east1.run.app/api/line/webhook',
  lineOaEnabled: true,
};
