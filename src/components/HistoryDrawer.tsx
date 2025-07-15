import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// Форматтеры (повторяем из App.tsx)
const intFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0
})
const percentFormatter = (v: number) => `${v.toFixed(4)}%`

export interface HistoryEntry {
  ts: number
  symbol: string
  risk: number
  coef: number
  natr: number
  thrCoef: number
  thr85: number
  thr2_85: number
  volume: number
}

export default function HistoryDrawer({
  open,
  onClose,
  history
}: {
  open: boolean
  onClose: () => void
  history: HistoryEntry[]
}) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="max-w-sm p-4 space-y-4">
        <SheetHeader>
          <SheetTitle>History</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost">✕</Button>
          </SheetClose>
        </SheetHeader>

        {history.length === 0 && <p>No entries yet.</p>}
        {history.map((h, i) => (
          <Card key={i}>
            <CardContent className="space-y-1">
              <small className="text-xs text-muted-foreground">
                {new Date(h.ts).toLocaleString()}
              </small>
              <div className="font-semibold">{h.symbol}</div>
              <div>
                <span className="text-sm text-muted-foreground">Risk: </span>
                <span className="font-medium">{intFormatter.format(h.risk)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Coef: </span>
                <span className="font-medium">{h.coef.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">NATR: </span>
                <span className="font-medium">{percentFormatter(h.natr)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">×coef: </span>
                <span className="font-medium">{percentFormatter(h.thrCoef)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">×1×0.85: </span>
                <span className="font-medium">{percentFormatter(h.thr85)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">×2×0.85: </span>
                <span className="font-medium">{percentFormatter(h.thr2_85)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Volume: </span>
                <span className="font-medium">{intFormatter.format(h.volume)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </SheetContent>
    </Sheet>
  )
}
