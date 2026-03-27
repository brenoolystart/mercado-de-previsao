import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, CheckCircle2, XCircle, Loader2, Upload, ScanFace } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AgeVerificationResult {
  approved: boolean;
  estimated_age?: number | null;
  confidence?: string;
  reason?: string;
}

interface AgeVerificationCameraProps {
  onVerified: (approved: boolean) => void;
}

type ScanPhase = 'idle' | 'positioning' | 'scanning' | 'analyzing' | 'done';

export function AgeVerificationCamera({ onVerified }: AgeVerificationCameraProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle');
  const [result, setResult] = useState<AgeVerificationResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  // Scan animation
  useEffect(() => {
    if (scanPhase !== 'scanning') {
      setScanProgress(0);
      return;
    }
    let frame: number;
    let start: number | null = null;
    const duration = 2500;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      setScanProgress(progress);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        // scanning done, capture and verify
        captureAndVerify();
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanPhase]);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setPhoto(null);
      setResult(null);
      setScanPhase('positioning');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setCameraError('Não foi possível acessar a câmera. Você pode enviar uma foto.');
      setScanPhase('idle');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  const startScan = () => {
    setScanPhase('scanning');
  };

  const captureAndVerify = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setPhoto(dataUrl);
    stopCamera();
    setScanPhase('analyzing');
    verifyPhoto(dataUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Erro', description: 'Selecione um arquivo de imagem.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhoto(dataUrl);
      setResult(null);
      setScanPhase('analyzing');
      verifyPhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const verifyPhoto = async (photoData: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-age-photo', {
        body: { photo: photoData },
      });

      if (error) throw error;

      const res = data as AgeVerificationResult;
      setResult(res);
      setScanPhase('done');
      onVerified(res.approved);

      if (res.approved) {
        toast({ title: '✅ Verificação aprovada', description: 'Idade confirmada. Prossiga com o cadastro.' });
      } else {
        toast({ title: '❌ Verificação não aprovada', description: res.reason || 'Tente novamente.', variant: 'destructive' });
      }
    } catch (err: any) {
      console.error(err);
      setScanPhase('idle');
      toast({ title: 'Erro na verificação', description: 'Não foi possível verificar. Tente novamente.', variant: 'destructive' });
    }
  };

  const reset = () => {
    setPhoto(null);
    setResult(null);
    setScanPhase('idle');
    stopCamera();
    onVerified(false);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm font-medium text-foreground mb-1 flex items-center justify-center gap-1.5">
          <ScanFace className="h-4 w-4" /> Verificação Facial de Idade
        </p>
        <p className="text-xs text-muted-foreground">
          {scanPhase === 'idle' && 'Escaneie seu rosto para confirmar que você tem 18+'}
          {scanPhase === 'positioning' && 'Encaixe seu rosto na moldura e pressione Escanear'}
          {scanPhase === 'scanning' && 'Escaneando... Mantenha-se parado'}
          {scanPhase === 'analyzing' && 'Analisando resultado...'}
          {scanPhase === 'done' && (result?.approved ? 'Verificação concluída!' : 'Verificação falhou')}
        </p>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

      {/* Idle state - show buttons */}
      {scanPhase === 'idle' && !cameraError && (
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={startCamera}>
            <ScanFace className="mr-2 h-4 w-4" /> Escanear Rosto
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Enviar Foto
          </Button>
        </div>
      )}

      {cameraError && (
        <div className="space-y-2">
          <p className="text-xs text-destructive text-center">{cameraError}</p>
          <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Enviar Foto
          </Button>
        </div>
      )}

      {/* Camera with face frame */}
      {(scanPhase === 'positioning' || scanPhase === 'scanning') && stream && (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border-2 border-primary/30 bg-black aspect-[4/3]">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />

            {/* Dark overlay with face cutout */}
            <div className="absolute inset-0 pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <mask id="faceMask">
                    <rect width="400" height="300" fill="white" />
                    <ellipse cx="200" cy="140" rx="80" ry="100" fill="black" />
                  </mask>
                </defs>
                <rect width="400" height="300" fill="rgba(0,0,0,0.55)" mask="url(#faceMask)" />
                {/* Face outline */}
                <ellipse cx="200" cy="140" rx="80" ry="100" fill="none"
                  stroke={scanPhase === 'scanning' ? 'hsl(142, 76%, 36%)' : 'hsl(var(--primary))'}
                  strokeWidth="2.5"
                  strokeDasharray={scanPhase === 'scanning' ? '0' : '8 4'}
                  className={scanPhase === 'positioning' ? 'animate-pulse' : ''}
                />
                {/* Corner brackets */}
                {[
                  'M 135 55 L 120 55 Q 115 55 115 60 L 115 75',
                  'M 265 55 L 280 55 Q 285 55 285 60 L 285 75',
                  'M 135 225 L 120 225 Q 115 225 115 220 L 115 205',
                  'M 265 225 L 280 225 Q 285 225 285 220 L 285 205',
                ].map((d, i) => (
                  <path key={i} d={d} fill="none"
                    stroke={scanPhase === 'scanning' ? 'hsl(142, 76%, 36%)' : 'hsl(var(--primary))'}
                    strokeWidth="3" strokeLinecap="round" />
                ))}
              </svg>
            </div>

            {/* Scanning line animation */}
            {scanPhase === 'scanning' && (
              <div
                className="absolute left-[25%] right-[25%] h-0.5 pointer-events-none transition-none"
                style={{
                  top: `${12 + scanProgress * 62}%`,
                  background: 'linear-gradient(90deg, transparent, hsl(142, 76%, 36%), hsl(142, 76%, 55%), hsl(142, 76%, 36%), transparent)',
                  boxShadow: '0 0 15px 3px hsla(142, 76%, 45%, 0.5)',
                }}
              />
            )}

            {/* Scan progress indicator */}
            {scanPhase === 'scanning' && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                {Math.round(scanProgress * 100)}%
              </div>
            )}
          </div>

          {scanPhase === 'positioning' && (
            <div className="flex gap-2">
              <Button type="button" onClick={startScan} className="flex-1">
                <ScanFace className="mr-2 h-4 w-4" /> Escanear
              </Button>
              <Button type="button" variant="ghost" onClick={() => { stopCamera(); setScanPhase('idle'); }}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Analyzing state */}
      {scanPhase === 'analyzing' && (
        <div className="space-y-3">
          {photo && (
            <div className="relative rounded-xl overflow-hidden border-2 border-primary/30 aspect-[4/3]">
              <img src={photo} alt="Selfie" className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="text-white text-sm font-medium">Analisando...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result state */}
      {scanPhase === 'done' && photo && result && (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border-2 aspect-[4/3]"
            style={{ borderColor: result.approved ? 'hsl(142, 76%, 36%)' : 'hsl(var(--destructive))' }}>
            <img src={photo} alt="Selfie" className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 ${result.approved ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {result.approved ? (
                <CheckCircle2 className="h-16 w-16 text-green-500 drop-shadow-lg" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500 drop-shadow-lg" />
              )}
              <span className={`text-sm font-bold px-3 py-1 rounded-full backdrop-blur-sm ${result.approved ? 'bg-green-500/30 text-white' : 'bg-red-500/30 text-white'}`}>
                {result.approved ? 'APROVADO' : 'REPROVADO'}
              </span>
            </div>
          </div>

          <p className={`text-xs text-center font-medium ${result.approved ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
            {result.reason}
          </p>

          {!result.approved && (
            <Button type="button" variant="outline" onClick={reset} className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" /> Tentar Novamente
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
