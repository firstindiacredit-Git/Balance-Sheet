import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  ButtonGroup,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Zoom,
  Fab,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloseIcon from '@mui/icons-material/Close';

function BalanceSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState({
    description: '',
    amount: '',
    type: 'expense',
    photo: null,
  });
  const [editEntry, setEditEntry] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [openPhotoDialog, setOpenPhotoDialog] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);

  useEffect(() => {
    fetchSheet();
    fetchEntries();
  }, [id]);

  const fetchSheet = async () => {
    try {
      const response = await axios.get(`https://balance-sheet-backend-three.vercel.app/api/sheets/${id}`);
      // const response = await axios.get(`http://localhost:5000/api/sheets/${id}`);

      setSheet(response.data);
    } catch (error) {
      console.error('Error fetching sheet:', error);
    }
  };

  const fetchEntries = async () => {
    try {
      const response = await axios.get(`https://balance-sheet-backend-three.vercel.app/api/sheets/${id}/entries`);
      // const response = await axios.get(`http://localhost:5000/api/sheets/${id}/entries`);
      setEntries(response.data);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('description', newEntry.description);
    formData.append('amount', newEntry.amount);
    formData.append('type', newEntry.type);
    if (newEntry.photo) {
      formData.append('photo', newEntry.photo);
    }

    try {
      const response = await axios.post(
        `https://balance-sheet-backend-three.vercel.app/api/sheets/${id}/entries`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
        }
      );

      if (response.data) {
        setNewEntry({
          description: '',
          amount: '',
          type: 'expense',
          photo: null,
        });
        setOpenAddDialog(false);
        fetchEntries();
      }
    } catch (error) {
      console.error('Error adding entry:', error);
      let errorMessage = 'Failed to add entry';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data.error || error.response.data.details || errorMessage;
        console.error('Error response:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server';
        console.error('Error request:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message;
        console.error('Error message:', error.message);
      }

      // You can add a state for error messages and display them in the UI
      alert(errorMessage);
    }
  };

  const calculateTotals = () => {
    const income = entries
      .filter((entry) => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);
    const expenses = entries
      .filter((entry) => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);
    return { income, expenses, balance: income - expenses };
  };

  const downloadCSV = () => {
    const headers = ['Date', 'Description', 'Type', 'Amount'];
    const csvData = entries.map(entry => [
      new Date(entry.createdAt).toLocaleDateString(),
      entry.description,
      entry.type,
      entry.amount
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${sheet.name}_balance_sheet.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(sheet.name, 14, 15);
    
    // Add summary
    doc.setFontSize(12);
    doc.text(`Total Income: ₹${totals.income.toFixed(2)}`, 14, 30);
    doc.text(`Total Expenses: ₹${totals.expenses.toFixed(2)}`, 14, 35);
    doc.text(`Balance: ₹${totals.balance.toFixed(2)}`, 14, 40);

    // Add table
    const tableData = entries.map(entry => [
      new Date(entry.createdAt).toLocaleString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      entry.description,
      entry.type,
      `₹${entry.amount.toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [['Date', 'Description', 'Type', 'Amount']],
      body: tableData,
      startY: 50,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`${sheet.name}_balance_sheet.pdf`);
  };

  const handleEdit = (entry) => {
    setEditEntry({
      _id: entry._id,
      description: entry.description,
      amount: entry.amount,
      type: entry.type,
      photo: null
    });
    setOpenEditDialog(true);
  };

  const handleDelete = (entry) => {
    setEntryToDelete(entry);
    setOpenDeleteDialog(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('description', editEntry.description);
    formData.append('amount', editEntry.amount);
    formData.append('type', editEntry.type);
    if (editEntry.photo) {
      formData.append('photo', editEntry.photo);
    }

    try {
      const response = await axios.put(
        `https://balance-sheet-backend-three.vercel.app/api/sheets/${id}/entries/${editEntry._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
        }
      );

      if (response.data) {
        setOpenEditDialog(false);
        fetchEntries();
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      let errorMessage = 'Failed to update entry';
      
      if (error.response) {
        errorMessage = error.response.data.error || error.response.data.details || errorMessage;
        console.error('Error response:', error.response.data);
      } else if (error.request) {
        errorMessage = 'No response from server';
        console.error('Error request:', error.request);
      } else {
        errorMessage = error.message;
        console.error('Error message:', error.message);
      }

      alert(errorMessage);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://balance-sheet-backend-three.vercel.app/api/delete/sheets/${id}/entries/${entryToDelete._id}`, { 
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setOpenDeleteDialog(false);
      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const handlePhotoClick = (photo) => {
    if (photo) {
        setSelectedPhoto(photo);
        setOpenPhotoDialog(true);
    }
  };

  if (!sheet) return null;

  const totals = calculateTotals();

  return (
    <Container>
      <Box sx={{ 
        mt: 4, 
        mb: 4, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        gap: '3px',
        background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
        borderRadius: 2,
        p: 2,
        color: 'white'
      }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white' }}>
          {sheet.name}
        </Typography>
        <Box>
          <ButtonGroup variant="contained" sx={{ mr: 2 }}>
            <Button
              startIcon={<FileDownloadIcon />}
              onClick={downloadCSV}
              sx={{ 
                bgcolor: '#4caf50',
                '&:hover': { bgcolor: '#388e3c' }
              }}
            >
              Download CSV
            </Button>
            <Button
              startIcon={<PictureAsPdfIcon />}
              onClick={downloadPDF}
              sx={{ 
                bgcolor: '#f44336',
                '&:hover': { bgcolor: '#d32f2f' }
              }}
            >
              Download PDF
            </Button>
          </ButtonGroup>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/')}
            sx={{ 
              color: 'white',
              borderColor: 'white',
              '&:hover': { 
                borderColor: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card 
            elevation={3}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #e0e0e0',
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
              <Box sx={{ 
                p: 3, 
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                color: 'white'
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'bold',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  Financial Summary
                </Typography>
              </Box>
              <Grid container spacing={0}>
                <Grid item xs={12} md={4}>
                  <Box 
                    sx={{ 
                      p: 3,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(76, 175, 80, 0.05)',
                      borderRight: '1px solid #e0e0e0',
                      borderBottom: { xs: '1px solid #e0e0e0', md: 'none' }
                    }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      color="text.secondary"
                      gutterBottom
                      sx={{ fontWeight: 500 }}
                    >
                      Total Income
                    </Typography>
                    <Typography 
                      variant="h4" 
                      color="success.main"
                      sx={{ 
                        fontWeight: 'bold',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                        mb: 1
                      }}
                    >
                      ₹{totals.income.toFixed(2)}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="success.main"
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      Income Transactions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box 
                    sx={{ 
                      p: 3,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(244, 67, 54, 0.05)',
                      borderRight: { md: '1px solid #e0e0e0' },
                      borderBottom: { xs: '1px solid #e0e0e0', md: 'none' }
                    }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      color="text.secondary"
                      gutterBottom
                      sx={{ fontWeight: 500 }}
                    >
                      Total Expenses
                    </Typography>
                    <Typography 
                      variant="h4" 
                      color="error.main"
                      sx={{ 
                        fontWeight: 'bold',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                        mb: 1
                      }}
                    >
                      ₹{totals.expenses.toFixed(2)}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="error.main"
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      Expense Transactions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box 
                    sx={{ 
                      p: 3,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: totals.balance >= 0 
                        ? 'rgba(76, 175, 80, 0.1)' 
                        : 'rgba(244, 67, 54, 0.1)',
                      borderRadius: { xs: '0 0 8px 8px', md: '0 8px 8px 0' }
                    }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      color="text.secondary"
                      gutterBottom
                      sx={{ fontWeight: 500 }}
                    >
                      Current Balance
                    </Typography>
                    <Typography 
                      variant="h4" 
                      color={totals.balance >= 0 ? 'success.main' : 'error.main'}
                      sx={{ 
                        fontWeight: 'bold',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                        mb: 1
                      }}
                    >
                      ₹{Math.abs(totals.balance).toFixed(2)}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color={totals.balance >= 0 ? 'success.main' : 'error.main'}
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontWeight: 500
                      }}
                    >
                      {totals.balance >= 0 ? 'Positive Balance' : 'Negative Balance'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <TableContainer 
            component={Paper}
            sx={{ 
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: 3
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#1976d2' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Photo</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow 
                    key={entry._id}
                    sx={{ 
                      bgcolor: index % 2 === 0 ? 'white' : '#f5f5f5',
                      '&:hover': { bgcolor: '#e3f2fd' }
                    }}
                  >
                    <TableCell>
                      {new Date(entry.createdAt).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>
                      <Typography
                        color={entry.type === 'income' ? 'success.main' : 'error.main'}
                        sx={{ fontWeight: 'bold' }}
                      >
                        {entry.type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        color={entry.type === 'income' ? 'success.main' : 'error.main'}
                        sx={{ fontWeight: 'bold' }}
                      >
                        ₹{entry.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {entry.photo && (
                        <IconButton
                          onClick={() => handlePhotoClick(entry.photo)}
                          size="small"
                        >
                          <img
                            src={entry.photo}
                            alt="Entry photo"
                            style={{
                              width: '40px',
                              height: '40px',
                              objectFit: 'cover',
                              borderRadius: '4px'
                            }}
                          />
                        </IconButton>
                      )}
                    </TableCell>
                    <TableCell>
                      <ButtonGroup size="small">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(entry)}
                          size="small"
                          sx={{ 
                            '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.1)' }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(entry)}
                          size="small"
                          sx={{ 
                            '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.1)' }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ButtonGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Add Entry Dialog */}
      <Dialog 
        open={openAddDialog} 
        onClose={() => setOpenAddDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ color: '#1976d2' }}>
            Add New Entry
          </Typography>
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Description"
                  value={newEntry.description}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, description: e.target.value })
                  }
                  required
                  variant="outlined"
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={newEntry.amount}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, amount: e.target.value })
                  }
                  required
                  variant="outlined"
                  InputProps={{
                    sx: { borderRadius: 2 },
                    startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={newEntry.type}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, type: e.target.value })
                    }
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="income">Income</MenuItem>
                    <MenuItem value="expense">Expense</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="file"
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, photo: e.target.files[0] })
                  }
                  inputProps={{ accept: 'image/*' }}
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            variant="contained" 
            color="primary"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)'
              }
            }}
          >
            Add Entry
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setOpenAddDialog(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)'
          }
        }}
      >
        <AddIcon />
      </Fab>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Entry</DialogTitle>
        <DialogContent>
          <form onSubmit={handleEditSubmit}>
            <TextField
              fullWidth
              label="Description"
              value={editEntry?.description || ''}
              onChange={(e) =>
                setEditEntry({ ...editEntry, description: e.target.value })
              }
              margin="normal"
              required
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={editEntry?.amount || ''}
              onChange={(e) =>
                setEditEntry({ ...editEntry, amount: e.target.value })
              }
              margin="normal"
              required
              variant="outlined"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
              }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Type</InputLabel>
              <Select
                value={editEntry?.type || 'expense'}
                onChange={(e) =>
                  setEditEntry({ ...editEntry, type: e.target.value })
                }
                variant="outlined"
              >
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="file"
              onChange={(e) =>
                setEditEntry({ ...editEntry, photo: e.target.files[0] })
              }
              margin="normal"
              inputProps={{ accept: 'image/*' }}
            />
            {editEntry?.photo && (
              <Box sx={{ mt: 2 }}>
                <img
                  src={URL.createObjectURL(editEntry.photo)}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '200px' }}
                />
              </Box>
            )}
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this entry? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Photo Dialog */}
      <Dialog
        open={openPhotoDialog}
        onClose={() => setOpenPhotoDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Photo Preview</DialogTitle>
        <DialogContent>
          {selectedPhoto && (
            <img
              src={selectedPhoto}
              alt="Entry photo"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPhotoDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default BalanceSheet; 