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

  // Маппинг русских букв на английскую раскладку
  const rusToEng: Record<string, string> = {
    'й':'q','ц':'w','у':'e','к':'r','е':'t','н':'y','г':'u','ш':'i','щ':'o','з':'p','х':'[','ъ':']',
    'ф':'a','ы':'s','в':'d','а':'f','п':'g','р':'h','о':'j','л':'k','д':'l','ж':';','э':"'",
    'я':'z','ч':'x','с':'c','м':'v','и':'b','т':'n','ь':'m','б':',','ю':'.'
  }
  const mapLayout = (str: string) =>
    str.split('').map(ch => {
      const low = ch.toLowerCase()
      if (rusToEng[low]) {
        const eng = rusToEng[low]
        return ch === low ? eng : eng.toUpperCase()
      }
      return ch
    }).join('')

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
      <PopoverContent className="w-full p-2">
        <Command>
          <CommandInput
            placeholder="Search ticker..."
            className="w-full px-16 py-4"
            onInput={e => {
              const input = e.currentTarget
              const mapped = mapLayout(input.value)
              if (mapped !== input.value) {
                input.value = mapped
              }
            }}
          />
          <CommandList className="max-h-60 overflow-auto">
            <CommandEmpty>No results.</CommandEmpty>
            {all
              .filter(sym =>
                sym.toLowerCase().includes(
                  // используем уже преобразованное значение инпута
                  (document.querySelector('input[placeholder="Search ticker..."]') as HTMLInputElement)?.value.toLowerCase() || ''
                )
              )
              .map(sym => (
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
