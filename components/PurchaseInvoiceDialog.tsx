import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Plus, Trash2, ShoppingCart, Package, Search } from "lucide-react";
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
}

interface PurchaseInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PurchaseInvoiceDialog({ open, onOpenChange, onSuccess }: PurchaseInvoiceDialogProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [supplierName, setSupplierName] = useState("");
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
      unitPrice: ""
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // إذا تم تغيير الدواء، نحديث الاسم والوحدة
    if (field === 'medicineId') {
      const selectedMedicine = medicines.find(m => m.id === value);
      if (selectedMedicine) {
        updatedItems[index].medicineName = selectedMedicine.name;
        updatedItems[index].unit = selectedMedicine.unit;
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

    setLoading(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-02c09bb0/purchase-invoice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: processedItems,
          total: calculateTotal(),
          supplierName
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('تم إنشاء فاتورة الشراء بنجاح');
        setSupplierName("");
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-emerald-50 to-teal-50">
        <DialogHeader className="pb-4 border-b border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-emerald-800">إضافة فاتورة شراء</DialogTitle>
              <DialogDescription className="text-emerald-600">
                قم بإضافة فاتورة شراء جديدة للمخزن مع تحديد المورد والأصناف المطلوبة
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="supplier" className="text-gray-700 font-medium">اسم المورد</Label>
            <Input
              id="supplier"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="أدخل اسم المورد"
              className="border-emerald-200 focus:border-emerald-400 bg-white"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-gray-700 font-medium">الأصناف</Label>
              <Button 
                type="button" 
                onClick={addItem} 
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="w-4 h-4 ml-1" />
                إضافة صنف
              </Button>
            </div>

            {items.map((item, index) => (
              <Card key={index} className="border-emerald-200 bg-white shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-600" />
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
                            "w-full justify-between border-emerald-200 focus:border-emerald-400 bg-white",
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
                                    <span className="text-xs text-gray-500">({medicine.category})</span>
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-600">الكمية</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        placeholder="الكمية"
                        className="border-emerald-200 focus:border-emerald-400 bg-white"
                      />
                      <div className="text-xs text-gray-500 mt-1">علبة</div>
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
                        className="border-emerald-200 focus:border-emerald-400 bg-white"
                      />
                      <div className="text-xs text-gray-500 mt-1">ج.م</div>
                    </div>
                  </div>

                  {Number(item.quantity) > 0 && Number(item.unitPrice) > 0 && (
                    <div className="text-sm bg-emerald-100 text-emerald-700 p-2 rounded-lg">
                      إجمالي هذا الصنف: {(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)} ج.م
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {items.length > 0 && (
            <div className="text-xl font-bold text-center p-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl border border-emerald-200">
              الإجمالي الكلي: {calculateTotal().toFixed(2)} ج.م
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-emerald-200">
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
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}