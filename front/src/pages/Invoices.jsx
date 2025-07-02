import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Collapse,
  Snackbar,
  TablePagination,
  Card,
  CardContent,
  CardActions,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { KeyboardArrowDown, KeyboardArrowUp, Download, Email } from '@mui/icons-material';
import api from '../services/api';
import AddInvoiceDialog from '../components/AddInvoiceDialog';
import EditInvoiceDialog from '../components/EditInvoiceDialog';

const Row = (props) => {
  const { row, onEditClick, onDeleteClick, onEmailSent } = props;
  const [open, setOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Fonction de téléchargement PDF
  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/invoices/${row.id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture_${row.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Erreur lors du téléchargement du PDF");
    }
  };

  // Fonction d'envoi d'email
  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      await api.post(`/invoices/${row.id}/send-email`);
      onEmailSent('success', 'Facture envoyée au client avec succès');
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erreur lors de l'envoi de la facture";
      onEmailSent('error', errorMessage);
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {row.id}
        </TableCell>
        <TableCell>{row.date ? new Date(row.date).toLocaleDateString() : ''}</TableCell>
        <TableCell>{row.clientName || row.Client?.name || ''}</TableCell>
        <TableCell>{row.total} €</TableCell>
        <TableCell>
          <Button size="small" variant="outlined" color="primary" sx={{ mr: 1 }} onClick={() => onEditClick(row)}>
            Modifier
          </Button>
          <Button size="small" variant="outlined" color="error" sx={{ mr: 1 }} onClick={() => onDeleteClick(row)}>
            Supprimer
          </Button>
          <IconButton size="small" color="success" onClick={handleDownloadPDF} title="Télécharger PDF">
            <Download />
          </IconButton>
          <IconButton 
            size="small" 
            color="info" 
            onClick={handleSendEmail} 
            disabled={sendingEmail}
            title="Envoyer au client"
          >
            {sendingEmail ? <CircularProgress size={20} /> : <Email />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Détails
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell>Produit</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Quantité</TableCell>
                    <TableCell>Prix Unitaire</TableCell>
                    <TableCell>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.InvoiceItems?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.productName || item.Product?.name}</TableCell>
                      <TableCell>{item.productDescription || item.Product?.description || ''}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.productPrice !== undefined ? item.productPrice : item.price} €</TableCell>
                      <TableCell>{(item.quantity * (item.productPrice !== undefined ? item.productPrice : item.price)).toFixed(2)} €</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState(null);
  const [emailSent, setEmailSent] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchInvoices = async (pageParam = page, limitParam = limit) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/invoices?page=${pageParam}&limit=${limitParam}`);
      const sortedInvoices = [...response.data.results].sort((a, b) => b.id - a.id);
      setInvoices(sortedInvoices);
      setTotal(response.data.total);
      setPage(response.data.page);
      setLimit(response.data.limit);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      setError("Erreur lors du chargement des factures");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, limit]);

  const handleInvoiceAdded = (newInvoice) => {
    setPage(1);
    fetchInvoices(1, limit);
  };

  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
    setDeleteError('');
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;
    setDeleteError('');
    try {
      await api.delete(`/invoices/${invoiceToDelete.id}`);
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceToDelete.id));
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Erreur lors de la suppression de la facture");
    }
  };

  const handleEditClick = (invoice) => {
    setInvoiceToEdit(invoice);
    setEditDialogOpen(true);
  };

  const handleInvoiceUpdated = (updatedInvoice) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv)));
    setEditDialogOpen(false);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Factures
      </Typography>
      <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={() => setOpenDialog(true)}>
        Ajouter une facture
      </Button>
      <AddInvoiceDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onInvoiceAdded={handleInvoiceAdded}
      />
      <EditInvoiceDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        invoice={invoiceToEdit}
        onInvoiceUpdated={handleInvoiceUpdated}
      />
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer la facture n°{invoiceToDelete?.id} ? Cette action est irréversible.
          </DialogContentText>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          {isMobile ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {invoices.length === 0 ? (
                <Alert severity="info">Aucune facture trouvée.</Alert>
              ) : (
                invoices.map((invoice) => (
                  <Card key={invoice.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6">Facture n°{invoice.id}</Typography>
                      <Typography color="text.secondary">Date : {invoice.date ? new Date(invoice.date).toLocaleDateString() : ''}</Typography>
                      <Typography color="text.secondary">Client : {invoice.clientName || invoice.Client?.name || ''}</Typography>
                      <Typography color="text.secondary">Montant : {invoice.total} €</Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" variant="outlined" color="primary" onClick={() => handleEditClick(invoice)}>
                        Modifier
                      </Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteClick(invoice)}>
                        Supprimer
                      </Button>
                      <IconButton size="small" color="success" onClick={async () => {
                        try {
                          const response = await api.get(`/invoices/${invoice.id}/pdf`, { responseType: 'blob' });
                          const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', `facture_${invoice.id}.pdf`);
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        } catch (err) {
                          alert("Erreur lors du téléchargement du PDF");
                        }
                      }} title="Télécharger PDF">
                        <Download />
                      </IconButton>
                      <IconButton size="small" color="info" onClick={async () => {
                        setEmailSent(null);
                        try {
                          await api.post(`/invoices/${invoice.id}/send-email`);
                          setEmailSent({ status: 'success', message: 'Facture envoyée au client avec succès' });
                        } catch (err) {
                          const errorMessage = err.response?.data?.error || "Erreur lors de l'envoi de la facture";
                          setEmailSent({ status: 'error', message: errorMessage });
                        }
                      }} title="Envoyer au client">
                        <Email />
                      </IconButton>
                    </CardActions>
                  </Card>
                ))
              )}
            </Box>
          ) : (
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell />
                      <TableCell>Numéro</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Montant</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          Aucune facture trouvée.
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((invoice) => (
                        <Row key={invoice.id} row={invoice} onEditClick={handleEditClick} onDeleteClick={handleDeleteClick} onEmailSent={setEmailSent} />
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          {isMobile ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 2 }}>
              <Button
                size="small"
                variant="outlined"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                ←
              </Button>
              <Typography variant="body2">
                {page} / {totalPages}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                →
              </Button>
            </Box>
          ) : (
            <Box sx={{ px: { xs: 2, sm: 0 } }}>
              <TablePagination
                component="div"
                count={total}
                page={page - 1}
                onPageChange={(e, newPage) => setPage(newPage + 1)}
                rowsPerPage={limit}
                onRowsPerPageChange={e => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Lignes par page"
              />
            </Box>
          )}
        </>
      )}
      {emailSent && (
        <Snackbar
          open={true}
          autoHideDuration={6000}
          onClose={() => setEmailSent(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setEmailSent(null)} 
            severity={emailSent.status} 
            sx={{ width: '100%' }}
          >
            {emailSent.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default Invoices;
