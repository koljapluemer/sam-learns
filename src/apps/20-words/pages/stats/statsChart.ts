import { BarController, BarElement, CategoryScale, Chart, Legend, LinearScale, Tooltip, type ChartItem } from 'chart.js'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip)

export function createDailyStatsChart(
  canvas: ChartItem,
  labels: string[],
  added: number[],
  memorized: number[],
  practiced: number[]
): Chart {
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Added', data: added, backgroundColor: '#2563eb' },
        { label: 'Memorized', data: memorized, backgroundColor: '#16a34a' },
        { label: 'Practiced', data: practiced, backgroundColor: '#d97706' }
      ]
    },
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
