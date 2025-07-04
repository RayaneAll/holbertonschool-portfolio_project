// Ce fichier gère la boîte de dialogue pour modifier une facture
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
  CircularProgress,
  useMediaQuery
} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { useFormik, FieldArray, FormikProvider } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';
import { useTheme } from '@mui/material/styles';

// Composant principal pour modifier une facture
const EditInvoiceDialog = ({ open, onClose, invoice, onInvoiceUpdated }) => {
  const [error, setError] = useState('');
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (open) {
      setDataLoading(true);
      Promise.all([
        api.get('/clients?limit=1000'),
        api.get('/products?limit=1000')
      ]).then(([clientsRes, productsRes]) => {
        setClients(clientsRes.data.results || []);
        setProducts(productsRes.data.results || []);
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
        <DialogContent sx={{ p: isMobile ? 1 : 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {dataLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TextField
                select
                margin="dense"
                label="Client"
                name="clientId"
                fullWidth
                value={formik.values.clientId}
                onChange={formik.handleChange}
                error={formik.touched.clientId && Boolean(formik.errors.clientId)}
                helperText={formik.touched.clientId && formik.errors.clientId}
                size={isMobile ? 'small' : 'medium'}
                InputLabelProps={{ shrink: true }}
                inputProps={{ style: { minHeight: 40 } }}
              >
                {Array.isArray(clients) ? clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                )) : null}
              </TextField>
              <TextField
                margin="dense"
                label="Date"
                name="date"
                type="date"
                fullWidth
                value={formik.values.date}
                onChange={formik.handleChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: new Date().toISOString().slice(0, 10) }}
                size={isMobile ? 'small' : 'medium'}
              />
              {(() => {
                const selectedDate = new Date(formik.values.date);
                const today = new Date();
                today.setHours(0,0,0,0);
                selectedDate.setHours(0,0,0,0);
                const diffDays = Math.floor((today - selectedDate) / (1000 * 60 * 60 * 24));
                if (diffDays > 30) {
                  return <Alert severity="warning" sx={{ mb: 2 }}>Attention : la date de facture est très ancienne ({diffDays} jours dans le passé).</Alert>;
                }
                return null;
              })()}
              <Box sx={{ mt: 2 }} />
              <FormikProvider value={formik}>
                <FieldArray
                  name="items"
                  render={arrayHelpers => (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {formik.values.items.map((item, idx) => {
                        const selectedProduct = products.find(p => p.id === item.productId);
                        const maxQty = selectedProduct ? selectedProduct.stock : Infinity;
                        const isOutOfStock = selectedProduct && selectedProduct.stock === 0;
                        const qtyError = item.quantity > maxQty;
                        return (
                          <Box key={idx} sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 1, alignItems: isMobile ? 'stretch' : 'center', mb: 1, p: isMobile ? 1 : 0, border: isMobile ? '1px solid #eee' : 'none', borderRadius: 2 }}>
                            <FormControl sx={{ flex: 1 }} size={isMobile ? 'small' : 'medium'}>
                              <InputLabel>Produit</InputLabel>
                              <Select
                                name={`items[${idx}].productId`}
                                value={item.productId}
                                label="Produit"
                                onChange={(e) => {
                                  formik.handleChange(e);
                                  const selected = products.find(p => p.id === e.target.value);
                                  formik.setFieldValue(`items[${idx}].price`, selected ? selected.price : 0);
                                  if (selected && item.quantity > selected.stock) {
                                    formik.setFieldValue(`items[${idx}].quantity`, selected.stock > 0 ? 1 : 0);
                                  }
                                }}
                                size={isMobile ? 'small' : 'medium'}
                              >
                                {Array.isArray(products) ? products.map((p) => (
                                  <MenuItem key={p.id} value={p.id} disabled={p.stock === 0 && item.productId !== p.id}>
                                    {p.name} {p.stock === 0 ? '(Rupture de stock)' : ''}
                                  </MenuItem>
                                )) : null}
                              </Select>
                            </FormControl>
                            <Box sx={{ position: 'relative', width: isMobile ? '100%' : 100 }}>
                              <TextField
                                label="Quantité"
                                name={`items[${idx}].quantity`}
                                type="number"
                                value={item.quantity}
                                onChange={e => {
                                  let value = Number(e.target.value);
                                  if (selectedProduct && value > selectedProduct.stock) value = selectedProduct.stock;
                                  if (value < 1) value = 1;
                                  formik.setFieldValue(`items[${idx}].quantity`, value);
                                }}
                                sx={{ width: '100%' }}
                                inputProps={{ min: 1, max: maxQty }}
                                error={qtyError}
                                helperText={!isOutOfStock && qtyError ? `Stock max : ${maxQty}` : ''}
                                disabled={isOutOfStock}
                                size={isMobile ? 'small' : 'medium'}
                              />
                              {isOutOfStock && (
                                <Box sx={{ position: 'absolute', left: 0, right: 0, top: '100%', textAlign: 'center', color: '#d32f2f', fontSize: 13, mt: '2px' }}>
                                  Stock max : 0
                                </Box>
                              )}
                            </Box>
                            <TextField
                              label="Prix (€)"
                              name={`items[${idx}].price`}
                              type="number"
                              value={item.price}
                              onChange={formik.handleChange}
                              sx={{ width: isMobile ? '100%' : 120 }}
                              disabled
                              size={isMobile ? 'small' : 'medium'}
                            />
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: isMobile ? 'flex-end' : 'center', mt: isMobile ? 1 : 0 }}>
                              <IconButton onClick={() => arrayHelpers.remove(idx)} disabled={formik.values.items.length === 1} size={isMobile ? 'small' : 'medium'}>
                                <Remove />
                              </IconButton>
                              <IconButton onClick={() => arrayHelpers.insert(idx + 1, { productId: '', quantity: 1, price: 0 })} size={isMobile ? 'small' : 'medium'}>
                                <Add />
                              </IconButton>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                />
              </FormikProvider>
              <Box sx={{ mt: 2, fontWeight: 'bold', textAlign: isMobile ? 'right' : 'left' }}>Total : {total} €</Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 1 : 0 }}>
          <Button onClick={onClose} disabled={dataLoading} fullWidth={isMobile} size={isMobile ? 'large' : 'medium'}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={dataLoading} fullWidth={isMobile} size={isMobile ? 'large' : 'medium'}>
            Modifier
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditInvoiceDialog; 