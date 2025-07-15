import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X } from 'lucide-react'

// форматтеры
const intFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
const percentFormatter = (v?: number) =>
  typeof v === 'number' && !isNaN(v) ? `${v.toFixed(4)}%` : '—'

export interface HistoryEntry {
  ts: number
  symbol: string
  risk: number
  coef: number
  thr: number
  thrCoef: number
  thr85: number
  thr2_85: number
  volume: number
}

export default function HistoryDrawer({
  open,
  onClose,
  history,
  onDelete,
  onClearAll
}: {
  open: boolean
  onClose(): void
  history: HistoryEntry[]
  onDelete(ts: number): void
  onClearAll(): void
}) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="max-w-sm p-4 h-full flex flex-col">
        <SheetHeader className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <SheetTitle>History</SheetTitle>
            <Button variant="ghost" size="sm" onClick={onClearAll}>
              Clear All
            </Button>
          </div>
          <SheetClose asChild>
            <Button variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="mt-4 overflow-y-auto flex-1 space-y-4">
          {history.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No entries yet.
            </p>
          ) : (
            history.map(h => (
              <Card key={h.ts} className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => onDelete(h.ts)}
                >
                  <X className="h-4 w-4" />
                </Button>

                <CardContent className="space-y-1">
                  <small className="text-xs text-muted-foreground block">
                    {new Date(h.ts).toLocaleString()}
                  </small>
                  <div className="font-semibold">{h.symbol}</div>

                  <div className="flex justify-between text-sm">
                    <span>Risk:</span>
                    <span>{intFormatter.format(h.risk)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Coef:</span>
                    <span>{h.coef.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>NATR:</span>
                    <span>{percentFormatter(h.thr)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>NATR×coef:</span>
                    <span>{percentFormatter(h.thrCoef)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>×1×0.85:</span>
                    <span>{percentFormatter(h.thr85)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>×2×0.85:</span>
                    <span>{percentFormatter(h.thr2_85)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Volume:</span>
                    <span>{intFormatter.format(h.volume)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
