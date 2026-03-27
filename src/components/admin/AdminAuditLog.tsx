import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, RefreshCw, Filter, Eye, Download, FileText, Shield, Database } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  old_data: unknown;
  new_data: unknown;
  created_at: string;
  admin_name?: string;
}

export function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!error && data) {
      const adminIds = [...new Set(data.map(l => l.admin_user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', adminIds);

      const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      setLogs(data.map(l => ({ ...l, admin_name: nameMap.get(l.admin_user_id) || undefined })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_table?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action.includes(actionFilter);
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('create') || action.includes('insert')) return <Badge className="bg-green-500 text-white">Criar</Badge>;
    if (action.includes('update') || action.includes('edit') || action.includes('role') || action.includes('balance')) return <Badge className="bg-blue-500 text-white">Atualizar</Badge>;
    if (action.includes('delete') || action.includes('remove') || action.includes('cancel')) return <Badge variant="destructive">Remover</Badge>;
    if (action.includes('resolve')) return <Badge className="bg-purple-500 text-white">Resolver</Badge>;
    return <Badge variant="secondary">{action}</Badge>;
  };

  const viewDetails = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const exportLogs = () => {
    const csv = ['Data,Admin,Ação,Tabela,Target ID', ...filteredLogs.map(l =>
      `"${l.created_at}","${l.admin_name || l.admin_user_id}","${l.action}","${l.target_table || ''}","${l.target_id || ''}"`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit_log_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
  };

  const uniqueActions = [...new Set(logs.map(l => l.action))];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total de Logs</span>
            </div>
            <p className="text-xl font-bold">{logs.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Admins Ativos</span>
            </div>
            <p className="text-xl font-bold">{new Set(logs.map(l => l.admin_user_id)).size}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Tabelas Afetadas</span>
            </div>
            <p className="text-xl font-bold">{new Set(logs.map(l => l.target_table).filter(Boolean)).size}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Log de Auditoria</CardTitle>
              <CardDescription>Histórico de ações administrativas</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportLogs}><Download className="h-4 w-4 mr-1" />CSV</Button>
              <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar ação, tabela, admin..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-1" /><SelectValue placeholder="Filtrar ação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {uniqueActions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Tabela</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="text-right">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum log encontrado</TableCell></TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{format(new Date(log.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(log.created_at), 'HH:mm:ss')}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-primary" />
                          <span className="text-sm">{log.admin_name || log.admin_user_id.slice(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        {log.target_table ? <Badge variant="outline">{log.target_table}</Badge> : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {log.target_id ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">{log.target_id.slice(0, 12)}...</code>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => viewDetails(log)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Ação</p>
                  <p className="font-medium text-sm">{selectedLog.action}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Admin</p>
                  <p className="font-medium text-sm">{selectedLog.admin_name || selectedLog.admin_user_id.slice(0, 12)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Tabela</p>
                  <p className="font-medium text-sm">{selectedLog.target_table || '-'}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="font-medium text-sm">{format(new Date(selectedLog.created_at), "dd/MM/yyyy 'às' HH:mm:ss")}</p>
                </div>
              </div>
              {selectedLog.old_data && (
                <div>
                  <p className="text-sm font-medium mb-1 text-destructive">Dados Anteriores</p>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-32">
                    {typeof selectedLog.old_data === 'string' ? selectedLog.old_data : JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.new_data && (
                <div>
                  <p className="text-sm font-medium mb-1 text-green-500">Dados Novos</p>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-32">
                    {typeof selectedLog.new_data === 'string' ? selectedLog.new_data : JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
