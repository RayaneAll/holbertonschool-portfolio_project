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
  price: Yup.number().typeError('Prix invalide').min(0, 'Prix >= 0').required('Prix requis'),
  stock: Yup.number().typeError('Stock invalide').min(0, 'Stock >= 0').required('Stock requis'),
});

const EditProductDialog = ({ open, onClose, product, onProductUpdated }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: product?.name || '',
      price: product?.price || '',
      stock: product?.stock || '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setError('');
      setLoading(true);
      try {
        const response = await api.put(`/products/${product.id}`, values);
        onProductUpdated(response.data);
        onClose();
      } catch (err) {
        setError(err.response?.data?.message || "Erreur lors de la modification du produit");
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
      <DialogTitle>Modifier le produit</DialogTitle>
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

export default EditProductDialog; 