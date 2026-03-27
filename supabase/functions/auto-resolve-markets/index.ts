import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const POLYMARKET_API = 'https://gamma-api.polymarket.com';

Deno.serve(async (req) => {
  try {
    console.log('Auto-resolve: Starting check for resolved Polymarket markets...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Get all unique market_ids with pending bets
    const { data: pendingBets, error: betsError } = await supabase
      .from('bets')
      .select('market_id, market_title')
      .eq('status', 'pending');

    if (betsError) {
      console.error('Error fetching pending bets:', betsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch pending bets' }), { status: 500 });
    }

    if (!pendingBets || pendingBets.length === 0) {
      console.log('Auto-resolve: No pending bets found.');
      return new Response(JSON.stringify({ message: 'No pending bets', resolved: 0 }), { status: 200 });
    }

    // Get unique market IDs
    const uniqueMarketIds = [...new Set(pendingBets.map(b => b.market_id))];
    console.log(`Auto-resolve: Found ${uniqueMarketIds.length} unique markets with pending bets`);

    let totalResolved = 0;
    let marketsResolved = 0;

    // 2. Check each market on Polymarket
    for (const marketId of uniqueMarketIds) {
      try {
        // Query the Polymarket API for this specific market
        const resp = await fetch(`${POLYMARKET_API}/markets/${marketId}`, {
          headers: { 'Accept': 'application/json' },
        });

        if (!resp.ok) {
          console.warn(`Auto-resolve: Could not fetch market ${marketId}: ${resp.status}`);
          continue;
        }

        const market = await resp.json();

        // Check if market is resolved/closed
        // Polymarket uses: closed=true and has a resolution (outcomePrices with 0/1 values)
        if (!market.closed) {
          continue; // Market still open
        }

        // Determine winning position from outcome prices
        // For binary markets: outcomePrices is like ["1","0"] meaning Yes won, or ["0","1"] meaning No won
        let winningPosition: 'yes' | 'no' | null = null;

        try {
          if (market.outcomePrices) {
            const prices = JSON.parse(market.outcomePrices);
            if (prices.length >= 2) {
              const yesPrice = parseFloat(prices[0]);
              const noPrice = parseFloat(prices[1]);

              // A resolved market will have prices of exactly 1.0 and 0.0
              if (yesPrice >= 0.95 && noPrice <= 0.05) {
                winningPosition = 'yes';
              } else if (noPrice >= 0.95 && yesPrice <= 0.05) {
                winningPosition = 'no';
              }
              // If neither is clearly 0/1, market might be resolved differently (e.g., voided)
            }
          }
        } catch (e) {
          console.warn(`Auto-resolve: Could not parse outcomePrices for ${marketId}:`, e);
        }

        if (!winningPosition) {
          console.log(`Auto-resolve: Market ${marketId} is closed but no clear winner detected, skipping.`);
          continue;
        }

        console.log(`Auto-resolve: Market ${marketId} resolved. Winner: ${winningPosition}`);

        // 3. Resolve all pending bets for this market
        const { data: marketBets } = await supabase
          .from('bets')
          .select('*')
          .eq('market_id', marketId)
          .eq('status', 'pending');

        if (!marketBets || marketBets.length === 0) continue;

        const now = new Date().toISOString();

        for (const bet of marketBets) {
          const isWinner = bet.position === winningPosition;
          const payoutAmount = isWinner ? Number(bet.potential_payout) : 0;

          // Update bet status
          await supabase.from('bets').update({
            status: isWinner ? 'won' : 'lost',
            payout_amount: payoutAmount,
            resolved_at: now,
          }).eq('id', bet.id);

          // Credit winner
          if (isWinner) {
            const { data: wallet } = await supabase
              .from('wallets')
              .select('*')
              .eq('id', bet.wallet_id)
              .single();

            if (wallet) {
              const newBalance = Number(wallet.balance) + payoutAmount;
              await supabase.from('wallets').update({
                balance: newBalance,
                total_won: Number(wallet.total_won) + payoutAmount,
              }).eq('id', wallet.id);

              await supabase.from('transactions').insert({
                user_id: bet.user_id,
                wallet_id: wallet.id,
                type: 'bet_won',
                amount: payoutAmount,
                balance_after: newBalance,
                description: `Auto-resolução: ${bet.market_title.substring(0, 50)}`,
                reference_id: bet.id,
              });
            }
          }

          // Send resolution notification to user
          const titleShort = bet.market_title.length > 40 ? bet.market_title.substring(0, 40) + '…' : bet.market_title;
          await supabase.from('notifications').insert({
            user_id: bet.user_id,
            type: 'market_resolution',
            title: isWinner ? '🎉 Você ganhou!' : '😔 Mercado resolvido',
            message: isWinner
              ? `Parabéns! Você ganhou R$${payoutAmount.toFixed(2)} no mercado "${titleShort}".`
              : `O mercado "${titleShort}" foi resolvido. Sua posição (${bet.position.toUpperCase()}) não venceu.`,
            reference_id: bet.market_id,
          });

          totalResolved++;
        }

        marketsResolved++;
        console.log(`Auto-resolve: Resolved ${marketBets.length} bets for market ${marketId}`);

      } catch (err) {
        console.error(`Auto-resolve: Error processing market ${marketId}:`, err);
      }
    }

    // Audit log
    if (marketsResolved > 0) {
      await supabase.from('admin_audit_log').insert({
        admin_user_id: '00000000-0000-0000-0000-000000000000', // system
        action: 'auto_resolve_markets',
        target_table: 'bets',
        new_data: { marketsResolved, totalResolved },
      });
    }

    console.log(`Auto-resolve complete: ${marketsResolved} markets, ${totalResolved} bets resolved.`);

    return new Response(JSON.stringify({
      success: true,
      marketsResolved,
      totalResolved,
      checkedMarkets: uniqueMarketIds.length,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Auto-resolve error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
});
