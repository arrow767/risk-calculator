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

// форматтеры
const intFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
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
          <SheetTitle>History</SheetTitle>
          <div className="flex space-x-2">
            <Button variant="ghost" onClick={onClearAll}>
              Clear All
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-4 overflow-y-auto flex-1 space-y-4">
          {history.length === 0 && <p>No entries yet.</p>}

          {history.map(h => (
            <Card key={h.ts} className="relative">
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => onDelete(h.ts)}
              >
                ✕
              </Button>
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
                  <span className="font-medium">
                    {parseFloat(h.coef.toFixed(2)).toString()}
                  </span>
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
        </div>
      </SheetContent>
    </Sheet>
  )
}
