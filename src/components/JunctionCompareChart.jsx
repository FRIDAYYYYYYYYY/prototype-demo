import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default function JunctionCompareChart() {
  const theme = useTheme()

  const data = {
    labels: ['2 s', '2 min', '3 min', '5 min'],
    datasets: [
      {
        label: 'CP-SAT Objective',
        data: [16000, 20000, 18000, 12000],
        backgroundColor: theme.palette.primary.main,
        borderRadius: 4,
      },
      {
        label: 'FCFS Objective',
        data: [27000, 21000, 18000, 12000],
        backgroundColor: theme.palette.warning.main,
        borderRadius: 4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme.palette.text.primary,
          font: {
            size: 11,
            weight: 600,
          },
          boxWidth: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Arrival Gap (Track B first, Track A second)',
          color: theme.palette.text.secondary,
          font: { size: 11, weight: 600 },
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: { size: 11 },
        },
        grid: {
          color: theme.palette.divider,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Weighted Delay Cost (Penalty Units)',
          color: theme.palette.text.secondary,
          font: { size: 11, weight: 600 },
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: { size: 11 },
        },
        grid: {
          color: theme.palette.divider,
        },
      },
    },
  }

  return (
    <Card sx={{ mt: 2.5 }}>
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <CompareArrowsRoundedIcon color="primary" sx={{ fontSize: 20 }} />
          <Typography variant="h6" sx={{ fontSize: '0.98rem', fontWeight: 800 }}>
            Junction Optimization Benchmark (CP-SAT vs. FCFS)
          </Typography>
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Comparative objective penalty comparison across varying arrival separation gaps at the converging junction.
        </Typography>

        <Box sx={{ width: '100%', height: 240 }}>
          <Bar data={data} options={options} />
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1.5, textAlign: 'center', fontStyle: 'italic', fontSize: '0.75rem' }}
        >
          Verified replay values. FCFS hand-computed from the same cost model.
        </Typography>
      </Box>
    </Card>
  )
}
