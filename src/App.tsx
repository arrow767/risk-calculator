import React, { useEffect, useState } from 'react'
import TickerDropdown from './components/TickerDropdown'
import SettingsDrawer from './components/SettingsDrawer'
import HistoryDrawer, { HistoryEntry } from './components/HistoryDrawer'
import { getLastThresholds, IndicatorParams } from '@/utils/indicator'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Menu, Settings as SettingsIcon } from 'lucide-react'

// форматтеры
const intFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
const percentFormatter = (v: number) => `${v.toFixed(4)}%`

export default function App() {
  const [symbol, setSymbol] = useState('')
  const [riskInput, setRiskInput] = useState(() => localStorage.getItem('risk') || '10000')
  const [coefInput, setCoefInput] = useState(() => localStorage.getItem('coef') || '1.1')
  const [params, setParams] = useState<IndicatorParams>(() => {
    const s = localStorage.getItem('params')
    return s
      ? JSON.parse(s)
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
  const [notif, setNotif] = useState<string | null>(null)

  // авто-скрытие уведомления
  useEffect(() => {
    if (!notif) return
    const t = setTimeout(() => setNotif(null), 3000)
    return () => clearTimeout(t)
  }, [notif])

  // persist
  useEffect(() => localStorage.setItem('risk', riskInput), [riskInput])
  useEffect(() => localStorage.setItem('coef', coefInput), [coefInput])
  useEffect(() => localStorage.setItem('params', JSON.stringify(params)), [params])
  useEffect(() => localStorage.setItem('history', JSON.stringify(history)), [history])

  // fetch NATR
  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    getLastThresholds(symbol, params)
      .then(({ natr }) => setNatr(natr))
      .finally(() => setLoading(false))
  }, [symbol, params])

  // расчёты
  const risk = parseFloat(riskInput.replace(',', '.')) || 0
  const coef = parseFloat(coefInput.replace(',', '.')) || 0
  const thrCoef = natr * coef
  const thr85 = thrCoef * params.multiplier85
  const thr2_85 = thrCoef * 2 * params.multiplier85
  const volume = thrCoef ? (risk * 100) / thrCoef : 0

  // save
  const saveEntry = () => {
    if (!symbol) return
    const entry: HistoryEntry = {
      ts: Date.now(),
      symbol,
      risk,
      coef,
      natr,
      thrCoef,
      thr85,
      thr2_85,
      volume
    }
    setHistory([...history, entry])
    setNotif('Entry saved')
  }

  // delete one
  const handleDelete = (ts: number) => {
    setHistory(history.filter(h => h.ts !== ts))
    setNotif('Entry deleted')
  }
  // clear all
  const handleClearAll = () => {
    setHistory([])
    setNotif('History cleared')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Notification */}
      {notif && (
        <div className="fixed top-4 inset-x-0 flex justify-center z-50 pointer-events-none">
          <div className="bg-green-600 text-white px-4 py-2 rounded shadow pointer-events-auto">
            {notif}
          </div>
        </div>
      )}

      <header className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
        <Button variant="ghost" onClick={() => setHistoryOpen(true)}>
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">Risk Calculator</h1>
        <Button variant="ghost" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon className="h-6 w-6" />
        </Button>
      </header>

      <main className="p-4 max-w-sm mx-auto space-y-6">
        <TickerDropdown value={symbol} onChange={setSymbol} />

        <div className="space-y-4">
          <div>
            <Label>Risk (USDT)</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={riskInput}
              onChange={e => setRiskInput(e.target.value)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Формат: {intFormatter.format(risk)}
            </p>
          </div>
          <div>
            <Label>Coefficient</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={coefInput}
              onChange={e => setCoefInput(e.target.value)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Формат: {coefInput || '—'}
            </p>
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
                <dd className="text-lg font-medium">{intFormatter.format(volume)}</dd>

                <dt className="text-sm text-muted-foreground">NATR×coef:</dt>
                <dd className="text-lg font-medium">{percentFormatter(thrCoef)}</dd>

                <dt className="text-sm text-muted-foreground">NATR×1×0.85:</dt>
                <dd className="text-lg font-medium">{percentFormatter(thr85)}</dd>

                <dt className="text-sm text-muted-foreground">NATR×2×0.85:</dt>
                <dd className="text-lg font-medium">{percentFormatter(thr2_85)}</dd>
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
        onDelete={handleDelete}
        onClearAll={handleClearAll}
      />
    </div>
  )
}
