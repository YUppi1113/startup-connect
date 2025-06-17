/* global supabase */
export async function registerPush(userId) {
  if (!('serviceWorker' in navigator)) return;
  if (!window.__ENV__ || !window.__ENV__.PUSH_VAPID_PUBLIC_KEY) return;
  try {
    const reg = await navigator.serviceWorker.register('sw.js');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: window.__ENV__.PUSH_VAPID_PUBLIC_KEY,
    });
    const p256dh = btoa(
      String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))
    );
    const auth = btoa(
      String.fromCharCode(...new Uint8Array(sub.getKey('auth')))
    );
    await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh,
      auth,
    });
  } catch (e) {
    console.warn('push registration failed', e);
  }
}
