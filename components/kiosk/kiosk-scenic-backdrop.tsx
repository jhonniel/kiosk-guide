/** Shared flush top-right scenic used on Home + Citizens' Charter. */
export function KioskScenicBackdrop({
  imageUrl,
}: {
  imageUrl: string;
}) {
  return (
    <div
      className="pointer-events-none absolute top-0 right-0 z-0 h-[18rem] w-[min(72%,48rem)] sm:h-[20rem]"
      aria-hidden
    >
      <div
        className="absolute inset-0 bg-cover bg-[center_top]"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-kiosk-bg from-[6%] via-kiosk-bg/70 via-[40%] to-transparent to-[72%]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-kiosk-bg to-transparent" />
    </div>
  );
}
