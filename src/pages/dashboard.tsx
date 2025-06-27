import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { format } from 'date-fns'
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
  ListItemButton,
  IconButton,
  Grid,
  TextField,
  Badge,
  Drawer
} from '@mui/material'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import DeleteIcon from '@mui/icons-material/Delete'
import { Timestamp, collection, DocumentData, getDocs, getFirestore } from 'firebase/firestore'
import { app } from '@/lib/firebase'

interface Props {
  handleSignupRedirect: () => void
  pushLogin: () => void
  role: string | null
}

const db = getFirestore(app)

export default function DashboardPage({ handleSignupRedirect, pushLogin, role }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [inventory, setInventory] = useState<DocumentData[]>([])
  const [selectedItem, setSelectedItem] = useState<DocumentData | null>(null)
  const [cart, setCart] = useState<DocumentData[]>([])
  const [showCart, setShowCart] = useState<boolean>(false)
  const [quantity, setQuantity] = useState<number>(1)

  const handleLogout = () => {
    Cookies.remove('auth_token')
    setSuccess('Successfully logged out')
    setTimeout(() => pushLogin(), 600)
  }

  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp?.seconds) return 'N/A'
    return format(new Date(timestamp.seconds * 1000), 'PPpp')
  }

  const handleAddToCart = (item: DocumentData) => {
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

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'Inventory'))
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        items.sort((a: any, b: any) => a.name?.toLowerCase().localeCompare(b.name?.toLowerCase()))
        setInventory(items)
      } catch (error) {
        setError('Failed to load inventory.')
        console.error(error)
      }
    }

    const storedCart = localStorage.getItem('sampleCart')
    if (storedCart) setCart(JSON.parse(storedCart))

    fetchInventory()
  }, [])

  return (
    <Box sx={{ bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700} color="primary">
            Freezer Portal
          </Typography>
          <Box>
              {role === 'admin' || 'superadmin' ? 
            <Button variant="contained" color="info" onClick={handleSignupRedirect} sx={{ mr: 2 }}>
            Create Student Account
          </Button>
          : null}
            <IconButton color="primary" onClick={() => setShowCart(true)}>
              <Badge badgeContent={cart.length} color="secondary">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
            <Button color="primary" onClick={handleLogout} sx={{ ml: 2 }}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" gutterBottom>
          Inventory Dashboard
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Inventory Samples
              </Typography>
              <List sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {inventory.map((item) => (
                  <ListItem key={item.id} disablePadding>
                    <ListItemButton onClick={() => setSelectedItem(item)}>
                      <ListItemText primary={`${item.name} - ${item.company}`} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            {selectedItem ? (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h5" gutterBottom>
                  Sample Details
                </Typography>
                <Typography><strong>ID:</strong> {selectedItem.id}</Typography>
                <Typography><strong>Name:</strong> {selectedItem.name}</Typography>
                <Typography><strong>Company:</strong> {selectedItem.company}</Typography>
                <Typography><strong>Volume:</strong> {selectedItem.volume}</Typography>
                <Typography><strong>Purchase Date:</strong> {formatTimestamp(selectedItem['Purchase Date'])}</Typography>
                <Typography><strong>Created At:</strong> {formatTimestamp(selectedItem.CreatedAT)}</Typography>
                <Typography><strong>Expiration Date:</strong> {formatTimestamp(selectedItem.ExpirationDate)}</Typography>
                {selectedItem.Notes && <Typography><strong>Notes:</strong> {selectedItem.Notes}</Typography>}

                <Box mt={3} display="flex" alignItems="center" gap={2}>
                  <TextField
                    label="Quantity"
                    type="number"
                    size="small"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(10, Number(e.target.value))))}
                    inputProps={{ min: 1, max: 10 }}
                    sx={{ width: 100 }}
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleAddToCart(selectedItem)}
                  >
                    Add to Cart
                  </Button>
                </Box>
              </Paper>
            ) : (
              <Typography variant="body1" color="text.secondary">
                Select an item from the inventory to view details.
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
    </Box>
  )
}
