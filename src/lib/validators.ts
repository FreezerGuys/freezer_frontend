import { NewInventoryItemInput, InventoryItem } from '@/types/inventory'

/**
 * Validation result object
 */
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

/**
 * Validates a new inventory item input (FINAL SCHEMA)
 * @param item - The inventory item to validate
 * @returns ValidationResult with any validation errors
 */
export function validateInventoryItem(item: NewInventoryItemInput): ValidationResult {
  const errors: Record<string, string> = {}

  // ========== REQUIRED FIELDS ==========
  
  // name
  if (!item.name?.trim()) {
    errors.name = 'Item name is required'
  } else if (item.name.trim().length < 2) {
    errors.name = 'Item name must be at least 2 characters'
  } else if (item.name.trim().length > 100) {
    errors.name = 'Item name must be less than 100 characters'
  }

  // company
  if (!item.company?.trim()) {
    errors.company = 'Company/supplier name is required'
  } else if (item.company.trim().length < 2) {
    errors.company = 'Company name must be at least 2 characters'
  } else if (item.company.trim().length > 100) {
    errors.company = 'Company name must be less than 100 characters'
  }

  // volume
  if (!item.volume?.trim()) {
    errors.volume = 'Volume is required'
  } else if (item.volume.trim().length < 2) {
    errors.volume = 'Volume must be at least 2 characters'
  } else if (item.volume.trim().length > 50) {
    errors.volume = 'Volume must be less than 50 characters'
  }

  // quantity
  if (item.quantity === undefined || item.quantity === null) {
    errors.quantity = 'Quantity is required'
  } else if (item.quantity < 0) {
    errors.quantity = 'Quantity cannot be negative'
  } else if (item.quantity > 999999) {
    errors.quantity = 'Quantity exceeds maximum'
  } else if (!Number.isInteger(item.quantity)) {
    errors.quantity = 'Quantity must be a whole number'
  }

  // category
  if (!item.category) {
    errors.category = 'Temperature zone is required'
  } else if (!['4C', '-20C'].includes(item.category)) {
    errors.category = 'Category must be 4C or -20C'
  }

  // barcode
  if (!item.barcode?.trim()) {
    errors.barcode = 'Barcode is required'
  } else if (item.barcode.trim().length < 3) {
    errors.barcode = 'Barcode must be at least 3 characters'
  } else if (item.barcode.trim().length > 100) {
    errors.barcode = 'Barcode must be less than 100 characters'
  }

  // qrCode
  if (!item.qrCode?.trim()) {
    errors.qrCode = 'QR code is required'
  } else if (item.qrCode.trim().length < 3) {
    errors.qrCode = 'QR code must be at least 3 characters'
  } else if (item.qrCode.trim().length > 100) {
    errors.qrCode = 'QR code must be less than 100 characters'
  }

  // ========== OPTIONAL FIELDS ==========

  // concentration
  if (item.concentration && item.concentration.trim().length > 50) {
    errors.concentration = 'Concentration must be less than 50 characters'
  }

  // batchNumber (optional but if provided, validate format)
  if (item.batchNumber?.trim()) {
    if (!item.batchNumber.match(/^[A-Z0-9\-]+$/)) {
      errors.batchNumber = 'Batch number format invalid (uppercase letters, numbers, hyphens only)'
    } else if (item.batchNumber.length > 50) {
      errors.batchNumber = 'Batch number must be less than 50 characters'
    }
  }

  // serialNumber (optional)
  if (item.serialNumber?.trim() && item.serialNumber.length > 50) {
    errors.serialNumber = 'Serial number must be less than 50 characters'
  }

  // casNumber (optional but if provided, validate CAS format: XXX-XX-X)
  if (item.casNumber?.trim()) {
    if (!item.casNumber.match(/^\d+-\d+-\d+$/)) {
      errors.casNumber = 'CAS number format must be XXX-XX-X (e.g., 7732-18-5)'
    }
  }

  // ========== DATE VALIDATION ==========

  if (item.purchaseDate && !isValidDate(item.purchaseDate)) {
    errors.purchaseDate = 'Invalid purchase date'
  }

  if (item.expirationDate && !isValidDate(item.expirationDate)) {
    errors.expirationDate = 'Invalid expiration date'
  }

  // Date logic validation
  if (item.purchaseDate && item.expirationDate) {
    const purchase = new Date(item.purchaseDate)
    const expiration = new Date(item.expirationDate)

    if (expiration <= purchase) {
      errors.expirationDate = 'Expiration date must be after purchase date'
    }
  }

  // ========== LOCATION VALIDATION ==========

  if (item.location) {
    const locError = validateLocation(item.location)
    if (!locError.isValid) {
      errors.location = Object.values(locError.errors)[0]
    }
  }

  // ========== NOTES ==========

  if (item.notes && item.notes.length > 500) {
    errors.notes = 'Notes must be less than 500 characters'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Validates location (3x2 track system)
 */
export function validateLocation(location: {
  track: number
  position: number
}): ValidationResult {
  const errors: Record<string, string> = {}

  if (!location?.track) {
    errors.track = 'Track is required'
  } else if (location.track < 1 || location.track > 3) {
    errors.track = 'Track must be between 1 and 3'
  }

  if (!location?.position) {
    errors.position = 'Position is required'
  } else if (location.position < 1 || location.position > 2) {
    errors.position = 'Position must be 1 or 2'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Helper function to check if inventory item has all required fields
 */
export function isInventoryItemComplete(item: NewInventoryItemInput | InventoryItem): boolean {
  return Boolean(
    item.name &&
    item.company &&
    item.volume &&
    item.quantity !== undefined &&
    item.category &&
    item.barcode &&
    item.qrCode
  )
}

/**
 * Generates location label from track and position
 * @param track - Track number (1, 2, or 3)
 * @param position - Position number (1 or 2)
 * @returns Label string in format "T1-P1"
 */
export function generateLocationLabel(track: number, position: number): string {
  return `T${track}-P${position}`
}

/**
 * Generates location description from track and position
 * @param track - Track number (1, 2, or 3)
 * @param position - Position number (1 or 2)
 * @returns Description string in format "Track 1, Position 1"
 */
export function generateLocationDescription(track: number, position: number): string {
  const trackNames = ['Top', 'Middle', 'Bottom']
  const positionNames = ['Left', 'Right']
  const trackName = trackNames[track - 1] || `${track}`
  const positionName = positionNames[position - 1] || `${position}`
  return `Track ${track} (${trackName}), Position ${position} (${positionName})`
}

/**
 * Validates a date string (ISO format: YYYY-MM-DD)
 * @param dateString - The date string to validate
 * @returns True if valid date, false otherwise
 */
function isValidDate(dateString: string): boolean {
  // Check ISO format (YYYY-MM-DD)
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) {
    return false
  }

  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Validates duplicate check - ensures name and company combination is unique
 * This should be called BEFORE attempting to add to Firestore
 * @param name - Item name to check
 * @param company - Company name to check
 * @returns Validation result
 */
export function validateDuplicateInput(name: string, company: string): ValidationResult {
  const errors: Record<string, string> = {}

  if (!name?.trim()) {
    errors.name = 'Name required for duplicate check'
  }

  if (!company?.trim()) {
    errors.company = 'Company required for duplicate check'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Sanitizes user input to prevent XSS attacks
 * Removes potentially dangerous characters
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/&/g, '&amp;')
    .slice(0, 500) // Limit length
}

/**
 * Formats validation errors for display
 * @param errors - Record of field errors
 * @returns Formatted error message string
 */
export function formatValidationErrors(errors: Record<string, string>): string {
  return Object.values(errors).join('\n')
}
