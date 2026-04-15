import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let isFirebaseError = false;
      let errorMessage = 'عذراً، حدث خطأ غير متوقع في التطبيق.';
      
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            isFirebaseError = true;
            errorMessage = 'حدث خطأ أثناء الاتصال بقاعدة البيانات. يرجى التحقق من اتصالك بالإنترنت أو المحاولة لاحقاً.';
            console.error('Firestore Error Context:', parsed);
          }
        }
      } catch (e) {
        // Not a JSON error message
      }

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-300">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-200 dark:border-gray-800 p-8 md:p-12 shadow-2xl text-center transition-colors duration-300">
            <div className="bg-red-500/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/20">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
              {isFirebaseError ? 'خطأ في قاعدة البيانات' : 'حدث خطأ ما'}
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
              {errorMessage}
            </p>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-yellow-500/20"
              >
                <RefreshCcw className="w-5 h-5" />
                إعادة تحميل الصفحة
              </button>
              
              <a
                href="/"
                className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-bold py-2 transition-colors"
              >
                <Home className="w-5 h-5" />
                العودة للرئيسية
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
