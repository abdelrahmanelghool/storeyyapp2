import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Edit3, Package } from "lucide-react";
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Medicine {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  lowStock: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface EditMedicineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicine: Medicine | null;
  onSuccess?: () => void;
}

export function EditMedicineDialog({ open, onOpenChange, medicine, onSuccess }: EditMedicineDialogProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: "أدوية", label: "أدوية", color: "blue" },
    { value: "فيجا", label: "فيجا", color: "green" },
    { value: "تخسيس", label: "تخسيس", color: "purple" }
  ];

  useEffect(() => {
    if (medicine && open) {
      setName(medicine.name);
      setQuantity(medicine.quantity.toString());
      setCategory(medicine.category);
    }
  }, [medicine, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!medicine) return;

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

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-02c09bb0/medicines/${medicine.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          quantity: quantityNum,
          category
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        alert('تم تحديث الدواء بنجاح');
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        alert('خطأ في تحديث الدواء: ' + result.error);
      }
    } catch (err) {
      console.error('Error updating medicine:', err);
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
      <DialogContent className="max-w-md bg-gradient-to-br from-blue-50 to-indigo-50">
        <DialogHeader className="pb-4 border-b border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Edit3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-blue-800">تعديل الدواء</DialogTitle>
              <DialogDescription className="text-blue-600">
                قم بتعديل بيانات الدواء الموجود في المخزن
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
              className="border-blue-200 focus:border-blue-400 bg-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicine-category" className="text-gray-700 font-medium">فئة الدواء</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="border-blue-200 focus:border-blue-400 bg-white">
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
            <Label htmlFor="medicine-quantity" className="text-gray-700 font-medium">الكمية</Label>
            <Input
              id="medicine-quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="أدخل الكمية"
              className="border-blue-200 focus:border-blue-400 bg-white"
            />
            <div className="text-sm text-gray-500">بوحدة العلبة</div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-blue-200">
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'جاري التحديث...' : 'حفظ التعديلات'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}