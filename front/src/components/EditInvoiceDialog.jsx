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
  Box,
  CircularProgress
} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { useFormik, FieldArray, FormikProvider } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';

const EditInvoiceDialog = ({ open, onClose, invoice, onInvoiceUpdated }) => {
  const [error, setError] = useState('');
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setDataLoading(true);
      Promise.all([
        api.get('/clients'),
        api.get('/products')
      ]).then(([clientsRes, productsRes]) => {
        setClients(clientsRes.data);
        setProducts(productsRes.data);
      }).catch(err => {
        setError("Erreur lors du chargement des données.");
        console.error(err);
      }).finally(() => {
        setDataLoading(false);
      });
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
    enableReinitialize: true,
    initialValues: {
      clientId: invoice?.ClientId || '',
      date: invoice ? new Date(invoice.date).toISOString().slice(0, 10) : '',
      items: (invoice?.InvoiceItems && invoice.InvoiceItems.length > 0)
        ? invoice.InvoiceItems.map(item => ({
            productId: item.ProductId,
            quantity: item.quantity,
            price: item.price,
          }))
        : [{ productId: '', quantity: 1, price: 0 }],
    },
    validationSchema,
    onSubmit: async (values) => {
      setError('');
      setDataLoading(true);
      try {
        const submissionValues = {
          ...values,
          date: new Date(values.date).toISOString().split('T')[0]
        };
        const response = await api.put(`/invoices/${invoice.id}`, submissionValues);
        onInvoiceUpdated(response.data);
        onClose();
      } catch (err) {
        setError(err.response?.data?.message || "Erreur lors de la modification de la facture");
      } finally {
        setDataLoading(false);
      }
    },
  });

  const total = formik.values.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Modifier la facture n°{invoice?.id}</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {dataLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <FormControl fullWidth margin="dense">
                <InputLabel id="client-label">Client</InputLabel>
                <Select
                  labelId="client-label"
                  name="clientId"
                  value={formik.values.clientId}
                  onChange={formik.handleChange}
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
                InputLabelProps={{ shrink: true }}
              />
              <FormikProvider value={formik}>
                <FieldArray
                  name="items"
                  render={arrayHelpers => (
                    <Box>
                      {formik.values.items.map((item, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                          <FormControl sx={{ flex: 1 }}>
                            <InputLabel>Produit</InputLabel>
                            <Select
                              name={`items[${idx}].productId`}
                              value={item.productId}
                              label="Produit"
                              onChange={(e) => {
                                formik.handleChange(e);
                                const selectedProduct = products.find(p => p.id === e.target.value);
                                formik.setFieldValue(`items[${idx}].price`, selectedProduct ? selectedProduct.price : 0);
                              }}
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
                            disabled
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
              <Box sx={{ mt: 2, fontWeight: 'bold' }}>Total : {total.toFixed(2)} €</Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={dataLoading}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={dataLoading || !formik.isValid || !formik.dirty}>
            Enregistrer
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditInvoiceDialog; 