import { apiFetch } from "./client";
export interface RecoveryOptions {
  action: "otp" | "contact_admin" | "unavailable";
  message: string;
  channels: {
    channel: "email" | "sms";
    destination: string;
    available: boolean;
  }[];
}
export interface IssuedOtp {
  challenge_id: string;
  destination: string;
  expires_in: number;
}
export const recoveryOptions = (email: string) =>
  apiFetch<RecoveryOptions>("/auth/password-recovery/options", {
    method: "POST",
    auth: false,
    toastOnError: false,
    body: JSON.stringify({ email }),
  });
export const requestRecovery = (email: string, channel: "email" | "sms") =>
  apiFetch<IssuedOtp>("/auth/password-recovery/request", {
    method: "POST",
    auth: false,
    toastOnError: false,
    body: JSON.stringify({ email, channel }),
  });
export const resetPassword = (
  challenge_id: string,
  code: string,
  new_password: string,
) =>
  apiFetch<void>("/auth/password-recovery/reset", {
    method: "POST",
    auth: false,
    toastOnError: false,
    body: JSON.stringify({ challenge_id, code, new_password }),
  });
export const getRecoveryPhone = () =>
  apiFetch<{ phone: string | null; verified: boolean; sms_available: boolean }>(
    "/auth/recovery-phone",
  );
export const requestPhoneVerification = (
  phone: string,
  current_password: string,
) =>
  apiFetch<IssuedOtp>("/auth/recovery-phone/request", {
    method: "POST",
    toastOnError: false,
    body: JSON.stringify({ phone, current_password }),
  });
export const verifyRecoveryPhone = (challenge_id: string, code: string) =>
  apiFetch<void>("/auth/recovery-phone/verify", {
    method: "POST",
    toastOnError: false,
    body: JSON.stringify({ challenge_id, code }),
  });
