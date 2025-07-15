import React, { useEffect, useState } from 'react'
import TickerDropdown from './components/TickerDropdown'
import SettingsDrawer from './components/SettingsDrawer'
import HistoryDrawer, { HistoryEntry } from './components/HistoryDrawer'
import { getLastThresholds, IndicatorParams } from '@/utils/indicator'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Menu, Settings } from 'lucide-react'

// Локаль для форматирования “100 000 000”
const volumeFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0
})

// Помощник для процентных значений с 4 знаками после запятой
function formatPercent(val: number) {
  return `${val.toFixed(4)}%`
}

export default function App() {
  const [symbol, setSymbol] = useState('')
  const [risk, setRisk] = useState(() => +localStorage.getItem('risk')! || 10000)
  const [coef, setCoef] = useState(() => +localStorage.getItem('coef')! || 1.1)
  const [params, setParams] = useState<IndicatorParams>(() => {
    const stored = localStorage.getItem('params')
    return stored
      ? JSON.parse(stored)
      : { L: 300, k: 1.0, limitMul: 10.0, smoothType: 'SMA', multiplier85: 0.85 }
  })
  const [natr, setNatr] = useState(0)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const h = localStorage.getItem('history')
    return h ? JSON.parse(h) : []
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  // persist
  useEffect(() => localStorage.setItem('risk', risk.toString()), [risk])
  useEffect(() => localStorage.setItem('coef', coef.toString()), [coef])
  useEffect(() => localStorage.setItem('params', JSON.stringify(params)), [params])
  useEffect(() => localStorage.setItem('history', JSON.stringify(history)), [history])

  // загрузка NATR
  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    getLastThresholds(symbol, params)
      .then(({ natr }) => setNatr(natr))
      .finally(() => setLoading(false))
  }, [symbol, params])

  // расчёты
  const thrCoef = natr * coef
  const thr85 = thrCoef * params.multiplier85
  const thr2_85 = thrCoef * 2 * params.multiplier85
  const volume = risk * 100 / thrCoef

  const saveEntry = () => {
    if (!symbol) return
    setHistory([
      ...history,
      { ts: Date.now(), symbol, risk, coef, natr, thrCoef, thr85, thr2_85, volume }
    ])
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
        <Button variant="ghost" onClick={() => setHistoryOpen(true)}>
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">Risk Calculator</h1>
        <Button variant="ghost" onClick={() => setSettingsOpen(true)}>
          <Settings className="h-6 w-6" />
        </Button>
      </header>

      <main className="p-4 max-w-sm mx-auto space-y-6">
        <TickerDropdown value={symbol} onChange={setSymbol} />

        <div className="space-y-4">
          <div>
            <Label>Risk (USDT)</Label>
            <Input
              type="number"
              value={risk}
              onChange={e => setRisk(+e.target.value)}
            />
          </div>
          <div>
            <Label>Coefficient</Label>
            <Input
              type="number"
              step="0.01"
              value={coef}
              onChange={e => setCoef(+e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="italic">Loading NATR…</p>
            ) : symbol ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                <dt className="text-sm text-muted-foreground">Volume:</dt>
                <dd className="text-lg font-medium">
                  {volumeFormatter.format(volume)}
                </dd>

                <dt className="text-sm text-muted-foreground">NATR×coef:</dt>
                <dd className="text-lg font-medium">{formatPercent(thrCoef)}</dd>

                <dt className="text-sm text-muted-foreground">NATR×1×0.85:</dt>
                <dd className="text-lg font-medium">{formatPercent(thr85)}</dd>

                <dt className="text-sm text-muted-foreground">NATR×2×0.85:</dt>
                <dd className="text-lg font-medium">{formatPercent(thr2_85)}</dd>
              </dl>
            ) : (
              <p className="italic">Select ticker above</p>
            )}

            {symbol && !loading && (
              <Button className="w-full mt-4" onClick={saveEntry}>
                Save to History
              </Button>
            )}
          </CardContent>
        </Card>
      </main>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        params={params}
        setParams={setParams}
      />
      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
      />
    </div>
  )
}
