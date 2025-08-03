export function AppHeader() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 text-white p-8 rounded-2xl mb-6 shadow-xl">
      {/* خلفية متدرجة مع تأثيرات */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
      
      <div className="relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
          <div className="w-8 h-8 bg-white rounded-lg shadow-lg flex items-center justify-center">
            <span className="text-blue-600 font-bold text-lg">S</span>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2 tracking-wide">
          Storeyy App
        </h1>
        <p className="text-blue-100 text-sm font-medium opacity-90">
          نظام إدارة المخازن الذكي
        </p>
        
        {/* شريط زخرفي */}
        <div className="flex justify-center mt-4">
          <div className="h-1 w-16 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"></div>
        </div>
      </div>
    </div>
  );
}