import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  Paper
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Email invalide')
    .required('Email requis'),
  password: Yup.string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .required('Mot de passe requis'),
});

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      console.log('Tentative de connexion avec:', values.email);
      setError('');
      try {
        const result = await login(values.email, values.password);
        console.log('Résultat de la connexion:', result);
        if (result.success) {
          console.log('Redirection vers /dashboard');
          navigate('/dashboard');
          window.location.href = '/dashboard';
        } else {
          console.log('Erreur de connexion:', result.error);
          setError(result.error);
        }
      } catch (err) {
        console.error('Erreur lors de la connexion:', err);
        setError('Une erreur est survenue lors de la connexion');
      }
    },
  });

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
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5">
            Connexion
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{ mt: 1, width: '100%' }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mot de passe"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Se connecter
            </Button>
          </Box>
          <Box sx={{ mt: 2, width: '100%', textAlign: 'right' }}>
            <Link to="/forgot-password" style={{ color: '#1976d2', textDecoration: 'none', fontSize: 14 }}>
              Mot de passe oublié ?
            </Link>
          </Box>
        </Paper>
    </Container>
  );
};

export default Login; 