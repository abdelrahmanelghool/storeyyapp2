import { AppHeader } from "./components/AppHeader";
import { HomePage } from "./components/HomePage";
import { InventoryPage } from "./components/InventoryPage";
import { ConnectionTest } from "./components/ConnectionTest";
import { useState, useEffect } from "react";

type Page = 'home' | 'inventory';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [refreshKey, setRefreshKey] = useState(0);

  // تسجيل Service Worker للعمل كتطبيق موبايل
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }, []);

  const handleInvoiceCreated = () => {
    // تحديث المخزون بعد إنشاء فاتورة
    setRefreshKey(prev => prev + 1);
  };

  const navigateToInventory = () => {
    setCurrentPage('inventory');
  };

  const navigateToHome = () => {
    setCurrentPage('home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-4 max-w-md mx-auto">
      {/* خلفية متحركة خفيفة */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
      <div className="fixed top-0 right-0 w-96 h-96 bg-gradient-radial from-blue-400/10 to-transparent rounded-full -translate-y-48 translate-x-48 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-gradient-radial from-purple-400/10 to-transparent rounded-full translate-y-40 -translate-x-40 pointer-events-none"></div>
      
      <div className="relative z-10 space-y-8">
        {/* عرض رأس التطبيق في الصفحة الرئيسية فقط */}
        {currentPage === 'home' && <AppHeader />}
        
        {/* عرض المحتوى حسب الصفحة المحددة */}
        {currentPage === 'home' && (
          <HomePage 
            onNavigateToInventory={navigateToInventory}
            onInvoiceCreated={handleInvoiceCreated}
          />
        )}
        
        {currentPage === 'inventory' && (
          <InventoryPage 
            key={refreshKey}
            onBack={navigateToHome}
          />
        )}
        
        {/* أداة اختبار الاتصال (في وضع التطوير) */}
        <ConnectionTest />
      </div>
    </div>
  );
}