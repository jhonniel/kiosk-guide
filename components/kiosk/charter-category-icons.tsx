"use client";
import type { ImgHTMLAttributes, ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  circleColor?: string;
};

function Badge({
  className,
  circleColor,
  children,
  ...props
}: IconProps & { children: ReactNode; circleColor: string }) {
  return (
    <svg viewBox="0 0 256 256" fill="none" aria-hidden className={className} {...props}>
      <circle cx="128" cy="128" r="128" fill={circleColor} />
      {children}
    </svg>
  );
}

export function HealthServicesIcon({ circleColor = "#e11d48", ...props }: IconProps) {
  return (
    <Badge circleColor={circleColor} {...props}>
      <g transform="translate(128.0 128.0) scale(0.320000) translate(-256.0000 -256.0000)">
        <path fill="#fff" d="M228.3 469.1L47.6 300.4c-4.2-3.9-8.2-8.1-11.9-12.4h87c22.6 0 43-13.6 51.7-34.5l10.5-25.2 49.3 109.5c3.8 8.5 12.1 14 21.4 14.1s17.8-5 22-13.3L320 253.7l1.7 3.4c9.5 19 28.9 31 50.1 31H476.3c-3.7 4.3-7.7 8.5-11.9 12.4L283.7 469.1c-7.5 7-17.4 10.9-27.7 10.9s-20.2-3.9-27.7-10.9zM503.7 240h-132c-3 0-5.8-1.7-7.2-4.4l-23.2-46.3c-4.1-8.1-12.4-13.3-21.5-13.3s-17.4 5.1-21.5 13.3l-41.4 82.8L205.9 158.2c-3.9-8.7-12.7-14.3-22.2-14.1s-18.1 5.9-21.8 14.8l-31.8 76.3c-1.2 3-4.2 4.9-7.4 4.9H16c-2.6 0-5 .4-7.3 1.1C3 225.2 0 208.2 0 190.9v-5.8c0-69.9 50.5-129.5 119.4-141C165 36.5 211.4 51.4 244 84l12 12 12-12c32.6-32.6 79-47.5 124.6-39.9C461.5 55.6 512 115.2 512 185.1v5.8c0 16.9-2.8 33.5-8.3 49.1z" />
      </g>
    </Badge>
  );
}

export function SocialWelfareIcon({ circleColor = "#7c3aed", ...props }: IconProps) {
  return (
    <Badge circleColor={circleColor} {...props}>
      <g transform="translate(128.0 128.0) scale(0.264000) translate(-320.0000 -256.0000)">
        <path fill="#fff" d="M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192h42.7c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0H21.3C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7h42.7C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3H405.3zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352H378.7C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7H154.7c-14.7 0-26.7-11.9-26.7-26.7z" />
      </g>
    </Badge>
  );
}

export function AgricultureServicesIcon({ circleColor = "#16a34a", ...props }: IconProps) {
  return (
    <Badge circleColor={circleColor} {...props}>
      <g transform="translate(128.0 128.0) scale(0.320000) translate(-256.0000 -256.0000)">
        <path fill="#fff" d="M512 32c0 113.6-84.6 207.5-194.2 222c-7.1-53.4-30.6-101.6-65.3-139.3C290.8 46.3 364 0 448 0h32c17.7 0 32 14.3 32 32zM0 96C0 78.3 14.3 64 32 64H64c123.7 0 224 100.3 224 224v32V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V320C100.3 320 0 219.7 0 96z" />
      </g>
    </Badge>
  );
}

export function EngineeringServicesIcon({ circleColor = "#2563eb", ...props }: IconProps) {
  return (
    <Badge circleColor={circleColor} {...props}>
      <g fill="#fff">
        <rect x="48" y="58" width="18" height="118" rx="2" />
        <rect x="190" y="58" width="18" height="118" rx="2" />
        <rect x="40" y="50" width="34" height="12" rx="2" />
        <rect x="182" y="50" width="34" height="12" rx="2" />
        <rect x="40" y="188" width="34" height="12" rx="2" />
        <rect x="182" y="188" width="34" height="12" rx="2" />
        <path d="M66 66c20 34 40 50 62 50s42-16 62-50l10 6c-22 38-46 60-72 60s-50-22-72-60l10-6z" />
        <path d="M66 90c18 26 38 38 62 38s44-12 62-38l9 5.5C180 128 156 148 128 148s-52-20-71-52.5L66 90z" />
        <rect x="90" y="112" width="7" height="40" rx="1.5" />
        <rect x="110" y="124" width="7" height="28" rx="1.5" />
        <rect x="139" y="124" width="7" height="28" rx="1.5" />
        <rect x="159" y="112" width="7" height="40" rx="1.5" />
        <rect x="42" y="150" width="172" height="12" rx="2" />
      </g>
    </Badge>
  );
}

export function BusinessProcurementIcon({ circleColor = "#ea580c", ...props }: IconProps) {
  return (
    <Badge circleColor={circleColor} {...props}>
      <g transform="translate(128.0 128.0) scale(0.300000) translate(-256.0000 -256.0000)">
        <path fill="#fff" d="M184 48H328c4.4 0 8 3.6 8 8V96H176V56c0-4.4 3.6-8 8-8zm-56 8V96H64C28.7 96 0 124.7 0 160v96H192 320 512V160c0-35.3-28.7-64-64-64H384V56c0-30.9-25.1-56-56-56H184c-30.9 0-56 25.1-56 56zM512 288H320v32c0 17.7-14.3 32-32 32H224c-17.7 0-32-14.3-32-32V288H0V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V288z" />
      </g>
    </Badge>
  );
}

export function TourismServicesIcon({
  className,
  circleColor: _circleColor,
  ...props
}: IconProps) {
  const {
    stroke: _stroke,
    strokeWidth: _strokeWidth,
    fill: _fill,
    viewBox: _viewBox,
    xmlns: _xmlns,
    ...imgProps
  } = props;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/citizens-charter/category-icons/tourism.png"
      alt=""
      className={className}
      draggable={false}
      {...(imgProps as ImgHTMLAttributes<HTMLImageElement>)}
    />
  );
}

export function VeterinaryServicesIcon({ circleColor = "#92400e", ...props }: IconProps) {
  return (
    <Badge circleColor={circleColor} {...props}>
      <g transform="translate(128.0 128.0) scale(0.320000) translate(-256.0000 -256.0000)">
        <path fill="#fff" d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z" />
      </g>
    </Badge>
  );
}

export function TreasuryPaymentsIcon({ circleColor = "#166534", ...props }: IconProps) {
  return (
    <Badge circleColor={circleColor} {...props}>
      <g transform="translate(128.0 128.0) scale(0.290000) translate(-192.0000 -256.0000)">
        <path fill="#fff" d="M64 32C46.3 32 32 46.3 32 64v64c-17.7 0-32 14.3-32 32s14.3 32 32 32l0 32c-17.7 0-32 14.3-32 32s14.3 32 32 32l0 64v96c0 17.7 14.3 32 32 32s32-14.3 32-32V384h80c68.4 0 127.7-39 156.8-96H352c17.7 0 32-14.3 32-32s-14.3-32-32-32h-.7c.5-5.3 .7-10.6 .7-16s-.2-10.7-.7-16h.7c17.7 0 32-14.3 32-32s-14.3-32-32-32H332.8C303.7 71 244.4 32 176 32H64zm190.4 96H96V96h80c30.5 0 58.2 12.2 78.4 32zM96 192H286.9c.7 5.2 1.1 10.6 1.1 16s-.4 10.8-1.1 16H96V192zm158.4 96c-20.2 19.8-47.9 32-78.4 32H96V288H254.4z" />
      </g>
    </Badge>
  );
}
