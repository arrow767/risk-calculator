// src/components/TickerDropdown.tsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'

export default function TickerDropdown({
  value,
  onChange
}: {
  value: string
  onChange: (s: string) => void
}) {
  const [all, setAll] = useState<string[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    axios
      .get('https://fapi.binance.com/fapi/v1/exchangeInfo')
      .then(res => {
        const syms = res.data.symbols
          .filter((s: any) => s.contractType === 'PERPETUAL' && s.quoteAsset === 'USDT')
          .map((s: any) => s.symbol)
        setAll(syms)
      })
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between mb-4">
          {value || 'Search ticker...'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search ticker..."
            className="w-full px-4 py-2"
          />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            {all.map(sym => (
              <CommandItem
                key={sym}
                onSelect={current => {
                  onChange(current)
                  setOpen(false)
                }}
              >
                {sym}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
