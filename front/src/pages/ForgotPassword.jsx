// Ce fichier gère la page de demande de réinitialisation du mot de passe
import { useState } from 'react';
import { Box, Button, Container, TextField, Typography, Alert, Paper } from '@mui/material';
import api from '../services/api';

// Composant principal de la page mot de passe oublié
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess('Si un compte existe, un email a été envoyé avec les instructions.');
    } catch (err) {
      setError("Erreur lors de la demande de réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

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
            Mot de passe oublié
          </Typography>
          {success && <Alert severity="success" sx={{ mb: 2, width: '100%' }}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              Envoyer le lien de réinitialisation
            </Button>
          </Box>
        </Paper>
    </Container>
  );
};

export default ForgotPassword; 