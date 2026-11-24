import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Banknote, QrCode } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Dialog from '../../../components/ui/dialog'
import Button from '../../../components/ui/button'
import Input from '../../../components/ui/input'
import { sessionQueryKey } from '../../auth/auth.queries'
import { formatPosTotal, getPosTotal, toPosMinorUnits, type PosCartLine } from '../pos-cart'
import { getCashError, getSaleFailure, readPendingSale } from '../pos-checkout'
import { useCreateSaleMutation } from '../sales.queries'
import type { CreateSaleInput, SalePaymentMethod } from '../sales.types'

type Attempt = {
  input: CreateSaleInput
  estimate: bigint | null
  uncertain: boolean
}

export default function PosCheckout({ lines, staffId }: { lines: PosCartLine[]; staffId: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mutation = useCreateSaleMutation()
  const storageKey = `selo.pending-sale.${staffId}`
  const [attempt, setAttempt] = useState<Attempt | null>(() => {
    const input = readPendingSale(storageKey)
    return input ? { input, estimate: null, uncertain: true } : null
  })
  const [method, setMethod] = useState<SalePaymentMethod>('CASH')
  const [cash, setCash] = useState('')
  const [reference, setReference] = useState('')
  const [confirmedLines, setConfirmedLines] = useState<PosCartLine[] | null>(null)
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  const total = getPosTotal(lines)
  const cashError = getCashError(cash.trim(), total)

  const review = () => {
    if (lines.length === 0 || attempt) return
    if (method === 'CASH' && cashError) {
      setError(cashError)
      return
    }
    if (method === 'QR' && confirmedLines !== lines) {
      setError('Confirm that you received the QR payment.')
      return
    }
    if (!globalThis.crypto?.randomUUID) {
      setError('Open Selo over HTTPS or localhost to complete a sale.')
      return
    }

    setError('')
    setAttempt({
      input: {
        idempotencyKey: crypto.randomUUID(),
        items: lines.map(({ productUnitId, quantity }) => ({ productUnitId, quantity })),
        payment: method === 'CASH'
          ? { method: 'CASH', tenderedAmount: cash.trim() }
          : { method: 'QR', manuallyConfirmed: true, referenceNo: reference.trim() || null },
      },
      estimate: total,
      uncertain: false,
    })
  }

  const clearSavedAttempt = () => {
    try {
      if (readPendingSale(storageKey)?.idempotencyKey === attempt?.input.idempotencyKey) {
        sessionStorage.removeItem(storageKey)
      }
    } catch {
      // Original key ကျန်နေရင်လည်း backend က receipt ကိုပဲ replay ပြန်ပေးသည်။
    }
  }

  const confirm = async () => {
    if (!attempt || inFlight.current) return
    try {
      // Request မပို့ခင် payload တစ်ခုလုံး သိမ်းထားလို့ reload နောက် key/body မပြောင်းဘဲ retry လုပ်နိုင်သည်။
      sessionStorage.setItem(storageKey, JSON.stringify(attempt.input))
    } catch {
      setError('Allow browser session storage before completing this sale.')
      return
    }
    inFlight.current = true
    setError('')
    try {
      const result = await mutation.mutateAsync(attempt.input)
      clearSavedAttempt()
      void queryClient.invalidateQueries({ queryKey: ['sales'] })
      void queryClient.invalidateQueries({ queryKey: ['inventory'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(result.message)
      navigate(`/sales/${result.data.id}`, { replace: true })
    } catch (failure) {
      const result = getSaleFailure(failure)
      if (result.conflict || (result.rejected && !attempt.uncertain)) {
        clearSavedAttempt()
        setAttempt(null)
        setConfirmedLines(null)
        if (!result.signedOut) void queryClient.invalidateQueries({ queryKey: ['products'] })
      } else {
        setAttempt({ ...attempt, uncertain: true })
      }
      setError(result.message)
      if (result.signedOut) {
        await queryClient.cancelQueries({ queryKey: sessionQueryKey })
        queryClient.setQueryData(sessionQueryKey, null)
      }
    } finally {
      inFlight.current = false
    }
  }

  if (!attempt && lines.length === 0 && !error) return null

  return (
    <>
      {lines.length > 0 && (
        <form noValidate onSubmit={(event) => { event.preventDefault(); review() }} className="space-y-4 border-t border-border p-4 sm:px-5">
          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="mb-2 font-semibold text-heading">Payment method</legend>
            {(['CASH', 'QR'] as const).map((option) => {
              const Icon = option === 'CASH' ? Banknote : QrCode
              return (
                <label key={option} className={`flex min-h-11 items-center gap-2 rounded-control border px-3 font-medium ${method === option ? 'border-primary bg-primary-soft text-primary' : 'border-input-border'}`}>
                  <input type="radio" name="pos-payment" checked={method === option} onChange={() => {
                    setMethod(option)
                    setConfirmedLines(null)
                    setError('')
                  }} className="accent-primary" />
                  <Icon size={17} aria-hidden="true" />{option === 'CASH' ? 'Cash' : 'QR'}
                </label>
              )
            })}
          </fieldset>
          {method === 'CASH' ? (
            <div>
              <label htmlFor="pos-cash" className="mb-1.5 block font-medium">Cash tendered (MMK)</label>
              <Input id="pos-cash" inputMode="decimal" maxLength={19} value={cash} onChange={(event) => { setCash(event.target.value); setError('') }} />
              {cash.trim() && !cashError && <p className="mt-2 text-sm text-muted">Estimated change <strong className="tabular-nums text-heading">{formatPosTotal(toPosMinorUnits(cash.trim()) - total)}</strong></p>}
            </div>
          ) : (
            <div className="space-y-3">
              <div><label htmlFor="pos-qr-ref" className="mb-1.5 block font-medium">Reference number (optional)</label><Input id="pos-qr-ref" maxLength={100} value={reference} onChange={(event) => setReference(event.target.value)} /></div>
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmedLines === lines} onChange={(event) => { setConfirmedLines(event.target.checked ? lines : null); setError('') }} className="mt-0.5 size-4 accent-primary" />I verified that the QR payment was received.</label>
            </div>
          )}
          {!attempt && error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full">Review sale</Button>
        </form>
      )}
      {!attempt && lines.length === 0 && error && <p role="alert" className="p-4 text-sm text-danger">{error}</p>}
      {attempt && (
        <Dialog title={attempt.uncertain ? 'Resume checkout' : 'Confirm sale'} closeDisabled={attempt.uncertain || mutation.isPending} onClose={() => {
          if (!inFlight.current && !attempt.uncertain) { setError(''); setAttempt(null) }
        }}>
          <div className="space-y-4" aria-busy={mutation.isPending}>
            <p className="font-medium">{attempt.input.payment.method === 'CASH' ? 'Cash' : 'QR'} · {attempt.input.items.length} {attempt.input.items.length === 1 ? 'cart line' : 'cart lines'}</p>
            {attempt.estimate !== null && <p>Estimated total <strong className="tabular-nums text-heading">{formatPosTotal(attempt.estimate)}</strong></p>}
            {attempt.input.payment.method === 'CASH' && <p>Cash tendered <strong className="tabular-nums text-heading">{formatPosTotal(toPosMinorUnits(attempt.input.payment.tenderedAmount))}</strong></p>}
            {attempt.uncertain ? (
              <p role="status" className="rounded-control bg-warning-soft p-3 text-sm text-warning">The sale is unconfirmed. Retry to check or complete this checkout with the same payment details.</p>
            ) : (
              <p className="text-sm text-muted">The server checks current prices and stock. The receipt shows the final amount.</p>
            )}
            {error && <p role="alert" className="rounded-control bg-danger-soft p-3 text-sm text-danger">{error}</p>}
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              {!attempt.uncertain && (
                <button type="button" autoFocus disabled={mutation.isPending} onClick={() => {
                  if (!inFlight.current) { setError(''); setAttempt(null) }
                }} className="min-h-10 rounded-control border border-input-border px-3 text-sm font-medium hover:bg-surface-muted">Back to cart</button>
              )}
              <Button disabled={mutation.isPending} onClick={() => void confirm()}>
                {mutation.isPending ? 'Completing…' : attempt.uncertain ? 'Retry checkout' : 'Complete sale'}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  )
}
