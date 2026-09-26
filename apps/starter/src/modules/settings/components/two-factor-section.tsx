import React, { useState } from "react";
import QRCode from "react-qr-code";
import {
  AlertTriangleIcon,
  Button,
  CopyIcon,
  DownloadIcon,
  Field,
  FieldLabel,
  Input,
  InputPassword,
  KeyIcon,
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  QrCodeIcon,
  ShieldCheckIcon,
  Switch,
  Tag,
  copyToClipboard,
  toast,
} from "@z3/admin-core";
import { getErrorMessage } from "@/libs/api-client";
import {
  useDisableTwoFactorMutation,
  useEnableTwoFactorMutation,
  useVerifyTotpMutation,
} from "../api/settings.api";

interface TwoFactorSectionProps {
  twoFactorEnabled?: boolean;
}

export function TwoFactorSection({ twoFactorEnabled }: TwoFactorSectionProps) {
  const is2FAActive = Boolean(twoFactorEnabled);

  // Mutations
  const enable2FAMutation = useEnableTwoFactorMutation();
  const verifyTotpMutation = useVerifyTotpMutation();
  const disable2FAMutation = useDisableTwoFactorMutation();

  // Setup Modal State
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [setupPassword, setSetupPassword] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  // Recovery Codes Modal State
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Disable Modal State
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");

  const handleStartSetup = () => {
    setSetupStep(1);
    setSetupPassword("");
    setVerificationCode("");
    setTotpURI("");
    setSecretKey("");
    setIsSetupOpen(true);
  };

  const handlePasswordSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!setupPassword) {
      toast.error("Please enter your current password");
      return;
    }

    try {
      const data = await enable2FAMutation.mutateAsync({
        password: setupPassword,
      });

      setTotpURI(data.totpURI);
      setBackupCodes(data.backupCodes);

      // Extract secret from totpURI (otpauth://totp/...?secret=XXXXX)
      try {
        const url = new URL(data.totpURI);
        const secret = url.searchParams.get("secret");
        setSecretKey(secret || "");
      } catch {
        const match = data.totpURI.match(/secret=([^&]+)/);
        setSecretKey(match ? match[1] : "");
      }

      setSetupStep(2);
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "Failed to initiate 2FA setup. Please check your password.",
        ),
      );
    }
  };

  const handleVerifyCodeSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (verificationCode.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit authentication code.");
      return;
    }

    try {
      await verifyTotpMutation.mutateAsync({
        code: verificationCode.trim(),
      });

      toast.success("Two-Factor Authentication is now active!");
      setIsSetupOpen(false);
      setVerificationCode("");
      setSetupPassword("");

      // Prompt user to save recovery codes if available
      if (backupCodes.length > 0) {
        setIsBackupOpen(true);
      }
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "Invalid or expired verification code. Please try again.",
        ),
      );
    }
  };

  const handleDisableSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!disablePassword) {
      toast.error("Please enter your password to disable 2FA.");
      return;
    }

    try {
      await disable2FAMutation.mutateAsync({
        password: disablePassword,
      });

      toast.success("Two-Factor Authentication has been disabled.");
      setIsDisableModalOpen(false);
      setDisablePassword("");
      setBackupCodes([]);
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "Failed to disable 2FA. Please verify your password.",
        ),
      );
    }
  };

  const handleCopySecret = async () => {
    if (!secretKey) return;
    await copyToClipboard(secretKey);
    toast.success("Secret key copied to clipboard");
  };

  const handleCopyBackupCodes = async () => {
    if (backupCodes.length === 0) return;
    await copyToClipboard(backupCodes.join("\n"));
    toast.success("Backup recovery codes copied to clipboard");
  };

  const handleDownloadBackupCodes = () => {
    if (backupCodes.length === 0) return;
    const textContent = `Admin Template - 2FA Recovery Codes\nGenerated: ${new Date().toISOString()}\n\n${backupCodes.join("\n")}\n\nKeep these codes in a safe place. Each code can only be used once.`;
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "2fa-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Recovery codes downloaded");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-foreground">
              Two-Factor Authentication (2FA)
            </h2>
            {is2FAActive ? (
              <Tag color="emerald">Enabled</Tag>
            ) : (
              <Tag color="slate">Disabled</Tag>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Add an extra layer of security to your account using an
            authenticator app
          </p>
        </div>

        <div className="flex items-center gap-2">
          {is2FAActive ? (
            <>
              {backupCodes.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBackupOpen(true)}
                >
                  View Recovery Codes
                </Button>
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setIsDisableModalOpen(true)}
              >
                Disable 2FA
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" onClick={handleStartSetup}>
              Enable 2FA
            </Button>
          )}
        </div>
      </div>

      {/* Setup 2FA Modal */}
      <Modal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        size="xl"
      >
        <ModalHeader>
          <div className="flex items-center gap-2">
            <div>
              <ModalTitle>Set Up Two-Factor Authentication</ModalTitle>
              <ModalDescription>
                {setupStep === 1
                  ? "Enter your password to begin authenticator setup."
                  : "Scan the QR code with your authenticator app and enter the code."}
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>

        {setupStep === 1 ? (
          <form onSubmit={handlePasswordSubmit}>
            <ModalBody className="space-y-4">
              <Field>
                <FieldLabel htmlFor="setup-password" required>
                  Current Password
                </FieldLabel>
                <InputPassword
                  id="setup-password"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="Enter your current password"
                  disabled={enable2FAMutation.isPending}
                  required
                />
              </Field>
            </ModalBody>

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSetupOpen(false)}
                disabled={enable2FAMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={enable2FAMutation.isPending || !setupPassword}
              >
                {enable2FAMutation.isPending ? "Generating..." : "Next"}
              </Button>
            </ModalFooter>
          </form>
        ) : (
          <form onSubmit={handleVerifyCodeSubmit}>
            <ModalBody className="space-y-5">
              {/* Step 1: Scan QR */}
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Step 1: Scan QR Code
                </span>
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 my-4 rounded-xl border border-border bg-muted/10 min-w-0 max-w-full">
                  {/* Live SVG QR Code */}
                  <div className="size-36 p-2.5 rounded-xl bg-white border border-border flex items-center justify-center shrink-0 shadow-sm">
                    {totpURI ? (
                      <QRCode
                        value={totpURI}
                        size={128}
                        style={{
                          height: "auto",
                          maxWidth: "100%",
                          width: "100%",
                        }}
                        viewBox="0 0 128 128"
                      />
                    ) : (
                      <div className="size-full bg-muted/30 animate-pulse rounded" />
                    )}
                  </div>

                  <div className="space-y-2.5 text-center sm:text-left min-w-0 w-full">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Scan this QR code with Google Authenticator, 1Password, or
                      any standard TOTP app.
                    </p>
                    {secretKey && (
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <span className="text-xs text-foreground">
                          Manual Secret Key:
                        </span>
                        <div className="flex items-center border rounded-md gap-2 min-w-0 max-w-full py-2 px-3">
                          <code className="rounded-lg font-mono text-[11px] text-foreground font-semibold break-all select-all flex-1 min-w-0 leading-relaxed">
                            {secretKey}
                          </code>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCopySecret}
                            className="shrink-0 gap-1 text-xs h-fit p-1"
                          >
                            <CopyIcon className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Verification Code */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Step 2: Enter 6-Digit Code
                </span>
                <Field>
                  <FieldLabel htmlFor="totp-code" required>
                    Authentication Code
                  </FieldLabel>
                  <Input
                    id="totp-code"
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    className="font-mono text-center tracking-widest text-base"
                    disabled={verifyTotpMutation.isPending}
                    required
                  />
                </Field>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSetupStep(1)}
                disabled={verifyTotpMutation.isPending}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={
                  verifyTotpMutation.isPending || verificationCode.length !== 6
                }
              >
                {verifyTotpMutation.isPending
                  ? "Verifying..."
                  : "Verify & Enable"}
              </Button>
            </ModalFooter>
          </form>
        )}
      </Modal>

      {/* Recovery Codes Modal */}
      <Modal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        size="md"
      >
        <ModalHeader>
          <div className="flex items-center gap-2">
            <div>
              <ModalTitle>2FA Recovery Backup Codes</ModalTitle>
              <ModalDescription>
                Store these single-use codes safely in case you lose access to
                your device.
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-4 rounded-xl border border-border bg-muted/15 font-mono text-center text-sm font-semibold tracking-wider">
            {backupCodes.map((code) => (
              <div
                key={code}
                className="py-1.5 px-2 rounded bg-card border border-border/50 text-foreground"
              >
                {code}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyBackupCodes}
              className="gap-1.5  py-2"
            >
              <CopyIcon className="size-3.5" />
              Copy Codes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadBackupCodes}
              className="gap-1.5 py-2"
            >
              <DownloadIcon className="size-3.5" />
              Download .txt
            </Button>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" onClick={() => setIsBackupOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Disable 2FA Password Confirm Modal */}
      <Modal
        isOpen={isDisableModalOpen}
        onClose={() => setIsDisableModalOpen(false)}
        size="md"
      >
        <ModalHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangleIcon className="size-5" />
            </div>
            <div>
              <ModalTitle>Disable Two-Factor Authentication</ModalTitle>
              <ModalDescription>
                Turning off 2FA makes your account significantly less secure.
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <form onSubmit={handleDisableSubmit}>
          <ModalBody className="space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Please confirm your account password to turn off Two-Factor
              Authentication.
            </p>

            <Field>
              <FieldLabel htmlFor="disable-password" required>
                Current Password
              </FieldLabel>
              <InputPassword
                id="disable-password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter current password to confirm"
                disabled={disable2FAMutation.isPending}
                required
              />
            </Field>
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDisableModalOpen(false)}
              disabled={disable2FAMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={disable2FAMutation.isPending || !disablePassword}
            >
              {disable2FAMutation.isPending
                ? "Disabling..."
                : "Confirm & Disable"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}

export default TwoFactorSection;
