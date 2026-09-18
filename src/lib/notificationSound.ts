import { Howl } from "howler";

export type NotificationSoundVariant = "agent" | "admin_deposit" | "admin_withdraw" | "master";

const soundByVariant: Partial<Record<NotificationSoundVariant, Howl>> = {};

function getOrCreateHowl(variant: NotificationSoundVariant): Howl {
  let howl = soundByVariant[variant];
  if (!howl) {
    howl = new Howl({
      src: ["/sounds/noti-sound.mp3"],
      loop: true,
      volume: 1,
    });
    soundByVariant[variant] = howl;
  }
  return howl;
}

export function playNotificationSound(variant: NotificationSoundVariant) {
  const howl = getOrCreateHowl(variant);
  if (!howl.playing()) {
    howl.play();
  }
}

export function stopNotificationSound(variant: NotificationSoundVariant) {
  const howl = soundByVariant[variant];
  if (howl && howl.playing()) {
    howl.stop();
  }
}
