import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
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

const EditClientDialog = ({ open, onClose, client, onClientUpdated }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: client?.name || '',
      email: client?.email || '',
      phone: client?.phone || '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setError('');
      setLoading(true);
      try {
        const response = await api.put(`/clients/${client.id}`, values);
        onClientUpdated(response.data);
        onClose();
      } catch (err) {
        setError(err.response?.data?.message || "Erreur lors de la modification du client");
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (open) setError('');
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Modifier le client</DialogTitle>
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
            Enregistrer
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditClientDialog; 