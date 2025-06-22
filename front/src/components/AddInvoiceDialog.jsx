import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  IconButton,
  Box
} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { useFormik, FieldArray, FormikProvider } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';

const AddInvoiceDialog = ({ open, onClose, onInvoiceAdded }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (open) {
      api.get('/clients').then(res => setClients(res.data));
      api.get('/products').then(res => setProducts(res.data));
    }
  }, [open]);

  const validationSchema = Yup.object({
    clientId: Yup.number().required('Client requis'),
    date: Yup.date().required('Date requise'),
    items: Yup.array().of(
      Yup.object({
        productId: Yup.number().required('Produit requis'),
        quantity: Yup.number().min(1, 'Min 1').required('Quantité requise'),
        price: Yup.number().min(0, 'Prix >= 0').required('Prix requis'),
      })
    ).min(1, 'Au moins un produit'),
  });

  const formik = useFormik({
    initialValues: {
      clientId: '',
      date: new Date().toISOString().slice(0, 10),
      items: [{ productId: '', quantity: 1, price: 0 }],
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setError('');
      setLoading(true);
      try {
        const response = await api.post('/invoices', values);
        onInvoiceAdded(response.data);
        resetForm();
        onClose();
      } catch (err) {
        setError(err.response?.data?.message || "Erreur lors de l'ajout de la facture");
      } finally {
        setLoading(false);
      }
    },
  });

  // Calcul du total
  const total = formik.values.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Ajouter une facture</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <FormControl fullWidth margin="dense">
            <InputLabel id="client-label">Client</InputLabel>
            <Select
              labelId="client-label"
              name="clientId"
              value={formik.values.clientId}
              onChange={formik.handleChange}
              error={formik.touched.clientId && Boolean(formik.errors.clientId)}
              label="Client"
            >
              {clients.map((client) => (
                <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Date"
            name="date"
            type="date"
            fullWidth
            value={formik.values.date}
            onChange={formik.handleChange}
            error={formik.touched.date && Boolean(formik.errors.date)}
            helperText={formik.touched.date && formik.errors.date}
            InputLabelProps={{ shrink: true }}
          />
          <FormikProvider value={formik}>
            <FieldArray
              name="items"
              render={arrayHelpers => (
                <Box>
                  {formik.values.items.map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                      <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel id={`product-label-${idx}`}>Produit</InputLabel>
                        <Select
                          labelId={`product-label-${idx}`}
                          name={`items[${idx}].productId`}
                          value={item.productId}
                          onChange={formik.handleChange}
                          label="Produit"
                        >
                          {products.map((p) => (
                            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        label="Quantité"
                        name={`items[${idx}].quantity`}
                        type="number"
                        value={item.quantity}
                        onChange={formik.handleChange}
                        sx={{ width: 100 }}
                      />
                      <TextField
                        label="Prix (€)"
                        name={`items[${idx}].price`}
                        type="number"
                        value={item.price}
                        onChange={formik.handleChange}
                        sx={{ width: 120 }}
                      />
                      <IconButton onClick={() => arrayHelpers.remove(idx)} disabled={formik.values.items.length === 1}>
                        <Remove />
                      </IconButton>
                      <IconButton onClick={() => arrayHelpers.insert(idx + 1, { productId: '', quantity: 1, price: 0 })}>
                        <Add />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            />
          </FormikProvider>
          <Box sx={{ mt: 2, fontWeight: 'bold' }}>Total : {total} €</Box>
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

export default AddInvoiceDialog; 