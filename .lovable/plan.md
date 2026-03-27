
Objetivo: corrigir o módulo de Gateway para que o valor do caixa não “suma”, não peça aporte indevido e reflita corretamente a operação.

O que eu encontrei
- Hoje o valor do caixa vem de `platform_settings.key = 'gateway_balance'`.
- No banco, esse valor está salvo como `0`.
- O total de saldo dos usuários também está `0` neste momento, então o alerta atual não está vindo de passivo real agora, e sim do fato de o campo do caixa estar zerado/manual.
- O fluxo “Depositar no Caixa” está inconsistente: ele gera um PIX comum e o webhook credita a carteira do usuário, não o caixa do gateway.
- O campo aceita texto livre e o parse atual é frágil para formato brasileiro. Ex.: `2.640` pode ser interpretado errado.
- O salvamento do caixa hoje usa `upsert`, mas a UI não trata erro de forma robusta; então pode parecer que salvou mesmo quando falha.

Plano de correção
1. Tornar o caixa um fluxo confiável
- Manter um saldo persistido do gateway, mas com gravação segura e validação explícita.
- Restaurar o valor inicial para `R$ 2.640,00` como saldo atual do caixa, já que foi o valor informado por você.

2. Corrigir entrada e exibição de moeda
- Ajustar o input do caixa para aceitar formato brasileiro corretamente (`2.640,00`, `2640`, `2640,00`) sem salvar valor errado.
- Exibir o valor formatado de forma consistente no painel.

3. Separar depósito de usuário vs. aporte no caixa
- Adicionar um identificador no registro de depósito para distinguir:
  - depósito para carteira do usuário
  - aporte administrativo no caixa
- Quando o admin usar “Depositar no Caixa”, o backend vai registrar esse depósito como aporte de caixa, não como crédito de carteira.

4. Corrigir o webhook do PIX
- Se o depósito for do tipo “carteira”, continua creditando `wallets`.
- Se for do tipo “caixa”, atualiza o saldo do gateway e registra auditoria, sem mexer na carteira do usuário.
- Isso elimina o cenário em que o painel pede para “colocar” valor mesmo após um aporte administrativo.

5. Melhorar integridade e feedback
- Tratar erro real no salvar do caixa e mostrar mensagem correta.
- Evitar sucesso falso na UI.
- Registrar ação administrativa no log quando o saldo do caixa for alterado manualmente ou por PIX administrativo.

6. Ajustes de banco
- Criar a estrutura mínima para classificar depósitos administrativos.
- Garantir política/RLS compatível com o fluxo administrativo atual.
- Opcionalmente, eu recomendaria também criar um histórico de movimentos do caixa para auditoria futura, em vez de depender só de um valor solto em `platform_settings`.

Arquivos/áreas que serão mexidos
- `src/components/admin/AdminGateway.tsx`
- `supabase/functions/generate-pix/index.ts`
- `supabase/functions/pixup-webhook/index.ts`
- nova migration no banco para suportar o tipo/finalidade do depósito
- possivelmente `admin_audit_log` para registrar o movimento

Resultado esperado
- O Gateway volta a mostrar `R$ 2.640,00` como caixa atual.
- O painel não vai mais “sumir” com esse valor por erro de parse/formatação.
- “Depositar no Caixa” passa a abastecer o caixa de verdade.
- O alerta de liquidez passa a refletir a situação real, e não um fluxo quebrado.

Detalhes técnicos
- Causa principal: o caixa hoje é manual e desacoplado do fluxo de PIX administrativo.
- Causa secundária: parsing monetário inadequado para locale pt-BR.
- Risco atual: aporte administrativo cair na carteira do usuário em vez do caixa, distorcendo financeiro e liquidez.
- Melhor desenho: `pix_deposits` com finalidade/tipo + webhook roteando crédito para o destino correto.

Se eu implementar, vou seguir nessa ordem:
1. migration do tipo/finalidade do depósito
2. ajuste do `generate-pix`
3. ajuste do `pixup-webhook`
4. correção do input/salvamento no `AdminGateway`
5. restauração do saldo inicial para `2640`
6. validação completa do fluxo no painel administrativo
