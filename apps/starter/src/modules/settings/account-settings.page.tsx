import React from "react";
import { PersonalInfoSection } from "./components/personal-info-section";
import { PasswordSection } from "./components/password-section";
import { TwoFactorSection } from "./components/two-factor-section";
import { useSessionQuery } from "./api/settings.api";
import SettingSkeleton from "./components/setting-skeleton";

export function AccountSettingsPage() {
  const sessionQuery = useSessionQuery();

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Account Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal profile details, account security, and active
          sessions.
        </p>
      </div>

      {sessionQuery.isLoading ? (
        <SettingSkeleton />
      ) : (
        <div className="space-y-6">
          <PersonalInfoSection user={sessionQuery.data?.user} />
          <PasswordSection />
          <TwoFactorSection
            twoFactorEnabled={sessionQuery.data?.user.twoFactorEnabled ?? false}
          />
        </div>
      )}
    </div>
  );
}

export default AccountSettingsPage;
