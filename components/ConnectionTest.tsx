import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Wifi, WifiOff, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function ConnectionTest() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<any>(null);

  const testConnection = async () => {
    setIsConnecting(true);
    setStatus('idle');
    setMessage('');

    try {
      // اختبار الاتصال بـ Supabase
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-02c09bb0/medicines`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage('الاتصال ناجح! السيرفر يعمل بشكل طبيعي');
        setDetails({
          medicinesCount: result.data?.length || 0,
          serverUrl: `https://${projectId}.supabase.co/functions/v1/make-server-02c09bb0`,
          timestamp: new Date().toLocaleString('ar-EG')
        });
      } else {
        setStatus('error');
        setMessage('خطأ في الاستجابة من السيرفر');
        setDetails({ error: result.error });
      }
    } catch (error) {
      setStatus('error');
      setMessage('خطأ في الاتصال بالسيرفر');
      setDetails({ 
        error: error.message,
        projectId,
        hasPublicKey: !!publicAnonKey 
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              {status === 'idle' ? (
                <Wifi className="w-5 h-5 text-gray-500" />
              ) : status === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <h3 className="text-lg font-semibold text-gray-800">اختبار الاتصال</h3>
            </div>
            
            {status !== 'idle' && (
              <Badge 
                variant={status === 'success' ? 'default' : 'destructive'}
                className={status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
              >
                {status === 'success' ? 'متصل' : 'منقطع'}
              </Badge>
            )}
          </div>

          <Button
            onClick={testConnection}
            disabled={isConnecting}
            variant="outline"
            className={`w-full ${
              status === 'success' 
                ? 'border-green-300 text-green-700 hover:bg-green-50' 
                : status === 'error'
                ? 'border-red-300 text-red-700 hover:bg-red-50'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              {isConnecting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : status === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : status === 'error' ? (
                <WifiOff className="w-4 h-4" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
              <span>
                {isConnecting ? 'جاري الاختبار...' : 'اختبار الاتصال'}
              </span>
            </div>
          </Button>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              status === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {details && (
            <div className="text-xs text-gray-600 space-y-1">
              {details.medicinesCount !== undefined && (
                <div>عدد الأدوية في قاعدة البيانات: {details.medicinesCount}</div>
              )}
              {details.timestamp && (
                <div>وقت آخر اختبار: {details.timestamp}</div>
              )}
              {details.error && (
                <div className="text-red-600 font-mono bg-red-50 p-2 rounded border">
                  {details.error}
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>قاعدة البيانات: Supabase</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>المضيف: Vercel</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>التطبيق: PWA جاهز</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}