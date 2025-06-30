import { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const StatCard = ({ title, value, icon, color }) => (
  <Paper
    sx={{
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      height: 140,
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ color: `${color}.main` }}>{icon}</Box>
    </Box>
    <Typography component="p" variant="h4">
      {value}
    </Typography>
  </Paper>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalProducts: 0,
    totalInvoices: 0,
    totalRevenue: 0,
  });
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, monthlyRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/stats/monthly'),
        ]);
        setStats(statsRes.data);
        setMonthly(monthlyRes.data);
      } catch (err) {
        setError('Erreur lors du chargement des statistiques');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ mt: 2 }}>
        {error}
      </Typography>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Tableau de bord
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Clients"
            value={stats.totalClients}
            icon={<PeopleIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Produits"
            value={stats.totalProducts}
            icon={<InventoryIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Factures"
            value={stats.totalInvoices}
            icon={<ReceiptIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Revenu Total"
            value={`${stats.totalRevenue.toLocaleString()} €`}
            icon={<MoneyIcon />}
            color="warning"
          />
        </Grid>
      </Grid>
      <Box sx={{ mt: 5 }}>
        <Typography variant="h6" gutterBottom>
          Chiffre d'affaires par mois
        </Typography>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={monthly} margin={{ top: 16, right: 32, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={m => m.slice(5) + '/' + m.slice(2, 4)} />
            <YAxis tickFormatter={v => v.toLocaleString()} />
            <Tooltip formatter={v => v.toLocaleString() + ' €'} labelFormatter={l => 'Mois : ' + l} />
            <Legend />
            <Bar dataKey="total" name="CA (€)" fill="#1976d2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default Dashboard;
