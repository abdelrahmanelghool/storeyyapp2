# 🚀 دليل نشر تطبيق Storeyy - خطوة بخطوة

## 📋 المتطلبات الأساسية
- حساب GitHub (مجاني)
- حساب Supabase (مجاني)
- حساب Vercel (مجاني)

---

## 🔧 المرحلة 1: إعداد Supabase

### 1.1 إنشاء مشروع Supabase
1. اذهب إلى [supabase.com](https://supabase.com)
2. اضغط "Start your project"
3. سجل دخول بـ GitHub
4. اضغط "New Project"
5. اختر منظمة واكتب:
   - **Name**: `storeyy-pharmacy`
   - **Database Password**: (احفظ كلمة المرور)
   - **Region**: أقرب منطقة لك
6. اضغط "Create new project"

### 1.2 الحصول على مفاتيح API
1. بعد إنشاء المشروع، اذهب إلى:
   - **Settings** → **API**
2. انسخ هذه القيم:
   - **Project URL**: `https://xxx.supabase.co`
   - **Public anon key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 1.3 رفع Backend Functions
1. حمل [Supabase CLI](https://supabase.com/docs/guides/cli)
2. في terminal اكتب:
```bash
supabase login
supabase init
supabase functions deploy server
```

---

## 🌐 المرحلة 2: نشر التطبيق على Vercel

### 2.1 رفع الكود إلى GitHub
1. اذهب إلى [github.com](https://github.com)
2. أنشئ مستودع جديد بالاسم `storeyy-app`
3. ارفع جميع ملفات التطبيق

### 2.2 ربط Vercel بـ GitHub
1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل دخول بـ GitHub
3. اضغط "New Project"
4. اختر `storeyy-app` من GitHub
5. اضغط "Import"

### 2.3 إضافة متغيرات البيئة
في صفحة إعدادات Vercel:
1. اذهب إلى **Settings** → **Environment Variables**
2. أضف:
   - `SUPABASE_URL` = قيمة Project URL من Supabase
   - `SUPABASE_ANON_KEY` = قيمة Public anon key من Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` = قيمة Service role key من Supabase

### 2.4 النشر
1. اضغط "Deploy"
2. انتظر حتى انتهاء النشر
3. ستحصل على رابط التطبيق: `https://storeyy-app.vercel.app`

---

## 📱 المرحلة 3: تحويل إلى تطبيق موبايل

### 3.1 تثبيت كـ PWA (الطريقة الأسهل)

**على iPhone:**
1. افتح Safari
2. اذهب إلى رابط التطبيق
3. اضغط زر "Share" 
4. اختر "Add to Home Screen"
5. اضغط "Add"

**على Android:**
1. افتح Chrome
2. اذهب إلى رابط التطبيق
3. اضغط القائمة (3 نقاط)
4. اختر "Add to Home screen"
5. اضغط "Add"

### 3.2 تطبيق موبايل حقيقي (متقدم)
لتطبيق على متاجر التطبيقات:
1. استخدم [Capacitor](https://capacitorjs.com/) أو [React Native](https://reactnative.dev/)
2. أو استخدم خدمة مثل [PWA Builder](https://www.pwabuilder.com/)

---

## 🔄 المرحلة 4: التحديثات التلقائية

### 4.1 إعداد التحديثات
التطبيق يتحدث تلقائياً كل 30 ثانية لمزامنة البيانات بين المستخدمين.

### 4.2 التحديثات اليدوية
لتحديث التطبيق:
1. ادفع التغييرات إلى GitHub
2. Vercel سيقوم بالنشر تلقائياً
3. المستخدمون سيحصلون على التحديث في المتصفح

---

## 💡 نصائح مهمة

### الأمان
- لا تشارك Service Role Key مع أحد
- استخدم HTTPS دائماً
- فعل Row Level Security في Supabase

### الأداء
- التطبيق يعمل بدون إنترنت جزئياً
- البيانات تُحفظ محلياً
- التزامن يحدث عند الاتصال

### المتابعة
- تابع الأخطاء في Vercel Dashboard
- تابع الاستخدام في Supabase Dashboard
- اعمل backup للبيانات دورياً

---

## 🎯 الاستخدام المشترك

بعد النشر، يمكن لأي شخص:
1. الوصول للتطبيق عبر الرابط
2. تثبيته على الهاتف
3. استخدامه مع مزامنة فورية
4. رؤية التحديثات من الطرف الآخر

**رابط التطبيق:** `https://storeyy-app.vercel.app`

---

## 🆘 المساعدة

إذا واجهت مشاكل:
1. تحقق من Console في المتصفح
2. تحقق من Logs في Vercel
3. تحقق من Database في Supabase
4. أعد تشغيل التطبيق

---

## 📞 الدعم

للحصول على مساعدة إضافية:
- [وثائق Supabase](https://supabase.com/docs)
- [وثائق Vercel](https://vercel.com/docs)
- [دعم GitHub](https://github.com/support)