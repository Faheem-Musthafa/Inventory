import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { format, startOfDay, endOfDay } from 'date-fns';

interface ArchiveMetadata {
  archiveDate: string; // Format: YYYY-MM-DD
  archivedAt: string;
  totalOrders: number;
  totalRevenue: number;
  orderIds: string[];
}

/**
 * Archives all orders and order items from the previous day
 * Called automatically at 2:00 AM daily
 */
export async function archiveDailyOrders(): Promise<void> {
  try {
    console.log('Starting daily archive process...');
    
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const archiveDateStr = format(yesterday, 'yyyy-MM-dd');
    
    const startDate = startOfDay(yesterday);
    const endDate = endOfDay(yesterday);
    
    // Fetch all orders from yesterday
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const ordersToArchive = ordersSnapshot.docs.filter(doc => {
      const orderData = doc.data();
      const orderDate = new Date(orderData.created_at);
      return orderDate >= startDate && orderDate <= endDate;
    });
    
    if (ordersToArchive.length === 0) {
      console.log('No orders to archive for', archiveDateStr);
      return;
    }
    
    console.log(`Found ${ordersToArchive.length} orders to archive for ${archiveDateStr}`);
    
    // Calculate total revenue
    let totalRevenue = 0;
    const orderIds: string[] = [];
    
    // Archive each order
    for (const orderDoc of ordersToArchive) {
      const orderId = orderDoc.id;
      const orderData = orderDoc.data();
      
      orderIds.push(orderId);
      totalRevenue += Number(orderData.total || 0);
      
      // Fetch order items for this order
      const itemsSnapshot = await getDocs(collection(db, 'order_items'));
      const orderItems = itemsSnapshot.docs
        .filter(itemDoc => itemDoc.data().order_id === orderId)
        .map(itemDoc => ({
          id: itemDoc.id,
          ...itemDoc.data()
        }));
      
      // Create archived order document with items included
      await addDoc(collection(db, 'archived_orders'), {
        ...orderData,
        original_order_id: orderId,
        archived_date: archiveDateStr,
        archived_at: new Date().toISOString(),
        order_items: orderItems
      });
      
      // Delete order items
      for (const item of orderItems) {
        await deleteDoc(doc(db, 'order_items', item.id));
      }
      
      // Delete original order
      await deleteDoc(doc(db, 'orders', orderId));
    }
    
    // Create archive metadata
    const metadata: ArchiveMetadata = {
      archiveDate: archiveDateStr,
      archivedAt: new Date().toISOString(),
      totalOrders: ordersToArchive.length,
      totalRevenue,
      orderIds
    };
    
    await addDoc(collection(db, 'archive_metadata'), metadata);
    
    console.log(`Successfully archived ${ordersToArchive.length} orders for ${archiveDateStr}`);
    console.log(`Total revenue archived: ${totalRevenue}`);
    
  } catch (error) {
    console.error('Error during archive process:', error);
    throw error;
  }
}

/**
 * Retrieve archived orders for a specific date
 */
export async function getArchivedOrdersByDate(date: Date) {
  try {
    const dateStr = format(date, 'yyyy-MM-dd');
    const archivedSnapshot = await getDocs(collection(db, 'archived_orders'));
    
    const orders = archivedSnapshot.docs
      .filter(doc => doc.data().archived_date === dateStr)
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    
    return orders;
  } catch (error) {
    console.error('Error fetching archived orders:', error);
    return [];
  }
}

/**
 * Retrieve archived orders for a date range
 */
export async function getArchivedOrdersByDateRange(startDate: Date, endDate: Date) {
  try {
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');
    
    const archivedSnapshot = await getDocs(collection(db, 'archived_orders'));
    
    const orders = archivedSnapshot.docs
      .filter(doc => {
        const archiveDate = doc.data().archived_date;
        return archiveDate >= startStr && archiveDate <= endStr;
      })
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    
    return orders;
  } catch (error) {
    console.error('Error fetching archived orders:', error);
    return [];
  }
}

/**
 * Get archive metadata (summary) for a specific date
 */
export async function getArchiveMetadata(date: Date) {
  try {
    const dateStr = format(date, 'yyyy-MM-dd');
    const metadataSnapshot = await getDocs(collection(db, 'archive_metadata'));
    
    const metadata = metadataSnapshot.docs
      .filter(doc => doc.data().archiveDate === dateStr)
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))[0];
    
    return metadata || null;
  } catch (error) {
    console.error('Error fetching archive metadata:', error);
    return null;
  }
}

/**
 * Get all available archive dates
 */
export async function getAvailableArchiveDates(): Promise<string[]> {
  try {
    const metadataSnapshot = await getDocs(collection(db, 'archive_metadata'));
    const dates = metadataSnapshot.docs
      .map(doc => doc.data().archiveDate)
      .sort((a, b) => b.localeCompare(a)); // Most recent first
    
    return dates;
  } catch (error) {
    console.error('Error fetching archive dates:', error);
    return [];
  }
}

/**
 * Schedule the archive to run at 2:00 AM daily
 */
export function scheduleArchive(): void {
  const checkTime = () => {
    const now = new Date();
    const targetHour = 2; // 2:00 AM
    const targetMinute = 0;
    
    // Calculate milliseconds until 2:00 AM
    const nextRun = new Date();
    nextRun.setHours(targetHour, targetMinute, 0, 0);
    
    // If 2:00 AM has passed today, schedule for tomorrow
    if (now >= nextRun) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    const timeUntilRun = nextRun.getTime() - now.getTime();
    
    console.log(`Next archive scheduled for: ${nextRun.toLocaleString()}`);
    
    setTimeout(async () => {
      console.log('Running scheduled archive at 2:00 AM...');
      await archiveDailyOrders();
      
      // Schedule next run
      checkTime();
    }, timeUntilRun);
  };
  
  checkTime();
}
