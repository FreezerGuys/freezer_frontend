import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  Timestamp,
  getFirestore,
  type QueryConstraint
} from 'firebase/firestore'
import { app } from '@/lib/firebase'
import { InventoryItem, NewInventoryItemInput, EditHistoryEntry, Checkout } from '@/types/inventory'

type EditChanges = EditHistoryEntry['changes']
import { generateLocationLabel, generateLocationDescription } from '@/lib/validators'

const db = getFirestore(app)

/**
 * Fetches all inventory items, sorted by name
 * @returns Array of InventoryItem objects
 */
export async function fetchAllInventory(): Promise<InventoryItem[]> {
  try {
    const snapshot = await getDocs(collection(db, 'Inventory'))
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InventoryItem[]

    // Sort by name
    items.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

    return items
  } catch (error) {
    console.error('Error fetching inventory:', error)
    throw new Error('Failed to load inventory items')
  }
}

/**
 * Checks if an inventory item with the same name, company, and batch already exists
 * @param name - Item name to check
 * @param company - Company name to check
 * @param batchNumber - Optional batch number to check
 * @returns True if duplicate exists, false otherwise
 */
export async function isDuplicateInventory(
  name: string,
  company: string,
  batchNumber?: string
): Promise<boolean> {
  try {
    let q
    if (batchNumber) {
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
    throw new Error('Failed to check for duplicates')
  }
}

/**
 * Adds a new inventory item to Firestore
 * @param item - The new inventory item input
 * @param userId - The user ID who is creating this item
 * @returns The newly created item with ID
 */
export async function addInventoryItem(
  item: NewInventoryItemInput,
  userId: string
): Promise<InventoryItem> {
  try {
    // Build location object with label and description
    let locationData: { track: number; position: number; label: string; description: string } | null = null
    let locationLabel = ''
    if (item.location?.track && item.location?.position) {
      locationLabel = generateLocationLabel(item.location.track, item.location.position)
      const locationDescription = generateLocationDescription(item.location.track, item.location.position)
      locationData = {
        track: item.location.track,
        position: item.location.position,
        label: locationLabel,
        description: locationDescription
      }
    }

    const itemData = {
      name: item.name.trim(),
      company: item.company.trim(),
      volume: item.volume.trim(),
      quantity: item.quantity,
      concentration: item.concentration?.trim() || null,
      purchaseDate: item.purchaseDate
        ? Timestamp.fromDate(new Date(item.purchaseDate))
        : null,
      expirationDate: item.expirationDate
        ? Timestamp.fromDate(new Date(item.expirationDate))
        : null,
      notes: item.notes?.trim() || '',
      batchNumber: item.batchNumber?.trim() || null,
      serialNumber: item.serialNumber?.trim() || null,
      casNumber: item.casNumber?.trim() || null,
      location: locationData,
      locationLabel: locationLabel || null,
      category: item.category,
      barcode: item.barcode.trim(),
      qrCode: item.qrCode.trim(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId,
      status: 'active',
      borrowedBy: undefined,
      borrowedAt: undefined,
      expectedReturnDate: undefined
    }

    const docRef = await addDoc(collection(db, 'Inventory'), itemData)

    return {
      id: docRef.id,
      ...itemData
    } as InventoryItem
  } catch (error) {
    console.error('Error adding inventory item:', error)
    throw new Error('Failed to add inventory item')
  }
}

/**
 * Updates an existing inventory item
 * @param itemId - The item ID to update
 * @param updates - Partial item data to update
 * @returns Updated item
 */
export async function updateInventoryItem(
  itemId: string,
  updates: Partial<InventoryItem>
): Promise<void> {
  try {
    const itemRef = doc(db, 'Inventory', itemId)
    await updateDoc(itemRef, {
      ...updates,
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error updating inventory item:', error)
    throw new Error('Failed to update inventory item')
  }
}

/**
 * Logs an edit to an item's history subcollection (user items only)
 * @param itemId - The item ID being edited
 * @param userId - The user making the change
 * @param changes - The fields that changed
 */
export async function logItemEdit(
  itemId: string,
  userId: string,
  changes: EditChanges
): Promise<void> {
  try {
    const historyData: Omit<EditHistoryEntry, 'id'> = {
      itemId,
      action: 'update',
      changedBy: userId,
      changedAt: Timestamp.now(),
      changes
    }

    await addDoc(
      collection(db, 'Inventory', itemId, 'history'),
      historyData
    )
  } catch (error) {
    console.error('Error logging item edit:', error)
    throw new Error('Failed to log edit history')
  }
}

/**
 * Gets inventory items by company
 * @param company - Company name to search for
 * @returns Array of matching InventoryItem objects
 */
export async function getInventoryByCompany(company: string): Promise<InventoryItem[]> {
  try {
    const q = query(
      collection(db, 'Inventory'),
      where('company', '==', company.trim())
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InventoryItem[]
  } catch (error) {
    console.error('Error fetching inventory by company:', error)
    throw new Error(`Failed to fetch items from ${company}`)
  }
}

/**
 * Gets inventory items by category (temperature zone)
 * @param category - Category ('4C' or '-20C')
 * @returns Array of matching InventoryItem objects
 */
export async function getInventoryByCategory(
  category: '4C' | '-20C'
): Promise<InventoryItem[]> {
  try {
    const q = query(
      collection(db, 'Inventory'),
      where('category', '==', category)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InventoryItem[]
  } catch (error) {
    console.error('Error fetching inventory by category:', error)
    throw new Error(`Failed to fetch items from ${category}`)
  }
}

/**
 * Gets active (non-expired, non-archived) inventory items
 * @returns Array of active InventoryItem objects
 */
export async function getActiveInventory(): Promise<InventoryItem[]> {
  try {
    const q = query(
      collection(db, 'Inventory'),
      where('status', '==', 'active')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InventoryItem[]
  } catch (error) {
    console.error('Error fetching active inventory:', error)
    throw new Error('Failed to fetch active items')
  }
}

/**
 * Gets expired inventory items
 * @returns Array of expired InventoryItem objects
 */
export async function getExpiredInventory(): Promise<InventoryItem[]> {
  try {
    const now = Timestamp.now()
    const q = query(
      collection(db, 'Inventory'),
      where('expirationDate', '!=', null),
      where('expirationDate', '<', now),
      where('status', '==', 'active')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InventoryItem[]
  } catch (error) {
    console.error('Error fetching expired inventory:', error)
    throw new Error('Failed to fetch expired items')
  }
}

/**
 * Gets borrowed/checked-out items
 * @returns Array of InventoryItem objects that are currently borrowed
 */
export async function getBorrowedInventory(): Promise<InventoryItem[]> {
  try {
    const q = query(
      collection(db, 'Inventory'),
      where('borrowedBy', '!=', null)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InventoryItem[]
  } catch (error) {
    console.error('Error fetching borrowed inventory:', error)
    throw new Error('Failed to fetch borrowed items')
  }
}

/**
 * Searches inventory items by name or company (partial match, case-insensitive)
 * NOTE: This is a client-side search. For better performance with large datasets,
 * consider using Algolia or Firestore full-text search
 * @param searchTerm - Search term to match
 * @returns Array of matching InventoryItem objects
 */
export async function searchInventory(searchTerm: string): Promise<InventoryItem[]> {
  try {
    const allItems = await fetchAllInventory()
    const term = searchTerm.toLowerCase().trim()

    return allItems.filter(
      item =>
        item.name.toLowerCase().includes(term) ||
        item.company.toLowerCase().includes(term) ||
        item.batchNumber?.toLowerCase().includes(term) ||
        item.casNumber?.toLowerCase().includes(term)
    )
  } catch (error) {
    console.error('Error searching inventory:', error)
    throw new Error('Failed to search inventory')
  }
}

/**
 * Gets inventory items created by a specific user
 * @param userId - User ID
 * @returns Array of InventoryItem objects
 */
export async function getInventoryByCreator(userId: string): Promise<InventoryItem[]> {
  try {
    const userRef = doc(db, 'Users', userId)
    const q = query(
      collection(db, 'Inventory'),
      where('createdBy', '==', userRef)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InventoryItem[]
  } catch (error) {
    console.error('Error fetching inventory by creator:', error)
    throw new Error(`Failed to fetch items created by user`)
  }
}

/**
 * Checkout an item for a user
 * @param itemId - Item to checkout
 * @param userId - User checking out
 * @param quantity - Quantity to checkout
 * @param expectedReturnDate - Optional expected return date
 * @param purpose - Optional purpose for the checkout
 * @returns Created checkout record
 */
export async function checkoutItem(
  itemId: string,
  userId: string,
  quantity: number,
  expectedReturnDate?: Date,
  purpose?: string
): Promise<Checkout> {
  try {
    const checkoutData: Omit<Checkout, 'id'> = {
      inventoryId: itemId,
      userId,
      checkedOutAt: Timestamp.now(),
      quantity,
      expectedReturnDate: expectedReturnDate
        ? Timestamp.fromDate(expectedReturnDate)
        : Timestamp.now(),
      status: 'active',
      purpose
    }

    const docRef = await addDoc(collection(db, 'Checkouts'), checkoutData)

    // Update inventory item to mark as borrowed
    await updateInventoryItem(itemId, {
      borrowedBy: userId,
      borrowedAt: Timestamp.now(),
      expectedReturnDate: expectedReturnDate
        ? Timestamp.fromDate(expectedReturnDate)
        : undefined
    })

    return {
      id: docRef.id,
      ...checkoutData
    } as Checkout
  } catch (error) {
    console.error('Error checking out item:', error)
    throw new Error('Failed to checkout item')
  }
}

/**
 * Return a checked-out item
 * @param itemId - Item being returned
 * @param checkoutId - Checkout record ID
 */
export async function returnItem(itemId: string, checkoutId: string): Promise<void> {
  try {
    // Update checkout record
    await updateDoc(doc(db, 'Checkouts', checkoutId), {
      returnedAt: Timestamp.now()
    })

    // Update inventory item to clear borrowed status
    await updateInventoryItem(itemId, {
      borrowedBy: undefined,
      borrowedAt: undefined,
      expectedReturnDate: undefined
    })
  } catch (error) {
    console.error('Error returning item:', error)
    throw new Error('Failed to return item')
  }
}

/**
 * Builds a complex query with multiple constraints
 * @param constraints - Array of Firestore QueryConstraint objects
 * @returns Array of matching InventoryItem objects
 */
export async function queryInventory(constraints: QueryConstraint[]): Promise<InventoryItem[]> {
  try {
    const q = query(collection(db, 'Inventory'), ...constraints)
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InventoryItem[]
  } catch (error) {
    console.error('Error executing inventory query:', error)
    throw new Error('Failed to execute query')
  }
}
