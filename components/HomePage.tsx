import { Button } from "./ui/button";
import { ShoppingCart, TrendingUp, Package2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { PurchaseInvoiceDialog } from "./PurchaseInvoiceDialog";
import { SaleInvoiceDialog } from "./SaleInvoiceDialog";

interface HomePageProps {
  onNavigateToInventory: () => void;
  onInvoiceCreated?: () => void;
}

export function HomePage({ onNavigateToInventory, onInvoiceCreated }: HomePageProps) {
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* أزرار الفواتير */}
      <div className="grid grid-cols-1 gap-6">
        <Button 
          onClick={() => setPurchaseDialogOpen(true)}
          className="group relative h-24 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-0"
          size="lg"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
          <div className="relative z-10 flex items-center justify-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <div className="text-right">
              <div className="font-bold text-xl">إضافة فاتورة شراء</div>
              <div className="text-emerald-100 text-sm">إضافة مخزون جديد للصيدلية</div>
            </div>
          </div>
        </Button>
        
        <Button 
          onClick={() => setSaleDialogOpen(true)}
          className="group relative h-24 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-0"
          size="lg"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
          <div className="relative z-10 flex items-center justify-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div className="text-right">
              <div className="font-bold text-xl">إضافة فاتورة بيع</div>
              <div className="text-orange-100 text-sm">تسجيل عملية بيع جديدة</div>
            </div>
          </div>
        </Button>

        <Button 
          onClick={onNavigateToInventory}
          className="group relative h-24 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-0"
          size="lg"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
          <div className="relative z-10 flex items-center justify-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
              <Package2 className="w-8 h-8" />
            </div>
            <div className="text-right">
              <div className="font-bold text-xl">أصناف المخزن</div>
              <div className="text-blue-100 text-sm">عرض وإدارة الأدوية المتاحة</div>
            </div>
          </div>
        </Button>
      </div>

      <PurchaseInvoiceDialog
        open={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
        onSuccess={onInvoiceCreated}
      />

      <SaleInvoiceDialog
        open={saleDialogOpen}
        onOpenChange={setSaleDialogOpen}
        onSuccess={onInvoiceCreated}
      />
    </div>
  );
}