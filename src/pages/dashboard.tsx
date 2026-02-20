import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Alert,
  CssBaseline,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Grid,
  TextField,
  Badge,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip
} from '@mui/material'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore'
import { app } from '@/lib/firebase'
import { validateInventoryItem } from '@/lib/validators'
import { addInventoryItem as addInventoryItemQuery, checkoutItem as checkoutItemQuery, fetchAllInventory } from '@/lib/firebaseQueries'
import { FreezerMap } from '@/components/FreezerMap'
import { InventoryItem } from '@/types/inventory'

interface Props {
  handleSignupRedirect: () => void
  pushLogin: () => void
  role: string | null
  userId?: string
  email?: string
}

const db = getFirestore(app)

export default function DashboardPage({ handleSignupRedirect, pushLogin, role, userId, email }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([])
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [cart, setCart] = useState<(InventoryItem & { quantity?: number })[]>([])
  const [showCart, setShowCart] = useState<boolean>(false)
  const [quantity, setQuantity] = useState<number>(1)
  const [showAddDialog, setShowAddDialog] = useState<boolean>(false)
  const [isLoadingAdd, setIsLoadingAdd] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [page, setPage] = useState<number>(0)
  const [rowsPerPage, setRowsPerPage] = useState<number>(10)
  const [newItem, setNewItem] = useState({
    name: '',
    company: '',
    volume: '',
    quantity: '',
    concentration: '',
    purchaseDate: '',
    expirationDate: '',
    notes: '',
    category: '4C' as '4C' | '-20C',
    barcode: '',
    qrCode: '',
    batchNumber: '',
    serialNumber: '',
    casNumber: '',
    location: { track: 1, position: 1 }
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showCheckoutDialog, setShowCheckoutDialog] = useState<boolean>(false)
  const [checkoutQuantity, setCheckoutQuantity] = useState<number>(1)
  const [checkoutReturnDate, setCheckoutReturnDate] = useState<string>('')
  const [checkoutPurpose, setCheckoutPurpose] = useState<string>('')
  const [isLoadingCheckout, setIsLoadingCheckout] = useState<boolean>(false)

  const isAdmin = role === 'admin' || role === 'superadmin'

  const handleLogout = () => {
    Cookies.remove('auth_token')
    setSuccess('Successfully logged out')
    setTimeout(() => pushLogin(), 600)
  }

  const handleAddToCart = (item: InventoryItem) => {
    if (cart.length >= 10) {
      setError('Cart is full (max 10 items).')
      setTimeout(() => setError(null), 2000)
      return
    }
    const alreadyInCart = cart.some(cartItem => cartItem.id === item.id)
    if (!alreadyInCart) {
      const updatedCart = [...cart, { ...item, quantity }]
      setCart(updatedCart)
      localStorage.setItem('sampleCart', JSON.stringify(updatedCart))
      setSuccess(`${item.name} added to cart`)
      setTimeout(() => setSuccess(null), 2000)
    } else {
      setError(`${item.name} is already in your cart`)
      setTimeout(() => setError(null), 2000)
    }
  }

  const handleRemoveFromCart = (itemId: string) => {
    const updatedCart = cart.filter(item => item.id !== itemId)
    setCart(updatedCart)
    localStorage.setItem('sampleCart', JSON.stringify(updatedCart))
  }

  const handleCheckoutItem = async () => {
    if (!selectedItem || !userId) {
      setError('Selected item or user information not found')
      return
    }

    if (!checkoutReturnDate) {
      setError('Expected return date is required')
      return
    }

    setIsLoadingCheckout(true)
    try {
      const returnDate = new Date(checkoutReturnDate)
      if (returnDate <= new Date()) {
        setError('Please select a future date for return')
        setIsLoadingCheckout(false)
        return
      }

      await checkoutItemQuery(
        selectedItem.id,
        userId,
        checkoutQuantity,
        returnDate,
        checkoutPurpose || undefined
      )

      setSuccess(`Successfully checked out "${selectedItem.name}"`)
      setTimeout(() => setSuccess(null), 3000)

      // Reset checkout form
      setCheckoutQuantity(1)
      setCheckoutReturnDate('')
      setCheckoutPurpose('')
      setShowCheckoutDialog(false)

      // Refresh inventory
      const snapshot = await getDocs(collection(db, 'Inventory'))
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem))
      items.sort((a: InventoryItem, b: InventoryItem) => (a.name ?? '').toLowerCase().localeCompare((b.name ?? '').toLowerCase()))
      setInventory(items)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to checkout item')
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsLoadingCheckout(false)
    }
  }

  const checkDuplicate = async (name: string, company: string, batchNumber?: string): Promise<boolean> => {
    try {
      let q
      if (batchNumber?.trim()) {
        q = query(
          collection(db, 'Inventory'),
          where('name', '==', name.trim()),
          where('company', '==', company.trim()),
          where('batchNumber', '==', batchNumber.trim())
        )
      } else {
        q = query(
          collection(db, 'Inventory'),
          where('name', '==', name.trim()),
          where('company', '==', company.trim())
        )
      }
      const snapshot = await getDocs(q)
      return snapshot.size > 0
    } catch (error) {
      console.error('Error checking for duplicates:', error)
      return false
    }
  }

  const handleAddInventory = async () => {
    setFieldErrors({})
    
    // Build input object for validation
    const input = {
      name: newItem.name.trim(),
      company: newItem.company.trim(),
      volume: newItem.volume.trim(),
      quantity: newItem.quantity ? parseInt(newItem.quantity) : 0,
      concentration: newItem.concentration.trim() || undefined,
      purchaseDate: newItem.purchaseDate || '',
      expirationDate: newItem.expirationDate || '',
      notes: newItem.notes.trim() || '',
      category: newItem.category,
      barcode: newItem.barcode.trim(),
      qrCode: newItem.qrCode.trim(),
      batchNumber: newItem.batchNumber.trim() || undefined,
      serialNumber: newItem.serialNumber.trim() || undefined,
      casNumber: newItem.casNumber.trim() || undefined,
      location: newItem.location
    }

    // Validate using validators
    const validation = validateInventoryItem(input)
    if (!validation.isValid) {
      setFieldErrors(validation.errors)
      setError('Please fix the errors below')
      setTimeout(() => setError(null), 3000)
      return
    }

    setIsLoadingAdd(true)
    try {
      // Check for duplicate
      const isDuplicate = await checkDuplicate(newItem.name, newItem.company, newItem.batchNumber)
      if (isDuplicate) {
        setError(`An item with name "${newItem.name}" from "${newItem.company}"${newItem.batchNumber ? ` and batch "${newItem.batchNumber}"` : ''} already exists`)
        setTimeout(() => setError(null), 3000)
        setIsLoadingAdd(false)
        return
      }

      // Use the query function to add with proper schema
      if (!userId) {
        setError('User ID not found. Please log in again.')
        return
      }

      await addInventoryItemQuery(input, userId)

      // Refresh inventory list
      const snapshot = await getDocs(collection(db, 'Inventory'))
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem))
      items.sort((a: InventoryItem, b: InventoryItem) => (a.name ?? '').toLowerCase().localeCompare((b.name ?? '').toLowerCase()))
      setInventory(items)

      setSuccess(`Successfully added "${newItem.name}" to inventory`)
      setTimeout(() => setSuccess(null), 3000)

      // Reset form and close dialog
      setNewItem({
        name: '',
        company: '',
        volume: '',
        quantity: '',
        concentration: '',
        purchaseDate: '',
        expirationDate: '',
        notes: '',
        category: '4C',
        barcode: '',
        qrCode: '',
        batchNumber: '',
        serialNumber: '',
        casNumber: '',
        location: { track: 1, position: 1 }
      })
      setFieldErrors({})
      setShowAddDialog(false)
    } catch (error) {
      setError('Failed to add inventory item')
      console.error('Error adding inventory:', error)
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsLoadingAdd(false)
    }
  }

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const items = await fetchAllInventory()
        setInventory(items)
        setFilteredInventory(items)
      } catch (err) {
        setError('Failed to load inventory.')
        console.error(err)
      }
    }

    const storedCart = localStorage.getItem('sampleCart')
    if (storedCart) setCart(JSON.parse(storedCart))

    loadInventory()
  }, [])

  // Filter inventory based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredInventory(inventory)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = inventory.filter(item =>
        item.name?.toLowerCase().includes(query) ||
        item.company?.toLowerCase().includes(query) ||
        item.volume?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.batchNumber?.toLowerCase().includes(query)
      )
      setFilteredInventory(filtered)
    }
    setPage(0) // Reset to first page when filtering
  }, [searchQuery, inventory])

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="sticky" color="default" elevation={2}>
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography 
              variant="h5" 
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #2563eb 0%, #059669 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ThermalHaven
            </Typography>
            <Divider orientation="vertical" variant="middle" sx={{ height: 32 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Inventory Management System
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAdmin ? (
              <>
                <Button 
                  variant="contained" 
                  color="success" 
                  onClick={() => setShowAddDialog(true)} 
                  startIcon={<AddIcon />}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Add Item
                </Button>
                <Button 
                  variant="outlined" 
                  color="info" 
                  onClick={handleSignupRedirect} 
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Create Account
                </Button>
              </>
            ) : null}
            <IconButton 
              color="primary" 
              onClick={() => setShowCart(true)}
              size="small"
              sx={{ 
                p: 1.25,
                '&:hover': { bgcolor: 'rgba(30, 64, 175, 0.08)' }
              }}
            >
              <Badge badgeContent={cart.length} color="error">
                <ShoppingCartIcon sx={{ fontSize: '1.5rem' }} />
              </Badge>
            </IconButton>
            <Divider orientation="vertical" variant="middle" sx={{ height: 32, mx: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ textAlign: 'right', mr: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {email?.split('@')[0] || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#0891b2', fontWeight: 600 }}>
                  {role?.charAt(0).toUpperCase()}{role?.slice(1) || 'User'}
                </Typography>
              </Box>
              <Button 
                color="error" 
                onClick={handleLogout} 
                size="small"
                variant="text"
              >
                Logout
              </Button>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h3" 
            sx={{
              fontWeight: 800,
              mb: 0.5,
              color: 'text.primary'
            }}
          >
            Inventory Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Manage and track your laboratory samples
          </Typography>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2, borderRadius: 1 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 2, borderRadius: 1 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            {/* Freezer Map */}
            <FreezerMap items={inventory} />
          </Grid>

          <Grid item xs={12}>
            {/* Search Bar */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search by name, company, volume, category, or batch..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  )
                }}
              />
            </Box>

            {/* Inventory Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f3f4f6' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Company</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Volume</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Batch Number</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInventory
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item) => (
                      <TableRow key={item.id} hover sx={{ cursor: 'pointer' }}>
                        <TableCell 
                          onClick={() => setSelectedItem(item)}
                          sx={{ fontWeight: 500 }}
                        >
                          {item.name}
                        </TableCell>
                        <TableCell onClick={() => setSelectedItem(item)}>
                          {item.company}
                        </TableCell>
                        <TableCell onClick={() => setSelectedItem(item)}>
                          {item.volume}
                        </TableCell>
                        <TableCell onClick={() => setSelectedItem(item)}>
                          {item.quantity || 0}
                        </TableCell>
                        <TableCell onClick={() => setSelectedItem(item)}>
                          <Typography
                            variant="body2"
                            sx={{
                              display: 'inline-block',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              bgcolor: item.category === '4C' ? '#dbeafe' : '#f3e8ff',
                              color: item.category === '4C' ? '#0369a1' : '#6b21a8',
                              fontWeight: 600,
                            }}
                          >
                            {item.category}
                          </Typography>
                        </TableCell>
                        <TableCell onClick={() => setSelectedItem(item)}>
                          {item.batchNumber || '-'}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          {item.location?.label ? (
                            <Chip
                              label={item.location.label}
                              size="small"
                              color="primary"
                              variant="outlined"
                              title={item.location.description}
                              sx={{
                                fontWeight: 600,
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: 'primary.light',
                                  color: 'white',
                                }
                              }}
                              onClick={() => setSelectedItem(item)}
                            />
                          ) : (
                            <Typography variant="body2" color="textSecondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Button
                            variant="contained"
                            color="secondary"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddToCart(item)
                            }}
                          >
                            Add to Cart
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredInventory.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableContainer>
          </Grid>

          {/* Details Panel */}
          <Grid item xs={12}>
            {selectedItem ? (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                  Sample Details
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Item Name
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedItem.name}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Company
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedItem.company}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Volume
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedItem.volume}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Quantity
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedItem.quantity}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Category
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedItem.category}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Batch Number
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedItem.batchNumber || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Concentration
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedItem.concentration || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Location
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedItem.location?.label || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Notes
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedItem.notes || '-'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box mt={3} display="flex" alignItems="center" gap={2}>
                  <TextField
                    label="Quantity to Add"
                    type="number"
                    size="small"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(10, Number(e.target.value))))}
                    inputProps={{ min: 1, max: 10 }}
                    sx={{ width: 120 }}
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleAddToCart(selectedItem)}
                  >
                    Add to Cart
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setShowCheckoutDialog(true)}
                  >
                    Checkout Item
                  </Button>
                </Box>
              </Paper>
            ) : (
              <Typography variant="body1" color="text.secondary">
                Click on an item in the table to view detailed information.
              </Typography>
            )}
          </Grid>
        </Grid>
      </Container>

      <Drawer anchor="right" open={showCart} onClose={() => setShowCart(false)}>
        <Box sx={{ width: 320, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Cart ({cart.length})
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {cart.map((item) => (
              <ListItem key={item.id} secondaryAction={
                <IconButton edge="end" onClick={() => handleRemoveFromCart(item.id)}>
                  <DeleteIcon />
                </IconButton>
              }>
                <ListItemText
                  primary={`${item.name} - ${item.company}`}
                  secondary={`Qty: ${item.quantity ?? 1}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Inventory Item</DialogTitle>
        <DialogContent sx={{ pt: 2, maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Required Fields */}
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600, color: 'primary.main' }}>
            Required Fields
          </Typography>
          
          <TextField
            fullWidth
            label="Item Name"
            margin="normal"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            placeholder="e.g., Sample A"
            error={!!fieldErrors.name}
            helperText={fieldErrors.name}
            required
          />
          
          <TextField
            fullWidth
            label="Company"
            margin="normal"
            value={newItem.company}
            onChange={(e) => setNewItem({ ...newItem, company: e.target.value })}
            placeholder="e.g., Acme Inc"
            error={!!fieldErrors.company}
            helperText={fieldErrors.company}
            required
          />
          
          <TextField
            fullWidth
            label="Volume"
            margin="normal"
            value={newItem.volume}
            onChange={(e) => setNewItem({ ...newItem, volume: e.target.value })}
            placeholder="e.g., 100ml"
            error={!!fieldErrors.volume}
            helperText={fieldErrors.volume}
            required
          />
          
          <TextField
            fullWidth
            label="Quantity"
            type="number"
            margin="normal"
            value={newItem.quantity}
            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            placeholder="e.g., 5"
            error={!!fieldErrors.quantity}
            helperText={fieldErrors.quantity}
            required
            inputProps={{ min: 0 }}
          />
          
          <FormControl fullWidth margin="normal" error={!!fieldErrors.category}>
            <InputLabel>Temperature Zone (Category) *</InputLabel>
            <Select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value as '4C' | '-20C' })}
              label="Temperature Zone (Category) *"
            >
              <MenuItem value="4C">4°C (Refrigerator)</MenuItem>
              <MenuItem value="-20C">-20°C (Freezer)</MenuItem>
            </Select>
            {fieldErrors.category && <FormHelperText>{fieldErrors.category}</FormHelperText>}
          </FormControl>
          
          <TextField
            fullWidth
            label="Barcode"
            margin="normal"
            value={newItem.barcode}
            onChange={(e) => setNewItem({ ...newItem, barcode: e.target.value })}
            placeholder="e.g., 123456789"
            error={!!fieldErrors.barcode}
            helperText={fieldErrors.barcode}
            required
          />
          
          <TextField
            fullWidth
            label="QR Code"
            margin="normal"
            value={newItem.qrCode}
            onChange={(e) => setNewItem({ ...newItem, qrCode: e.target.value })}
            placeholder="e.g., QR123456789"
            error={!!fieldErrors.qrCode}
            helperText={fieldErrors.qrCode}
            required
          />

          {/* Optional Fields */}
          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Optional Fields
          </Typography>
          
          <TextField
            fullWidth
            label="Concentration"
            margin="normal"
            value={newItem.concentration}
            onChange={(e) => setNewItem({ ...newItem, concentration: e.target.value })}
            placeholder="e.g., 50%"
            error={!!fieldErrors.concentration}
            helperText={fieldErrors.concentration}
          />
          
          <TextField
            fullWidth
            label="Batch Number"
            margin="normal"
            value={newItem.batchNumber}
            onChange={(e) => setNewItem({ ...newItem, batchNumber: e.target.value })}
            placeholder="e.g., BATCH-20240101"
            error={!!fieldErrors.batchNumber}
            helperText={fieldErrors.batchNumber}
          />
          
          <TextField
            fullWidth
            label="Serial Number"
            margin="normal"
            value={newItem.serialNumber}
            onChange={(e) => setNewItem({ ...newItem, serialNumber: e.target.value })}
            placeholder="e.g., SN-12345"
            error={!!fieldErrors.serialNumber}
            helperText={fieldErrors.serialNumber}
          />
          
          <TextField
            fullWidth
            label="CAS Number"
            margin="normal"
            value={newItem.casNumber}
            onChange={(e) => setNewItem({ ...newItem, casNumber: e.target.value })}
            placeholder="e.g., 7732-18-5"
            error={!!fieldErrors.casNumber}
            helperText={fieldErrors.casNumber}
          />
          
          <Typography variant="subtitle2" sx={{ mt: 3, mb: 2, fontWeight: 600, color: 'primary.main' }}>
            Freezer Location (3×2 Track System)
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth error={!!fieldErrors.track}>
                <InputLabel>Track (Row)</InputLabel>
                <Select
                  value={newItem.location?.track || 1}
                  onChange={(e) => setNewItem({ 
                    ...newItem, 
                    location: { ...newItem.location, track: e.target.value as number }
                  })}
                  label="Track (Row)"
                >
                  <MenuItem value={1}>Track 1 (Top)</MenuItem>
                  <MenuItem value={2}>Track 2 (Middle)</MenuItem>
                  <MenuItem value={3}>Track 3 (Bottom)</MenuItem>
                </Select>
                {fieldErrors.track && <FormHelperText>{fieldErrors.track}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth error={!!fieldErrors.position}>
                <InputLabel>Position (Column)</InputLabel>
                <Select
                  value={newItem.location?.position || 1}
                  onChange={(e) => setNewItem({ 
                    ...newItem, 
                    location: { ...newItem.location, position: e.target.value as number }
                  })}
                  label="Position (Column)"
                >
                  <MenuItem value={1}>Position 1 (Left)</MenuItem>
                  <MenuItem value={2}>Position 2 (Right)</MenuItem>
                </Select>
                {fieldErrors.position && <FormHelperText>{fieldErrors.position}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
          
          <TextField
            fullWidth
            label="Purchase Date"
            type="date"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={newItem.purchaseDate}
            onChange={(e) => setNewItem({ ...newItem, purchaseDate: e.target.value })}
            error={!!fieldErrors.purchaseDate}
            helperText={fieldErrors.purchaseDate}
          />
          
          <TextField
            fullWidth
            label="Expiration Date"
            type="date"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={newItem.expirationDate}
            onChange={(e) => setNewItem({ ...newItem, expirationDate: e.target.value })}
            error={!!fieldErrors.expirationDate}
            helperText={fieldErrors.expirationDate}
          />
          
          <TextField
            fullWidth
            label="Notes"
            margin="normal"
            multiline
            rows={3}
            value={newItem.notes}
            onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
            placeholder="Add any additional notes"
            error={!!fieldErrors.notes}
            helperText={fieldErrors.notes}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowAddDialog(false)
            setFieldErrors({})
          }}>Cancel</Button>
          <Button 
            onClick={handleAddInventory} 
            variant="contained" 
            color="success"
            disabled={isLoadingAdd}
          >
            {isLoadingAdd ? 'Adding...' : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckoutDialog} onClose={() => setShowCheckoutDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Checkout Item</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedItem && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Item: <strong>{selectedItem.name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Available Quantity: <strong>{selectedItem.quantity}</strong>
              </Typography>

              <TextField
                fullWidth
                label="Quantity to Checkout"
                type="number"
                margin="normal"
                value={checkoutQuantity}
                onChange={(e) => setCheckoutQuantity(Math.max(1, Math.min(selectedItem.quantity, Number(e.target.value))))}
                inputProps={{ min: 1, max: selectedItem.quantity }}
              />

              <TextField
                fullWidth
                label="Expected Return Date"
                type="date"
                margin="normal"
                InputLabelProps={{ shrink: true }}
                value={checkoutReturnDate}
                onChange={(e) => setCheckoutReturnDate(e.target.value)}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
              />

              <TextField
                fullWidth
                label="Purpose (Optional)"
                margin="normal"
                multiline
                rows={2}
                value={checkoutPurpose}
                onChange={(e) => setCheckoutPurpose(e.target.value)}
                placeholder="Why are you checking out this item?"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowCheckoutDialog(false)
            setCheckoutQuantity(1)
            setCheckoutReturnDate('')
            setCheckoutPurpose('')
          }}>Cancel</Button>
          <Button 
            onClick={handleCheckoutItem} 
            variant="contained" 
            color="primary"
            disabled={isLoadingCheckout || !checkoutReturnDate}
          >
            {isLoadingCheckout ? 'Checking out...' : 'Confirm Checkout'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
