import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Pill, AlertTriangle, Plus, Minus, Activity, Package2, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
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

export function InventoryItems() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showActivities, setShowActivities] = useState(false);

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

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      
      // تهيئة البيانات إذا لم تكن موجودة
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-02c09bb0/init-data`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      // جلب الأدوية
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-02c09bb0/medicines`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        // تطبيق الترتيب الأبجدي على البيانات المجلوبة
        const sortedItems = sortAlphabetically(result.data);
        setItems(sortedItems);
        setError(null);
      } else {
        setError(result.error || 'خطأ في جلب البيانات');
      }
    } catch (err) {
      console.error('Error fetching medicines:', err);
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-02c09bb0/activities`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setActivities(result.data.slice(0, 10)); // آخر 10 أنشطة
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  const updateQuantity = async (medicineId: string, newQuantity: number) => {
    if (newQuantity < 0) return;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-02c09bb0/medicines/${medicineId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      const result = await response.json();
      
      if (result.success) {
        // تحديث العنصر في القائمة مع الحفاظ على الترتيب الأبجدي
        const updatedItems = items.map(item => 
          item.id === medicineId ? result.data : item
        );
        setItems(sortAlphabetically(updatedItems));
        
        // تحديث سجل النشاطات
        fetchActivities();
      } else {
        alert('خطأ في تحديث الكمية: ' + result.error);
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      alert('خطأ في الاتصال بالخادم');
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

  useEffect(() => {
    fetchMedicines();
    fetchActivities();
    
    // تحديث النشاطات كل 30 ثانية
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Package2 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">أصناف المخزن</h2>
        </div>
        <div className="text-center py-12 text-gray-500">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          جاري تحميل البيانات...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Package2 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">أصناف المخزن</h2>
        </div>
        <div className="text-center py-12 text-red-500 bg-red-50 rounded-2xl border border-red-200">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p className="mb-4">{error}</p>
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
      {/* رأس القسم مع أزرار التحكم */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Package2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">أصناف المخزن</h2>
            <p className="text-sm text-gray-500">{items.length} صنف متاح (مرتب أبجدياً)</p>
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
            onClick={fetchMedicines} 
            variant="outline" 
            size="sm"
            className="border-gray-200 hover:bg-gray-50"
          >
            تحديث
          </Button>
        </div>
      </div>

      {/* سجل النشاطات */}
      {showActivities && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">النشاطات الأخيرة</h3>
            </div>
            
            {activities.length === 0 ? (
              <p className="text-gray-500 text-sm">لا توجد نشاطات مسجلة</p>
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
      
      {items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Package2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg mb-2">لا توجد أدوية في المخزن</p>
          <p className="text-gray-400 text-sm">ابدأ بإضافة فاتورة شراء لإضافة أصناف جديدة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((item) => (
            <Card 
              key={item.id} 
              className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                item.lowStock 
                  ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200 hover:border-red-300' 
                  : 'bg-gradient-to-r from-white to-gray-50 border-gray-200 hover:border-blue-300'
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge 
                        variant={item.lowStock ? "destructive" : "secondary"}
                        className={`flex items-center gap-1 px-3 py-1 ${
                          item.lowStock 
                            ? 'bg-red-100 text-red-700 border-red-200' 
                            : 'bg-green-100 text-green-700 border-green-200'
                        }`}
                      >
                        {item.lowStock && <AlertTriangle className="w-3 h-3" />}
                        {item.quantity} {item.unit}
                      </Badge>
                      {item.lowStock && (
                        <span className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded-full">
                          مخزون منخفض
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-xl ${
                    item.lowStock ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <Pill className={`w-6 h-6 ${
                      item.lowStock ? 'text-red-600' : 'text-blue-600'
                    }`} />
                  </div>
                </div>
                
                {/* أزرار تعديل الكمية */}
                <div className="flex items-center justify-between bg-white/80 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 0}
                      className="w-10 h-10 p-0 border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    
                    <div className="text-center min-w-[60px]">
                      <div className="text-lg font-bold text-gray-800">{item.quantity}</div>
                      <div className="text-xs text-gray-500">{item.unit}</div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-10 h-10 p-0 border-gray-300 hover:bg-green-50 hover:border-green-300 hover:text-green-600"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-500">آخر تحديث</div>
                    <div className="text-xs text-gray-400">
                      {item.updatedAt ? formatTimeAgo(item.updatedAt) : formatTimeAgo(item.createdAt)}
                    </div>
                  </div>
                </div>
              </CardContent>
              
              {/* شريط جانبي ملون */}
              <div className={`absolute right-0 top-0 w-1 h-full ${
                item.lowStock ? 'bg-red-500' : 'bg-blue-500'
              }`}></div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}