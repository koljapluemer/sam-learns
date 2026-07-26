// Stacked bar chart: watch time per day, stacked by language - same
// chart.js setup as src/apps/infinitesentences/app/statsChart.ts.
import { BarController, BarElement, CategoryScale, Chart, Legend, LinearScale, Tooltip, type ChartItem } from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip)

function generateColor(index: number, total: number): string {
  const hue = (index * 360) / Math.max(total, 1)
  return `hsl(${hue % 360}, 70%, 50%)`
}

export function createDailyWatchTimeChart(
  canvas: ChartItem,
  labels: string[],
  languageNames: string[],
  minutesByLanguage: { minutes: Record<string, number> }[]
): Chart {
  const datasets = languageNames.map((languageName, index) => ({
    label: languageName,
    data: minutesByLanguage.map((point) => point.minutes[languageName] || 0),
    backgroundColor: generateColor(index, languageNames.length)
  }))

  return new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true, title: { display: true, text: 'minutes' } }
      }
    }
  })
}
