// src/App.tsx
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
  // последние настройки из localStorage
  const [symbol, setSymbol] = useState(
    () => localStorage.getItem('symbol') || ''
  )
  const [riskInput, setRiskInput] = useState(
    () => localStorage.getItem('risk') || '10000'
  )
  const [coefInput, setCoefInput] = useState(
    () => localStorage.getItem('coef') || '1.1'
  )
  const [params, setParams] = useState<IndicatorParams>(() => {
    const s = localStorage.getItem('params')
    return s
      ? JSON.parse(s)
      : { L: 300, k: 1.0, limitMul: 10.0 }
  })

  // состояния для порогов
  const [natr, setNatr] = useState(0)
  const [thrAdj, setThrAdj] = useState(0)

  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const h = localStorage.getItem('history')
    return h ? JSON.parse(h) : []
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [notif, setNotif] = useState<string | null>(null)

  // persist символа
  useEffect(() => {
    localStorage.setItem('symbol', symbol)
  }, [symbol])

  // persist остальных полей
  useEffect(() => localStorage.setItem('risk', riskInput), [riskInput])
  useEffect(() => localStorage.setItem('coef', coefInput), [coefInput])
  useEffect(() => localStorage.setItem('params', JSON.stringify(params)), [params])
  useEffect(() => localStorage.setItem('history', JSON.stringify(history)), [history])

  // авто‑скрытие уведомлений
  useEffect(() => {
    if (!notif) return
    const t = setTimeout(() => setNotif(null), 3000)
    return () => clearTimeout(t)
  }, [notif])

  // загрузка порогов через индикатор
  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    getLastThresholds(symbol, params)
      .then(({ thr, thrAdj }) => {
        setNatr(thr)
        setThrAdj(thrAdj)
      })
      .finally(() => setLoading(false))
  }, [symbol, params])

  // вычисления
  const risk = parseFloat(riskInput.replace(',', '.')) || 0
  const coef = parseFloat(coefInput.replace(',', '.')) || 0
  const thrCoef = natr * coef
  const thr85 = thrCoef * params.limitMul // или другой коэф
  const thr2_85 = thrCoef * 2 * params.limitMul
  const volume = thrCoef ? (risk * 100) / thrCoef : 0

  // сохранение
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
    setHistory([entry, ...history])
    setNotif('Entry saved')
  }

  // удаление одной записи
  const handleDelete = (ts: number) => {
    setHistory(history.filter(h => h.ts !== ts))
    setNotif('Entry deleted')
  }
  // очистка истории целиком
  const handleClearAll = () => {
    setHistory([])
    setNotif('History cleared')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* уведомление */}
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
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="italic">Loading thresholds…</p>
            ) : symbol ? (
              <dl className="grid grid-cols-2 gap-2">
                <dt className="text-sm text-muted-foreground">NATR:</dt>
                <dd className="font-medium">{percentFormatter(natr)}</dd>

                <dt className="text-sm text-muted-foreground">Adj Thr:</dt>
                <dd className="font-medium">{percentFormatter(thrAdj)}</dd>

                <dt className="text-sm text-muted-foreground">Volume:</dt>
                <dd className="font-medium">{intFormatter.format(volume)}</dd>
              </dl>
            ) : (
              <p className="italic">Select ticker</p>
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
