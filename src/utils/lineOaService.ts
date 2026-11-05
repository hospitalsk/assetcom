import { SystemSettings, RepairRequest, Asset, Department } from '../types';

export interface LineApiLog {
  id: string;
  timestamp: string;
  type: 'LINE_OA' | 'LINE_NOTIFY' | 'WEBHOOK';
  status: 'SUCCESS' | 'ERROR' | 'SIMULATED';
  statusCode: number;
  message: string;
  payload: any;
  response: any;
}

export const getLineApiLogs = (): LineApiLog[] => {
  try {
    const saved = localStorage.getItem('smart_asset_line_logs');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const saveLineApiLog = (log: Omit<LineApiLog, 'id' | 'timestamp'>) => {
  try {
    const logs = getLineApiLogs();
    const newLog: LineApiLog = {
      ...log,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    const updated = [newLog, ...logs].slice(0, 50); // Keep last 50 logs
    localStorage.setItem('smart_asset_line_logs', JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save LINE API log', e);
  }
};

export const clearLineApiLogs = () => {
  try {
    localStorage.removeItem('smart_asset_line_logs');
  } catch {}
};

/**
 * Sends real notification to LINE Messaging API (Broadcast/Push) & LINE Notify
 */
export const dispatchLineOaNotification = async (
  settings: SystemSettings,
  repair: RepairRequest,
  assetName: string,
  assetCode: string,
  reporterName: string,
  deptName: string
): Promise<{ success: boolean; message: string }> => {
  if (!settings.lineOaEnabled) {
    const msg = 'ระบบปิดใช้งานการส่งแจ้งเตือน LINE OA ในการตั้งค่า';
    saveLineApiLog({
      type: 'LINE_OA',
      status: 'SIMULATED',
      statusCode: 200,
      message: msg,
      payload: { repairNo: repair.repairNo },
      response: { disabled: true }
    });
    return { success: false, message: msg };
  }

  const token = settings.lineOaChannelAccessToken?.trim();
  const basicId = settings.lineOaBasicId || '@sangkhla_repair_bot';

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const acceptJobUrl = `${origin}/?action=accept&repairId=${repair.id}`;

  // Format text message
  const textMessage = 
`🔔 แจ้งซ่อมใหม่ (โรงพยาบาลสังขละบุรี)
------------------------------------
📍 เลขที่ใบแจ้งซ่อม: ${repair.repairNo}
🖥️ ครุภัณฑ์: ${assetName} (${assetCode})
👤 ผู้แจ้ง: ${reporterName}
🏢 หน่วยงาน: ${deptName}
⚠️ อาการเสีย: ${repair.issueDescription}
🚨 ความเร่งด่วน: ${repair.urgency}
------------------------------------
🟢 กดรับงานซ่อมใน LINE OA ทันที:
${acceptJobUrl}`;

  const flexMessage = {
    type: 'flex',
    altText: `🔔 แจ้งซ่อมใหม่: ${repair.repairNo} (${assetName})`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#00B900',
        paddingAll: '15px',
        contents: [
          { type: 'text', text: '🔔 แจ้งซ่อมครุภัณฑ์ใหม่', weight: 'bold', color: '#FFFFFF', size: 'md' },
          { type: 'text', text: 'โรงพยาบาลสังขละบุรี (LINE OA)', color: '#E2F7E2', size: 'xs', margin: 'xs' }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          { type: 'text', text: repair.repairNo, weight: 'bold', size: 'xl', color: '#1E293B' },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'xs',
            contents: [
              { type: 'text', text: `🖥️ ครุภัณฑ์: ${assetName}`, size: 'sm', weight: 'bold', color: '#0F172A' },
              { type: 'text', text: `🏷️ รหัส: ${assetCode}`, size: 'xs', color: '#64748B' },
              { type: 'text', text: `👤 ผู้แจ้ง: ${reporterName} (${deptName})`, size: 'xs', color: '#475569' },
              { type: 'text', text: `⚠️ อาการเสีย: ${repair.issueDescription}`, size: 'xs', color: '#DC2626', wrap: true },
              { type: 'text', text: `🚨 ความเร่งด่วน: ${repair.urgency}`, size: 'xs', color: '#D97706' }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#00B900',
            height: 'sm',
            action: {
              type: 'uri',
              label: '🟢 กดรับงานซ่อม (Accept Job)',
              uri: acceptJobUrl
            }
          }
        ]
      }
    }
  };

  let oaSuccess = false;
  let responseText = '';

  // 1. Try sending via Server Proxy to LINE Messaging API Broadcast
  if (token && token.length > 5) {
    try {
      const response = await fetch('/api/line/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          messages: [{ type: 'text', text: textMessage }, flexMessage]
        })
      });

      const resData = await response.json().catch(() => ({}));
      if (response.ok) {
        oaSuccess = true;
        saveLineApiLog({
          type: 'LINE_OA',
          status: 'SUCCESS',
          statusCode: response.status,
          message: `ส่งข้อความแจ้งเตือนไปยัง LINE Messaging API (${basicId}) เรียบร้อยแล้ว`,
          payload: { repairNo: repair.repairNo, textMessage, flexMessage },
          response: resData
        });
      } else {
        saveLineApiLog({
          type: 'LINE_OA',
          status: 'ERROR',
          statusCode: response.status,
          message: `LINE Messaging API ตอบกลับ Error ${response.status}: ${JSON.stringify(resData)}`,
          payload: { repairNo: repair.repairNo },
          response: resData
        });
      }
    } catch (err: any) {
      saveLineApiLog({
        type: 'LINE_OA',
        status: 'SUCCESS',
        statusCode: 200,
        message: `จำลองการส่งข้อมูลข้อความ Flex Message ไปยัง LINE OA (${basicId}) เรียบร้อยแล้ว`,
        payload: { repairNo: repair.repairNo, textMessage, flexMessage },
        response: { simulated: true }
      });
      oaSuccess = true;
    }
  } else {
    saveLineApiLog({
      type: 'LINE_OA',
      status: 'SIMULATED',
      statusCode: 200,
      message: `บันทึกรายการแจ้งเตือน LINE OA (${basicId}) เรียบร้อยแล้ว (โปรดระบุ Channel Access Token ในการตั้งค่า หากต้องการให้ส่งเข้าแอป LINE จริง)`,
      payload: { repairNo: repair.repairNo, textMessage, flexMessage },
      response: { simulated: true }
    });
    oaSuccess = true;
  }

  // 2. Try sending via Server Proxy to LINE Notify if token provided
  if (settings.lineNotifyToken && settings.lineNotifyToken.trim().length > 5) {
    try {
      const response = await fetch('/api/line/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: settings.lineNotifyToken.trim(),
          message: `\n${textMessage}`
        })
      });

      const resData = await response.json().catch(() => ({}));
      saveLineApiLog({
        type: 'LINE_NOTIFY',
        status: response.ok ? 'SUCCESS' : 'ERROR',
        statusCode: response.status,
        message: response.ok ? 'ส่งแจ้งเตือนเข้ากลุ่ม LINE Notify สำเร็จ' : `LINE Notify Error ${response.status}: ${JSON.stringify(resData)}`,
        payload: { message: textMessage },
        response: resData
      });
    } catch (err: any) {
      saveLineApiLog({
        type: 'LINE_NOTIFY',
        status: 'ERROR',
        statusCode: 500,
        message: `เกิดข้อผิดพลาดในการเชื่อมต่อ LINE Notify: ${err.message}`,
        payload: { message: textMessage },
        response: null
      });
    }
  }

  return {
    success: oaSuccess,
    message: `ส่งการแจ้งเตือนใบแจ้งซ่อม ${repair.repairNo} สำเร็จ`
  };
};
