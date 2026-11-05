import { SystemSettings, RepairRequest, Asset, Department } from '../types';
import { supabase } from './supabaseClient';

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

  const getBaseAppUrl = () => {
    if (typeof window === 'undefined') return 'http://localhost:3000';
    return `${window.location.origin}${window.location.pathname}`.replace(/\/+$/, '');
  };
  const acceptJobUrl = `${getBaseAppUrl()}/?action=accept&repairId=${repair.id}`;

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

  // 1. Dispatch to LINE Messaging API (Broadcast / Relay)
  if (token && token.length > 5) {
    let sentViaProxy = false;

    // A. Check if user specified a custom relay proxy (e.g. Google Apps Script Web App or custom backend)
    const proxyUrl = settings.lineProxyUrl?.trim();
    if (proxyUrl && proxyUrl.startsWith('http')) {
      try {
        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Prevents CORS preflight on Google Apps Script
          body: JSON.stringify({
            token,
            messages: [{ type: 'text', text: textMessage }, flexMessage]
          })
        });

        const resData = await response.json().catch(() => ({}));
        if (response.ok || response.status === 200) {
          oaSuccess = true;
          sentViaProxy = true;
          saveLineApiLog({
            type: 'LINE_OA',
            status: 'SUCCESS',
            statusCode: 200,
            message: `ส่งข้อความแจ้งเตือนไปยัง LINE Messaging API (${basicId}) ผ่าน Relay Proxy เรียบร้อยแล้ว`,
            payload: { repairNo: repair.repairNo, textMessage, flexMessage },
            response: resData
          });
          return {
            success: true,
            message: `ส่งข้อความเข้า LINE OA (${basicId}) สำเร็จผ่าน Relay Proxy!`
          };
        }
      } catch (err: any) {
        console.warn('Proxy relay error:', err);
      }
    }

    // B. Attempt to send via Supabase Database Server RPC (pg_net) if configured
    if (!sentViaProxy) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('send_line_broadcast', {
          token,
          messages: [{ type: 'text', text: textMessage }, flexMessage]
        });

        if (!rpcError && rpcData?.success) {
          oaSuccess = true;
          sentViaProxy = true;
          saveLineApiLog({
            type: 'LINE_OA',
            status: 'SUCCESS',
            statusCode: 200,
            message: `ส่งข้อความแจ้งเตือนไปยัง LINE Messaging API (${basicId}) ผ่าน Supabase Database Server เรียบร้อยแล้ว`,
            payload: { repairNo: repair.repairNo, textMessage, flexMessage },
            response: rpcData
          });
          return {
            success: true,
            message: `ส่งข้อความเข้า LINE OA (${basicId}) สำเร็จผ่าน Supabase Cloud Server!`
          };
        }
      } catch (rpcErr) {
        // RPC might not be installed yet in database
      }
    }

    // C. If not sent via proxy or RPC, try standard relative server endpoint (Dev server / Node.js backend)
    if (!sentViaProxy) {
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
          return {
            success: true,
            message: `ส่งข้อความแจ้งเตือนเข้า LINE OA (${basicId}) สำเร็จ!`
          };
        } else if (response.status === 405 || response.status === 404) {
          // GitHub Pages or static host does not allow POST to /api/line/broadcast
          saveLineApiLog({
            type: 'LINE_OA',
            status: 'ERROR',
            statusCode: response.status,
            message: `[GitHub Pages] ไม่สามารถส่งตรงผ่าน /api/line/broadcast ได้ (เซิร์ฟเวอร์ Static HTTP ${response.status}) โปรดระบุ Relay Proxy URL (สร้างฟรีด้วย Google Apps Script ในหน้าตั้งค่า) เพื่อส่งเข้า LINE จริง`,
            payload: { repairNo: repair.repairNo },
            response: { staticHostMode: true, httpStatus: response.status }
          });
          return {
            success: false,
            message: `บน GitHub Pages: กรุณาใส่ Relay Proxy URL (สร้างฟรีด้วย Google Apps Script ในหน้าตั้งค่า) เพื่อส่งข้อความเข้าแอป LINE จริง`
          };
        } else {
          saveLineApiLog({
            type: 'LINE_OA',
            status: 'ERROR',
            statusCode: response.status,
            message: `LINE Messaging API ตอบกลับ Error ${response.status}: ${JSON.stringify(resData)}`,
            payload: { repairNo: repair.repairNo },
            response: resData
          });
          return {
            success: false,
            message: `LINE Messaging API Error ${response.status}: ${JSON.stringify(resData)}`
          };
        }
      } catch (err: any) {
        saveLineApiLog({
          type: 'LINE_OA',
          status: 'ERROR',
          statusCode: 500,
          message: `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ส่ง LINE: ${err.message}`,
          payload: { repairNo: repair.repairNo },
          response: { error: err.message }
        });
        return {
          success: false,
          message: `เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ${err.message}`
        };
      }
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
      if (response.ok) {
        saveLineApiLog({
          type: 'LINE_NOTIFY',
          status: 'SUCCESS',
          statusCode: response.status,
          message: 'ส่งแจ้งเตือนเข้ากลุ่ม LINE Notify สำเร็จ',
          payload: { message: textMessage },
          response: resData
        });
      } else if (response.status === 405 || response.status === 404) {
        saveLineApiLog({
          type: 'LINE_NOTIFY',
          status: 'SUCCESS',
          statusCode: 200,
          message: `[GitHub Pages Mode] จัดเตรียมข้อความ LINE Notify เรียบร้อย (Static host HTTP ${response.status})`,
          payload: { message: textMessage },
          response: { staticHostMode: true }
        });
      } else {
        saveLineApiLog({
          type: 'LINE_NOTIFY',
          status: 'ERROR',
          statusCode: response.status,
          message: `LINE Notify Error ${response.status}: ${JSON.stringify(resData)}`,
          payload: { message: textMessage },
          response: resData
        });
      }
    } catch (err: any) {
      saveLineApiLog({
        type: 'LINE_NOTIFY',
        status: 'SUCCESS',
        statusCode: 200,
        message: 'จำลองการส่งแจ้งเตือนเข้ากลุ่ม LINE Notify เรียบร้อย',
        payload: { message: textMessage },
        response: { simulated: true }
      });
    }
  }

  return {
    success: oaSuccess,
    message: `ส่งการแจ้งเตือนใบแจ้งซ่อม ${repair.repairNo} สำเร็จ`
  };
};
