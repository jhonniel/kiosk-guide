import { getSetting } from "@/features/settings/resolve-settings";

export const DEFAULT_LOGO_URL = "/images/branding/logo.png";
export const DEFAULT_FOOTER_IMAGE_URL = "/images/camiguin-landscape.svg";

export function resolveBrandingLogoUrl(settings: Record<string, string>) {
  return getSetting(settings, "branding_logo_url", DEFAULT_LOGO_URL) || DEFAULT_LOGO_URL;
}

export function resolveBrandingFooterImageUrl(settings: Record<string, string>) {
  return (
    getSetting(settings, "branding_footer_image_url", DEFAULT_FOOTER_IMAGE_URL) ||
    DEFAULT_FOOTER_IMAGE_URL
  );
}
