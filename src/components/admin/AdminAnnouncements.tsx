import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Megaphone, Plus, Trash2, RefreshCw, AlertTriangle, Info, Bell, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export function AdminAnnouncements() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('info');
  const [expiresAt, setExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    setAnnouncements((data as Announcement[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: 'Preencha título e conteúdo', variant: 'destructive' });
      return;
    }
    setCreating(true);
    const { error } = await supabase.from('announcements').insert({
      title: title.trim(),
      content: content.trim(),
      type,
      created_by: user!.id,
      expires_at: expiresAt || null,
    });
    if (error) {
      toast({ title: 'Erro ao criar anúncio', variant: 'destructive' });
    } else {
      toast({ title: 'Anúncio publicado!' });
      setTitle(''); setContent(''); setExpiresAt('');
      setCreateOpen(false);
      fetchAnnouncements();
    }
    setCreating(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('announcements').update({ is_active: !current }).eq('id', id);
    fetchAnnouncements();
  };

  const deleteAnnouncement = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    toast({ title: 'Anúncio removido' });
    fetchAnnouncements();
  };

  const typeIcon = (t: string) => {
    switch (t) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'urgent': return <Bell className="h-4 w-4 text-destructive" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" />Anúncios</h2>
          <p className="text-sm text-muted-foreground">Comunique-se com os usuários da plataforma</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnnouncements}><RefreshCw className="h-4 w-4 mr-1" />Atualizar</Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" />Novo Anúncio</Button>
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Expira</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8"><RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : announcements.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum anúncio criado</TableCell></TableRow>
              ) : (
                announcements.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>{typeIcon(a.type)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{a.title}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[250px]">{a.content}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch checked={a.is_active} onCheckedChange={() => toggleActive(a.id, a.is_active)} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(a.created_at), 'dd/MM HH:mm', { locale: ptBR })}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.expires_at ? format(new Date(a.expires_at), 'dd/MM/yy') : '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => deleteAnnouncement(a.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Anúncio</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">ℹ️ Informação</SelectItem>
                  <SelectItem value="warning">⚠️ Aviso</SelectItem>
                  <SelectItem value="success">✅ Sucesso</SelectItem>
                  <SelectItem value="urgent">🔴 Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Manutenção programada" />
            </div>
            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Descreva o anúncio..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Expira em (opcional)</Label>
              <Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>{creating ? 'Publicando...' : 'Publicar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
