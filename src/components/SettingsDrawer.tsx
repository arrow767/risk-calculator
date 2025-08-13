import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { IndicatorParams } from '@/utils/indicator'

export default function SettingsDrawer({
  open,
  onClose,
  params,
  setParams,
  lOptions,
  setLOptions,
}: {
  open: boolean
  onClose(): void
  params: IndicatorParams
  setParams: (p: IndicatorParams) => void
  lOptions: [number, number]
  setLOptions: (v: [number, number]) => void
}) {
  const upd = (k: keyof IndicatorParams, v: any) => setParams({ ...params, [k]: v })

  const changeL0 = (val: string) => {
    const n = parseInt(val.replace(/\D/g, '') || '0', 10)
    setLOptions([n || lOptions[0], lOptions[1]])
  }
  const changeL1 = (val: string) => {
    const n = parseInt(val.replace(/\D/g, '') || '0', 10)
    setLOptions([lOptions[0], n || lOptions[1]])
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="max-w-sm p-4">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label>L (bars)</Label>
            <Input
              type="number"
              value={params.L}
              onChange={e => upd('L', +e.target.value)}
            />
          </div>

          <div>
            <Label>k (σ multiplier)</Label>
            <Input
              type="number"
              step="0.1"
              value={params.k}
              onChange={e => upd('k', +e.target.value)}
            />
          </div>

          <div>
            <Label>limitMul</Label>
            <Input
              type="number"
              step="0.1"
              value={params.limitMul}
              onChange={e => upd('limitMul', +e.target.value)}
            />
          </div>

          {/* Если у вас в типе есть multiplier85 — оставьте поле, иначе можно убрать */}
          {'multiplier85' in params ? (
            <div>
              <Label>Multiplier (0.85)</Label>
              {/* @ts-ignore — на случай, если в типе он опционален */}
              <Input
                type="number"
                step="0.01"
                value={(params as any).multiplier85 ?? 0.85}
                onChange={e => upd('multiplier85' as any, +e.target.value)}
              />
            </div>
          ) : null}

          <div className="pt-2">
            <Label>Quick L presets (used by toggle)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <Label className="text-xs">Preset #1</Label>
                <Input
                  type="number"
                  value={lOptions[0]}
                  onChange={e => changeL0(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Preset #2</Label>
                <Input
                  type="number"
                  value={lOptions[1]}
                  onChange={e => changeL1(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Эти два значения появляются кнопками «Quick L (bars)» на главном экране.
            </p>
          </div>

          <div className="pt-2">
            <SheetClose asChild>
              <Button className="w-full">Close</Button>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
