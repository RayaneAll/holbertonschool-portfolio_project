// Ce fichier gère la boîte de dialogue pour ajouter un produit
import { useState } from 'react';
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
  price: Yup.number().typeError('Prix invalide').min(0, 'Prix >= 0').required('Prix requis'),
  stock: Yup.number().typeError('Stock invalide').min(0, 'Stock >= 0').required('Stock requis'),
  description: Yup.string().required('Description requise').max(255, '255 caractères max'),
});

// Composant principal pour ajouter un produit
const AddProductDialog = ({ open, onClose, onProductAdded }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: '',
      price: '',
      stock: '',
      description: '',
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setError('');
      setLoading(true);
      try {
        const response = await api.post('/products', values);
        onProductAdded(response.data);
        resetForm();
        onClose();
      } catch (err) {
        if (err.response?.status === 409) {
          setError("Un produit avec cette description existe déjà.");
        } else {
          setError(err.response?.data?.message || "Erreur lors de l'ajout du produit");
        }
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Ajouter un produit</DialogTitle>
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
            label="Prix (€)"
            name="price"
            type="number"
            fullWidth
            value={formik.values.price}
            onChange={formik.handleChange}
            error={formik.touched.price && Boolean(formik.errors.price)}
            helperText={formik.touched.price && formik.errors.price}
          />
          <TextField
            margin="dense"
            label="Stock"
            name="stock"
            type="number"
            fullWidth
            value={formik.values.stock}
            onChange={formik.handleChange}
            error={formik.touched.stock && Boolean(formik.errors.stock)}
            helperText={formik.touched.stock && formik.errors.stock}
          />
          <TextField
            margin="dense"
            label="Description"
            name="description"
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            value={formik.values.description}
            onChange={formik.handleChange}
            error={formik.touched.description && Boolean(formik.errors.description)}
            helperText={formik.touched.description && formik.errors.description}
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

export default AddProductDialog; 