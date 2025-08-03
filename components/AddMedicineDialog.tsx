import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Package } from "lucide-react";
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AddMedicineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddMedicineDialog({ open, onOpenChange, onSuccess }: AddMedicineDialogProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: "أدوية", label: "أدوية", color: "blue" },
    { value: "فيجا", label: "فيجا", color: "green" },
    { value: "تخسيس", label: "تخسيس", color: "purple" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('يجب إدخال اسم الدواء');
      return;
    }

    if (!category) {
      alert('يجب اختيار فئة الدواء');
      return;
    }

    const quantityNum = Number(quantity);
    if (quantityNum < 0) {
      alert('الكمية يجب أن تكون رقم موجب');
      return;
    }

    setLoading(true);

    try {
      // التحقق من توفر المعلومات المطلوبة
      if (!projectId || !publicAnonKey) {
        alert('خطأ: إعدادات الاتصال غير متوفرة');
        setLoading(false);
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-02c09bb0/medicines`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          quantity: quantityNum,
          unit: 'علبة',
          category
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        alert('تم إضافة الدواء بنجاح');
        setName("");
        setQuantity("");
        setCategory("");
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        alert('خطأ في إضافة الدواء: ' + result.error);
      }
    } catch (err) {
      console.error('Error adding medicine:', err);
      alert(`خطأ في الاتصال بالخادم: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setQuantity("");
    setCategory("");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-md bg-gradient-to-br from-green-50 to-emerald-50">
        <DialogHeader className="pb-4 border-b border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-green-800">إضافة دواء جديد</DialogTitle>
              <DialogDescription className="text-green-600">
                أضف دواء جديد إلى مخزن الصيدلية مع تحديد الفئة
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="medicine-name" className="text-gray-700 font-medium">اسم الدواء</Label>
            <Input
              id="medicine-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم الدواء"
              className="border-green-200 focus:border-green-400 bg-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicine-category" className="text-gray-700 font-medium">فئة الدواء</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="border-green-200 focus:border-green-400 bg-white">
                <SelectValue placeholder="اختر فئة الدواء" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-${cat.color}-500`}></div>
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicine-quantity" className="text-gray-700 font-medium">الكمية الأولية</Label>
            <Input
              id="medicine-quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="أدخل الكمية"
              className="border-green-200 focus:border-green-400 bg-white"
            />
            <div className="text-sm text-gray-500">بوحدة العلبة</div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-green-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'جاري الإضافة...' : 'إضافة الدواء'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}