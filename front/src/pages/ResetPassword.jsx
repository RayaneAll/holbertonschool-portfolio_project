// Ce fichier gère la page de réinitialisation du mot de passe
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Button, Container, TextField, Typography, Alert, Paper } from '@mui/material';
import api from '../services/api';

// Composant principal de la page de réinitialisation
const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!password || password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess('Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Container
        component="main"
        maxWidth="xs"
        disableGutters
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#222',
        }}
      >
          <Paper elevation={3} sx={{ padding: 4, width: '100%', textAlign: 'center' }}>
            <Alert severity="error">Lien de réinitialisation invalide.</Alert>
          </Paper>
      </Container>
    );
  }

  return (
    <Container
      component="main"
      maxWidth="xs"
      disableGutters
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#222',
      }}
    >
        <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
            Nouveau mot de passe
          </Typography>
          {success && <Alert severity="success" sx={{ mb: 2, width: '100%' }}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Nouveau mot de passe"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirm"
              label="Confirmer le mot de passe"
              type="password"
              id="confirm"
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              Réinitialiser le mot de passe
            </Button>
          </Box>
        </Paper>
    </Container>
  );
};

export default ResetPassword; 