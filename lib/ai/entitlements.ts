import type { UserType } from "@/app/(auth)/auth";

type Entitlements = {
  maxMessagesPerDay: number;
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: Infinity,
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: Infinity,
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
