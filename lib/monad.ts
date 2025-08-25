export async function sendTestTransaction() {
  // Here you’d integrate with Monad testnet RPC
  // For now we just simulate a delay
  await new Promise(resolve => setTimeout(resolve, 200));
  return { txHash: "fake_tx_hash_" + Math.random().toString(36).substring(2, 8) };
}

