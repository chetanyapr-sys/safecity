function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(apiBaseUrl: string, token: string) {
  console.log("[subscribeToPush] started");

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("[subscribeToPush] Service Worker or PushManager not supported");
    return null;
  }

  console.log("[subscribeToPush] requesting permission...");
  const permission = await Notification.requestPermission();
  console.log("[subscribeToPush] permission result:", permission);

  if (permission !== "granted") {
    console.log("[subscribeToPush] permission not granted, stopping");
    return null;
  }

  console.log("[subscribeToPush] waiting for service worker to be ready...");
  const registration = await navigator.serviceWorker.ready;
  console.log("[subscribeToPush] service worker ready:", registration);

  console.log("[subscribeToPush] checking existing subscription...");
  const existing = await registration.pushManager.getSubscription();
  console.log("[subscribeToPush] existing subscription:", existing);

  let subscription = existing;

  if (!subscription) {
    console.log("[subscribeToPush] VAPID key from env:", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
    console.log("[subscribeToPush] no existing subscription, creating new one...");
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string
      ),
    });
    console.log("[subscribeToPush] new subscription created:", subscription);
  }

  console.log("[subscribeToPush] sending to backend:", `${apiBaseUrl}/api/push/subscribe`);
  const res = await fetch(`${apiBaseUrl}/api/push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(subscription.toJSON()),
  });

  console.log("[subscribeToPush] backend response status:", res.status);
  const data = await res.json();
  console.log("[subscribeToPush] backend response data:", data);

  return subscription;
}