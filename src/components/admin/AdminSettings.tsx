import { useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, DollarSign, Users, Shield, Bell, Save, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AdminSettings() {
  const { platformSettings, updatePlatformSetting } = useAdmin();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(() => {
    const settingsMap: Record<string, unknown> = {};
    platformSettings.forEach(s => { try { settingsMap[s.key] = typeof s.value === 'string' ? JSON.parse(s.value as string) : s.value; } catch { settingsMap[s.key] = s.value; } });
    return settingsMap;
  });

  const handleSave = async () => { setSaving(true); for (const [key, value] of Object.entries(settings)) { await updatePlatformSetting(key, value); } toast({ title: 'Configurações salvas' }); setSaving(false); };
  const updateSetting = (key: string, value: unknown) => { setSettings(prev => ({ ...prev, [key]: value })); };

  return (
    <div className="space-y-6">
      <Card className="border-border/50"><CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Configurações da Plataforma</CardTitle></CardHeader><CardContent className="space-y-6"><div className="space-y-2"><Label>Nome da Plataforma</Label><Input value={settings.platform_name as string || 'OnChoice'} onChange={(e) => updateSetting('platform_name', e.target.value)} /></div><div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"><div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-500" /><div><p className="font-medium">Modo Manutenção</p><p className="text-sm text-muted-foreground">Desabilita acesso de usuários não-admin</p></div></div><Switch checked={settings.maintenance_mode === 'true' || settings.maintenance_mode === true} onCheckedChange={(checked) => updateSetting('maintenance_mode', checked)} /></div></CardContent></Card>
      <Card className="border-border/50"><CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />Configurações de Palpites</CardTitle></CardHeader><CardContent className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>Palpite Mínimo (R$)</Label><Input type="number" min="0" step="0.01" value={settings.min_bet_amount as number || 1} onChange={(e) => updateSetting('min_bet_amount', parseFloat(e.target.value))} /></div><div className="space-y-2"><Label>Palpite Máximo (R$)</Label><Input type="number" min="0" step="0.01" value={settings.max_bet_amount as number || 10000} onChange={(e) => updateSetting('max_bet_amount', parseFloat(e.target.value))} /></div></div><div className="space-y-2"><Label>Taxa da Plataforma (%)</Label><Input type="number" min="0" max="100" step="0.1" value={settings.platform_fee_percentage as number || 2.5} onChange={(e) => updateSetting('platform_fee_percentage', parseFloat(e.target.value))} /></div></CardContent></Card>
      <Card className="border-border/50"><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Configurações de Usuários</CardTitle></CardHeader><CardContent className="space-y-6"><div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium">Cadastro Habilitado</p></div></div><Switch checked={settings.registration_enabled === 'true' || settings.registration_enabled === true} onCheckedChange={(checked) => updateSetting('registration_enabled', checked)} /></div><div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"><div className="flex items-center gap-3"><Shield className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium">KYC Obrigatório</p></div></div><Switch checked={settings.kyc_required === 'true' || settings.kyc_required === true} onCheckedChange={(checked) => updateSetting('kyc_required', checked)} /></div></CardContent></Card>
      <div className="flex justify-end"><Button onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? 'Salvando...' : 'Salvar Todas as Configurações'}</Button></div>
    </div>
  );
}
