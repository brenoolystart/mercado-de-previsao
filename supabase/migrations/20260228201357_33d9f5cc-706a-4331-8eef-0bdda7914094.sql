
-- Table for platform development expenses
CREATE TABLE public.platform_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'outros',
  amount NUMERIC NOT NULL,
  service_name TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage expenses"
ON public.platform_expenses
FOR ALL
USING (is_admin(auth.uid()));

CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.platform_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
