import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ArrowLeft, AlertTriangle, Plus, Trash2, Package2, Activity, Zap, Search, Filter, Edit3 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { AddMedicineDialog } from "./AddMedicineDialog";
import { EditMedicineDialog } from "./EditMedicineDialog";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  lowStock: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface ActivityLog {
  id: string;
  type: string;
  description: string;
  details: any;
  timestamp: string;
  userId: string;
}

interface InventoryPageProps {
  onBack: () => void;
}

export function InventoryPage({ onBack }: InventoryPageProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showActivities, setShowActivities] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("الكل");

  const categories = [
    { value: "الكل", label: "الكل", color: "gray" },
    { value: "أدوية", label: "أدوية", color: "blue" },
    { value: "فيجا", label: "فيجا", color: "green" },
    { value: "تخسيس", label: "تخسيس", color: "purple" }
  ];

  // دالة الترتيب الأبجدي للنصوص العربية والإنجليزية
  const sortAlphabetically = (items: InventoryItem[]) => {
    return items.sort((a, b) => {
      return a.name.localeCompare(b.name, 'ar', { 
        numeric: true, 
        caseFirst: 'lower',
        sensitivity: 'base' 
      });
    });
  };

  // فلترة الأصناف حسب البحث والفئة مع الترتيب الأبجدي
  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // فلترة حسب النص
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // فلترة حسب الفئة
    if (selectedCategory !== "الكل") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // تطبيق الترتيب الأبجدي
    return sortAlphabetically(filtered);
  }, [items, searchTerm, selectedCategory]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      
      // التحقق من توفر المعلومات المطلوبة
      if (!projectId || !publicAnonKey) {
        setError('إعدادات الاتصال غير متوفرة');
        setLoading(false);
        return;
      }

      // تهيئة البيانات إذا لم تكن موجودة
      try {
        await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-02c09bb0/init-data`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (initError) {
        console.log('Init data request failed (non-critical):', initError);
      }

      // جلب الأدوية
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-02c09bb0/medicines`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // إضافة الفئة الافتراضية للأدوية القديمة
        const medicinesWithCategory = result.data.map(item => ({
          ...item,
          category: item.category || 'أدوية'
        }));
        
        // تطبيق الترتيب الأبجدي على البيانات المجلوبة
        const sortedMedicines = sortAlphabetically(medicinesWithCategory);
        setItems(sortedMedicines);
        setError(null);
      } else {
        setError(result.error || 'خطأ في جلب البيانات');
      }
    } catch (err) {
      console.error('Error fetching medicines:', err);
      setError(`خطأ في الاتصال بالخادم: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      // التحقق من توفر المعلومات المطلوبة
      if (!projectId || !publicAnonKey) {
        console.log('Supabase credentials not available, skipping activities fetch');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-02c09bb0/activities`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setActivities(result.data.slice(0, 10)); // آخر 10 أنشطة
      } else {
        console.error('Activities fetch failed:', result.error);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      // تعيين مصفوفة فارغة في حالة الخطأ لتجنب تعطل التطبيق
      setActivities([]);
    }
  };

  const deleteMedicine = async (medicineId: string, medicineName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الدواء "${medicineName}"؟`)) {
      return;
    }

    try {
      // التحقق من توفر المعلومات المطلوبة
      if (!projectId || !publicAnonKey) {
        alert('خطأ: إعدادات الاتصال غير متوفرة');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-02c09bb0/medicines/${medicineId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // إزالة العنصر وإعادة ترتيب القائمة
        const updatedItems = items.filter(item => item.id !== medicineId);
        setItems(sortAlphabetically(updatedItems));
        fetchActivities(); // تحديث سجل النشاطات
        alert('تم حذف الدواء بنجاح');
      } else {
        alert('خطأ في حذف الدواء: ' + result.error);
      }
    } catch (err) {
      console.error('Error deleting medicine:', err);
      alert(`خطأ في الاتصال بالخادم: ${err.message}`);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'أدوية': return 'blue';
      case 'فيجا': return 'green';
      case 'تخسيس': return 'purple';
      default: return 'gray';
    }
  };

  const handleEditMedicine = (medicine: InventoryItem) => {
    setSelectedMedicine(medicine);
    setEditDialogOpen(true);
  };

  // تحديث دالة النجاح لإعادة تحميل وترتيب البيانات
  const handleSuccessfulUpdate = () => {
    fetchMedicines(); // سيقوم بإعادة جلب البيانات وترتيبها أبجدياً
  };

  useEffect(() => {
    // طباعة معلومات التشخيص
    console.log('InventoryPage initialized with:', {
      projectId,
      hasPublicKey: !!publicAnonKey,
      serverUrl: `https://${projectId}.supabase.co/functions/v1/make-server-02c09bb0`
    });
    
    fetchMedicines();
    fetchActivities();
    
    // تحديث النشاطات كل 30 ثانية
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* رأس الصفحة */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={onBack}
            variant="outline" 
            size="sm"
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Package2 className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">أصناف المخزن</h1>
          </div>
        </div>

        <div className="text-center py-16 text-gray-500">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          جاري تحميل البيانات...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* رأس الصفحة */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={onBack}
            variant="outline" 
            size="sm"
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Package2 className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">أصناف المخزن</h1>
          </div>
        </div>

        <div className="text-center py-16 text-red-500 bg-red-50 rounded-2xl border border-red-200">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <p className="mb-4 text-lg">{error}</p>
          <Button 
            onClick={fetchMedicines} 
            variant="outline" 
            size="sm"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            onClick={onBack}
            variant="outline" 
            size="sm"
            className="p-2 hover:bg-blue-50 border-blue-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Package2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">أصناف المخزن</h1>
              <p className="text-sm text-gray-500">{filteredItems.length} من {items.length} صنف (مرتب أبجدياً)</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowActivities(!showActivities)}
            variant="outline" 
            size="sm"
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Activity className="w-4 h-4 ml-1" />
            النشاطات
          </Button>
          <Button 
            onClick={() => setAddDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 ml-1" />
            إضافة دواء
          </Button>
        </div>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="space-y-4">
        {/* شريط البحث */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="ابحث عن دواء..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-gray-200 focus:border-blue-400"
          />
        </div>

        {/* أزرار الفئات */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              variant={selectedCategory === category.value ? "default" : "outline"}
              size="sm"
              className={`flex-shrink-0 ${
                selectedCategory === category.value
                  ? `bg-${category.color}-600 hover:bg-${category.color}-700 text-white`
                  : `border-${category.color}-200 text-${category.color}-600 hover:bg-${category.color}-50`
              }`}
            >
              <div className={`w-2 h-2 rounded-full bg-${category.color}-500 ml-1`}></div>
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {/* سجل النشاطات */}
      {showActivities && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">النشاطات الأخيرة</h3>
              <Button
                onClick={fetchActivities}
                variant="ghost"
                size="sm"
                className="ml-auto p-1 h-6 w-6"
              >
                🔄
              </Button>
            </div>
            
            {activities.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">لا توجد نشاطات مسجلة</p>
                <p className="text-xs text-gray-400 mt-1">
                  قد يكون السيرفر غير متصل أو لم يتم تكوينه بعد
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">{activity.description}</p>
                      <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* عرض الأصناف في مربعات صغيرة */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Package2 className="w-20 h-20 mx-auto mb-4 text-gray-300" />
          {searchTerm || selectedCategory !== "الكل" ? (
            <>
              <p className="text-gray-500 text-xl mb-2">لا توجد نتائج</p>
              <p className="text-gray-400 text-sm mb-4">
                {searchTerm ? `لا توجد أدوية تحتوي على "${searchTerm}"` : `لا توجد أدوية في فئة "${selectedCategory}"`}
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("الكل");
                }}
                variant="outline"
                size="sm"
              >
                مسح الفلاتر
              </Button>
            </>
          ) : (
            <>
              <p className="text-gray-500 text-xl mb-2">لا توجد أدوية في المخزن</p>
              <p className="text-gray-400 text-sm mb-4">ابدأ بإضافة الأدوية إلى المخزن</p>
              <Button 
                onClick={() => setAddDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة أول دواء
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const categoryColor = getCategoryColor(item.category);
            return (
              <Card 
                key={item.id} 
                className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                  item.lowStock 
                    ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200 hover:border-red-300' 
                    : 'bg-gradient-to-br from-white to-blue-50 border-gray-200 hover:border-blue-300'
                }`}
              >
                <CardContent className="p-4 text-center">
                  {/* أزرار التحكم */}
                  <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => handleEditMedicine(item)}
                      variant="ghost"
                      size="sm"
                      className="w-6 h-6 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => deleteMedicine(item.id, item.name)}
                      variant="ghost"
                      size="sm"
                      className="w-6 h-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* محتوى المربع */}
                  <div className="mb-3">
                    <h3 className="font-bold text-gray-800 text-sm leading-tight mb-2 min-h-[2.5rem] flex items-center justify-center">
                      {item.name}
                    </h3>
                    
                    {/* فئة الدواء */}
                    <div className="mb-2">
                      <Badge 
                        variant="secondary"
                        className={`text-xs px-2 py-1 bg-${categoryColor}-100 text-${categoryColor}-700 border-${categoryColor}-200`}
                      >
                        {item.category}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-center">
                      <Badge 
                        variant={item.lowStock ? "destructive" : "secondary"}
                        className={`text-xs px-2 py-1 ${
                          item.lowStock 
                            ? 'bg-red-100 text-red-700 border-red-200' 
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                        }`}
                      >
                        {item.lowStock && <AlertTriangle className="w-3 h-3 ml-1" />}
                        {item.quantity} علبة
                      </Badge>
                    </div>

                    {item.lowStock && (
                      <div className="text-xs text-red-600 font-medium mt-2 bg-red-100 px-2 py-1 rounded-full">
                        مخزون منخفض
                      </div>
                    )}
                  </div>
                </CardContent>
                
                {/* شريط جانبي ملون حسب الفئة */}
                <div className={`absolute bottom-0 left-0 w-full h-1 ${
                  item.lowStock ? 'bg-red-500' : `bg-${categoryColor}-500`
                }`}></div>
              </Card>
            );
          })}
        </div>
      )}

      <AddMedicineDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleSuccessfulUpdate}
      />

      <EditMedicineDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        medicine={selectedMedicine}
        onSuccess={handleSuccessfulUpdate}
      />
    </div>
  );
}