import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-['Sarabun',sans-serif]">
          <div className="bg-slate-800 border border-slate-700 p-6 sm:p-8 rounded-2xl max-w-lg w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-3xl mx-auto">
              ⚠️
            </div>
            <h2 className="text-xl font-bold">เกิดข้อผิดพลาดในการโหลดระบบ</h2>
            <p className="text-xs text-slate-400">
              {this.state.error?.message || 'ระบบไม่สามารถแสดงผลหน้าจอได้ตามปกติ'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                🔄 รีโหลดหน้าเว็บ
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                🧹 ล้างข้อมูลแคชและรีสตาร์ท
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
(window as any).__APP_MOUNTED__ = true;
