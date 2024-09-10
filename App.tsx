import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BackgroundFetch from 'react-native-background-fetch';
import BackgroundGeolocation, {
  Subscription,
} from 'react-native-background-geolocation';

export default function App() {
  const [count, setCount] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const [enabled, setEnabled] = useState(false);

  const bgGeoEventSubscriptions: Subscription[] = [];

  useEffect(() => {
    initBackgroundFetch(); // <-- optional
    initBackgroundGeolocation();
    return () => {
      // Remove BackgroundGeolocation event-subscribers when the View is removed or refreshed
      // during development live-reload.  Without this, event-listeners will accumulate with
      // each refresh during live-reload.
      unsubscribe();
    };
  }, []);

  /// Helper method to push a BackgroundGeolocation subscription onto our list of subscribers.
  const subscribe = (subscription: Subscription) => {
    bgGeoEventSubscriptions.push(subscription);
  };

  /// Helper method to unsubscribe from all registered BackgroundGeolocation event-listeners.
  const unsubscribe = () => {
    bgGeoEventSubscriptions.forEach((subscription: Subscription) =>
      subscription.remove()
    );
  };

  const initBackgroundFetch = async () => {
    await BackgroundFetch.configure(
      {
        minimumFetchInterval: 15,
        stopOnTerminate: true,
      },
      (taskId) => {
        console.log('[BackgroundFetch] ', taskId);
        BackgroundFetch.finish(taskId);
      },
      (taskId) => {
        console.log('[BackgroundFetch] TIMEOUT: ', taskId);
        BackgroundFetch.finish(taskId);
      }
    );
  };

  const addEvent = (name: string, params: any) => {
    let timestamp = new Date();
    const event = {
      expanded: false,
      timestamp: `${timestamp.getMonth()}-${timestamp.getDate()} ${timestamp.getHours()}:${timestamp.getMinutes()}:${timestamp.getSeconds()}`,
      name: name,
      params: JSON.stringify(params, null, 2),
    };
    setEvents((previous) => [...previous, event]);
  };

  const initBackgroundGeolocation = async () => {
    // Listen to events.  Each BackgroundGeolocation event-listener returns a subscription instance
    // with a .remove() method for removing the event-listener.  You should collect a list of these
    // subcribers and .remove() them all when the View is destroyed or refreshed during dev live-reload.
    subscribe(
      BackgroundGeolocation.onProviderChange((event) => {
        console.log('[onProviderChange]', event);
        addEvent('onProviderChange', event);
      })
    );

    subscribe(
      BackgroundGeolocation.onLocation(
        (location) => {
          console.log('[onLocation]', location);
          addEvent('onLocation', location);
          setCount((prev) => prev++);
        },
        (error) => {
          console.warn('[onLocation] ERROR: ', error);
        }
      )
    );

    subscribe(
      BackgroundGeolocation.onMotionChange((location) => {
        console.log('[onMotionChange]', location);
        addEvent('onMotionChange', location);
      })
    );

    subscribe(
      BackgroundGeolocation.onGeofence((event) => {
        console.log('[onGeofence]', event);
        addEvent('onGeofence', event);
      })
    );

    subscribe(
      BackgroundGeolocation.onConnectivityChange((event) => {
        console.log('[onConnectivityChange]', event);
        addEvent('onConnectivityChange', event);
      })
    );

    subscribe(
      BackgroundGeolocation.onEnabledChange((enabled) => {
        console.log('[onEnabledChange]', enabled);
        addEvent('onEnabledChange', { enabled: enabled });
      })
    );

    subscribe(
      BackgroundGeolocation.onHttp((event) => {
        console.log('[onHttp]', event);
        addEvent('onHttp', event);
      })
    );

    subscribe(
      BackgroundGeolocation.onActivityChange((event) => {
        console.log('[onActivityChange]', event);
        addEvent('onActivityChange', event);
      })
    );

    subscribe(
      BackgroundGeolocation.onPowerSaveChange((enabled) => {
        console.log('[onPowerSaveChange]', enabled);
        addEvent('onPowerSaveChange', { isPowerSaveMode: enabled });
      })
    );

    /// Get an authorization token from demo server at tracker.transistorsoft.com
    const token =
      await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(
        'my_org',
        'flavio',
        'https://tracker.transistorsoft.com'
      );

    /// Configure the plugin.
    const state = await BackgroundGeolocation.ready({
      debug: true,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      transistorAuthorizationToken: token,
      distanceFilter: 10,
      stopOnTerminate: false,
      startOnBoot: true,
      autoSync: true,
      maxDaysToPersist: 14,
      // Application
      enableHeadless: true,
    });

    /// Add the current state as first item in list.
    addEvent('Current state', state);

    /// Set the default <Switch> state (disabled)
    setEnabled(state.enabled);
  };

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <Text>{count}</Text>
      <StatusBar style='auto' />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
