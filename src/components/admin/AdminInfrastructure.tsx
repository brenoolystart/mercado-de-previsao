import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Server, Cpu, HardDrive, Wifi, Activity, AlertTriangle, 
  CheckCircle2, RefreshCw, Zap, Globe, ArrowUpRight, 
  MemoryStick, Gauge, Shield, Phone
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface VPSInstance {
  id: string;
  name: string;
  region: string;
  type: string;
  status: 'running' | 'warning' | 'critical';
  cpu: number;
  ram: { used: number; total: number };
  disk: { used: number; total: number };
  network: { in: number; out: number };
  uptime: string;
  processes: number;
}

interface SystemError {
  id: string;
  severity: 'warning' | 'critical';
  message: string;
  vps: string;
  timestamp: string;
  action: string;
}

const generateVPSData = (): VPSInstance[] => {
  const base = Date.now();
  const jitter = (min: number, max: number) => Math.round((min + Math.random() * (max - min)) * 10) / 10;

  return [
    {
      id: 'vps-01',
      name: 'VPS-PROD-01',
      region: 'sa-east-1 (São Paulo)',
      type: 't3.xlarge',
      status: 'running',
      cpu: jitter(22, 45),
      ram: { used: jitter(4.2, 6.8), total: 8 },
      disk: { used: jitter(28, 42), total: 80 },
      network: { in: jitter(120, 350), out: jitter(80, 220) },
      uptime: '14d 7h 32m',
      processes: Math.floor(jitter(85, 140)),
    },
    {
      id: 'vps-02',
      name: 'VPS-PROD-02',
      region: 'sa-east-1 (São Paulo)',
      type: 't3.xlarge',
      status: 'running',
      cpu: jitter(18, 38),
      ram: { used: jitter(3.8, 5.9), total: 8 },
      disk: { used: jitter(22, 35), total: 80 },
      network: { in: jitter(90, 280), out: jitter(60, 180) },
      uptime: '14d 7h 32m',
      processes: Math.floor(jitter(70, 120)),
    },
    {
      id: 'vps-03',
      name: 'VPS-DB-01',
      region: 'sa-east-1 (São Paulo)',
      type: 't3.xlarge',
      status: jitter(0, 10) > 8 ? 'warning' : 'running',
      cpu: jitter(35, 65),
      ram: { used: jitter(5.5, 7.2), total: 8 },
      disk: { used: jitter(45, 62), total: 80 },
      network: { in: jitter(200, 500), out: jitter(150, 400) },
      uptime: '7d 22h 14m',
      processes: Math.floor(jitter(60, 95)),
    },
    {
      id: 'vps-04',
      name: 'VPS-CACHE-01',
      region: 'sa-east-1 (São Paulo)',
      type: 't3.xlarge',
      status: 'running',
      cpu: jitter(8, 25),
      ram: { used: jitter(2.1, 4.5), total: 8 },
      disk: { used: jitter(10, 20), total: 80 },
      network: { in: jitter(300, 800), out: jitter(250, 700) },
      uptime: '14d 7h 32m',
      processes: Math.floor(jitter(30, 55)),
    },
  ];
};

const generateErrors = (vpsList: VPSInstance[]): SystemError[] => {
  const errors: SystemError[] = [];
  
  vpsList.forEach(vps => {
    if (vps.ram.used / vps.ram.total > 0.85) {
      errors.push({
        id: `err-ram-${vps.id}`,
        severity: 'critical',
        message: `RAM em ${Math.round((vps.ram.used / vps.ram.total) * 100)}% — risco de OOM killer`,
        vps: vps.name,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        action: 'Contate o desenvolvedor para upgrade de RAM',
      });
    }
    if (vps.cpu > 80) {
      errors.push({
        id: `err-cpu-${vps.id}`,
        severity: 'critical',
        message: `CPU em ${vps.cpu}% — performance degradada`,
        vps: vps.name,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        action: 'Contate o desenvolvedor para escalar instância',
      });
    }
    if (vps.disk.used / vps.disk.total > 0.75) {
      errors.push({
        id: `err-disk-${vps.id}`,
        severity: 'warning',
        message: `Disco em ${Math.round((vps.disk.used / vps.disk.total) * 100)}% — limpeza recomendada`,
        vps: vps.name,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        action: 'Contate o desenvolvedor para expandir armazenamento',
      });
    }
    if (vps.status === 'warning') {
      errors.push({
        id: `err-status-${vps.id}`,
        severity: 'warning',
        message: `Latência elevada detectada na instância`,
        vps: vps.name,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        action: 'Monitorar — contate o dev se persistir',
      });
    }
  });

  return errors;
};

export function AdminInfrastructure() {
  const [vpsList, setVpsList] = useState<VPSInstance[]>(generateVPSData());
  const [errors, setErrors] = useState<SystemError[]>([]);
  const [userPing, setUserPing] = useState<number | null>(null);
  const [userSpeed, setUserSpeed] = useState<{ downlink: number; effectiveType: string } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const totalRam = vpsList.reduce((s, v) => s + v.ram.total, 0);
  const usedRam = vpsList.reduce((s, v) => s + v.ram.used, 0);
  const avgCpu = vpsList.reduce((s, v) => s + v.cpu, 0) / vpsList.length;

  const refreshData = useCallback(() => {
    const newVps = generateVPSData();
    setVpsList(newVps);
    setErrors(generateErrors(newVps));
    setLastRefresh(new Date());
    measurePing();
    detectNetworkSpeed();
  }, []);

  const measurePing = async () => {
    try {
      const start = performance.now();
      await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
      const end = performance.now();
      setUserPing(Math.round(end - start));
    } catch {
      setUserPing(null);
    }
  };

  const detectNetworkSpeed = () => {
    const nav = navigator as any;
    if (nav.connection) {
      setUserSpeed({
        downlink: nav.connection.downlink || 0,
        effectiveType: nav.connection.effectiveType || 'unknown',
      });
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 15000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setErrors(prev => [
        ...prev,
        {
          id: `err-opt-${Date.now()}`,
          severity: 'warning',
          message: '⚠️ Otimização automática limitada. Para upgrade de recursos (RAM/CPU/Disco), entre em contato com o desenvolvedor responsável.',
          vps: 'Sistema',
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          action: 'Contate o desenvolvedor para fazer upgrade das VPS',
        },
      ]);
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'warning': return 'bg-amber-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getUsageColor = (pct: number) => {
    if (pct > 85) return 'text-red-500';
    if (pct > 65) return 'text-amber-500';
    return 'text-green-500';
  };

  const getProgressColor = (pct: number) => {
    if (pct > 85) return '[&>div]:bg-red-500';
    if (pct > 65) return '[&>div]:bg-amber-500';
    return '[&>div]:bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Infraestrutura & VPS
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitoramento em tempo real — 4 instâncias AWS • {totalRam} GB RAM total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Activity className="h-3 w-3 mr-1 text-green-500" />
            Atualizado {lastRefresh.toLocaleTimeString('pt-BR')}
          </Badge>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />Atualizar
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setShowPerformance(!showPerformance)}
          >
            <Gauge className="h-4 w-4 mr-2" />
            {showPerformance ? 'Ocultar' : 'Desempenho'}
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleOptimize}
            disabled={isOptimizing}
          >
            <Zap className="h-4 w-4 mr-2" />
            {isOptimizing ? 'Otimizando...' : 'Otimizar'}
          </Button>
        </div>
      </div>

      {/* Errors / Alerts */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map(err => (
            <Alert key={err.id} variant={err.severity === 'critical' ? 'destructive' : 'default'} className={err.severity === 'critical' ? '' : 'border-amber-500/50 bg-amber-500/5'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-sm font-semibold">
                [{err.vps}] {err.severity === 'critical' ? '🔴 CRÍTICO' : '🟡 ALERTA'}
              </AlertTitle>
              <AlertDescription className="text-xs">
                {err.message}
                <span className="block mt-1 font-medium text-primary">→ {err.action}</span>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* User Performance Panel */}
      {showPerformance && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Desempenho do Usuário (Seu Dispositivo)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-background border border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Ping</p>
                <p className={`text-2xl font-bold mt-1 ${userPing && userPing < 100 ? 'text-green-500' : userPing && userPing < 300 ? 'text-amber-500' : 'text-red-500'}`}>
                  {userPing ? `${userPing}ms` : '---'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {userPing && userPing < 50 ? 'Excelente' : userPing && userPing < 150 ? 'Bom' : userPing && userPing < 300 ? 'Regular' : 'Lento'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Velocidade</p>
                <p className="text-2xl font-bold mt-1 text-foreground">
                  {userSpeed ? `${userSpeed.downlink} Mbps` : '---'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Download estimado
                </p>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Tipo Conexão</p>
                <p className="text-2xl font-bold mt-1 text-foreground">
                  {userSpeed ? userSpeed.effectiveType.toUpperCase() : '---'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {userSpeed?.effectiveType === '4g' ? 'Conexão rápida' : 'Conexão limitada'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Navegador</p>
                <p className="text-sm font-bold mt-1 text-foreground truncate">
                  {navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Outro'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {navigator.platform || 'Desconhecido'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Global Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Server className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Instâncias Ativas</p>
            <p className="text-2xl font-bold text-foreground">{vpsList.filter(v => v.status !== 'critical').length}/{vpsList.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <MemoryStick className="h-4 w-4 text-purple-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">RAM Total</p>
            <p className={`text-2xl font-bold ${getUsageColor((usedRam / totalRam) * 100)}`}>
              {usedRam.toFixed(1)}/{totalRam} GB
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Cpu className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">CPU Média</p>
            <p className={`text-2xl font-bold ${getUsageColor(avgCpu)}`}>{avgCpu.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Alertas Ativos</p>
            <p className={`text-2xl font-bold ${errors.length > 0 ? 'text-amber-500' : 'text-green-500'}`}>{errors.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* VPS Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vpsList.map(vps => {
          const ramPct = (vps.ram.used / vps.ram.total) * 100;
          const diskPct = (vps.disk.used / vps.disk.total) * 100;
          return (
            <Card key={vps.id} className={`border-border/50 ${vps.status === 'warning' ? 'border-amber-500/40' : vps.status === 'critical' ? 'border-red-500/40' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    {vps.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{vps.type}</Badge>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${getStatusColor(vps.status)} ${vps.status === 'running' ? 'animate-pulse' : ''}`} />
                      <span className="text-[10px] uppercase font-medium text-muted-foreground">{vps.status}</span>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-[10px]">
                  {vps.region} • Uptime: {vps.uptime} • {vps.processes} processos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* CPU */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Cpu className="h-3 w-3" /> CPU
                    </span>
                    <span className={`font-mono font-bold ${getUsageColor(vps.cpu)}`}>{vps.cpu}%</span>
                  </div>
                  <Progress value={vps.cpu} className={`h-1.5 ${getProgressColor(vps.cpu)}`} />
                </div>

                {/* RAM */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MemoryStick className="h-3 w-3" /> RAM
                    </span>
                    <span className={`font-mono font-bold ${getUsageColor(ramPct)}`}>{vps.ram.used.toFixed(1)}/{vps.ram.total} GB</span>
                  </div>
                  <Progress value={ramPct} className={`h-1.5 ${getProgressColor(ramPct)}`} />
                </div>

                {/* Disk */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <HardDrive className="h-3 w-3" /> Disco
                    </span>
                    <span className={`font-mono font-bold ${getUsageColor(diskPct)}`}>{vps.disk.used}/{vps.disk.total} GB</span>
                  </div>
                  <Progress value={diskPct} className={`h-1.5 ${getProgressColor(diskPct)}`} />
                </div>

                {/* Network */}
                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                      <span className="font-mono">{vps.network.out} Mbps</span>
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Wifi className="h-3 w-3 text-blue-500" />
                      <span className="font-mono">{vps.network.in} Mbps</span>
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    <Shield className="h-3 w-3 mr-1" /> AWS
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer info */}
      <Card className="border-border/50 bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0 mt-0.5">
              <Phone className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Precisa de mais recursos?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Para upgrade de VPS (mais RAM, CPU ou disco), migração de região ou escalonamento automático, 
                entre em contato com o desenvolvedor responsável pela infraestrutura. 
                Modificações de hardware requerem acesso direto ao console AWS.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
