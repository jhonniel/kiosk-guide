import { getSetting } from "@/features/settings/settings-helpers";

export const DEFAULT_LOGO_URL = "/images/branding/logo.png";
export const DEFAULT_CARING_CAMIGUIN_LOGO_URL = "/images/branding/caring-camiguin.png?v=2";
export const DEFAULT_FOOTER_IMAGE_URL = "/images/camiguin-landscape.svg";

export function resolveBrandingLogoUrl(settings: Record<string, string>) {
  return getSetting(settings, "branding_logo_url", DEFAULT_LOGO_URL) || DEFAULT_LOGO_URL;
}

export function resolveBrandingCaringLogoUrl(settings: Record<string, string>) {
  return (
    getSetting(settings, "branding_caring_logo_url", DEFAULT_CARING_CAMIGUIN_LOGO_URL) ||
    DEFAULT_CARING_CAMIGUIN_LOGO_URL
  );
}

export function resolveBrandingFooterImageUrl(settings: Record<string, string>) {
  return (
    getSetting(settings, "branding_footer_image_url", DEFAULT_FOOTER_IMAGE_URL) ||
    DEFAULT_FOOTER_IMAGE_URL
  );
}
