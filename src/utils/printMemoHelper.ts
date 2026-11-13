export interface MemoFormData {
  emblemUrl?: string;
  agency?: string;
  docNumber: string;
  docDate: string;
  deptName: string;
  category: string;
  machineName: string;
  machineModel: string;
  issueDescription: string;
  assetNumber: string;
  vendorCompany: string;
  vendorPhone: string;
  quantity: string;
  senderSign: string;
  senderName: string;
  senderPosition: string;
  headOpinion: string;
  headSign: string;
  headName: string;
  headPosition: string;
  isHeadApproved?: boolean;
  canSelfRepairFree: boolean;
  canSelfRepairWithCost: boolean;
  sendToGovTech: boolean;
  repairDays: string;
  repairCost: string;
  sendToOutsideCompany: boolean;
  outsideCompanyName: string;
  otherOption: boolean;
  otherOptionDetails: string;
  maintenanceSign: string;
  maintenanceName: string;
  procureSign: string;
  procureName?: string;
  procurePosition?: string;
  deliverySign: string;
  deliveryName: string;
  deliveryDay: string;
  deliveryMonth: string;
  deliveryYear: string;
  approverComment1: string;
  approverComment2: string;
  approverSign: string;
  approverName: string;
  receiveSign: string;
  receiveName: string;
  receivePosition: string;
}

export function generateOfficialMemoHtml(data: MemoFormData): string {
  const isCat = (catName: string) => (data.category === catName ? 'checked' : '');

  return `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <div class="row text-center indent" style="margin-top: 15px;">
    <title>บันทึกข้อความ</title>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
    <style>
       .top-left-image {
            position: absolute;
            top: 12px;
            left: 70px;
            width: 1.5cm;
            height: 1.5cm;
            object-fit: contain;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            background-color: #525659;
            display: flex;
            justify-content: center;
            padding: 10px;
            font-family: 'Sarabun', sans-serif;
            font-size: 13px; /* ขนาดพอดีสำหรับการจัดหน้าแบบฟอร์มราชการใน 1 หน้า */
            color: #000;
        }
        .a4-page {
            width: 210mm;
            height: 297mm; 
            padding: 10mm 18mm; /* ขอบกระดาษ */
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            position: relative;
            line-height: 1.35; 
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-size: 13px;
        }
        .header-title {
            font-size: 15pt;
            font-weight: bold;
            margin-bottom: 5px;
            margin-top: 5px;
        }
        .row {
            display: flex;
            align-items: baseline;
            margin-bottom: 4px;
            width: 100%;
        }
        .bold { font-weight: bold; }
        .text-center { text-align: center; }
        .indent { padding-left: 2.5cm; }
        
        input[type="text"] {
            border: none;
            border-bottom: 1px dotted #000000;
            background: transparent;
            font-family: 'Sarabun', sans-serif;
            font-size: 13px;
            line-height: 1.2;
            height: 1.25em;
            vertical-align: baseline;
            outline: none;
            padding: 0 4px 1px 4px;
            margin: 0;
            color: #000080;
            box-sizing: border-box;
        }
        .flex-input { flex-grow: 1; margin: 0 5px; }
        
        .checkbox-label {
            display: inline-flex;
            align-items: center;
            cursor: pointer;
            margin-right: 5px;
        }
        .checkbox-label input { margin-right: 3px; }
        
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 5px;
        }
        
        .signature-box {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        hr { border: 0.5px solid #000; margin: 5px 0; }
        
        .print-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 20px;
            font-size: 12pt;
            font-family: 'Sarabun', sans-serif;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            z-index: 1000;
        }
        
        @media print {
            body { background: none; padding: 0; display: block; }
            .a4-page { 
                box-shadow: none; 
                width: 210mm; 
                height: 297mm; 
                padding: 10mm 15mm; 
                margin: 0; 
                line-height: 1.35;
                font-size: 13px;
            }
            .print-btn { display: none; }
            input[type="text"] { 
                color: #000 !important; 
                border-bottom: 1px dotted #000000 !important; 
                line-height: 1.2 !important;
                font-size: 13px !important;
                height: 1.25em !important;
                vertical-align: baseline !important;
                padding: 0 4px 1px 4px !important;
                margin: 0 !important;
            }
            @page { size: A4; margin: 0; }
        }
    </style>
</head>
<body>

    <div class="a4-page">
        <!-- ส่วนหัว ตราครุฑ 3 ซม. -->
        <img src="${(() => {
          const raw = data.emblemUrl || './assets/aistudio/________3cm_fbf2f514.png';
          if (raw.startsWith('data:') || raw.startsWith('http://') || raw.startsWith('https://')) return raw;
          if (typeof window !== 'undefined') {
            try { return new URL(raw, window.location.href).href; } catch { return raw; }
          }
          return raw;
        })()}" alt="ตราครุฑ" style="position: absolute; top: 13px; left: 70px; width: 1.38cm; height: 1.5cm; object-fit: contain;" onerror="this.src='${typeof window !== 'undefined' ? `${window.location.origin}/assets/garuda_3cm.png` : '/assets/garuda_3cm.png'}'">
        <div>
            <div class="header-title" style="padding-left: 272px;">บันทึกข้อความ</div>
            
            <div class="row" style="margin-top: 9px; margin-bottom: 5px;">
                <span class="bold">ส่วนราชการ</span>&nbsp;${data.agency || 'โรงพยาบาลสังขละบุรี ฝ่ายบริหารทั่วไป โทร. ๐๓๔-๕๙๕๐๓๐ ต่อ ๒๐๕'}
            </div>
            
            <div class="row">
                <div style="display: flex; flex: 6; align-items: baseline;">
                    <span class="bold">ที่</span>&nbsp;กจ ๐๐๓.๓๐๘.๑/<input type="text" class="flex-input" style="max-width: 50px;" value="${data.docNumber || ''}">
                </div>
                <div style="display: flex; flex: 6; align-items: baseline;">
                    <span class="bold">วันที่</span><input type="text" class="flex-input" value="${data.docDate || ''}">
                </div>
            </div>

            <div class="row">
                <span class="bold">เรื่อง</span>&nbsp;ขออนุมัติซ่อมบำรุงพัสดุ-ครุภัณฑ์
            </div>
            
            <div class="row" style="margin-bottom: 5px;">
                <span class="bold">เรียน</span>&nbsp;ผู้อำนวยการโรงพยาบาลสังขละบุรี
            </div>
        </div>

        <!-- เนื้อหา -->
        <div>
            <div style="padding-left: 20px; margin-top: 5px;">
                ด้วยฝ่าย/งาน <input type="text" style="width: 220px;" value="${data.deptName || ''}"> มีความประสงค์จะทำการซ่อมบำรุงพัสดุ ครุภัณฑ์
            </div>
            
            <div class="row" style="flex-wrap: wrap;">
                <label class="checkbox-label"><input type="radio" name="cat" ${isCat('การแพทย์')}> การแพทย์</label> /
                <label class="checkbox-label"><input type="radio" name="cat" ${isCat('สำนักงาน')}> สำนักงาน</label> /
                <label class="checkbox-label"><input type="radio" name="cat" ${isCat('ยานพาหนะ')}> ยานพาหนะ</label> /
                <label class="checkbox-label"><input type="radio" name="cat" ${isCat('อาคาร')}> อาคาร</label> /
                <label class="checkbox-label"><input type="radio" name="cat" ${isCat('สิ่งก่อสร้าง')}> สิ่งก่อสร้าง</label> /
                <label class="checkbox-label"><input type="radio" name="cat" ${isCat('งานบ้านงานครัว')}> งานบ้านงานครัว</label> /
                <label class="checkbox-label"><input type="radio" name="cat" ${isCat('อุปกรณ์และอื่นๆ')}> อุปกรณ์และอื่นๆ</label>
                ตามตารางดังต่อไปนี้
            </div>

            <!-- รายการซ่อม -->
            <div style="padding-left: 20px; margin-top: 5px;">
                <div class="row">
                    1.เครื่อง<input type="text" style="width: 300px;" value="${data.machineName || ''}"> รุ่น<input type="text" class="flex-input" value="${data.machineModel || ''}">
                </div>
                <div class="row">
                    ลักษณะ/อาการชำรุด<input type="text" style="width: 220px;" value="${data.issueDescription || ''}"> หมายเลขครุภัณฑ์<input type="text" class="flex-input" value="${data.assetNumber || ''}">
                </div>
                <div class="row">
                    บริษัท<input type="text" style="width: 200px;" value="${data.vendorCompany || ''}"> เบอร์โทรศัพท์<input type="text" style="width: 100px;" value="${data.vendorPhone || ''}"> จำนวน<input type="text" class="flex-input" value="${data.quantity || '1 เครื่อง'}">
                </div>
            </div>
                 
            <div class="row" style="margin-top: 20px;">
                จึงเรียนมาเพื่อโปรดพิจารณา
            </div>
        </div>

        <!-- ลายเซ็นส่วนที่ 1 -->
        <div class="grid-2" style="margin-top: 10px;">
            <div class="signature-box">
                <div class="row" style="justify-content: center;">ลงชื่อ<input type="text" style="width: 160px; text-align: center;" value="${data.senderSign || ''}">ผู้ส่งซ่อม</div>
                <div class="row" style="justify-content: left;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(<input type="text" style="width: 170px; text-align: center;" value="${data.senderName || ''}">)</div>
                <div class="row" style="justify-content: center;">ตำแหน่ง<input type="text" style="width: 260px; text-align: center;" value="${data.senderPosition || ''}"></div>
            </div>
            <div class="signature-box">
                <div>ความเห็นของหัวหน้าฝ่าย/หัวหน้ากลุ่มงาน</div>
                ${data.isHeadApproved !== false ? `
                <div class="row" style="justify-content: center;"><input type="text" style="width: 300px; text-align: center;" value="${data.headOpinion || ''}"></div>
                <div class="row" style="justify-content: center;">ลงชื่อ<input type="text" style="width: 160px; text-align: center;" value="${data.headSign || ''}"></div>
                <div class="row" style="justify-content: left;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(<input type="text" style="width: 170px; text-align: center;" value="${data.headName || ''}">)</div>
                <div class="row" style="justify-content: center;">ตำแหน่ง<input type="text" style="width: 270px; text-align: center;" value="${data.headPosition || ''}"></div>
                ` : `
                <div class="row" style="justify-content: center; color: #94a3b8;">.........................................................................................</div>
                <div class="row" style="justify-content: center; margin-top: 4px;">ลงชื่อ..................................................</div>
                <div class="row" style="justify-content: center;">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</div>
                <div class="row" style="justify-content: center;">ตำแหน่ง..................................................</div>
                `}
            </div>
        </div>

        <!-- ซ่อมบำรุง -->
        <div>
            <div style="padding-left: 0px; margin-top: 5px;">
                <div class="row">บันทึกหน่วยงานซ่อมบำรุง/ฝ่ายบริหารทั่วไป</div>
                <div class="row">เสนอ ผู้อำนวยการโรงพยาบาลสังขละบุรี</div>
            </div>
            <div class="row">
                <label class="checkbox-label"><input type="checkbox" ${data.canSelfRepairFree ? 'checked' : ''}>&nbsp;ซ่อมได้เองโดยช่างของโรงพยาบาล ไม่เสียค่าใช้จ่าย</label>
            </div>
            <div class="row">
                <label class="checkbox-label"><input type="checkbox" ${data.canSelfRepairWithCost ? 'checked' : ''}>&nbsp;ซ่อมได้เองโดยช่างของโรงพยาบาลโดยเสียค่าวัสดุเพิ่มเติม</label>
            </div>
            <div class="row">
                <label class="checkbox-label"><input type="checkbox" ${data.sendToGovTech ? 'checked' : ''}>&nbsp;ส่งซ่อมกองช่างบำรุง</label>
            </div>
            <div class="row">
                <label class="checkbox-label"><input type="checkbox" ${data.canSelfRepairWithCost || data.canSelfRepairFree ? 'checked' : ''}>&nbsp;ระยะเวลาการซ่อมประมาณ<input type="text" style="width: 40px; text-align: center;" value="${data.repairDays || ''}">วัน&nbsp;&nbsp;ค่าใช้จ่ายประมาณ<input type="text" style="width: 70px; text-align: center;" value="${data.repairCost || ''}">บาท</label>
            </div>
            <div style="padding-left: 0px; margin-top: 5px;">
                <div class="row">ไม่สามารถซ่อมเองได้ จำเป็นต้องส่งซ่อมภายนอกหน่วยงาน</div>
            </div>
            <div class="row">
                <label class="checkbox-label"><input type="checkbox" ${data.sendToOutsideCompany ? 'checked' : ''}>&nbsp;ส่งซ่อมบริษัท<input type="text" style="width: 180px; text-align: center;" value="${data.outsideCompanyName || ''}"></label>
            </div>
            <div class="row">
                <label class="checkbox-label"><input type="checkbox" ${data.otherOption ? 'checked' : ''}>&nbsp;อื่นๆ<input type="text" style="width: 230px; text-align: center;" value="${data.otherOptionDetails || ''}"></label>
            </div>
        </div>
                  
        <!-- ลายเซ็นส่วนที่ 2 -->
        <div class="grid-2" style="margin-top: 10px;">
            <div class="signature-box" style="align-items: flex-start;">
              <div class="row" style="justify-content: center;">ลงชื่อ<input type="text" style="width: 160px; text-align: center;" value="${data.maintenanceSign || ''}">หน่วยงานซ่อมบำรุง</div>
                <div class="row" style="justify-content: left; margin-bottom: 5px;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(<input type="text" style="width: 170px; text-align: center;" value="${data.maintenanceName || ''}">)</div>
            </div>
        </div>

        <!-- รับของ/ส่งของ -->
        <div class="grid-2" style="margin-top: 20px;">
            <div>
                <span class="bold">จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</span><br>
                <br>
                <div class="row" style="margin-top: 5px;">(ลงชื่อ)<input type="text" style="width: 150px; text-align: center;" value="${data.procureSign || 'ชุติญา จรัสกุลธาดา'}"></div>
                <div class="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(นางสาวชุติญา จรัสกุลธาดา)</div>
                <div class="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ตำแหน่ง&nbsp;หัวหน้าเจ้าหน้าที่</div>
            </div>
            <div>
                <span class="bold">บันทึกหน่วยงานรับซ่อมบำรุง/บันทึกผู้ส่งของ</span><br>
                ได้รับการซ่อมบำรุงตามรายการข้างต้นเรียบร้อยแล้ว<br>
                <br>
                <div class="row" style="margin-top: 5px;">&nbsp;&nbsp;&nbsp;&nbsp;(ลงชื่อ)<input type="text" style="width: 150px; text-align: center;" value="${data.deliverySign || ''}"></div>
                <div class="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(<input type="text" style="width: 170px; text-align: center;" value="${data.deliveryName || ''}">)</div>
                <div class="row">วันที่<input type="text" style="width: 50px; text-align: center;" value="${data.deliveryDay || ''}">เดือน<input type="text" style="width: 100px; text-align: center;" value="${data.deliveryMonth || ''}">พ.ศ.<input type="text" style="width: 70px; text-align: center;" value="${data.deliveryYear || ''}"></div>
            </div>
        </div>
        
        <div class="grid-2" style="margin-top: 20px;">
            <div>
                <span class="bold">ความคิดเห็นของผู้มีอำนาจอนุมัติ</span><br>
                <input type="text" style="width: 200px; text-align: center;" value="${data.approverComment1 || 'อนุมัติให้ดำเนินการซ่อมบำรุงได้'}"><br>
                <input type="text" style="width: 200px; text-align: center;" value="${data.approverComment2 || ''}"><br>
                <div class="row" style="margin-top: 5px;">(ลงชื่อ)<input type="text" style="width: 150px; text-align: center;" value="${data.approverSign || 'จิรวัฒน์ วงษ์สวัสดิ์'}"></div>
                <div class="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(นายจิรวัฒน์ วงษ์สวัสดิ์)</div>
                <div class="row">นายแพทย์ชำนาญการ (ด้านเวชกรรม)</div>
                <div class="row">ตำแหน่ง&nbsp;ผู้อำนวยการโรงพยาบาลสังขละบุรี</div>
            </div>
            <div>
                <span class="bold">บันทึกหน่วยงานรับซ่อมบำรุง/บันทึกผู้รับของ</span><br>
                ได้รับการซ่อมบำรุงตามรายการข้างต้นเรียบร้อยแล้ว<br>
                <div class="row" style="margin-top: 5px;">&nbsp;&nbsp;&nbsp;&nbsp;(ลงชื่อ)<input type="text" style="width: 150px; text-align: center;" value="${data.receiveSign || ''}"></div>
                <div class="row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(<input type="text" style="width: 170px; text-align: center;" value="${data.receiveName || ''}">)</div>
                <div class="row">ตำแหน่ง<input type="text" style="width: 270px; text-align: center;" value="${data.receivePosition || 'เจ้าหน้าที่ผู้รับของ'}"></div>
            </div>
        </div>
    </div>
    <button class="print-btn" onclick="window.print()">พิมพ์เอกสารนี้</button>
    <script>
      window.addEventListener('load', function() {
        setTimeout(function() {
          try {
            window.focus();
            window.print();
          } catch(e) {
            console.error(e);
          }
        }, 350);
      });
    </script>
</body>
</html>`;
}

/**
 * Triggers printing of the official memo using an isolated iframe
 * so that Tailwind styles, dashboard menus, or modal overlays don't interfere.
 */
export function printOfficialMemoDocument(data: MemoFormData) {
  const htmlContent = generateOfficialMemoHtml(data);
  let frame = document.getElementById('official-memo-print-frame') as HTMLIFrameElement;
  if (!frame) {
    frame = document.createElement('iframe');
    frame.id = 'official-memo-print-frame';
    frame.style.position = 'fixed';
    frame.style.top = '0';
    frame.style.left = '0';
    frame.style.width = '210mm';
    frame.style.height = '297mm';
    frame.style.opacity = '0.001';
    frame.style.pointerEvents = 'none';
    frame.style.zIndex = '-9999';
    frame.style.border = '0';
    document.body.appendChild(frame);
  }

  const doc = frame.contentWindow?.document || frame.contentDocument;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print intercepted, opening in new tab instead:', err);
        openOfficialMemoInNewWindow(data);
      }
    }, 450);
  } else {
    openOfficialMemoInNewWindow(data);
  }
}

/**
 * Opens the standalone official memorandum in a new browser tab/window
 * so the user can preview, edit, or print with native browser tools without any iframe constraints.
 */
export function openOfficialMemoInNewWindow(data: MemoFormData) {
  const htmlContent = generateOfficialMemoHtml(data);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    // If popups are blocked by browser, trigger in current window or create download
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener,noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
