import webpush from "../config/webPush";
import PushSubscription from "../models/PushSubscription";

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  const subs = await PushSubscription.find({ user: userId as any });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          JSON.stringify(payload)
        );
      } catch (err: any) {
        // 410/404 = subscription expired/invalid, clean it up
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    })
  );
}