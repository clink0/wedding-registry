"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";

// ─── Types ────────────────────────────────────────────────────────────────────
interface RegistryItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  store: string;
  url: string;
  purchased: boolean;
}

// ─── Registry items ───────────────────────────────────────────────────────────
// Add your own URLs here. These are seeded into Firestore on first load.
const DEFAULT_ITEMS: RegistryItem[] = [
  { id: "1",  name: "Coravin",                       category: "Kitchen",     description: "Coravin Timeless Three+ Wine By-the-Glass System",      price: "$279",  store: "Coravin",              url: "https://www.coravin.com/collections/coravin-systems/products/timeless-three-plus",                       purchased: false },
  { id: "2",  name: "Filtered Showerhead",           category: "Bathroom",    description: "Mounted filtered showerhead",                           price: "$99",   store: "MDhair",               url: "https://offers.mdhair.co/filtered-showerhead/landing-page-v2?utm_source=Google_Ads&utm_medium=166352623143&utm_campaign=21664532325&utm_content=769293494790&utm_term=v1&gad_source=1&gad_campaignid=21664532325&gbraid=0AAAAAoOu4L5IiO1Ptx0cB2osNvTM9IDhD&gclid=Cj0KCQiA5I_NBhDVARIsAOrqIsYhbgGxFgvWdJU7jc4AZXCp0eqsOfrIdz_7DTYCZDTGrMj2b0ZBL8EaAv6oEALw_wcB&_gl=1*90xw06*_gcl_aw*R0NMLjE3NzIzOTIyOTcuQ2owS0NRaUE1SV9OQmhEVkFSSXNBT3JxSXNZaGJnR3hGZ3ZXZEpVN2pjNEFaWENwMGVxc09mcklkel83RFRZQ1pEVEdyTWoyYjBaQkw4RWFBdjZvRUFMd193Y0I.*_gcl_au*MTI5NzM0NTAwNS4xNzcyMzkyMjk3*_ga*NjcyMjgyMC4xNzcyMzkyMjk3*_ga_K7P2K3SDZ6*czE3NzIzOTIyOTYkbzEkZzAkdDE3NzIzOTIyOTYkajYwJGwwJGgw", purchased: false },
  { id: "3",  name: "Pasta Machine",                 category: "Kitchen",     description: "Marcato Atlas 150 Plus Pasta Machine",                  price: "$155",  store: "Marcato",              url: "https://www.surlatable.com/product/marcato-atlas-150-plus-pasta-machine/9857194",                        purchased: false },
  { id: "4",  name: "Meal Prep Bowl Set",            category: "Kitchen",     description: "Microwavable Stainless Steel food prep",                price: "$620",  store: "Black + Blum",         url: "https://www.vitamix.com/us/en_us/shop/a3500",                                                            purchased: false },
  { id: "5",  name: "Meater Pro",                    category: "Kitchen",     description: "Smart Meat Thermometer",                                price: "$130",  store: "Meater",               url: "https://store-us.meater.com/products/meater-pro",                                                        purchased: false },
  { id: "6",  name: "Casper Pillows",                category: "Bedroom",     description: "Casper Original Pillow double pack king size",          price: "$171",  store: "Casper",               url: "https://casper.com/products/double-original-pillow?variant=41670973128785",                              purchased: false },
  { id: "7",  name: "Stainless Steel Whisk",         category: "Kitchen",     description: "All Clad 12 in Stainless Steel Whisk",                  price: "$30",   store: "All Clad",             url: "https://www.all-clad.com/stainless-steel-whisk-12-inch.html",                                            purchased: false },
];

const COLLECTION = "registry";

// ─── Decorative components ────────────────────────────────────────────────────
function GoldDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "8px 0" }}>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, #b8972e, transparent)" }} />
      <span style={{ color: "#b8972e", fontSize: "16px", lineHeight: "1" }}>✦</span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, #b8972e, transparent)" }} />
    </div>
  );
}

// ─── Item row ─────────────────────────────────────────────────────────────────
function ItemRow({
  item,
  animDelay,
  onToggle,
  pulse,
}: {
  item: RegistryItem;
  animDelay?: number;
  onToggle: (item: RegistryItem) => void;
  pulse: boolean;
}) {
  return (
    <div
      className={`item${item.purchased ? " bought" : ""}`}
      style={{ animationDelay: animDelay ? `${animDelay}s` : undefined }}
    >
      {/* Left: name + meta */}
      <div>
        <div className="item-name">{item.name}</div>
        <div className="item-meta">
          <span className="item-category">{item.category}</span>
          <span className="item-description">{item.description}</span>
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="item-store-link"
              onClick={(e) => e.stopPropagation()}
            >
              — {item.store}
              <svg className="external-icon" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7" />
                <path d="M8 1h3m0 0v3m0-3L5.5 6.5" />
              </svg>
            </a>
          ) : (
            <span className="item-store">— {item.store}</span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="item-price">{item.price}</div>

      {/* Checkbox */}
      <div
        className={`checkbox${item.purchased ? " ticked" : ""}${pulse ? " pulse" : ""}`}
        onClick={() => onToggle(item)}
        role="checkbox"
        aria-checked={item.purchased}
        aria-label={`${item.purchased ? "Unmark" : "Mark"} ${item.name} as purchased`}
      >
        {item.purchased && (
          <svg className="checkmark" viewBox="0 0 12 12">
            <polyline points="2,6 5,9 10,3" />
          </svg>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WeddingRegistry() {
  const [items, setItems]             = useState<RegistryItem[]>([]);
  const [loaded, setLoaded]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [justChecked, setJustChecked] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    async function init() {
      try {
        console.log("1. Attempting getDocs...");
        const snapshot = await getDocs(collection(db, COLLECTION));
        console.log("2. getDocs succeeded, empty?", snapshot.empty);
        
        if (snapshot.empty) {
          console.log("3. Seeding default items...");
          await Promise.all(
            DEFAULT_ITEMS.map((item) => setDoc(doc(db, COLLECTION, item.id), item))
          );
          console.log("4. Seeding complete.");
        }

        console.log("5. Setting up onSnapshot listener...");

        unsubscribe = onSnapshot(
          collection(db, COLLECTION),
          (snap) => {
            const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RegistryItem));
            // Keep a stable sort: by numeric id
            data.sort((a, b) => Number(a.id) - Number(b.id));
            setItems(data);
            setLoaded(true);
          },
          (err) => {
            console.error("Firestore error:", err);
            setError("Unable to load registry. Please check your Firebase config.");
            setLoaded(true);
          }
        );
      } catch (err) {
        console.error("Init error:", err);
        setError("Unable to connect to Firebase. Check your .env.local values.");
        setLoaded(true);
      }
    }

    init();
    return () => unsubscribe?.();
  }, []);

  const togglePurchased = useCallback(async (item: RegistryItem) => {
    const updated = { ...item, purchased: !item.purchased };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    setJustChecked(item.id);
    setTimeout(() => setJustChecked(null), 600);
    await setDoc(doc(db, COLLECTION, item.id), updated);
  }, []);

  const available = items.filter((i) => !i.purchased);
  const purchased = items.filter((i) =>  i.purchased);
  const pct       = items.length ? (purchased.length / items.length) * 100 : 0;

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (!loaded) {
    return (
      <div style={{
        background: "#faf7ee", minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontFamily: "'Great Vibes', cursive", fontSize: "28px",
          background: "linear-gradient(135deg, #c8a84b, #f5e17a, #b8972e)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Loading…
        </span>
      </div>
    );
  }

  // ─── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        background: "#faf7ee", minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 12, fontFamily: "'Cormorant Garamond', serif", padding: 32, textAlign: "center",
      }}>
        <span style={{ fontSize: 32, color: "#b8972e" }}>✦</span>
        <p style={{ fontSize: 18, color: "#5a4e38", fontStyle: "italic" }}>{error}</p>
        <p style={{ fontSize: 13, color: "#8a7040", letterSpacing: "0.1em" }}>
          Check the browser console for details.
        </p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes checkPulse {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.4); }
          100% { transform: scale(1); }
        }

        .page {
          background-color: #faf7ee;
          background-image:
            radial-gradient(ellipse at 15% 20%, rgba(200,168,75,.04) 0%, transparent 50%),
            radial-gradient(ellipse at 85% 80%, rgba(200,168,75,.04) 0%, transparent 50%);
          min-height: 100vh;
          font-family: 'Cormorant Garamond', Georgia, serif;
          color: #1a1a18;
          padding: 0 16px 80px;
        }

        .header       { text-align: center; padding: 64px 24px 32px; animation: fadeIn .9s ease both; }
        .pre-heading  { font-size: 12px; letter-spacing: .35em; text-transform: uppercase; color: #b8972e; margin-bottom: 14px; }
        .names        { font-family: 'Great Vibes', cursive; font-size: clamp(54px, 11vw, 92px); line-height: 1.05; }
        .ampersand    {
          font-family: 'Great Vibes', cursive;
          font-size: clamp(42px, 8vw, 70px);
          display: block;
          background: linear-gradient(135deg, #c8a84b 0%, #f5e17a 35%, #b8972e 55%, #e8c850 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 5s ease-in-out infinite;
          margin: -6px 0;
        }
        .wedding-date { font-style: italic; font-size: 17px; color: #6b5a30; letter-spacing: .12em; margin-top: 14px; font-weight: 300; }
        .intro-text   { font-style: italic; font-size: 15px; color: #6b5a30; line-height: 1.75; font-weight: 300; padding: 14px 0; }

        .progress-wrap  { max-width: 780px; margin: 0 auto 32px; padding: 0 24px; }
        .progress-label { display: flex; justify-content: space-between; font-size: 11px; letter-spacing: .22em; text-transform: uppercase; color: #8a7040; margin-bottom: 8px; }
        .progress-track { height: 3px; background: rgba(184,151,46,.15); border-radius: 2px; overflow: hidden; }
        .progress-fill  { height: 100%; background: linear-gradient(to right, #c8a84b, #f5e17a, #b8972e); border-radius: 2px; transition: width .6s cubic-bezier(.4,0,.2,1); }

        .frame { max-width: 780px; margin: 0 auto; padding: 0 24px; border: 1px solid rgba(184,151,46,.28); border-radius: 2px; position: relative; }
        .frame::before, .frame::after { content: ''; position: absolute; width: 13px; height: 13px; border-color: #b8972e; border-style: solid; opacity: .65; }
        .frame::before { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
        .frame::after  { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

        .item {
          display: grid; grid-template-columns: 1fr auto auto;
          align-items: center; gap: 20px;
          padding: 22px 0;
          border-bottom: 1px solid rgba(184,151,46,.14);
          transition: opacity .45s ease;
          animation: fadeIn .4s ease both;
        }
        .item.bought { opacity: .35; }
        .item-name   { font-size: 19px; font-weight: 500; letter-spacing: .02em; line-height: 1.2; }
        .item.bought .item-name { text-decoration: line-through; text-decoration-color: rgba(26,26,24,.3); }
        .item-meta   { display: flex; gap: 10px; align-items: baseline; margin-top: 5px; flex-wrap: wrap; }

        .item-category    { font-size: 10px; letter-spacing: .25em; text-transform: uppercase; color: #b8972e; }
        .item-description { font-style: italic; font-size: 14px; color: #5a4e38; font-weight: 300; }
        .item-store       { font-size: 12px; color: #8a7040; letter-spacing: .08em; }

        .item-store-link {
          font-size: 12px; color: #8a7040; letter-spacing: .08em;
          text-decoration: none;
          display: inline-flex; align-items: center; gap: 4px;
          transition: color .2s ease;
        }
        .item-store-link:hover { color: #b8972e; }
        .external-icon {
          width: 9px; height: 9px;
          stroke: currentColor; flex-shrink: 0;
          position: relative; top: -1px;
        }

        .item-price { font-size: 17px; color: #6b5a30; letter-spacing: .04em; white-space: nowrap; text-align: right; }

        .checkbox {
          width: 22px; height: 22px; flex-shrink: 0;
          border: 1.5px solid rgba(184,151,46,.55); border-radius: 2px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .2s ease;
        }
        .checkbox:hover  { border-color: #b8972e; background: rgba(184,151,46,.07); }
        .checkbox.ticked { background: linear-gradient(135deg, #c8a84b, #b8972e); border-color: #b8972e; }
        .checkbox.pulse  { animation: checkPulse .35s ease; }
        .checkmark { width: 12px; height: 12px; stroke: #faf7ee; fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }

        .bought-divider { text-align: center; font-size: 11px; letter-spacing: .28em; text-transform: uppercase; color: #b8972e; padding: 28px 0 10px; opacity: .65; }
        .footer { text-align: center; padding-top: 52px; font-family: 'Great Vibes', cursive; font-size: 26px; color: #b8972e; opacity: .65; }
      `}</style>

      <div className="page">
        <div className="header" style={{ maxWidth: 700, margin: "0 auto" }}>
          <p className="pre-heading">Wedding Registry</p>
          <div className="names">
            Iris
            <span className="ampersand">&amp;</span>
            Luke
          </div>
          <p className="wedding-date">The Seventh of June, Two Thousand &amp; Twenty-Six</p>
          <div style={{ maxWidth: 560, margin: "24px auto 0" }}>
            <GoldDivider />
            <p className="intro-text">
              Your presence at our celebration is the greatest gift of all.<br />
              Should you wish to honour us further, we have curated a selection below.
            </p>
            <GoldDivider />
          </div>
        </div>

        <div className="progress-wrap">
          <div className="progress-label">
            <span>Gifts Claimed</span>
            <span>{purchased.length} of {items.length}</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="frame">
          {available.map((item, idx) => (
            <ItemRow
              key={item.id}
              item={item}
              animDelay={idx * 0.04}
              onToggle={togglePurchased}
              pulse={justChecked === item.id}
            />
          ))}

          {purchased.length > 0 && (
            <>
              <div className="bought-divider">✦ &nbsp; Purchased &nbsp; ✦</div>
              {purchased.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onToggle={togglePurchased}
                  pulse={justChecked === item.id}
                />
              ))}
            </>
          )}
        </div>

        <div className="footer">With Love &amp; Gratitude</div>
      </div>
    </>
  );
}