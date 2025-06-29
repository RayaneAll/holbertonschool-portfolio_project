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
  Snackbar
} from '@mui/material';
import api from '../services/api';
import AddClientDialog from '../components/AddClientDialog';
import EditClientDialog from '../components/EditClientDialog';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);
  const [emailSent, setEmailSent] = useState(null);
  const [sendingEmails, setSendingEmails] = useState({});

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (err) {
      setError("Erreur lors du chargement des clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleClientAdded = (newClient) => {
    setClients((prev) => [...prev, newClient]);
  };

  const handleDeleteClick = (client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
    setDeleteError('');
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    setDeleteError('');
    try {
      await api.delete(`/clients/${clientToDelete.id}`);
      setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Erreur lors de la suppression du client");
    }
  };

  const handleEditClick = (client) => {
    setClientToEdit(client);
    setEditDialogOpen(true);
  };

  const handleClientUpdated = (updatedClient) => {
    setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
  };

  const handleEmailSent = (status, message) => {
    setEmailSent({ status, message });
  };

  const handleSendStatementEmail = async (client) => {
    setSendingEmails(prev => ({ ...prev, [client.id]: true }));
    try {
      await api.post(`/clients/${client.id}/statement/send-email`);
      handleEmailSent('success', `Relevé de compte envoyé à ${client.name} avec succès`);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Erreur lors de l'envoi du relevé de compte";
      handleEmailSent('error', errorMessage);
    } finally {
      setSendingEmails(prev => ({ ...prev, [client.id]: false }));
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Clients
      </Typography>
      <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={() => setOpenDialog(true)}>
        Ajouter un client
      </Button>
      <AddClientDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onClientAdded={handleClientAdded}
      />
      <EditClientDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        client={clientToEdit}
        onClientUpdated={handleClientUpdated}
      />
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer le client "{clientToDelete?.name}" ? Cette action est irréversible.
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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Téléphone</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Aucun client trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" color="primary" sx={{ mr: 1 }} onClick={() => handleEditClick(client)}>
                        Modifier
                      </Button>
                      <Button size="small" variant="outlined" color="error" sx={{ mr: 1 }} onClick={() => handleDeleteClick(client)}>
                        Supprimer
                      </Button>
                      <IconButton 
                        size="small" 
                        color="success" 
                        onClick={async () => {
                          try {
                            const response = await api.get(`/clients/${client.id}/statement/pdf`, { responseType: 'blob' });
                            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `releve_client_${client.id}.pdf`);
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                          } catch (err) {
                            alert("Erreur lors du téléchargement du relevé PDF");
                          }
                        }} 
                        title="Télécharger relevé PDF"
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="info" 
                        onClick={() => handleSendStatementEmail(client)} 
                        disabled={sendingEmails[client.id]}
                        title="Envoyer le relevé au client"
                      >
                        {sendingEmails[client.id] ? <CircularProgress size={20} /> : <EmailIcon />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
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

export default Clients;
