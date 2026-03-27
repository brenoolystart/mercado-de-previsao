
-- Function to notify all admins about important platform events
CREATE OR REPLACE FUNCTION public.notify_admins_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_record RECORD;
  notif_title TEXT;
  notif_message TEXT;
  notif_type TEXT;
  notif_ref TEXT;
BEGIN
  -- Determine notification based on the trigger table
  IF TG_TABLE_NAME = 'pix_deposits' AND NEW.status = 'paid' THEN
    notif_type := 'admin_deposit';
    notif_title := '💰 Novo Depósito Confirmado';
    notif_message := 'Depósito de R$ ' || ROUND(NEW.amount::numeric, 2) || ' confirmado via PIX';
    notif_ref := 'admin:transactions';
  ELSIF TG_TABLE_NAME = 'pix_withdrawals' AND NEW.status = 'pending' THEN
    notif_type := 'admin_withdrawal';
    notif_title := '💸 Solicitação de Saque';
    notif_message := 'Novo saque de R$ ' || ROUND(NEW.amount::numeric, 2) || ' aguardando aprovação';
    notif_ref := 'admin:withdrawals';
  ELSIF TG_TABLE_NAME = 'profiles' AND TG_OP = 'INSERT' THEN
    notif_type := 'admin_signup';
    notif_title := '👤 Novo Usuário';
    notif_message := COALESCE(NEW.full_name, 'Usuário') || ' acabou de se cadastrar na plataforma';
    notif_ref := 'admin:users';
  ELSE
    RETURN NEW;
  END IF;

  -- Send notification to all admins
  FOR admin_record IN 
    SELECT user_id FROM public.user_roles WHERE role IN ('super_admin', 'admin', 'moderator')
  LOOP
    -- Don't notify the user who triggered the event
    IF admin_record.user_id IS DISTINCT FROM NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, reference_id)
      VALUES (admin_record.user_id, notif_type, notif_title, notif_message, notif_ref);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Trigger on paid deposits
CREATE TRIGGER notify_admins_on_deposit
AFTER UPDATE ON public.pix_deposits
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'paid')
EXECUTE FUNCTION public.notify_admins_event();

-- Trigger on new withdrawal requests
CREATE TRIGGER notify_admins_on_withdrawal
AFTER INSERT ON public.pix_withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_event();

-- Trigger on new user signup
CREATE TRIGGER notify_admins_on_signup
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_event();
