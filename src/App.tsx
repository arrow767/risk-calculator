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
  const [symbol, setSymbol] = useState(() => localStorage.getItem('symbol') || '')
  const [riskInput, setRiskInput] = useState(() => localStorage.getItem('risk') || '10000')
  const [coefInput, setCoefInput] = useState(() => localStorage.getItem('coef') || '1.1')
  const [params, setParams] = useState<IndicatorParams>(() => {
    const p = localStorage.getItem('params')
    return p ? JSON.parse(p) : { L: 300, k: 1.0, limitMul: 10.0 }
  })

  const [thr, setThr] = useState(0)
  const [thrAdj, setThrAdj] = useState(0)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const h = localStorage.getItem('history')
    return h ? JSON.parse(h) : []
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [notif, setNotif] = useState<string | null>(null)

  // Persist state
  useEffect(() => { localStorage.setItem('symbol', symbol) }, [symbol])
  useEffect(() => { localStorage.setItem('risk', riskInput) }, [riskInput])
  useEffect(() => { localStorage.setItem('coef', coefInput) }, [coefInput])
  useEffect(() => { localStorage.setItem('params', JSON.stringify(params)) }, [params])
  useEffect(() => { localStorage.setItem('history', JSON.stringify(history)) }, [history])

  // Auto-hide notifications
  useEffect(() => {
    if (!notif) return
    const t = setTimeout(() => setNotif(null), 3000)
    return () => clearTimeout(t)
  }, [notif])

  // Fetch thresholds
  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    getLastThresholds(symbol, params)
      .then(({ thr: t, thrAdj: a }) => {
        setThr(t)
        setThrAdj(a)
      })
      .finally(() => setLoading(false))
  }, [symbol, params])

  const risk = parseFloat(riskInput.replace(',', '.')) || 0
  const coef = parseFloat(coefInput.replace(',', '.')) || 0

  const thrCoef = thr * coef
  const thr85 = thr * 0.85
  const thr2_85 = thr * 2 * 0.85
  const volume = thrCoef ? (risk * 100) / thrCoef : 0

  // Save to history
  const saveEntry = () => {
    if (!symbol) return
    const entry: HistoryEntry = {
      ts: Date.now(),
      symbol,
      risk,
      coef,
      thr,
      thrCoef,
      thr85,
      thr2_85,
      volume
    }
    setHistory([entry, ...history])
    setNotif('✔ Saved!')
  }
  const handleDelete = (ts: number) => {
    setHistory(history.filter(h => h.ts !== ts))
    setNotif('🗑 Deleted')
  }
  const handleClearAll = () => {
    setHistory([])
    setNotif('🗑 All cleared')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Notification */}
      {notif && (
        <div className="fixed inset-x-0 top-5 flex justify-center z-50 pointer-events-none">
          <div className="bg-green-500 text-white px-5 py-2 rounded-full shadow-lg pointer-events-auto">
            {notif}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between bg-white shadow px-6 py-4">
        <Button variant="ghost" className="text-gray-600" onClick={() => setHistoryOpen(true)}>
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-extrabold text-gray-800">Risk Calculator</h1>
        <Button variant="ghost" className="text-gray-600" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon className="h-6 w-6" />
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto py-8">
        <div className="max-w-md mx-auto space-y-8 px-4">
          {/* Inputs */}
          <Card className="bg-white shadow-lg rounded-2xl p-6">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TickerDropdown value={symbol} onChange={setSymbol} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700">Risk (USDT)</Label>
                  <Input
                    className="mt-1 w-full"
                    type="text"
                    inputMode="decimal"
                    value={riskInput}
                    onChange={e => setRiskInput(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700">Coefficient</Label>
                  <Input
                    className="mt-1 w-full"
                    type="text"
                    inputMode="decimal"
                    value={coefInput}
                    onChange={e => setCoefInput(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="bg-white shadow-lg rounded-2xl p-6">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <p className="text-center text-gray-500 animate-pulse">Loading...</p>
              ) : symbol ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">NATR</p>
                    <p className="text-xl font-semibold text-gray-800">{percentFormatter(thr)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">NATR×coef</p>
                    <p className="text-xl font-semibold text-gray-800">{percentFormatter(thrCoef)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">×1×0.85</p>
                    <p className="text-xl font-semibold text-gray-800">{percentFormatter(thr85)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">×2×0.85</p>
                    <p className="text-xl font-semibold text-gray-800">{percentFormatter(thr2_85)}</p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className="text-sm text-gray-500">Volume</p>
                    <p className="text-xl font-semibold text-gray-800">{intFormatter.format(volume)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-400">Select a ticker above to see results.</p>
              )}
              {symbol && !loading && (
                <Button className="w-full mt-4" size="lg">
                  Save to History
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Drawers */}
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} params={params} setParams={setParams} />
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
