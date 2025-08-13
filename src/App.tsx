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

// утилита: добавить число в «последние», уникально, макс 3
function pushRecent(val: number, list: number[], max = 3) {
  if (!isFinite(val) || val === 0) return list
  const next = [val, ...list.filter(v => v !== val)]
  return next.slice(0, max)
}

export default function App() {
  const [symbol, setSymbol] = useState(() => localStorage.getItem('symbol') || '')
  const [riskInput, setRiskInput] = useState(() => localStorage.getItem('risk') || '10000')
  const [coefInput, setCoefInput] = useState(() => localStorage.getItem('coef') || '1.1')
  const [params, setParams] = useState<IndicatorParams>(() => {
    const p = localStorage.getItem('params')
    return p ? JSON.parse(p) : { L: 300, k: 1.0, limitMul: 10.0 }
  })

  // пресеты для быстрого тоггла L (ниже инпутов)
  const [lOptions, setLOptions] = useState<[number, number]>(() => {
    try { return JSON.parse(localStorage.getItem('lOptions') || '[100,300]') } catch { return [100, 300] }
  })

  // последние значения risk / coef (кнопки под инпутами)
  const [recentRisks, setRecentRisks] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('recentRisks') || '[]') } catch { return [] }
  })
  const [recentCoefs, setRecentCoefs] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('recentCoefs') || '[]') } catch { return [] }
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

  // persist
  useEffect(() => { localStorage.setItem('symbol', symbol) }, [symbol])
  useEffect(() => { localStorage.setItem('risk', riskInput) }, [riskInput])
  useEffect(() => { localStorage.setItem('coef', coefInput) }, [coefInput])
  useEffect(() => { localStorage.setItem('params', JSON.stringify(params)) }, [params])
  useEffect(() => { localStorage.setItem('history', JSON.stringify(history)) }, [history])
  useEffect(() => { localStorage.setItem('lOptions', JSON.stringify(lOptions)) }, [lOptions])
  useEffect(() => { localStorage.setItem('recentRisks', JSON.stringify(recentRisks)) }, [recentRisks])
  useEffect(() => { localStorage.setItem('recentCoefs', JSON.stringify(recentCoefs)) }, [recentCoefs])

  useEffect(() => {
    if (!notif) return
    const t = setTimeout(() => setNotif(null), 3000)
    return () => clearTimeout(t)
  }, [notif])

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
  const thr85 = thr * 1 * 0.85
  const thr2_85 = thr * 2 * 0.85
  const volume = thrCoef ? (risk * 100) / thrCoef : 0

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

    // обновляем списки последних значений (по факту использования)
    setRecentRisks(prev => pushRecent(risk, prev))
    setRecentCoefs(prev => pushRecent(coef, prev))

    setNotif('Entry saved')
  }

  const handleDelete = (ts: number) => {
    setHistory(history.filter(h => h.ts !== ts))
    setNotif('Entry deleted')
  }
  const handleClearAll = () => {
    setHistory([])
    setNotif('History cleared')
  }

  const selectL = (L: number) => setParams(p => ({ ...p, L }))

  return (
    <div className="min-h-screen bg-background">
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
            {recentRisks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recentRisks.map(v => (
                  <Button
                    key={`risk-${v}`}
                    variant="outline"
                    size="sm"
                    onClick={() => setRiskInput(String(v))}
                  >
                    {intFormatter.format(v)}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Coefficient</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={coefInput}
              onChange={e => setCoefInput(e.target.value)}
            />
            {recentCoefs.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recentCoefs.map(v => (
                  <Button
                    key={`coef-${v}`}
                    variant="outline"
                    size="sm"
                    onClick={() => setCoefInput(String(v))}
                  >
                    {v.toFixed(2)}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick L (bars) toggle */}
        <div className="space-y-2">
          <Label>Quick L (bars)</Label>
          <div className="grid grid-cols-2 gap-2">
            {[lOptions[0], lOptions[1]].map((Lval, i) => {
              const active = params.L === Lval
              return (
                <Button
                  key={`Lopt-${i}-${Lval}`}
                  variant={active ? 'default' : 'outline'}
                  onClick={() => selectL(Lval)}
                  className="w-full"
                  size="sm"
                >
                  L = {Lval}
                </Button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">Current L: {params.L}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="italic">Loading thresholds…</p>
            ) : symbol ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                <dt className="text-sm text-muted-foreground">NATR:</dt>
                <dd className="text-lg font-medium">{percentFormatter(thr)}</dd>

                <dt className="text-sm text-muted-foreground">NATR×coef:</dt>
                <dd className="text-lg font-medium">{percentFormatter(thrCoef)}</dd>

                <dt className="text-sm text-muted-foreground">×1×0.85:</dt>
                <dd className="text-lg font-medium">{percentFormatter(thr85)}</dd>

                <dt className="text-sm text-muted-foreground">×2×0.85:</dt>
                <dd className="text-lg font-medium">{percentFormatter(thr2_85)}</dd>

                <dt className="text-sm text-muted-foreground">Volume:</dt>
                <dd className="text-lg font-medium">{intFormatter.format(volume)}</dd>
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
        lOptions={lOptions}
        setLOptions={setLOptions}
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
