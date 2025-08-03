import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors({ origin: '*' }))
app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// دالة لتسجيل النشاطات
async function logActivity(type: string, description: string, details?: any) {
  const activityId = `activity:${Date.now()}`
  const activityData = {
    id: activityId,
    type,
    description,
    details: details || {},
    timestamp: new Date().toISOString(),
    userId: 'user1' // في تطبيق حقيقي، سيكون من JWT token
  }
  
  await kv.set(activityId, activityData)
  console.log('Activity logged:', activityData)
}

// الحصول على جميع الأدوية
app.get('/make-server-02c09bb0/medicines', async (c) => {
  try {
    const medicines = await kv.getByPrefix('medicine:')
    return c.json({ success: true, data: medicines })
  } catch (error) {
    console.log('Error fetching medicines:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// إضافة دواء جديد
app.post('/make-server-02c09bb0/medicines', async (c) => {
  try {
    const { name, quantity, unit, category } = await c.req.json()
    
    if (!name || quantity === undefined || !unit) {
      return c.json({ success: false, error: 'بيانات الدواء غير مكتملة' }, 400)
    }

    const medicineId = `medicine:${Date.now()}`
    const medicineData = {
      id: medicineId,
      name,
      quantity: Number(quantity),
      unit: unit || 'علبة',
      category: category || 'أدوية', // الفئة الافتراضية
      lowStock: Number(quantity) < 10, // تحديث حد المخزون المنخفض لـ 10 علب
      createdAt: new Date().toISOString()
    }

    await kv.set(medicineId, medicineData)
    
    // تسجيل النشاط
    await logActivity('medicine_added', `تم إضافة دواء جديد: ${name}`, {
      medicineId,
      name,
      quantity,
      unit: unit || 'علبة',
      category: category || 'أدوية'
    })
    
    return c.json({ success: true, data: medicineData })
  } catch (error) {
    console.log('Error adding medicine:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// تحديث بيانات الدواء (كامل)
app.put('/make-server-02c09bb0/medicines/:id', async (c) => {
  try {
    const medicineId = c.req.param('id')
    const { name, quantity, category } = await c.req.json()

    const existingMedicine = await kv.get(medicineId)
    if (!existingMedicine) {
      return c.json({ success: false, error: 'الدواء غير موجود' }, 404)
    }

    // تحديث جميع البيانات أو الكمية فقط
    const updatedMedicine = {
      ...existingMedicine,
      ...(name && { name }),
      ...(category && { category }),
      ...(quantity !== undefined && { quantity: Number(quantity) }),
      lowStock: Number(quantity !== undefined ? quantity : existingMedicine.quantity) < 10,
      updatedAt: new Date().toISOString()
    }

    await kv.set(medicineId, updatedMedicine)
    
    // تسجيل النشاط
    if (name || category) {
      await logActivity('medicine_updated', `تم تعديل الدواء: ${updatedMedicine.name}`, {
        medicineId,
        oldData: existingMedicine,
        newData: updatedMedicine
      })
    } else if (quantity !== undefined) {
      await logActivity('quantity_updated', `تم تحديث كمية ${existingMedicine.name}`, {
        medicineId,
        oldQuantity: existingMedicine.quantity,
        newQuantity: Number(quantity),
        difference: Number(quantity) - existingMedicine.quantity
      })
    }

    return c.json({ success: true, data: updatedMedicine })
  } catch (error) {
    console.log('Error updating medicine:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// إضافة فاتورة شراء
app.post('/make-server-02c09bb0/purchase-invoice', async (c) => {
  try {
    const { items, total, supplierName } = await c.req.json()
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return c.json({ success: false, error: 'عناصر الفاتورة مطلوبة' }, 400)
    }

    const invoiceId = `purchase:${Date.now()}`
    const invoiceData = {
      id: invoiceId,
      type: 'purchase',
      items,
      total: Number(total),
      supplierName: supplierName || '',
      createdAt: new Date().toISOString()
    }

    // حفظ الفاتورة
    await kv.set(invoiceId, invoiceData)

    // تحديث كميات الأدوية
    for (const item of items) {
      const medicine = await kv.get(item.medicineId)
      if (medicine) {
        const updatedQuantity = medicine.quantity + item.quantity
        await kv.set(item.medicineId, {
          ...medicine,
          quantity: updatedQuantity,
          lowStock: updatedQuantity < 10,
          updatedAt: new Date().toISOString()
        })
      }
    }

    // تسجيل النشاط
    await logActivity('purchase_invoice', `تم إنشاء فاتورة شراء من ${supplierName}`, {
      invoiceId,
      supplierName,
      total,
      itemsCount: items.length
    })

    return c.json({ success: true, data: invoiceData })
  } catch (error) {
    console.log('Error creating purchase invoice:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// إضافة فاتورة بيع
app.post('/make-server-02c09bb0/sale-invoice', async (c) => {
  try {
    const { items, total, customerName } = await c.req.json()
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return c.json({ success: false, error: 'عناصر الفاتورة مطلوبة' }, 400)
    }

    // التحقق من توفر الكميات
    for (const item of items) {
      const medicine = await kv.get(item.medicineId)
      if (!medicine || medicine.quantity < item.quantity) {
        return c.json({ 
          success: false, 
          error: `كمية غير كافية للدواء: ${item.medicineName}` 
        }, 400)
      }
    }

    const invoiceId = `sale:${Date.now()}`
    const invoiceData = {
      id: invoiceId,
      type: 'sale',
      items,
      total: Number(total),
      customerName: customerName || '',
      createdAt: new Date().toISOString()
    }

    // حفظ الفاتورة
    await kv.set(invoiceId, invoiceData)

    // تحديث كميات الأدوية (خصم)
    for (const item of items) {
      const medicine = await kv.get(item.medicineId)
      const updatedQuantity = medicine.quantity - item.quantity
      await kv.set(item.medicineId, {
        ...medicine,
        quantity: updatedQuantity,
        lowStock: updatedQuantity < 10,
        updatedAt: new Date().toISOString()
      })
    }

    // تسجيل النشاط
    await logActivity('sale_invoice', `تم إنشاء فاتورة بيع للعميل ${customerName}`, {
      invoiceId,
      customerName,
      total,
      itemsCount: items.length
    })

    return c.json({ success: true, data: invoiceData })
  } catch (error) {
    console.log('Error creating sale invoice:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// الحصول على الفواتير
app.get('/make-server-02c09bb0/invoices', async (c) => {
  try {
    const purchases = await kv.getByPrefix('purchase:')
    const sales = await kv.getByPrefix('sale:')
    
    return c.json({ 
      success: true, 
      data: {
        purchases,
        sales,
        all: [...purchases, ...sales].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }
    })
  } catch (error) {
    console.log('Error fetching invoices:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// الحصول على سجل النشاطات
app.get('/make-server-02c09bb0/activities', async (c) => {
  try {
    const activities = await kv.getByPrefix('activity:')
    const sortedActivities = activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    
    return c.json({ success: true, data: sortedActivities })
  } catch (error) {
    console.log('Error fetching activities:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// حذف دواء
app.delete('/make-server-02c09bb0/medicines/:id', async (c) => {
  try {
    const medicineId = c.req.param('id')
    
    const existingMedicine = await kv.get(medicineId)
    if (!existingMedicine) {
      return c.json({ success: false, error: 'الدواء غير موجود' }, 404)
    }

    await kv.del(medicineId)
    
    // تسجيل النشاط
    await logActivity('medicine_deleted', `تم حذف الدواء: ${existingMedicine.name}`, {
      medicineId,
      deletedMedicine: existingMedicine
    })

    return c.json({ success: true, message: 'تم حذف الدواء بنجاح' })
  } catch (error) {
    console.log('Error deleting medicine:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// إضافة بيانات وهمية عند بدء التشغيل مع الفئات الجديدة
app.get('/make-server-02c09bb0/init-data', async (c) => {
  try {
    const existingMedicines = await kv.getByPrefix('medicine:')
    
    if (existingMedicines.length === 0) {
      const sampleMedicines = [
        {
          id: 'medicine:1',
          name: 'باراسيتامول 500 مجم',
          quantity: 25,
          unit: 'علبة',
          category: 'أدوية',
          lowStock: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'medicine:2',
          name: 'أموكسيسيلين 250 مجم',
          quantity: 8,
          unit: 'علبة',
          category: 'أدوية',
          lowStock: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'medicine:3',
          name: 'فيتامين سي 1000 مجم',
          quantity: 18,
          unit: 'علبة',
          category: 'فيجا',
          lowStock: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'medicine:4',
          name: 'إيبوبروفين 200 مجم',
          quantity: 5,
          unit: 'علبة',
          category: 'أدوية',
          lowStock: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'medicine:5',
          name: 'أوميجا 3',
          quantity: 12,
          unit: 'علبة',
          category: 'فيجا',
          lowStock: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'medicine:6',
          name: 'شراب الكحة للأطفال',
          quantity: 3,
          unit: 'علبة',
          category: 'أدوية',
          lowStock: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'medicine:7',
          name: 'جرين كوفي للتخسيس',
          quantity: 15,
          unit: 'علبة',
          category: 'تخسيس',
          lowStock: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'medicine:8',
          name: 'كبسولات حرق الدهون',
          quantity: 7,
          unit: 'علبة',
          category: 'تخسيس',
          lowStock: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'medicine:9',
          name: 'فيتامينات متعددة للنساء',
          quantity: 20,
          unit: 'علبة',
          category: 'فيجا',
          lowStock: false,
          createdAt: new Date().toISOString()
        }
      ]

      for (const medicine of sampleMedicines) {
        await kv.set(medicine.id, medicine)
      }

      // تسجيل نشاط التهيئة
      await logActivity('system_init', 'تم تهيئة البيانات الأولية للنظام مع الفئات', {
        medicinesCount: sampleMedicines.length,
        categories: ['أدوية', 'فيجا', 'تخسيس']
      })
    }

    return c.json({ success: true, message: 'تم تهيئة البيانات بنجاح' })
  } catch (error) {
    console.log('Error initializing data:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

Deno.serve(app.fetch)