// Ce fichier gère la page de gestion des produits
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
  TablePagination,
  Card,
  CardContent,
  CardActions,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import api from '../services/api';
import AddProductDialog from '../components/AddProductDialog';
import EditProductDialog from '../components/EditProductDialog';

// Composant principal de la page produits
const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchProducts = async (pageParam = page, limitParam = limit) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/products?page=${pageParam}&limit=${limitParam}`);
      setProducts(response.data.results);
      setTotal(response.data.total);
      setPage(response.data.page);
      setLimit(response.data.limit);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      setError("Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, limit]);

  const handleProductAdded = (newProduct) => {
    setProducts((prev) => [...prev, newProduct]);
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
    setDeleteError('');
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setDeleteError('');
    try {
      await api.delete(`/products/${productToDelete.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Erreur lors de la suppression du produit");
    }
  };

  const handleEditClick = (product) => {
    setProductToEdit(product);
    setEditDialogOpen(true);
  };

  const handleProductUpdated = (updatedProduct) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
  };

  const sortedProducts = [...products].sort((a, b) => b.id - a.id);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Produits
      </Typography>
      <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={() => setOpenDialog(true)}>
        Ajouter un produit
      </Button>
      <AddProductDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onProductAdded={handleProductAdded}
      />
      <EditProductDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        product={productToEdit}
        onProductUpdated={handleProductUpdated}
      />
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer le produit "{productToDelete?.name}" ? Cette action est irréversible.
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
              {sortedProducts.length === 0 ? (
                <Alert severity="info">Aucun produit trouvé.</Alert>
              ) : (
                sortedProducts.map((product) => (
                  <Card key={product.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6">{product.name}</Typography>
                      <Typography color="text.secondary">Prix : {product.price} €</Typography>
                      <Typography color="text.secondary">Stock : {product.stock}</Typography>
                      <Typography color="text.secondary">{product.description ? (product.description.length > 100 ? product.description.slice(0, 100) + '…' : product.description) : ''}</Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" variant="outlined" color="primary" onClick={() => handleEditClick(product)}>
                        Modifier
                      </Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteClick(product)}>
                        Supprimer
                      </Button>
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
                      <TableCell>Nom</TableCell>
                      <TableCell>Prix</TableCell>
                      <TableCell>Stock</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          Aucun produit trouvé.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.price} €</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>{product.description ? (product.description.length > 100 ? product.description.slice(0, 100) + '…' : product.description) : ''}</TableCell>
                          <TableCell>
                            <Button size="small" variant="outlined" color="primary" sx={{ mr: 1 }} onClick={() => handleEditClick(product)}>
                              Modifier
                            </Button>
                            <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteClick(product)}>
                              Supprimer
                            </Button>
                          </TableCell>
                        </TableRow>
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
    </Box>
  );
};

export default Products;
