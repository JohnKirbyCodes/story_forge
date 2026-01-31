"use client";

import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export function DashboardWrapper({ children }: DashboardWrapperProps) {
  return (
    <OnboardingProvider>
      {children}
      <OnboardingModal />
    </OnboardingProvider>
  );
}
