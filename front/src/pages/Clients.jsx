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
  DialogActions
} from '@mui/material';
import api from '../services/api';
import AddClientDialog from '../components/AddClientDialog';
import EditClientDialog from '../components/EditClientDialog';

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
                      <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteClick(client)}>
                        Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Clients;
