import axios from 'axios'

export interface IndicatorParams {
  L: number
  k: number
  limitMul: number
}

const INTERVAL = '1h'

export async function fetchHistoricalKlinesBinance(
  symbol: string,
  interval: string,
  requiredBars: number
): Promise<{ highs: number[]; lows: number[]; closes: number[] }> {
  const BATCH_LIMIT = 1000
  let all: any[][] = []
  let endTime: number | undefined

  while (all.length < requiredBars) {
    const batchSize = Math.min(BATCH_LIMIT, requiredBars - all.length)
    const qs: any = { symbol, interval, limit: batchSize, endTime }
    const { data } = await axios.get(
      'https://fapi.binance.com/fapi/v1/klines',
      { params: qs }
    )
    if (!data.length) break
    all = data.concat(all)
    endTime = data[0][0] - 1
  }

  const slice = all.slice(-requiredBars)
  return {
    highs: slice.map(k => +k[2]),
    lows: slice.map(k => +k[3]),
    closes: slice.map(k => +k[4])
  }
}

function sma(arr: number[], idx: number, p: number): number {
  let sum = 0
  for (let j = idx - p + 1; j <= idx; j++) {
    if (isNaN(arr[j]) || arr[j] === undefined) return NaN
    sum += arr[j]
  }
  return sum / p
}

function stdev(arr: number[], idx: number, p: number): number {
  // используем sma внутри, как в оригинале
  const mean = sma(arr, idx, p)
  if (isNaN(mean)) return NaN

  let sq = 0
  for (let j = idx - p + 1; j <= idx; j++) {
    if (isNaN(arr[j]) || arr[j] === undefined) return NaN
    const d = arr[j] - mean
    sq += d * d
  }
  return Math.sqrt(sq / p)
}

export function calcRobustThr(
  highs: number[],
  lows: number[],
  closes: number[],
  params: IndicatorParams
): { thr: number[]; thrAdj: number[] } {
  const { L, k, limitMul } = params
  const n = closes.length

  const n1 = Array<number>(n).fill(NaN)
  const mu0_1 = Array<number>(n).fill(NaN)
  const mu0_2 = Array<number>(n).fill(NaN)
  const n1w = Array<number>(n).fill(NaN)
  const mu1 = Array<number>(n).fill(NaN)
  const mu2 = Array<number>(n).fill(NaN)
  const thr = Array<number>(n).fill(NaN)
  const thrAdj = Array<number>(n).fill(NaN)

  // 1) NATR
  for (let i = 0; i < n; i++) {
    if (
      isNaN(highs[i]) ||
      isNaN(lows[i]) ||
      isNaN(closes[i]) ||
      closes[i] <= 0 ||
      (i > 0 && (isNaN(closes[i - 1]) || closes[i - 1] <= 0))
    )
      continue

    const tr =
      i === 0
        ? highs[0] - lows[0]
        : Math.max(
            highs[i] - lows[i],
            Math.abs(highs[i] - closes[i - 1]),
            Math.abs(lows[i] - closes[i - 1])
          )
    n1[i] = (tr / closes[i]) * 100
  }

  // 2) double SMA for mu0_2
  for (let i = L - 1; i < n; i++) mu0_1[i] = sma(n1, i, L)
  for (let i = 2 * L - 2; i < n; i++) mu0_2[i] = sma(mu0_1, i, L)

  // 3) winsorize
  for (let i = 0; i < n; i++) {
    const v = n1[i]
    const m02 = mu0_2[i]
    n1w[i] =
      isNaN(m02) || isNaN(v) || m02 <= 0 ? v : Math.min(v, m02 * limitMul)
  }

  // 4) double SMA for mu2
  for (let i = 2 * L - 2; i < n; i++) mu1[i] = sma(n1w, i, L)
  for (let i = 3 * L - 3; i < n; i++) mu2[i] = sma(mu1, i, L)

  // 5) threshold
  for (let i = 3 * L - 3; i < n; i++) {
    const base = mu2[i]
    if (isNaN(base)) continue
    const σ = stdev(n1w, i, L)
    if (isNaN(σ)) continue
    thr[i] = base + k * σ
    thrAdj[i] = thr[i] * 0.85 * 2 // как в вашем скрипте
  }

  return { thr, thrAdj }
}

/**
 * Возвращает последние значения thr и thrAdj
 */
export async function getLastThresholds(
  symbol: string,
  params: IndicatorParams
): Promise<{ thr: number; thrAdj: number }> {
  const REQUIRED_BARS = params.L * 3
  const { highs, lows, closes } = await fetchHistoricalKlinesBinance(
    symbol,
    INTERVAL,
    REQUIRED_BARS
  )
  if (highs.length < REQUIRED_BARS) {
    throw new Error('Not enough data')
  }
  const { thr, thrAdj } = calcRobustThr(highs, lows, closes, params)
  const idxs = thr
    .map((v, i) => (!isNaN(v) ? i : -1))
    .filter(i => i >= 0)
  const lastI = idxs.pop()
  if (lastI === undefined) {
    throw new Error('No threshold calculated')
  }
  return { thr: thr[lastI], thrAdj: thrAdj[lastI] }
}