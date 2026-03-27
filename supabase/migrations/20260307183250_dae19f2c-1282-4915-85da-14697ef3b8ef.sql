-- Fix Paulo's wallet balance (deposit of R$25 was confirmed but wallet not credited)
UPDATE wallets 
SET balance = 25, total_deposited = 25, updated_at = now()
WHERE id = '3e0d9737-358f-457d-96c9-f79097428953';

-- Also insert the missing transaction record
INSERT INTO transactions (user_id, wallet_id, type, amount, balance_after, description, reference_id)
VALUES (
  '26de97a2-72d1-4847-8153-5a112a17fee8',
  '3e0d9737-358f-457d-96c9-f79097428953',
  'deposit',
  25,
  25,
  'Depósito via PIX - DEP-1772128906267-a8q2xi (corrigido manualmente)',
  '614018d8-60e4-4c1b-9c1c-c2b03f55e70d'
);

-- Update deposit status to 'paid' for consistency
UPDATE pix_deposits SET status = 'paid' WHERE id = '614018d8-60e4-4c1b-9c1c-c2b03f55e70d'