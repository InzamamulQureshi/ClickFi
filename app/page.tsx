"use client";

import { useEffect, useState } from "react";
import { useFarcaster } from "@/lib/farcaster-auth";

type User = {
  id: string;
  username: string;
  score: number;
  clicks: number;
  boosters: { multiplier: number; autoclick: number; critChance: number };
  nfts: number;
};

export default function HomePage() {
  const { user: farcasterUser, isLoading: fcLoading, login, isAuthenticated } = useFarcaster();
  const [user, setUser] = useState<User | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{ username: string; score: number }[]>([]);
  const [gainFlash, setGainFlash] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user
  useEffect(() => {
    if (isAuthenticated && farcasterUser) {
      // Create game user with Farcaster info
      fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: farcasterUser.username })
      })
        .then(r => r.json())
        .then(d => {
          setUser(d.user);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to load user:", err);
          setLoading(false);
        });
    } else if (!fcLoading && !isAuthenticated) {
      // Not authenticated, try to load anonymous user
      fetch("/api/user")
        .then(r => r.json())
        .then(d => {
          setUser(d.user);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to load user:", err);
          setLoading(false);
        });
    }
  }, [isAuthenticated, farcasterUser, fcLoading]);

  // Click handler
  async function handleClick() {
    try {
      const res = await fetch("/api/click", { method: "POST" });
      const data = await res.json();
      
      if (data.error) {
        console.error("Click error:", data.error);
        return;
      }
      
      setUser(prev => prev ? { ...prev, score: data.score, clicks: data.clicks } : prev);
      setGainFlash(data.gain);
      setTimeout(() => setGainFlash(null), 1000);
    } catch (error) {
      console.error("Click failed:", error);
    }
  }

  // Leaderboard
  async function openLeaderboard() {
    try {
      const r = await fetch("/api/leaderboard");
      const d = await r.json();
      setLeaderboard(d.leaderboard || []);
      setShowBoard(true);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    }
  }

  // Shop actions
  async function buy(type: "multiplier" | "autoclick" | "crit", cost: number) {
    try {
      const r = await fetch("/api/booster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, cost }),
      });
      const d = await r.json();
      if (d.error) {
        alert(d.error);
        return;
      }
      setUser(d.user);
    } catch (error) {
      console.error("Purchase failed:", error);
    }
  }

  async function mintNFT(cost = 1000) {
    try {
      const r = await fetch("/api/nft/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cost }),
      });
      const d = await r.json();
      if (d.error) {
        alert(d.error);
        return;
      }
      setUser(d.user);
      alert(`Minted Monad NFT #${d.tokenId} 🎉`);
    } catch (error) {
      console.error("Mint failed:", error);
    }
  }

  if (loading || fcLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e1b4b, #312e81, #3730a3)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p>Loading your Monad adventure...</p>
        </div>
      </div>
    );
  }

  // Show Farcaster login if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <style jsx>{`
          .container {
            min-height: 100vh;
            background: linear-gradient(135deg, #1e1b4b, #312e81, #3730a3);
            color: white;
            padding: 20px;
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .login-card {
            background: rgba(255,255,255,0.1);
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
          }
          .title {
            font-size: 2.5rem;
            font-weight: bold;
            background: linear-gradient(45deg, #fbbf24, #a855f7, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 16px;
          }
          .login-btn {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: 16px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
            margin-top: 20px;
          }
          .login-btn:hover {
            transform: translateY(-2px);
          }
        `}</style>
        
        <div className="container">
          <div className="login-card">
            <h1 className="title">MONAD CLICKER</h1>
            <p style={{ fontSize: '1.1rem', marginBottom: '24px', opacity: 0.9 }}>
              The most addictive Web3 clicker game on Monad blockchain! 🚀
            </p>
            <p style={{ marginBottom: '24px', opacity: 0.7 }}>
              Connect with Farcaster to save your progress and compete with friends!
            </p>
            <button className="login-btn" onClick={login}>
              🟣 Connect Farcaster
            </button>
            <p style={{ fontSize: '0.9rem', marginTop: '20px', opacity: 0.6 }}>
              Or <button 
                onClick={() => window.location.reload()} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#a855f7', 
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >
                play as guest
              </button>
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes float {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-50px); }
        }
        .float-animation {
          animation: float 1s ease-out forwards;
        }
        .container {
          min-height: 100vh;
          background: linear-gradient(135deg, #1e1b4b, #312e81, #3730a3);
          color: white;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        .title {
          font-size: 3rem;
          font-weight: bold;
          background: linear-gradient(45deg, #fbbf24, #a855f7, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 8px;
        }
        .subtitle {
          font-size: 1.5rem;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
        }
        .card {
          background: rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 24px;
          margin: 0 auto 24px;
          max-width: 400px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .score {
          text-align: center;
          margin-bottom: 24px;
        }
        .score-number {
          font-size: 3rem;
          font-weight: 900;
          color: #fbbf24;
        }
        .click-area {
          text-align: center;
          position: relative;
          margin: 32px 0;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .click-button {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fbbf24, #f59e0b, #d97706);
          border: 4px solid rgba(255,255,255,0.3);
          color: white;
          font-weight: bold;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.1s;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        .click-button:hover {
          transform: scale(1.05);
        }
        .click-button:active {
          transform: scale(0.95);
        }
        .gain-flash {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 1.5rem;
          font-weight: bold;
          color: #fbbf24;
          pointer-events: none;
        }
        .buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          max-width: 400px;
          margin: 0 auto;
        }
        .button {
          padding: 12px 16px;
          border-radius: 16px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
        }
        .button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-shop { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; }
        .btn-ranks { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; }
        .btn-nft { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; }
        .btn-about { background: linear-gradient(135deg, #6b7280, #4b5563); color: white; }
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: rgba(17, 24, 39, 0.95);
          border-radius: 20px;
          padding: 24px;
          max-width: 500px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .modal-header {
          display: flex;
          justify-content: between;
          align-items: center;
          margin-bottom: 20px;
        }
        .modal-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: white;
          margin: 0;
        }
        .close-btn {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .shop-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          margin-bottom: 12px;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .leaderboard-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          margin-bottom: 8px;
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
        }
      `}</style>

      <div className="container">
        {/* Header */}
        <div className="header">
          <h1 className="title">MONAD</h1>
          <h2 className="subtitle">CLICKER</h2>
        </div>

        {user && (
          <>
            {/* Score Card */}
            <div className="card">
              <div className="score">
                <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '8px' }}>
                  YOUR BALANCE
                </p>
                <div className="score-number">{user.score.toLocaleString()}</div>
                <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                  {user.clicks.toLocaleString()} total transactions
                </p>
              </div>

              {/* Boosters */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '12px' }}>
                  ⚡ ACTIVE POWERS
                </h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>🔥 Click Multiplier</span>
                    <span>×{user.boosters.multiplier}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>🤖 Auto Boost</span>
                    <span>+{user.boosters.autoclick}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>💎 Critical Hit</span>
                    <span>{(user.boosters.critChance * 100).toFixed(0)}%</span>
                  </div>
                  {user.nfts > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>🖼️ NFTs Owned</span>
                      <span>{user.nfts}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Click Area */}
            <div className="click-area">
              <button className="click-button" onClick={handleClick}>
                CLICK
              </button>
              {gainFlash !== null && (
                <div className="gain-flash float-animation">
                  +{gainFlash}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="buttons">
              <button className="button btn-shop" onClick={() => setShowShop(true)}>
                🛒 Shop
              </button>
              <button className="button btn-ranks" onClick={openLeaderboard}>
                🏆 Ranks
              </button>
              <button 
                className="button btn-nft" 
                onClick={() => mintNFT(1000)}
                disabled={user.score < 1000}
              >
                🪙 Mint NFT
              </button>
              <button className="button btn-about" onClick={() => setShowAbout(true)}>
                ℹ️ About
              </button>
            </div>
          </>
        )}

        {/* Modals */}
        {showShop && user && (
          <div className="modal" onClick={() => setShowShop(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">⚡ Power-Up Shop</h3>
                <button className="close-btn" onClick={() => setShowShop(false)}>×</button>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div className="shop-item">
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#a855f7' }}>🔥 Click Multiplier +1</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Current: ×{user.boosters.multiplier}</div>
                  </div>
                  <button 
                    className="button btn-shop"
                    onClick={() => buy("multiplier", 200)}
                    disabled={user.score < 200}
                    style={{ padding: '8px 16px' }}
                  >
                    200 🪙
                  </button>
                </div>
                <div className="shop-item">
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>🤖 Auto-Boost +1</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Current: +{user.boosters.autoclick}</div>
                  </div>
                  <button 
                    className="button btn-ranks"
                    onClick={() => buy("autoclick", 150)}
                    disabled={user.score < 150}
                    style={{ padding: '8px 16px' }}
                  >
                    150 🪙
                  </button>
                </div>
                <div className="shop-item">
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#10b981' }}>💎 Critical Hit +5%</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Current: {(user.boosters.critChance*100).toFixed(0)}%</div>
                  </div>
                  <button 
                    className="button"
                    onClick={() => buy("crit", 250)}
                    disabled={user.score < 250}
                    style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}
                  >
                    250 🪙
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showBoard && (
          <div className="modal" onClick={() => setShowBoard(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">🏆 Monad Champions</h3>
                <button className="close-btn" onClick={() => setShowBoard(false)}>×</button>
              </div>
              <div>
                {leaderboard.length === 0 && (
                  <p style={{ textAlign: 'center', opacity: 0.7, padding: '20px' }}>
                    No champions yet. Be the first!
                  </p>
                )}
                {leaderboard.map((r, i) => (
                  <div key={`${r.username}-${i}`} className="leaderboard-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: 'bold', color: '#fbbf24' }}>#{i + 1}</span>
                      <span>{r.username}</span>
                    </div>
                    <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                      {r.score.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showAbout && (
          <div className="modal" onClick={() => setShowAbout(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">🚀 About Monad Clicker</h3>
                <button className="close-btn" onClick={() => setShowAbout(false)}>×</button>
              </div>
              <div style={{ lineHeight: 1.6, opacity: 0.9 }}>
                <p style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#a855f7' }}>Welcome to Monad Clicker!</strong> 🎮
                </p>
                <p style={{ marginBottom: '16px' }}>
                  A next-gen Web3 clicker game built on the blazing-fast Monad blockchain. 
                  Click to earn tokens, unlock powerful boosters, and climb the leaderboards!
                </p>
                <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                  Built with Next.js, TypeScript, and lots of ⚡
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}