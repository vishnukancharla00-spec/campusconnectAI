import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

/**
 * createOldMoneyChart(ctx, labels, data, options)
 * - ctx: canvas.getContext('2d') or canvas element
 * - labels: array
 * - data: array (or array of arrays for multiple datasets)
 */
export function createOldMoneyChart(ctx, labels, data, options = {}) {
  // if ctx is element, get context
  const context = (ctx && ctx.getContext) ? ctx.getContext('2d') : ctx;

  // gradients sized for a typical canvas height; Chart.js will adapt visually
  const g1 = context.createLinearGradient(0,0,0,300);
  g1.addColorStop(0, "rgba(47,93,59,0.95)");
  g1.addColorStop(1, "rgba(47,93,59,0.12)");

  const g2 = context.createLinearGradient(0,0,0,300);
  g2.addColorStop(0,"rgba(201,163,95,0.95)");
  g2.addColorStop(1,"rgba(201,163,95,0.12)");

  const g3 = context.createLinearGradient(0,0,0,300);
  g3.addColorStop(0,"rgba(124,46,46,0.95)");
  g3.addColorStop(1,"rgba(124,46,46,0.12)");

  const palette = [g1, g2, g3, "#243B55", "#F5E6C6"];

  const dataset = Array.isArray(data[0])
    ? data.map((d, i) => ({
        label: options.labels && options.labels[i] ? options.labels[i] : `Series ${i+1}`,
        data: d,
        backgroundColor: palette[i % palette.length],
        borderColor: palette[i % palette.length],
        borderWidth: 1,
        fill: true,
      }))
    : [{
        label: options.label || "Dataset",
        data,
        backgroundColor: palette,
        borderColor: palette.map(c => (typeof c === 'string' ? c : c.toString())),
        borderWidth: 1,
        borderRadius: 8,
      }];

  return new Chart(context, {
    type: options.type || "bar",
    data: {
      labels,
      datasets: dataset
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(33,33,33,0.95)",
          titleColor: "#fff",
          bodyColor: "#fff"
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#444" } },
        y: { grid: { color: "rgba(16,16,16,0.04)" }, ticks: { color: "#444" } }
      },
      maintainAspectRatio: false,
      ...options
    }
  });
}
