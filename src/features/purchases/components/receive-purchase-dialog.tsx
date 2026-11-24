import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Dialog from '../../../components/ui/dialog'
import Button from '../../../components/ui/button'
import { sessionQueryKey } from '../../auth/auth.queries'
import { getLineTotalMinor } from '../purchases.form'
import { formatPurchaseMinorUnits } from '../purchases.format'
import { useCreatePurchaseMutation } from '../purchases.queries'
import { getPurchaseFailure, type PendingPurchase } from '../purchases.receiving'

type Props = {
  purchase: PendingPurchase
  storageKey: string
  supplierName: string
  recovered: boolean
  onClose: () => void
}

export default function ReceivePurchaseDialog({ purchase, storageKey, supplierName, recovered, onClose }: Props) {
  const mutation = useCreatePurchaseMutation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const inFlight = useRef(false)
  const [uncertain, setUncertain] = useState(recovered)
  const [error, setError] = useState('')
  const [rejected, setRejected] = useState(false)
  const total = purchase.items.reduce((sum, item) => sum + getLineTotalMinor(item.quantity, item.unitCost), 0n)

  const handleClose = () => {
    if (inFlight.current) return
    if (uncertain) {
      navigate('/purchases')
      return
    }
    onClose()
  }

  const receive = async () => {
    if (inFlight.current || rejected) return
    try {
      // POST မပို့ခင် snapshot ကို tab ထဲ သိမ်းထားလို့ reload ပြီးလည်း same key/body နဲ့ retry လုပ်နိုင်သည်။
      sessionStorage.setItem(storageKey, JSON.stringify(purchase))
    } catch {
      setError('Unable to save this attempt in this tab. Allow browser storage and try again.')
      return
    }

    const clearAttempt = () => {
      try {
        sessionStorage.removeItem(storageKey)
      } catch {
        // Storage cleanup failure leaves the original key available for a safe replay.
      }
    }

    inFlight.current = true
    setError('')
    try {
      const result = await mutation.mutateAsync(purchase)
      clearAttempt()
      // Detail route က server receipt ကို ယူပြီး အခြား views က ပြောင်းသွားတဲ့ stock ကို ပြန်ယူသည်။
      void queryClient.invalidateQueries({ queryKey: ['purchases', 'list'] })
      void queryClient.invalidateQueries({ queryKey: ['inventory'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(result.message)
      navigate(`/purchases/${result.data.id}`, { replace: true })
    } catch (failure) {
      const result = getPurchaseFailure(failure)
      if (result.conflict || (result.rejected && !uncertain)) {
        clearAttempt()
        setUncertain(false)
        setRejected(true)
      } else {
        setUncertain(true)
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

  return (
    <Dialog title="Confirm purchase receipt" onClose={handleClose} closeDisabled={mutation.isPending}>
      <div className="space-y-4" aria-busy={mutation.isPending}>
        <dl className="grid grid-cols-2 gap-3">
          <div><dt className="text-sm text-muted">Supplier</dt><dd className="font-medium wrap-anywhere">{supplierName}</dd></div>
          <div><dt className="text-sm text-muted">Purchase lines</dt><dd className="font-medium">{purchase.items.length}</dd></div>
          <div><dt className="text-sm text-muted">Estimated total</dt><dd className="font-semibold tabular-nums text-heading">{formatPurchaseMinorUnits(total)}</dd></div>
        </dl>
        <p className="text-sm">Receiving records the purchase and updates stock for these items.</p>
        {uncertain && (
          <p role="status" className="rounded-control bg-warning-soft p-3 text-sm text-warning">
            The receipt is unconfirmed. Retry this purchase to check or complete it. You can return to New purchase in this tab to resume.
          </p>
        )}
        {error && <p role="alert" className="rounded-control bg-danger-soft p-3 text-sm text-danger">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <button type="button" autoFocus disabled={mutation.isPending} onClick={handleClose} className="min-h-10 rounded-control border border-input-border px-3 py-2 text-sm hover:bg-surface-muted disabled:opacity-50">
            {uncertain ? 'Back to history' : 'Back to form'}
          </button>
          {!rejected && <Button disabled={mutation.isPending} onClick={() => void receive()}>
            {mutation.isPending ? 'Receiving…' : uncertain ? 'Retry purchase' : 'Receive purchase'}
          </Button>}
        </div>
      </div>
    </Dialog>
  )
}
