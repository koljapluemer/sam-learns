// Port of linguanodon's infinitesentences app/statsApp.js chart setup (the
// window.Chart CDN UMD global replaced by a real chart.js import). The
// original's chartjs-plugin-annotation goal line isn't a dependency here, so
// the goal is shown as a caption next to the chart instead (see PageStats.vue).
import { BarController, BarElement, CategoryScale, Chart, Legend, LinearScale, Tooltip, type ChartItem } from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip)

function generateColor(index: number, total: number): string {
  const hue = (index * 360) / Math.max(total, 1)
  return `hsl(${hue % 360}, 70%, 50%)`
}

export function createSentencesChart(
  canvas: ChartItem,
  labels: string[],
  languageIsos: string[],
  languageNames: Record<string, string>,
  countsByLanguage: { counts: Record<string, number> }[],
  totalsFallback: number[]
): Chart {
  const datasets =
    languageIsos.length === 0
      ? [{ label: 'Sentences', data: totalsFallback, backgroundColor: '#2563eb' }]
      : languageIsos.map((iso, index) => ({
          label: languageNames[iso] || iso,
          data: countsByLanguage.map((point) => point.counts[iso] || 0),
          backgroundColor: generateColor(index, languageIsos.length)
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
        y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  })
}
