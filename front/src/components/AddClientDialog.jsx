// Ce fichier gère la boîte de dialogue pour ajouter un client
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';

const validationSchema = Yup.object({
  name: Yup.string().required('Nom requis'),
  email: Yup.string().email('Email invalide').required('Email requis'),
  phone: Yup.string().required('Téléphone requis'),
});

// Composant principal pour ajouter un client
const AddClientDialog = ({ open, onClose, onClientAdded }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      phone: '',
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setError('');
      setLoading(true);
      try {
        const response = await api.post('/clients', values);
        onClientAdded(response.data);
        resetForm();
        onClose();
      } catch (err) {
        if (err.response?.status === 409) {
          setError("Un client avec cet email ou ce téléphone existe déjà.");
        } else {
          setError(err.response?.data?.message || 'Erreur lors de l\'ajout du client');
        }
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Ajouter un client</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            margin="dense"
            label="Nom"
            name="name"
            fullWidth
            value={formik.values.name}
            onChange={formik.handleChange}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
          />
          <TextField
            margin="dense"
            label="Email"
            name="email"
            type="email"
            fullWidth
            value={formik.values.email}
            onChange={formik.handleChange}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
          />
          <TextField
            margin="dense"
            label="Téléphone"
            name="phone"
            fullWidth
            value={formik.values.phone}
            onChange={formik.handleChange}
            error={formik.touched.phone && Boolean(formik.errors.phone)}
            helperText={formik.touched.phone && formik.errors.phone}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            Ajouter
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddClientDialog; 