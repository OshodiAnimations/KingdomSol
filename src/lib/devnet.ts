'use client';

// Solana Devnet Airdrop Implementation
// Uses the official Solana Web3.js library for real devnet airdrops

export async function requestDevnetAirdrop(walletAddress: string): Promise<{ success: boolean; message: string; signature?: string }> {
  try {
    // Dynamic import to avoid SSR issues
    const { Connection, PublicKey, LAMPORTS_PER_SOL } = await import('@solana/web3.js');

    const connection = new Connection(
      'https://api.devnet.solana.com',
      'confirmed'
    );

    const pubkey = new PublicKey(walletAddress);

    // Request 1 SOL airdrop (1 billion lamports)
    const signature = await connection.requestAirdrop(pubkey, LAMPORTS_PER_SOL);

    // Confirm the transaction
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, 'confirmed');

    // Get new balance
    const balance = await connection.getBalance(pubkey);
    const solBalance = balance / LAMPORTS_PER_SOL;

    return {
      success: true,
      message: `Airdrop successful! +1 SOL received. New balance: ${solBalance.toFixed(3)} SOL`,
      signature,
    };
  } catch (error: any) {
    const msg = error?.message || '';

    if (msg.includes('429') || msg.includes('rate limit') || msg.includes('airdrop limit')) {
      return {
        success: false,
        message: 'Airdrop rate limited. Wait 24 hours or use faucet.solana.com instead.',
      };
    }

    if (msg.includes('Invalid public key')) {
      return {
        success: false,
        message: 'Invalid wallet address. Connect a real Solana wallet first.',
      };
    }

    return {
      success: false,
      message: `Airdrop failed: ${msg || 'Unknown error'}. Try faucet.solana.com`,
    };
  }
}

export async function getDevnetBalance(walletAddress: string): Promise<number> {
  try {
    const { Connection, PublicKey, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const pubkey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
}
