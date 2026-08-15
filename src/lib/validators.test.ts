import { describe, expect, it } from 'vitest'
import { validateContactMessage } from './validators'
import { NewContactMessageInput } from '@/types/contact'

const validInput: NewContactMessageInput = {
  name: 'Jordan Lee',
  email: 'jordan@example.com',
  message: 'Hi, could you tell me more about setting this up for our lab?'
}

describe('validateContactMessage', () => {
  it('accepts a well-formed submission', () => {
    const result = validateContactMessage(validInput)
    expect(result).toEqual({ isValid: true, errors: {} })
  })

  it('trims whitespace before checking length', () => {
    const result = validateContactMessage({ ...validInput, name: '  Jo  ' })
    expect(result.isValid).toBe(true)
  })

  it.each([
    ['', 'Name is required'],
    ['  ', 'Name is required'],
    ['J', 'Name must be at least 2 characters'],
    ['x'.repeat(101), 'Name must be less than 100 characters']
  ])('rejects an invalid name %j', (name, expectedError) => {
    const result = validateContactMessage({ ...validInput, name })
    expect(result.isValid).toBe(false)
    expect(result.errors.name).toBe(expectedError)
  })

  it.each([
    ['', 'Email is required'],
    ['not-an-email', 'Enter a valid email address'],
    ['missing-domain@', 'Enter a valid email address'],
    ['@missing-local.com', 'Enter a valid email address'],
    [`${'a'.repeat(250)}@example.com`, 'Email must be less than 254 characters']
  ])('rejects an invalid email %j', (email, expectedError) => {
    const result = validateContactMessage({ ...validInput, email })
    expect(result.isValid).toBe(false)
    expect(result.errors.email).toBe(expectedError)
  })

  it.each([
    ['', 'Message is required'],
    ['too short', 'Message must be at least 10 characters'],
    ['x'.repeat(2001), 'Message must be less than 2000 characters']
  ])('rejects an invalid message %j', (message, expectedError) => {
    const result = validateContactMessage({ ...validInput, message })
    expect(result.isValid).toBe(false)
    expect(result.errors.message).toBe(expectedError)
  })

  it('reports every invalid field at once', () => {
    const result = validateContactMessage({ name: '', email: 'bad', message: 'short' })
    expect(result.isValid).toBe(false)
    expect(Object.keys(result.errors).sort()).toEqual(['email', 'message', 'name'])
  })
})
