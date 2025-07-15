import axios from 'axios'

export interface IndicatorParams {
  L: number
  k: number
  limitMul: number
  smoothType: 'SMA'
  multiplier85: number
}

const INTERVAL = '1h'

export async function fetchHistoricalKlines(
  symbol: string,
  interval: string,
  requiredBars: number
) {
  const BATCH = 1000
  let all: any[][] = []
  let endTime: number | undefined

  while (all.length < requiredBars) {
    const sz = Math.min(BATCH, requiredBars - all.length)
    const { data } = await axios.get('https://fapi.binance.com/fapi/v1/klines', {
      params: { symbol, interval, limit: sz, endTime }
    })
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
  for (let j = idx - p + 1; j <= idx; j++) sum += arr[j] || 0
  return sum / p
}

function stdev(arr: number[], idx: number, p: number, mean: number): number {
  let sq = 0
  for (let j = idx - p + 1; j <= idx; j++) {
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
) {
  const { L, k, limitMul, multiplier85 } = params
  const n = closes.length
  const trArr = Array<number>(n).fill(NaN)

  for (let i = 0; i < n; i++) {
    const tr =
      i === 0
        ? highs[0] - lows[0]
        : Math.max(
            highs[i] - lows[i],
            Math.abs(highs[i] - closes[i - 1]),
            Math.abs(lows[i] - closes[i - 1])
          )
    trArr[i] = (tr / closes[i]) * 100
  }

  const mu0_1 = Array<number>(n).fill(NaN)
  for (let i = L - 1; i < n; i++) mu0_1[i] = sma(trArr, i, L)

  const mu0_2 = Array<number>(n).fill(NaN)
  for (let i = 2 * L - 2; i < n; i++) mu0_2[i] = sma(mu0_1, i, L)

  const trW = Array<number>(n).fill(NaN)
  for (let i = 0; i < n; i++) {
    if (i < 2 * L - 2) trW[i] = trArr[i]
    else trW[i] = Math.min(trArr[i], mu0_2[i] * limitMul)
  }

  const mu1 = Array<number>(n).fill(NaN)
  for (let i = L - 1; i < n; i++) mu1[i] = sma(trW, i, L)

  const mu2 = Array<number>(n).fill(NaN)
  for (let i = 2 * L - 2; i < n; i++) mu2[i] = sma(mu1, i, L)

  const thr = Array<number>(n).fill(NaN)
  const thrAdj = Array<number>(n).fill(NaN)
  for (let i = 3 * L - 3; i < n; i++) {
    const σ = stdev(trW, i, L, mu2[i])
    thr[i] = mu2[i] + k * σ
    thrAdj[i] = thr[i] * multiplier85 * 2
  }

  return { thr, thrAdj }
}

export async function getLastThresholds(
  symbol: string,
  params: IndicatorParams
) {
  const req = params.L * 3
  const { highs, lows, closes } = await fetchHistoricalKlines(
    symbol,
    INTERVAL,
    req
  )
  const { thr, thrAdj } = calcRobustThr(highs, lows, closes, params)
  const idxs = thr.map((v, i) => (!isNaN(v) ? i : -1)).filter(i => i >= 0)
  const last = idxs.pop()
  if (last === undefined) throw new Error('No threshold')
  return { natr: thr[last], adj2: thrAdj[last] }
}
