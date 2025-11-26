const CACHE_NAME = 'nutriguide-v2';
const urlsToCache = [
  '/',
  '/dashboard',
  '/profile',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Background sync for meal logging
self.addEventListener('sync', (event) => {
  if (event.tag === 'meal-log-sync') {
    event.waitUntil(syncMealLogs());
  }
});

// Push notifications for meal reminders
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Time for your next meal!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'log-meal',
        title: 'Log Meal',
        icon: '/icons/log-meal.png'
      },
      {
        action: 'snooze',
        title: 'Remind Later',
        icon: '/icons/snooze.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('NutriGuide Reminder', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'log-meal') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (event.action === 'snooze') {
    // Schedule another notification in 15 minutes
    setTimeout(() => {
      self.registration.showNotification('NutriGuide Reminder', {
        body: 'Don\'t forget to log your meal!',
        icon: '/icon-192.png'
      });
    }, 15 * 60 * 1000);
  } else {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

async function syncMealLogs() {
  try {
    // Get pending meal logs from IndexedDB
    const pendingLogs = await getPendingMealLogs();
    
    for (const log of pendingLogs) {
      try {
        await fetch('/api/nutrition/log-meal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(log)
        });
        
        // Remove from pending logs
        await removePendingMealLog(log.id);
      } catch (error) {
        console.error('Failed to sync meal log:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// IndexedDB helpers for offline storage
async function getPendingMealLogs() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NutriGuideDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['mealLogs'], 'readonly');
      const store = transaction.objectStore('mealLogs');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function removePendingMealLog(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NutriGuideDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['mealLogs'], 'readwrite');
      const store = transaction.objectStore('mealLogs');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => {
        resolve();
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}