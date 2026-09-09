type StatusResult = { success: boolean; status?: string; error?: string };

// A lost callback response must still recover through the authenticated status
// endpoint. Only server-verified PAID status permits the thank-you redirect.
export async function confirmCheckoutPayment(
  verify: () => Promise<StatusResult>,
  checkStatus: () => Promise<StatusResult>,
  wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
) {
  try {
    const result = await verify();
    if (result.success && result.status === "PAID") return true;
  } catch { /* Recover from a lost verification response below. */ }

  for (let attempt = 0; attempt < 10; attempt++) {
    await wait(2000);
    try {
      const result = await checkStatus();
      if (result.success && result.status === "PAID") return true;
      if (result.success && result.status === "REFUNDED") return false;
    } catch { /* A temporary network failure should not end recovery. */ }
  }
  return false;
}
