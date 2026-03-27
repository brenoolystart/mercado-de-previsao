import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DollarSign, Plus, Trash2, CalendarIcon, Calculator, PieChart,
  FileSpreadsheet, TrendingUp, TrendingDown, RefreshCw, Upload, X
} from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  service_name: string | null;
  expense_date: string;
  notes: string | null;
  created_by: string;
  created_at: string;
}

const CATEGORIES = [
  { value: 'servidor', label: '🖥️ Servidor / VPS', color: 'hsl(220, 70%, 50%)' },
  { value: 'dominio', label: '🌐 Domínio / DNS', color: 'hsl(150, 60%, 45%)' },
  { value: 'api', label: '🔌 APIs / Integrações', color: 'hsl(280, 60%, 55%)' },
  { value: 'design', label: '🎨 Design / UI', color: 'hsl(340, 70%, 55%)' },
  { value: 'dev', label: '💻 Desenvolvimento', color: 'hsl(200, 70%, 50%)' },
  { value: 'marketing', label: '📢 Marketing', color: 'hsl(30, 80%, 55%)' },
  { value: 'gateway', label: '💳 Gateway Pagamento', color: 'hsl(0, 70%, 55%)' },
  { value: 'licenca', label: '📄 Licenças / Software', color: 'hsl(60, 60%, 45%)' },
  { value: 'outros', label: '📦 Outros', color: 'hsl(0, 0%, 50%)' },
];

const getCategoryInfo = (val: string) => CATEGORIES.find(c => c.value === val) || CATEGORIES[CATEGORIES.length - 1];

export function AdminFinanceiro() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrev, setCalcPrev] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  // Form state
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('outros');
  const [formAmount, setFormAmount] = useState('');
  const [formService, setFormService] = useState('');
  const [formDate, setFormDate] = useState<Date>(new Date());
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('platform_expenses')
      .select('*')
      .order('expense_date', { ascending: false });
    if (data) setExpenses(data as Expense[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleSave = async () => {
    if (!formDesc.trim() || !formAmount) {
      toast({ title: 'Preencha descrição e valor', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('platform_expenses').insert({
      description: formDesc.trim(),
      category: formCategory,
      amount: parseFloat(formAmount.replace(',', '.')),
      service_name: formService.trim() || null,
      expense_date: format(formDate, 'yyyy-MM-dd'),
      notes: formNotes.trim() || null,
      created_by: user?.id,
    } as any);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ Gasto registrado!' });
      resetForm();
      fetchExpenses();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este gasto?')) return;
    await supabase.from('platform_expenses').delete().eq('id', id);
    toast({ title: 'Gasto excluído' });
    fetchExpenses();
  };

  const handleImportCSV = async () => {
    if (!importText.trim()) return;
    const lines = importText.trim().split('\n');
    let imported = 0;
    for (const line of lines) {
      const parts = line.split(';').map(s => s.trim());
      if (parts.length < 3) continue;
      const [date, desc, amount, category, service] = parts;
      const parsedDate = date || format(new Date(), 'yyyy-MM-dd');
      const parsedAmount = parseFloat((amount || '0').replace(',', '.'));
      if (isNaN(parsedAmount) || parsedAmount <= 0) continue;

      await supabase.from('platform_expenses').insert({
        description: desc || 'Importado',
        category: category || 'outros',
        amount: parsedAmount,
        service_name: service || null,
        expense_date: parsedDate,
        created_by: user?.id,
      } as any);
      imported++;
    }
    toast({ title: `✅ ${imported} gastos importados!` });
    setImportText('');
    setShowImport(false);
    fetchExpenses();
  };

  const resetForm = () => {
    setFormDesc(''); setFormCategory('outros'); setFormAmount('');
    setFormService(''); setFormDate(new Date()); setFormNotes('');
    setShowForm(false);
  };

  // Calculator
  const calcInput = (val: string) => {
    setCalcDisplay(prev => prev === '0' ? val : prev + val);
  };
  const calcOperation = (op: string) => {
    setCalcPrev(parseFloat(calcDisplay));
    setCalcOp(op);
    setCalcDisplay('0');
  };
  const calcEquals = () => {
    if (calcPrev === null || !calcOp) return;
    const curr = parseFloat(calcDisplay);
    let result = 0;
    switch (calcOp) {
      case '+': result = calcPrev + curr; break;
      case '-': result = calcPrev - curr; break;
      case '*': result = calcPrev * curr; break;
      case '/': result = curr !== 0 ? calcPrev / curr : 0; break;
    }
    setCalcDisplay(result.toString());
    setCalcPrev(null);
    setCalcOp(null);
  };
  const calcClear = () => { setCalcDisplay('0'); setCalcPrev(null); setCalcOp(null); };
  const calcUseValue = () => {
    setFormAmount(calcDisplay);
    setShowCalc(false);
  };

  // Stats
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const thisMonthExpenses = expenses
    .filter(e => e.expense_date.startsWith(format(new Date(), 'yyyy-MM')))
    .reduce((s, e) => s + Number(e.amount), 0);

  const categoryData = CATEGORIES.map(cat => {
    const total = expenses.filter(e => e.category === cat.value).reduce((s, e) => s + Number(e.amount), 0);
    return { name: cat.label, value: total, color: cat.color };
  }).filter(c => c.value > 0);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Financeiro — Controle de Gastos
          </h2>
          <p className="text-sm text-muted-foreground">Registre e acompanhe todos os custos da plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCalc(!showCalc)}>
            <Calculator className="h-4 w-4 mr-1" />{showCalc ? 'Fechar' : 'Calculadora'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImport(!showImport)}>
            <Upload className="h-4 w-4 mr-1" />Importar
          </Button>
          <Button variant="outline" size="sm" onClick={fetchExpenses}>
            <RefreshCw className="h-4 w-4 mr-1" />Atualizar
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1" />Novo Gasto
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Geral</p>
            <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Este Mês</p>
            <p className="text-xl font-bold text-primary mt-1">{formatCurrency(thisMonthExpenses)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Registros</p>
            <p className="text-xl font-bold text-foreground mt-1">{expenses.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Categorias</p>
            <p className="text-xl font-bold text-foreground mt-1">{categoryData.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Calculator */}
      {showCalc && (
        <Card className="border-primary/30 max-w-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Calculator className="h-4 w-4" /> Calculadora</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="bg-muted rounded-lg p-3 text-right font-mono text-xl text-foreground">{calcDisplay}</div>
            <div className="grid grid-cols-4 gap-1">
              {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(btn => (
                <Button
                  key={btn}
                  variant={['/','*','-','+'].includes(btn) ? 'secondary' : btn === '=' ? 'default' : 'outline'}
                  size="sm"
                  className="font-mono text-base"
                  onClick={() => {
                    if (btn === '=') calcEquals();
                    else if (['+','-','*','/'].includes(btn)) calcOperation(btn);
                    else calcInput(btn);
                  }}
                >{btn}</Button>
              ))}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="flex-1" onClick={calcClear}>Limpar</Button>
              <Button variant="default" size="sm" className="flex-1" onClick={calcUseValue}>Usar Valor</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import CSV */}
      {showImport && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Upload className="h-4 w-4" /> Importar Planilha (CSV)</CardTitle>
            <CardDescription className="text-xs">Formato: data;descrição;valor;categoria;serviço (uma linha por gasto)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder={`2025-01-15;Servidor AWS;250,00;servidor;Amazon AWS\n2025-01-20;Domínio .com.br;45,00;dominio;Registro.br`}
              rows={5}
              className="font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleImportCSV} disabled={!importText.trim()}>
                <Upload className="h-4 w-4 mr-1" />Importar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowImport(false); setImportText(''); }}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Expense Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Plus className="h-4 w-4" /> Registrar Gasto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder="Descrição *" value={formDesc} onChange={e => setFormDesc(e.target.value)} />
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Valor (R$) *" value={formAmount} onChange={e => setFormAmount(e.target.value)} type="text" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder="Serviço / Fornecedor" value={formService} onChange={e => setFormService(e.target.value)} />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !formDate && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {formDate ? format(formDate, 'dd/MM/yyyy') : 'Data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={formDate} onSelect={d => d && setFormDate(d)} className="p-3 pointer-events-auto" locale={ptBR} />
                </PopoverContent>
              </Popover>
              <Input placeholder="Observações" value={formNotes} onChange={e => setFormNotes(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Gasto'}</Button>
              <Button variant="ghost" onClick={resetForm}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pie Chart */}
        <Card className="border-border/50 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><PieChart className="h-4 w-4 text-primary" /> Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum gasto registrado</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <RechartsPie>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </RechartsPie>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Expense Table */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Histórico de Gastos</CardTitle>
            <CardDescription className="text-xs">{expenses.length} registros</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
            ) : expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum gasto registrado ainda</p>
            ) : (
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {expenses.map(exp => {
                  const cat = getCategoryInfo(exp.category);
                  return (
                    <div key={exp.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground truncate">{exp.description}</p>
                          <Badge variant="outline" className="text-[10px] shrink-0">{cat.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                          <span>{format(new Date(exp.expense_date + 'T12:00:00'), 'dd/MM/yyyy')}</span>
                          {exp.service_name && <span>• {exp.service_name}</span>}
                          {exp.notes && <span>• {exp.notes}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className="text-sm font-bold text-foreground">{formatCurrency(Number(exp.amount))}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(exp.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
