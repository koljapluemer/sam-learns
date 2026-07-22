// Port of linguanodon's hebrewscript app/charts.js to real ESM imports
// (Chart.js was a CDN UMD global there; here it's an actual npm dependency,
// same library, same registration, same chart configs).

import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  Legend,
  PointElement,
  Tooltip,
  type ChartConfiguration
} from 'chart.js'
import { LineWithErrorBarsController, PointWithErrorBar } from 'chartjs-chart-error-bars'
import { fillDailyRange, fullDateFormatter, getChartMinWidth, shortDateFormatter, toDate } from './dailyChart'
import type { AccuracyTrialPoint, DailyAccuracyPoint, DailyExercisePoint, PairAccuracyTrialPoint } from './types'

Chart.register(
  LineController,
  BarController,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  Filler,
  Legend,
  Tooltip,
  LineWithErrorBarsController,
  PointWithErrorBar
)

const RECENT_TRIAL_WINDOW = 100

function readThemeColor(propertyName: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(propertyName).trim()
  return value || '#888888'
}

function readChartPalette() {
  return {
    axis: readThemeColor('--color-base-content'),
    axisBorder: readThemeColor('--color-base-300'),
    errorBar: readThemeColor('--color-base-content'),
    error: readThemeColor('--color-error'),
    grid: readThemeColor('--color-base-300'),
    primary: readThemeColor('--color-primary'),
    success: readThemeColor('--color-success'),
    surface: readThemeColor('--color-base-100'),
    tooltipBackground: readThemeColor('--color-base-100')
  }
}

function toRollingDataset(label: string, borderColor: string, trials: AccuracyTrialPoint[], getValue: (trial: AccuracyTrialPoint) => number) {
  return {
    label,
    data: trials.map((trial) => ({ x: trial.trialNumber, y: Math.round(getValue(trial) * 1000) / 10 })),
    borderColor,
    borderWidth: 3,
    cubicInterpolationMode: 'monotone' as const,
    pointRadius: 0,
    tension: 0.3
  }
}

export function createAccuracyTrendChart(canvas: HTMLCanvasElement, initialTrials: AccuracyTrialPoint[]) {
  let trials = initialTrials
  let range: 'recent' | 'all' = 'recent'
  let chart: Chart | null = null
  const palette = readChartPalette()

  const render = () => {
    const visibleTrials = range === 'recent' ? trials.slice(-RECENT_TRIAL_WINDOW) : trials
    const firstVisibleTrialNumber = visibleTrials[0]?.trialNumber
    const lastVisibleTrialNumber = visibleTrials[visibleTrials.length - 1]?.trialNumber

    const markerDataset = {
      label: 'Individual trials',
      data: visibleTrials.map((trial) => ({ x: trial.trialNumber, y: 50 })),
      borderWidth: 0,
      pointBackgroundColor: visibleTrials.map((trial) => (trial.isCorrect ? palette.success : palette.error)),
      pointBorderColor: visibleTrials.map((trial) => (trial.isCorrect ? palette.success : palette.error)),
      pointHoverRadius: 5,
      pointRadius: 4,
      showLine: false
    }

    const datasets =
      range === 'recent'
        ? [
            markerDataset,
            toRollingDataset('Rolling 10', 'rgb(59, 130, 246)', visibleTrials, (t) => t.rolling10),
            toRollingDataset('Rolling 100', 'rgb(245, 158, 11)', visibleTrials, (t) => t.rolling100)
          ]
        : [
            toRollingDataset('Rolling 100', 'rgb(245, 158, 11)', visibleTrials, (t) => t.rolling100),
            toRollingDataset('Rolling 1000', 'rgb(168, 85, 247)', visibleTrials, (t) => t.rolling1000)
          ]

    if (chart) chart.destroy()
    chart = new Chart(canvas, {
      type: 'line',
      data: { datasets },
      options: {
        animation: false,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'nearest' },
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true } },
          tooltip: {
            callbacks: {
              title: (items) => (items[0] ? `Trial ${items[0].parsed.x}` : ''),
              label: (item) => {
                if (range === 'recent' && item.dataset.label === 'Individual trials') {
                  return visibleTrials[item.dataIndex]?.isCorrect ? 'Correct' : 'Incorrect'
                }
                const value = (item.parsed.y as number) ?? 0
                return `${item.dataset.label}: ${value.toFixed(1)}%`
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            max: lastVisibleTrialNumber,
            min: firstVisibleTrialNumber,
            ticks: { maxRotation: 0 },
            title: { display: true, text: 'Trial' },
            type: 'linear'
          },
          y: {
            max: 100,
            min: 0,
            ticks: { callback: (value) => `${value}%` },
            title: { display: true, text: 'Accuracy' }
          }
        }
      }
    } as ChartConfiguration)
  }

  render()

  return {
    setRange(nextRange: 'recent' | 'all') {
      range = nextRange
      render()
    },
    getRange: () => range,
    update(nextTrials: AccuracyTrialPoint[]) {
      trials = nextTrials
      render()
    }
  }
}

export function createDailyVolumeChart(canvas: HTMLCanvasElement, days: DailyExercisePoint[]) {
  const completeDays = fillDailyRange(days, (day) => ({ day, exercises: 0 }))
  const chartLabels = completeDays.map((point) => {
    const date = toDate(point.day)
    return date ? shortDateFormatter.format(date) : point.day
  })

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: chartLabels,
      datasets: [
        {
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(37, 99, 235)',
          borderRadius: 6,
          borderSkipped: false,
          data: completeDays.map((point) => point.exercises),
          label: 'Exercises',
          maxBarThickness: 36
        }
      ]
    },
    options: {
      animation: false,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => {
              const point = completeDays[items[0]?.dataIndex ?? -1]
              if (!point) return ''
              const date = toDate(point.day)
              return date ? fullDateFormatter.format(date) : point.day
            },
            label: (item) => {
              const exercises = (item.parsed.y as number) ?? 0
              return `${exercises} exercise${exercises === 1 ? '' : 's'}`
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Exercises' } }
      }
    }
  })

  return { chart, completeDays }
}

export function createDailyAccuracyChart(canvas: HTMLCanvasElement, days: DailyAccuracyPoint[]) {
  const palette = readChartPalette()
  const completeDays = fillDailyRange(days, (day) => ({
    accuracy: null,
    confidenceHigh95: null,
    confidenceLow95: null,
    correct: 0,
    day,
    trials: 0
  }))
  const chartLabels = completeDays.map((point) => {
    const date = toDate(point.day)
    return date ? shortDateFormatter.format(date) : point.day
  })

  const chart = new Chart(canvas, {
    type: 'lineWithErrorBars',
    data: {
      labels: chartLabels,
      datasets: [
        {
          borderColor: palette.primary,
          data: completeDays.map((point) =>
            point.accuracy === null || point.confidenceLow95 === null || point.confidenceHigh95 === null
              ? { y: Number.NaN, yMax: Number.NaN, yMin: Number.NaN }
              : { y: point.accuracy * 100, yMax: point.confidenceHigh95 * 100, yMin: point.confidenceLow95 * 100 }
          ),
          errorBarColor: palette.errorBar,
          errorBarLineWidth: 2.5,
          errorBarWhiskerColor: palette.errorBar,
          errorBarWhiskerLineWidth: 2.5,
          errorBarWhiskerSize: 10,
          label: 'Accuracy',
          pointBackgroundColor: palette.primary,
          pointBorderColor: palette.surface,
          pointBorderWidth: 2.5,
          pointHoverRadius: 7,
          pointRadius: 15,
          pointRotation: 0,
          pointStyle: 'circle',
          showLine: false,
          spanGaps: false
        }
      ]
    },
    options: {
      animation: false,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: palette.tooltipBackground,
          bodyColor: palette.axis,
          borderColor: palette.axisBorder,
          borderWidth: 1,
          displayColors: false,
          titleColor: palette.axis,
          callbacks: {
            label: (item) => {
              const point = completeDays[item.dataIndex]
              if (!point || point.accuracy === null || point.confidenceLow95 === null || point.confidenceHigh95 === null) return ''
              return [
                `Accuracy: ${(point.accuracy * 100).toFixed(1)}%`,
                `95% CI: ${(point.confidenceLow95 * 100).toFixed(1)}% to ${(point.confidenceHigh95 * 100).toFixed(1)}%`,
                `Trials: ${point.trials}`
              ]
            },
            title: (items) => {
              const point = completeDays[items[0]?.dataIndex ?? -1]
              if (!point) return ''
              const date = toDate(point.day)
              return date ? fullDateFormatter.format(date) : point.day
            }
          }
        }
      },
      scales: {
        x: { border: { color: palette.axisBorder }, grid: { display: false }, offset: true, ticks: { color: palette.axis } },
        y: {
          border: { color: palette.axisBorder },
          max: 100,
          min: 0,
          ticks: { callback: (value) => `${value}%`, color: palette.axis, stepSize: 25 },
          grid: { color: palette.grid },
          title: { color: palette.axis, display: true, text: 'Accuracy' }
        }
      }
    } as ChartConfiguration<'lineWithErrorBars'>['options']
  } as ChartConfiguration<'lineWithErrorBars'>)

  return { chart, completeDays }
}

export function createPairHistoryChart(canvas: HTMLCanvasElement, trials: PairAccuracyTrialPoint[]) {
  const palette = readChartPalette()
  const firstVisibleTrial = trials[0]?.trialNumber ?? 1
  const lastVisibleTrial = trials[trials.length - 1]?.trialNumber ?? 1

  const timestampFormatter = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric'
  })
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return Number.isNaN(date.getTime()) ? timestamp : timestampFormatter.format(date)
  }

  return new Chart(canvas, {
    type: 'line',
    data: {
      datasets: [
        {
          data: trials.map((trial) => ({ x: trial.trialNumber, y: trial.isCorrect ? 100 : 0 })),
          label: 'Attempts',
          pointBackgroundColor: trials.map((trial) => (trial.isCorrect ? palette.success : palette.error)),
          pointBorderColor: trials.map((trial) => (trial.isCorrect ? palette.success : palette.error)),
          pointBorderWidth: 1.5,
          pointHoverRadius: 5,
          pointRadius: 4,
          showLine: false
        },
        {
          borderColor: palette.primary,
          borderWidth: 3,
          cubicInterpolationMode: 'monotone',
          data: trials.map((trial) => ({ x: trial.trialNumber, y: Math.round(trial.rolling10 * 1000) / 10 })),
          label: 'Rolling 10',
          pointBackgroundColor: palette.primary,
          pointBorderColor: palette.surface,
          pointBorderWidth: 2,
          pointHoverRadius: 5,
          pointRadius: 2,
          tension: 0.25
        }
      ]
    },
    options: {
      animation: false,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'nearest' },
      plugins: {
        legend: { position: 'bottom', labels: { color: palette.axis, usePointStyle: true } },
        tooltip: {
          backgroundColor: palette.tooltipBackground,
          bodyColor: palette.axis,
          borderColor: palette.axisBorder,
          borderWidth: 1,
          titleColor: palette.axis,
          callbacks: {
            title: (items) => {
              const trial = trials[items[0]?.dataIndex ?? -1]
              if (!trial) return ''
              return [`Attempt ${trial.trialNumber}`, formatTimestamp(trial.timestamp)]
            },
            label: (item) => {
              const trial = trials[item.dataIndex]
              if (item.dataset.label === 'Attempts') return trial?.isCorrect ? 'Correct' : 'Incorrect'
              return `Rolling 10: ${((item.parsed.y as number) ?? 0).toFixed(1)}%`
            }
          }
        }
      },
      scales: {
        x: {
          border: { color: palette.axisBorder },
          grid: { display: false },
          max: lastVisibleTrial,
          min: firstVisibleTrial,
          ticks: { color: palette.axis, maxRotation: 0 },
          title: { color: palette.axis, display: true, text: 'Attempt' },
          type: 'linear'
        },
        y: {
          beginAtZero: true,
          border: { color: palette.axisBorder },
          grid: { color: palette.grid },
          max: 100,
          ticks: { callback: (value) => `${value}%`, color: palette.axis },
          title: { color: palette.axis, display: true, text: 'Accuracy' }
        }
      }
    }
  })
}

export { getChartMinWidth }
