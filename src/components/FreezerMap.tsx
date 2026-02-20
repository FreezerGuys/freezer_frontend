import { useMemo, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Tooltip,
  Typography,
  Chip,
  Stack,
} from '@mui/material'
import { InventoryItem } from '@/types/inventory'

interface LocationCount {
  track: number
  position: number
  label: string
  count: number
  items: InventoryItem[]
  activeItems: InventoryItem[]
  expiredItems: InventoryItem[]
}

interface FreezerMapProps {
  items: InventoryItem[]
  onLocationClick?: (track: number, position: number) => void
}

/**
 * FreezerMap Component
 * Displays a 3x2 grid visualization of the freezer storage locations
 * Shows item counts and categories at each location
 */
export function FreezerMap({ items, onLocationClick }: FreezerMapProps) {
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null)

  // Calculate item counts by location
  const locationData = useMemo(() => {
    const locations: Record<string, LocationCount> = {}

    // Initialize all 6 locations
    for (let track = 1; track <= 3; track++) {
      for (let position = 1; position <= 2; position++) {
        const label = `T${track}-P${position}`
        locations[label] = {
          track,
          position,
          label,
          count: 0,
          items: [],
          activeItems: [],
          expiredItems: [],
        }
      }
    }

    // Count items at each location
    items.forEach((item) => {
      if (item.location?.label && locations[item.location.label]) {
        const loc = locations[item.location.label]
        loc.items.push(item)
        loc.count++

        // Categorize items
        if (item.status === 'expired') {
          loc.expiredItems.push(item)
        } else if (item.status === 'active') {
          loc.activeItems.push(item)
        }
      }
    })

    return Object.values(locations).sort((a, b) => {
      if (a.track !== b.track) return a.track - b.track
      return a.position - b.position
    })
  }, [items])

  // Get color based on item count
  const getLocationColor = (location: LocationCount): string => {
    if (location.count === 0) return '#f3f4f6' // Gray for empty
    if (location.expiredItems.length > 0) return '#fee2e2' // Red for expired
    if (location.count >= 5) return '#dcfce7' // Green for well-stocked
    if (location.count >= 2) return '#e0e7ff' // Blue for moderate
    return '#fef3c7' // Yellow for low stock
  }

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
          Freezer Location Map (3×2 Grid)
        </Typography>

        {/* Grid Layout */}
        <Grid
          container
          spacing={2}
          sx={{
            mb: 3,
          }}
        >
          {locationData.map((location) => (
            <Grid item xs={6} key={location.label}>
              <Tooltip
                title={
                  location.count === 0 ? (
                    'Empty location'
                  ) : (
                    <Stack spacing={1}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {location.label} - {location.count} items
                      </Typography>
                      {location.activeItems.length > 0 && (
                        <Typography variant="caption">
                          Active: {location.activeItems.length}
                        </Typography>
                      )}
                      {location.expiredItems.length > 0 && (
                        <Typography variant="caption" sx={{ color: '#dc2626' }}>
                          Expired: {location.expiredItems.length}
                        </Typography>
                      )}
                      {location.items.slice(0, 3).map((item) => (
                        <Typography key={item.id} variant="caption">
                          • {item.name}
                        </Typography>
                      ))}
                      {location.items.length > 3 && (
                        <Typography variant="caption">
                          ... and {location.items.length - 3} more
                        </Typography>
                      )}
                    </Stack>
                  )
                }
                arrow
                placement="top"
              >
                <Paper
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    bgcolor: getLocationColor(location),
                    border: '2px solid',
                    borderColor:
                      hoveredLocation === location.label ? 'primary.main' : 'transparent',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: 3,
                      borderColor: 'primary.main',
                      bgcolor:
                        hoveredLocation === location.label
                          ? getLocationColor(location)
                          : 'action.hover',
                    },
                    minHeight: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 1,
                  }}
                  onMouseEnter={() => setHoveredLocation(location.label)}
                  onMouseLeave={() => setHoveredLocation(null)}
                  onClick={() => onLocationClick?.(location.track, location.position)}
                >
                  {/* Location Label */}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.875rem',
                    }}
                  >
                    {location.label}
                  </Typography>

                  {/* Item Count */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: location.count === 0 ? '#9ca3af' : 'inherit',
                      }}
                    >
                      {location.count}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: location.count === 0 ? '#9ca3af' : 'inherit',
                      }}
                    >
                      items
                    </Typography>
                  </Box>

                  {/* Status Badges */}
                  {location.expiredItems.length > 0 && (
                    <Chip
                      label={`${location.expiredItems.length} expired`}
                      size="small"
                      variant="filled"
                      sx={{
                        bgcolor: '#fecaca',
                        color: '#991b1b',
                        fontWeight: 600,
                      }}
                    />
                  )}

                  {/* Track and Position Info */}
                  <Typography variant="caption" sx={{ textAlign: 'center', mt: 1 }}>
                    Track {location.track} • Pos {location.position}
                  </Typography>
                </Paper>
              </Tooltip>
            </Grid>
          ))}
        </Grid>

        {/* Legend */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e5e7eb' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Location Status Legend
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6} sm={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 20, height: 20, bgcolor: '#f3f4f6', border: '1px solid #d1d5db' }} />
                <Typography variant="caption">Empty</Typography>
              </Stack>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 20, height: 20, bgcolor: '#fef3c7', border: '1px solid #d1d5db' }} />
                <Typography variant="caption">Low (1)</Typography>
              </Stack>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 20, height: 20, bgcolor: '#e0e7ff', border: '1px solid #d1d5db' }} />
                <Typography variant="caption">Moderate (2-4)</Typography>
              </Stack>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 20, height: 20, bgcolor: '#dcfce7', border: '1px solid #d1d5db' }} />
                <Typography variant="caption">Full (5+)</Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 20, height: 20, bgcolor: '#fee2e2', border: '1px solid #d1d5db' }} />
                <Typography variant="caption">Has Expired</Typography>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Summary Stats */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e5e7eb' }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {items.filter(i => i.status === 'active').length}
                </Typography>
                <Typography variant="caption" display="block" color="textSecondary">
                  Active Items
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                  {items.filter(i => i.status === 'expired').length}
                </Typography>
                <Typography variant="caption" display="block" color="textSecondary">
                  Expired Items
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main' }}>
                  {locationData.filter(l => l.count === 0).length}
                </Typography>
                <Typography variant="caption" display="block" color="textSecondary">
                  Empty Slots
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {locationData.filter(l => l.count > 0).length}/6
                </Typography>
                <Typography variant="caption" display="block" color="textSecondary">
                  Used Locations
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  )
}
