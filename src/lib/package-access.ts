export interface PackageSubscriptionLike {
  status: string;
  package: { category: string };
}

export function isActiveSubscriptionStatus(status: string | null | undefined): boolean {
  return status?.trim().toUpperCase() === "ACTIVE";
}

export function hasActivePackageCategory(
  subscriptions: readonly PackageSubscriptionLike[] | null | undefined,
  category: string,
): boolean {
  return Boolean(subscriptions?.some(
    (subscription) => isActiveSubscriptionStatus(subscription.status) && subscription.package.category.toLowerCase() === category.toLowerCase(),
  ));
}

export function hasActiveCallsPackage(
  subscriptions: readonly PackageSubscriptionLike[] | null | undefined,
): boolean {
  return hasActivePackageCategory(subscriptions, "calls");
}

export function hasActiveBasicPackage(
  subscriptions: readonly PackageSubscriptionLike[] | null | undefined,
): boolean {
  return hasActivePackageCategory(subscriptions, "basic");
}

export function canJoinRegularGroup(
  subscriptions: readonly PackageSubscriptionLike[] | null | undefined,
): boolean {
  return hasActiveBasicPackage(subscriptions) && !hasActiveCallsPackage(subscriptions);
}
