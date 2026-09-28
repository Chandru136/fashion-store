export function CustomerWhatsAppButton({ phone, name }: { phone: string | null | undefined; name: string }) {
  const compact = (phone || "").trim().replace(/[\s().-]/g, "");
  const international = /^(\+|00)/.test(compact);
  let number = compact.replace(/^(\+|00)/, "");
  // Assume India only for local mobile numbers; preserve explicit country codes.
  if (!international) {
    if (/^0[6-9]\d{9}$/.test(number)) number = number.slice(1);
    if (/^[6-9]\d{9}$/.test(number)) number = `91${number}`;
  }
  const valid = /^[1-9]\d{7,14}$/.test(number) &&
    (international || /^91[6-9]\d{9}$/.test(number));
  const icon = <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 .1 5.4.1 12c0 2.1.5 4.1 1.6 6L0 24l6.3-1.7A12 12 0 0 0 12 24c6.6 0 12-5.4 12-12a11.9 11.9 0 0 0-3.5-8.5ZM12 22a10 10 0 0 1-5.1-1.4l-.4-.2-3.7 1 1-3.7-.2-.4A10 10 0 1 1 12 22Z" />
    <path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.1-.7.2l-.9 1.1c-.2.2-.4.3-.7.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.1-.3 0-.4.2-.6l.4-.5.3-.5c.1-.2.1-.4 0-.5l-.9-2.2c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5l1.7.6c.7.2 1.4.2 1.9.1.5-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.5-.4Z" />
  </svg>;

  return valid ? <a
    href={`https://wa.me/${number}`}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`Chat with ${name || "customer"} on WhatsApp (opens in a new tab)`}
    title={`Chat on WhatsApp: +${number}`}
    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
  >{icon}</a> : <button
    type="button"
    disabled
    aria-label="WhatsApp unavailable: missing or invalid phone number"
    title="WhatsApp unavailable: missing or invalid phone number"
    className="inline-flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-full bg-stone-100 text-stone-400"
  >{icon}</button>;
}
