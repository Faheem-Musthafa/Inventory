# Automatic Order Archive System

## Overview
This system automatically archives orders every day at **2:00 AM**, moving them from the active database to a calendar-organized archive. No data is deleted - everything is preserved for future reference and retrieval.

## How It Works

### 1. **Automatic Archiving (Daily at 2:00 AM)**
- System runs automatically at 2:00 AM every day
- Archives all orders from the previous day
- Moves orders to `archived_orders` collection
- Stores order items within each archived order
- Creates metadata summary in `archive_metadata` collection
- Removes archived orders from active `orders` and `order_items` collections

### 2. **Archive Structure**

#### Collections Created:
```
Firebase Firestore
├── archived_orders/          (All archived orders)
│   ├── {archiveId}
│   │   ├── original_order_id
│   │   ├── archived_date      (YYYY-MM-DD)
│   │   ├── archived_at        (ISO timestamp)
│   │   ├── order_items[]      (embedded items)
│   │   └── ... (all original order data)
│
└── archive_metadata/         (Daily summaries)
    ├── {metadataId}
    │   ├── archiveDate        (YYYY-MM-DD)
    │   ├── archivedAt         (ISO timestamp)
    │   ├── totalOrders
    │   ├── totalRevenue
    │   └── orderIds[]
```

### 3. **Archive Page Features**
- **Calendar Selection**: Pick any date with archived data
- **Summary Cards**: View total orders and revenue for selected date
- **Orders Table**: View all archived orders with full details
- **Invoice Viewer**: View and print original receipts
- **CSV Export**: Download archived data for accounting

## Usage

### For Users:
1. Navigate to **Archive** in the sidebar
2. Select a date from the calendar (highlighted dates have archives)
3. View orders and revenue for that date
4. Click eye icon to view invoice
5. Click "Export to CSV" to download data

### For Developers:

#### Manual Archive Trigger:
```typescript
import { archiveDailyOrders } from '@/lib/archiveSystem';

// Archive orders manually
await archiveDailyOrders();
```

#### Retrieve Archived Data:
```typescript
import { 
  getArchivedOrdersByDate,
  getArchivedOrdersByDateRange,
  getArchiveMetadata,
  getAvailableArchiveDates
} from '@/lib/archiveSystem';

// Get orders for specific date
const orders = await getArchivedOrdersByDate(new Date('2025-11-04'));

// Get orders for date range
const rangeOrders = await getArchivedOrdersByDateRange(
  new Date('2025-11-01'),
  new Date('2025-11-30')
);

// Get summary metadata
const metadata = await getArchiveMetadata(new Date('2025-11-04'));

// Get list of all archive dates
const availableDates = await getAvailableArchiveDates();
```

## Firestore Security Rules

The following rules are applied:

```javascript
// Archived orders - read-only after creation
match /archived_orders/{archiveId} {
  allow read: if true;
  allow create: if true;
  allow update, delete: if false;  // Prevent modification
}

// Archive metadata - read-only after creation
match /archive_metadata/{metadataId} {
  allow read: if true;
  allow create: if true;
  allow update, delete: if false;  // Prevent modification
}
```

## Benefits

### Business Benefits:
- ✅ **Clean Dashboard**: Active orders stay current and relevant
- ✅ **Complete History**: All data preserved indefinitely
- ✅ **Quick Reports**: Generate reports for any past date
- ✅ **Audit Trail**: Immutable archive records
- ✅ **Performance**: Faster queries on active orders

### Technical Benefits:
- ✅ **Automatic**: No manual intervention needed
- ✅ **Reliable**: Runs at 2:00 AM when traffic is lowest
- ✅ **Scalable**: Archived data organized by date
- ✅ **Searchable**: Calendar-based retrieval
- ✅ **Backed Up**: All data in Firestore with automatic backups

## Important Notes

### ⚠️ Archive Timing
- Archives run at **2:00 AM local time**
- Archives data from **yesterday** (previous day)
- Preserves all order details and items

### 🔒 Data Integrity
- Archived orders are **read-only**
- Cannot be modified or deleted after archiving
- Original order IDs preserved for reference
- All relationships maintained

### 📊 Reports & Analytics
- Reports show **active orders only**
- Use Archive page to view historical data
- CSV export available for both active and archived data

## Troubleshooting

### Archive Not Running?
- Check browser console for errors
- Ensure user is logged in (archive scheduler starts after login)
- Verify Firestore security rules are deployed

### Can't See Archived Orders?
- Check selected date in calendar
- Only dates with archives are highlighted
- Use "Available Archives" list to see all dates

### Need to Restore Archived Order?
- Archives are read-only by design
- To restore: manually copy data back to `orders` collection
- Not recommended - use archive viewer instead

## Future Enhancements

Potential features to add:
- [ ] Search within archived orders
- [ ] Bulk export by date range
- [ ] Archive analytics dashboard
- [ ] Custom archive retention policies
- [ ] Archive compression for older data
- [ ] Email notifications after archive completion

## Support

For issues or questions:
- Check Firebase console for archive collections
- View browser console for archive logs
- Contact development team for assistance
