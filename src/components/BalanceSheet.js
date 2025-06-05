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
  CircularProgress,
  Skeleton,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ShareIcon from '@mui/icons-material/Share';
import PeopleIcon from '@mui/icons-material/People';
import CloseIcon from '@mui/icons-material/Close';
import BlockIcon from '@mui/icons-material/Block';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import './BalanceSheet.css';

// const API_URL = 'https://balance-sheet-backend-three.vercel.app';
const API_URL ='http://localhost:5000';

function BalanceSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [openShareDialog, setOpenShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareError, setShareError] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [sharedBy, setSharedBy] = useState('');
  const [openSharedUsersDialog, setOpenSharedUsersDialog] = useState(false);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [isRemovingAccess, setIsRemovingAccess] = useState(false);
  const [removeAccessError, setRemoveAccessError] = useState('');
  const [shareHistory, setShareHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    fetchSheet();
    fetchEntries();
  }, [id]);

  const fetchSheet = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/sheets/${id}`);
      setSheet(response.data);
      
      // Check if current user is the owner
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const isOwner = response.data.user === decoded.userId;
        setIsOwner(isOwner);
        
        // If not the owner, set the sharedBy information
        if (!isOwner && response.data.sharedBy) {
          setSharedBy(response.data.sharedBy);
        }
      }
    } catch (error) {
      console.error('Error fetching sheet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/sheets/${id}/entries`);
      setEntries(response.data);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSharedUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/sheets/${id}/shared-users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSharedUsers(response.data);
    } catch (error) {
      console.error('Error fetching shared users:', error);
      // Show error to user
      setShareError('Failed to fetch shared users');
    }
  };

  const fetchShareHistory = async () => {
    try {
      setIsLoadingHistory(true);
      setShareError('');
      const token = localStorage.getItem('token');
      if (!token) {
        setShareError('Please log in to view share history');
        return;
      }

      const response = await axios.get(`${API_URL}/api/users/share-history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Share history response:', response.data);
      setShareHistory(response.data);
    } catch (error) {
      console.error('Error fetching share history:', error);
      setShareError(error.response?.data?.error || 'Failed to fetch share history');
      setShareHistory([]); // Reset history on error
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newEntry.description || !newEntry.amount || !newEntry.type) {
        alert('Please fill in all required fields');
        return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('description', newEntry.description);
    formData.append('amount', newEntry.amount);
    formData.append('type', newEntry.type);
    if (newEntry.photo) {
        formData.append('photo', newEntry.photo);
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in again');
            return;
        }

        console.log('Submitting entry:', {
            description: newEntry.description,
            amount: newEntry.amount,
            type: newEntry.type,
            hasPhoto: !!newEntry.photo,
            photoType: newEntry.photo?.type,
            photoSize: newEntry.photo?.size
        });

        const response = await axios.post(
            `${API_URL}/api/sheets/${id}/entries`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        console.log('Server response:', response.data);

        if (response.data) {
            setNewEntry({
                description: '',
                amount: '',
                type: 'expense',
                photo: null,
            });
            setPreviewImage(null);
            setOpenAddDialog(false);
            fetchEntries();
        }
    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers
        });

        let errorMessage = 'Failed to add entry. Please try again.';
        if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
            if (error.response.data.details) {
                errorMessage += `\nDetails: ${JSON.stringify(error.response.data.details)}`;
            }
        }
        alert(errorMessage);
    } finally {
        setIsSubmitting(false);
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

  const getFilteredEntries = () => {
    let filtered = entries;
    
    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(entry => entry.type === filter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
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
    
    // Add watermark
    const img = new Image();
    img.src = '/logo.png';
    img.onload = function() {
      // Calculate watermark size and position
      const imgWidth = 100;
      const imgHeight = (imgWidth * img.height) / img.width;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Add watermark with reduced opacity
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({opacity: 0.2}));
      doc.addImage(img, 'PNG', (pageWidth - imgWidth) / 2, (pageHeight - imgHeight) / 2, imgWidth, imgHeight);
      doc.restoreGraphicsState();
      
      // Add title with color
      doc.setFontSize(16);
      doc.setTextColor(25, 118, 210); // Material-UI primary blue color
      doc.text(sheet.name, 14, 15);
      
      // Reset text color for other content
      doc.setTextColor(0, 0, 0); // Reset to black

      // Add summary table
      autoTable(doc, {
        head: [['Summary', 'Value']],
        body: [
          ['Total Income', totals.income.toLocaleString('en-IN')],
          ['Total Expenses', totals.expenses.toLocaleString('en-IN')],
          ['Balance', totals.balance.toLocaleString('en-IN')]
        ],
        startY: 25,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          0: { cellWidth: 60, fontStyle: 'bold' },
          1: { cellWidth: 60, halign: 'right', fontStyle: 'bold' }
        }
      });

      // Add transactions table
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
        entry.type.charAt(0).toUpperCase() + entry.type.slice(1),
        entry.amount.toLocaleString('en-IN')
      ]);

      autoTable(doc, {
        head: [['Date', 'Description', 'Type', 'Amount']],
        body: tableData,
        startY: doc.lastAutoTable.finalY + 10,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 70 },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 30, halign: 'right' }
        },
        didParseCell: function(data) {
          // Add color to income/expense cells
          if (data.column.index === 2) {
            if (data.cell.raw === 'Income') {
              data.cell.styles.textColor = [76, 175, 80]; // Green for income
            } else if (data.cell.raw === 'Expense') {
              data.cell.styles.textColor = [244, 67, 54]; // Red for expense
            }
          }
          // Add color to amount cells
          if (data.column.index === 3) {
            const type = data.row.cells[2].raw;
            if (type === 'Income') {
              data.cell.styles.textColor = [76, 175, 80]; // Green for income
            } else if (type === 'Expense') {
              data.cell.styles.textColor = [244, 67, 54]; // Red for expense
            }
          }
        }
      });

      doc.save(`${sheet.name}_balance_sheet.pdf`);
    };
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
    
    if (!editEntry?.description || !editEntry?.amount || !editEntry?.type) {
        alert('Please fill in all required fields');
        return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('description', editEntry.description);
    formData.append('amount', editEntry.amount);
    formData.append('type', editEntry.type);
    if (editEntry.photo) {
        formData.append('photo', editEntry.photo);
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in again');
            return;
        }

        console.log('Updating entry:', {
            id: editEntry._id,
            description: editEntry.description,
            amount: editEntry.amount,
            type: editEntry.type,
            hasPhoto: !!editEntry.photo
        });

        const response = await axios.put(
            `${API_URL}/api/sheets/${id}/entries/${editEntry._id}`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        console.log('Update response:', response.data);
        setOpenEditDialog(false);
        fetchEntries();
    } catch (error) {
        console.error('Error updating entry:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        let errorMessage = 'Failed to update entry. Please try again.';
        if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
            if (error.response.data.details) {
                errorMessage += `\nDetails: ${JSON.stringify(error.response.data.details)}`;
            }
        }
        alert(errorMessage);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/delete/sheets/${id}/entries/${entryToDelete._id}`, {
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

  const handleShare = async () => {
    if (!shareEmail) {
      setShareError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareEmail)) {
      setShareError('Please enter a valid email address');
      return;
    }

    setIsSharing(true);
    setShareError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again');
        return;
      }

      console.log('Attempting to share sheet:', {
        sheetId: id,
        email: shareEmail,
        url: `${API_URL}/api/sheets/share/${id}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const response = await axios.post(
        `${API_URL}/api/sheets/share/${id}`,
        { email: shareEmail },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Share response:', response.data);
      if (response.data.sharedBy) {
        setSharedBy(response.data.sharedBy);
      }

      setShareSuccess(true);
      setOpenShareDialog(false);
      setShareEmail('');
    } catch (error) {
      console.error('Error sharing sheet:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config
      });
      const errorMessage = error.response?.data?.error || 'Failed to share balance sheet';
      setShareError(errorMessage);
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveAccess = async (userId) => {
    try {
      setIsRemovingAccess(true);
      setRemoveAccessError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setRemoveAccessError('Please log in again');
        return;
      }

      console.log('Removing user access:', { sheetId: id, userId });

      const response = await axios.delete(
        `${API_URL}/api/sheets/${id}/shared-users/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Remove access response:', response.data);
      setShareSuccess(true);
      await fetchSharedUsers();
      
      // If this was the last shared user, close the dialog
      if (sharedUsers.length === 1) {
        setOpenShareDialog(false);
      }
    } catch (error) {
      console.error('Error removing user access:', error);
      const errorMessage = error.response?.data?.error || 'Failed to remove user access';
      setRemoveAccessError(errorMessage);
    } finally {
      setIsRemovingAccess(false);
    }
  };

  // Add this function to check if user has edit permissions
  const hasEditPermissions = () => {
    return isOwner;
  };

  // Update useEffect to fetch share history when share dialog opens
  useEffect(() => {
    if (openShareDialog) {
      fetchShareHistory();
    }
  }, [openShareDialog]);

  if (isLoading) {
    return (
      <Container>
        {/* Header Skeleton */}
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
          <Skeleton variant="text" width={200} height={40} sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)' }} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Skeleton variant="rectangular" width={120} height={36} sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)', borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={120} height={36} sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)', borderRadius: 1 }} />
          </Box>
        </Box>

        {/* Summary Card Skeleton */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card elevation={3} sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 3, bgcolor: '#1976d2' }}>
                  <Skeleton variant="text" width={150} height={30} sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)' }} />
                </Box>
                <Grid container spacing={0}>
                  {[1, 2, 3].map((item) => (
                    <Grid item xs={12} md={4} key={item}>
                      <Box sx={{ p: 3, borderRight: item !== 3 ? '1px solid #e0e0e0' : 'none' }}>
                        <Skeleton variant="text" width={100} height={24} />
                        <Skeleton variant="text" width={150} height={40} />
                        <Skeleton variant="text" width={120} height={20} />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Table Skeleton */}
          <Grid item xs={12}>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#1976d2' }}>
                    {['Date', 'Description', 'Type', 'Amount', 'Photo', 'Actions'].map((header) => (
                      <TableCell key={header} sx={{ color: 'white', fontWeight: 'bold' }}>
                        <Skeleton variant="text" width={80} height={24} sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)' }} />
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((row) => (
                    <TableRow key={row}>
                      <TableCell><Skeleton variant="text" width={120} /></TableCell>
                      <TableCell><Skeleton variant="text" width={200} /></TableCell>
                      <TableCell><Skeleton variant="text" width={80} /></TableCell>
                      <TableCell><Skeleton variant="text" width={100} /></TableCell>
                      <TableCell><Skeleton variant="circular" width={40} height={40} /></TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Skeleton variant="circular" width={32} height={32} />
                          <Skeleton variant="circular" width={32} height={32} />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!sheet) return null;

  const totals = calculateTotals();

  // Update the share dialog to include history
  const renderShareDialog = () => (
    <Dialog 
      open={openShareDialog} 
      onClose={() => {
        setOpenShareDialog(false);
        setShareEmail('');
        setShareError('');
      }}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShareIcon />
          <Typography variant="h6">Share Balance Sheet</Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={() => {
            setOpenShareDialog(false);
            setShareEmail('');
            setShareError('');
          }}
          sx={{
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <TextField
          fullWidth
          label="Email Address"
          type="email"
          value={shareEmail}
          onChange={(e) => {
            setShareEmail(e.target.value);
            setShareError('');
          }}
          margin="normal"
          required
          variant="outlined"
          error={!!shareError}
          helperText={shareError}
          disabled={isSharing}
          sx={{ mb: 3 }}
        />

        <Typography variant="subtitle1" sx={{ mb: 2, color: 'text.secondary' }}>
          Recently Shared With
        </Typography>
        
        {isLoadingHistory ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : shareHistory.length > 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1,
            mb: 2
          }}>
            {shareHistory.map((user) => (
              <Chip
                key={user._id}
                avatar={
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {(user.username || user.email)[0].toUpperCase()}
                  </Avatar>
                }
                label={user.username || user.email}
                onClick={() => setShareEmail(user.email)}
                sx={{
                  '&:hover': {
                    bgcolor: 'primary.light',
                    color: 'white'
                  }
                }}
              />
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No recent sharing history
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: 'background.default' }}>
        <Button 
          onClick={() => {
            setOpenShareDialog(false);
            setShareEmail('');
            setShareError('');
          }}
          disabled={isSharing}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleShare}
          variant="contained" 
          color="primary"
          disabled={isSharing}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            background: 'linear-gradient(45deg, #9c27b0 30%, #ba68c8 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #7b1fa2 30%, #9c27b0 90%)'
            }
          }}
        >
          {isSharing ? <CircularProgress size={24} /> : 'Share'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container>
      <Box className="css-35ijrp">
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white' }}>
          {sheet.name}
          {!isOwner && sharedBy && (
            <Typography 
              variant="subtitle1" 
              component="span" 
              sx={{ 
                ml: 2, 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.8em'
              }}
            >
              (Shared with you by {sharedBy})
            </Typography>
          )}
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
            {hasEditPermissions() && (
              <Button
                startIcon={<ShareIcon />}
                onClick={() => setOpenShareDialog(true)}
                sx={{ 
                  bgcolor: '#9c27b0',
                  '&:hover': { bgcolor: '#7b1fa2' }
                }}
              >
                Share
              </Button>
            )}
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
          <Box sx={{ 
            mb: 2, 
            display: 'flex', 
            gap: 2, 
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <TextField
              placeholder="Search entries..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                minWidth: '250px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, color: 'text.secondary' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="currentColor"/>
                    </svg>
                  </Box>
                ),
                endAdornment: searchQuery && (
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery('')}
                    sx={{ mr: -1 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                ),
              }}
            />
            <ButtonGroup variant="contained" aria-label="filter buttons">
              <Button
                onClick={() => setFilter('all')}
                variant={filter === 'all' ? 'contained' : 'outlined'}
                sx={{
                  bgcolor: filter === 'all' ? '#1976d2' : 'transparent',
                  color: filter === 'all' ? 'white' : '#1976d2',
                  '&:hover': {
                    bgcolor: filter === 'all' ? '#1565c0' : 'rgba(25, 118, 210, 0.1)'
                  }
                }}
              >
                All
              </Button>
              <Button
                onClick={() => setFilter('income')}
                variant={filter === 'income' ? 'contained' : 'outlined'}
                sx={{
                  bgcolor: filter === 'income' ? '#4caf50' : 'transparent',
                  color: filter === 'income' ? 'white' : '#4caf50',
                  '&:hover': {
                    bgcolor: filter === 'income' ? '#388e3c' : 'rgba(76, 175, 80, 0.1)'
                  }
                }}
              >
                Income
              </Button>
              <Button
                onClick={() => setFilter('expense')}
                variant={filter === 'expense' ? 'contained' : 'outlined'}
                sx={{
                  bgcolor: filter === 'expense' ? '#f44336' : 'transparent',
                  color: filter === 'expense' ? 'white' : '#f44336',
                  '&:hover': {
                    bgcolor: filter === 'expense' ? '#d32f2f' : 'rgba(244, 67, 54, 0.1)'
                  }
                }}
              >
                Expenses
              </Button>
            </ButtonGroup>
          </Box>
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
                  {hasEditPermissions() && (
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredEntries().map((entry, index) => (
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
                    {hasEditPermissions() && (
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
                    )}
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
          Add New Entry
          {isSubmitting && (
            <CircularProgress 
              size={20} 
              sx={{ 
                ml: 2,
                color: 'primary.main'
              }} 
            />
          )}
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="photo-upload"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // Validate file size (5MB limit)
                        if (file.size > 5 * 1024 * 1024) {
                          alert('File size should be less than 5MB');
                          e.target.value = null;
                          return;
                        }
                        // Validate file type
                        if (!file.type.startsWith('image/')) {
                          alert('Please upload an image file');
                          e.target.value = null;
                          return;
                        }
                        setNewEntry({ ...newEntry, photo: file });
                        // Create preview URL
                        const previewUrl = URL.createObjectURL(file);
                        setPreviewImage(previewUrl);
                      }
                    }}
                  />
                  <label htmlFor="photo-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      sx={{ borderRadius: 2 }}
                    >
                      Upload Photo
                    </Button>
                  </label>
                  {previewImage && (
                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                      <img
                        src={previewImage}
                        alt="Preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '200px',
                          objectFit: 'contain'
                        }}
                      />
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          setNewEntry({ ...newEntry, photo: null });
                          setPreviewImage(null);
                        }}
                        sx={{ mt: 1 }}
                      >
                        Remove Photo
                      </Button>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenAddDialog(false);
            setNewEntry({
              description: '',
              amount: '',
              type: 'expense',
              photo: null,
            });
            setPreviewImage(null);
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained" 
            color="primary"
            disabled={isSubmitting}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)'
              }
            }}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Add Entry'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Edit Entry
          {isSubmitting && (
            <CircularProgress 
              size={20} 
              sx={{ 
                ml: 2,
                color: 'primary.main'
              }} 
            />
          )}
        </DialogTitle>
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
          <Button 
            onClick={handleEditSubmit} 
            variant="contained" 
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>
          Confirm Delete
          {isSubmitting && (
            <CircularProgress 
              size={20} 
              sx={{ 
                ml: 2,
                color: 'error.main'
              }} 
            />
          )}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this entry? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Delete'}
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

      {/* Share Dialog */}
      {renderShareDialog()}

      {/* Success Snackbar */}
      <Snackbar
        open={shareSuccess}
        autoHideDuration={6000}
        onClose={() => setShareSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShareSuccess(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Balance sheet shared successfully!
        </Alert>
      </Snackbar>

      {/* Shared Users Dialog */}
      <Dialog
        open={openSharedUsersDialog}
        onClose={() => setOpenSharedUsersDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon />
            <Typography variant="h6">Shared With</Typography>
          </Box>
          <IconButton
            aria-label="close"
            onClick={() => setOpenSharedUsersDialog(false)}
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {removeAccessError && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                borderRadius: 1,
                '& .MuiAlert-icon': {
                  color: 'error.main'
                }
              }}
            >
              {removeAccessError}
            </Alert>
          )}
          {sharedUsers.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              color: 'text.secondary'
            }}>
              <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Not Shared Yet
              </Typography>
              <Typography variant="body2">
                Share this balance sheet with others to collaborate
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {sharedUsers.map((user) => (
                <ListItem
                  key={user._id}
                  sx={{
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                  secondaryAction={
                    <Tooltip title="Remove Access">
                      <IconButton
                        edge="end"
                        aria-label="remove access"
                        onClick={() => handleRemoveAccess(user._id)}
                        disabled={isRemovingAccess}
                        sx={{
                          color: 'error.main',
                          '&:hover': {
                            bgcolor: 'error.light',
                            color: 'white'
                          }
                        }}
                      >
                        {isRemovingAccess ? (
                          <CircularProgress size={24} color="error" />
                        ) : (
                          <BlockIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: 'primary.main',
                      color: 'white'
                    }}>
                      {(user.username || user.email)[0].toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {user.username || user.email}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        Shared on {new Date(user.sharedAt).toLocaleDateString()}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'background.default' }}>
          <Button
            onClick={() => setOpenSharedUsersDialog(false)}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setOpenSharedUsersDialog(false);
              setOpenShareDialog(true);
            }}
            startIcon={<PersonAddIcon />}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            Share with More
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {hasEditPermissions() && (
          <>
            <Fab
              color="primary"
              aria-label="share"
              onClick={() => {
                fetchSharedUsers();
                setOpenSharedUsersDialog(true);
              }}
              sx={{
                background: 'linear-gradient(45deg, #9c27b0 30%, #ba68c8 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #7b1fa2 30%, #9c27b0 90%)'
                }
              }}
            >
              <PeopleIcon />
            </Fab>
            <Fab
              color="primary"
              aria-label="add"
              onClick={() => setOpenAddDialog(true)}
              sx={{
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)'
                }
              }}
            >
              <AddIcon />
            </Fab>
          </>
        )}
      </Box>
    </Container>
  );
}

export default BalanceSheet; 