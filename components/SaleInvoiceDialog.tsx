import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Plus, Trash2, AlertTriangle, TrendingUp, Package, Search } from "lucide-react";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "./ui/utils";

interface Medicine {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

interface InvoiceItem {
  medicineId: string;
  medicineName: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  availableQuantity: number;
}

interface SaleInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SaleInvoiceDialog({ open, onOpenChange, onSuccess }: SaleInvoiceDialogProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMedicines = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-02c09bb0/medicines`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        setMedicines(result.data);
      }
    } catch (err) {
      console.error('Error fetching medicines:', err);
    }
  };

  const addItem = () => {
    setItems([...items, {
      medicineId: "",
      medicineName: "",
      quantity: "",
      unit: "علبة",
      unitPrice: "",
      availableQuantity: 0
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // إذا تم تغيير الدواء، نحديث الاسم والوحدة والكمية المتاحة
    if (field === 'medicineId') {
      const selectedMedicine = medicines.find(m => m.id === value);
      if (selectedMedicine) {
        updatedItems[index].medicineName = selectedMedicine.name;
        updatedItems[index].unit = selectedMedicine.unit;
        updatedItems[index].availableQuantity = selectedMedicine.quantity;
      }
    }
    
    setItems(updatedItems);
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return total + (quantity * price);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      alert('يجب إضافة عنصر واحد على الأقل');
      return;
    }

    const processedItems = items.map(item => ({
      ...item,
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0
    }));

    if (processedItems.some(item => !item.medicineId || item.quantity <= 0 || item.unitPrice <= 0)) {
      alert('يجب ملء جميع البيانات بقيم صحيحة');
      return;
    }

    // التحقق من الكميات المتاحة
    const insufficientItems = processedItems.filter(item => item.quantity > item.availableQuantity);
    if (insufficientItems.length > 0) {
      alert(`كمية غير كافية للأصناف: ${insufficientItems.map(item => item.medicineName).join(', ')}`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-02c09bb0/sale-invoice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: processedItems,
          total: calculateTotal(),
          customerName
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('تم إنشاء فاتورة البيع بنجاح');
        setCustomerName("");
        setItems([]);
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        alert('خطأ في إنشاء الفاتورة: ' + result.error);
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      alert('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMedicines();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-orange-50 to-red-50">
        <DialogHeader className="pb-4 border-b border-orange-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-orange-800">إضافة فاتورة بيع</DialogTitle>
              <DialogDescription className="text-orange-600">
                قم بإضافة فاتورة بيع جديدة مع تحديد العميل والأصناف المباعة
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="customer" className="text-gray-700 font-medium">اسم العميل</Label>
            <Input
              id="customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="أدخل اسم العميل"
              className="border-orange-200 focus:border-orange-400 bg-white"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-gray-700 font-medium">الأصناف</Label>
              <Button 
                type="button" 
                onClick={addItem} 
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="w-4 h-4 ml-1" />
                إضافة صنف
              </Button>
            </div>

            {items.map((item, index) => (
              <Card key={index} className="border-orange-200 bg-white shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-orange-600" />
                      <Label className="font-medium text-gray-700">الصنف {index + 1}</Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* قائمة الأدوية القابلة للبحث */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">اختر الدواء</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between border-orange-200 focus:border-orange-400 bg-white",
                            !item.medicineId && "text-muted-foreground"
                          )}
                        >
                          {item.medicineId
                            ? medicines.find((medicine) => medicine.id === item.medicineId)?.name
                            : "ابحث واختر الدواء..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-white">
                        <Command>
                          <CommandInput placeholder="ابحث عن دواء..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>لا توجد أدوية.</CommandEmpty>
                            <CommandGroup>
                              {medicines.map((medicine) => (
                                <CommandItem
                                  key={medicine.id}
                                  value={medicine.name}
                                  onSelect={() => {
                                    updateItem(index, 'medicineId', medicine.id);
                                  }}
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <div className={`w-2 h-2 rounded-full ${
                                      medicine.category === 'أدوية' ? 'bg-blue-500' :
                                      medicine.category === 'فيجا' ? 'bg-green-500' :
                                      medicine.category === 'تخسيس' ? 'bg-purple-500' : 'bg-gray-500'
                                    }`}></div>
                                    <span className="flex-1">{medicine.name}</span>
                                    <span className="text-xs text-gray-500">
                                      (متاح: {medicine.quantity})
                                    </span>
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        item.medicineId === medicine.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {item.medicineId && item.availableQuantity === 0 && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                      غير متوفر في المخزن
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-600">الكمية</Label>
                      <Input
                        type="number"
                        min="1"
                        max={item.availableQuantity}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        placeholder="الكمية"
                        className="border-orange-200 focus:border-orange-400 bg-white"
                      />
                      {item.medicineId && (
                        <div className="text-xs text-gray-500 mt-1">
                          متاح: {item.availableQuantity} علبة
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">سعر العلبة</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                        placeholder="السعر"
                        className="border-orange-200 focus:border-orange-400 bg-white"
                      />
                      <div className="text-xs text-gray-500 mt-1">ج.م</div>
                    </div>
                  </div>

                  {Number(item.quantity) > item.availableQuantity && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                      الكمية المطلوبة أكبر من المتاح
                    </div>
                  )}

                  {Number(item.quantity) > 0 && Number(item.unitPrice) > 0 && Number(item.quantity) <= item.availableQuantity && (
                    <div className="text-sm bg-orange-100 text-orange-700 p-2 rounded-lg">
                      إجمالي هذا الصنف: {(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)} ج.م
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {items.length > 0 && (
            <div className="text-xl font-bold text-center p-4 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl border border-orange-200">
              الإجمالي الكلي: {calculateTotal().toFixed(2)} ج.م
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-orange-200">
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
              disabled={loading || items.length === 0}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}