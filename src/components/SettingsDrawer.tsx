import React from 'react'
import { Sheet,SheetContent,SheetHeader,SheetTitle,SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { IndicatorParams } from '@/utils/indicator'

export default function SettingsDrawer({
  open,onClose,params,setParams
}:{
  open:boolean; onClose():void;
  params:IndicatorParams; setParams:(p:IndicatorParams)=>void
}) {
  const upd=(k:keyof IndicatorParams,v:any)=>setParams({...params,[k]:v})
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="max-w-sm p-4">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div><Label>L (bars)</Label>
            <Input type="number" value={params.L} onChange={e=>upd('L',+e.target.value)}/></div>
          <div><Label>k (σ multiplier)</Label>
            <Input type="number" step="0.1" value={params.k} onChange={e=>upd('k',+e.target.value)}/></div>
          <div><Label>limitMul</Label>
            <Input type="number" step="0.1" value={params.limitMul} onChange={e=>upd('limitMul',+e.target.value)}/></div>
          <div><Label>Multiplier (0.85)</Label>
            <Input type="number" step="0.01" value={params.multiplier85} onChange={e=>upd('multiplier85',+e.target.value)}/></div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
