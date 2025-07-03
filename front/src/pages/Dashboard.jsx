// Ce fichier affiche le tableau de bord avec les statistiques principales
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

// Carte statistique pour chaque indicateur
const StatCard = ({ title, value, icon, color, symbol }) => (
  <Paper
    sx={{
      p: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: { xs: 150, sm: 170 },
      width: { xs: 150, sm: 170 },
      minWidth: 120,
      maxWidth: 200,
      borderRadius: 5,
      boxShadow: 4,
      textAlign: 'center',
      m: { xs: 1, sm: 2 },
      mx: 'auto',
      position: 'relative',
    }}
  >
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
      <Box sx={{ color: `${color}.main`, mb: 1 }}>{icon}</Box>
      <Typography color="text.secondary" gutterBottom sx={{ fontSize: 17, fontWeight: 500 }}>
        {title}
      </Typography>
      {symbol ? (
        <Typography component="p" variant="h3" sx={{ fontWeight: 700, fontSize: 38, lineHeight: 1, mb: 2 }}>
          {value}
          <span style={{ fontSize: 38, fontWeight: 700, color: '#222', verticalAlign: 'baseline', marginLeft: 2 }}>{symbol}</span>
        </Typography>
      ) : (
        <Typography component="p" variant="h3" sx={{ fontWeight: 700, fontSize: 38, lineHeight: 1, mb: 2 }}>
          {value}
        </Typography>
      )}
    </Box>
  </Paper>
);

// Composant principal du tableau de bord
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
      <Grid container spacing={0} justifyContent="center" alignItems="center">
        <Grid item xs={6} sm={6} md={3} display="flex" justifyContent="center" alignItems="center">
          <StatCard
            title="Total Clients"
            value={stats.totalClients}
            icon={<PeopleIcon sx={{ fontSize: 36 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3} display="flex" justifyContent="center" alignItems="center">
          <StatCard
            title="Total Produits"
            value={stats.totalProducts}
            icon={<InventoryIcon sx={{ fontSize: 36 }} />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3} display="flex" justifyContent="center" alignItems="center">
          <StatCard
            title="Total Factures"
            value={stats.totalInvoices}
            icon={<ReceiptIcon sx={{ fontSize: 36 }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3} display="flex" justifyContent="center" alignItems="center">
          <StatCard
            title="Revenu Total"
            value={stats.totalRevenue.toLocaleString()}
            icon={<MoneyIcon sx={{ fontSize: 36 }} />}
            color="warning"
            symbol="€"
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

// Export du composant Dashboard
export default Dashboard;
