/**
 * Minimal handler skeleton — replace with a full port from a shipped app
 * (auth, event filter, accounts update, grant_credits RPC).
 * See skills/rc-launchpad/credits-bridge.md
 */
import { CREDIT_PRODUCTS, PRO_MONTHLY_CREDITS } from './constants.ts'

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    })
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')?.trim()
  const auth = req.headers.get('Authorization')?.trim()
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: parse body.event, validate app_user_id UUID,
  // update accounts from entitlements, grant credits with idempotency.
  // CREDIT_PRODUCTS / PRO_MONTHLY_CREDITS are the pack + renewal maps.
  void CREDIT_PRODUCTS
  void PRO_MONTHLY_CREDITS

  return Response.json({
    success: true,
    stub: true,
    message: 'Replace stub with full credits-bridge implementation'
  })
})
