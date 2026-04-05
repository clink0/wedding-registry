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

const DEFAULT_ITEMS: RegistryItem[] = [
  // --- BARWARE ---
  { id: "1", name: "Coravin Wine System", category: "Barware", description: "Timeless Three+ by-the-glass preservation system", price: "$279", store: "Coravin", url: "https://www.coravin.com/collections/coravin-systems/products/timeless-three-plus", purchased: false },
  // --- BATHROOM ---
  { id: "2", name: "Filtered Showerhead", category: "Bathroom", description: "Wall-mounted 15-stage filtered shower system", price: "$99", store: "MDhair", url: "https://offers.mdhair.co/filtered-showerhead/landing-page-v2", purchased: false },
  // --- BEDROOM ---
  { id: "3", name: "Casper Pillows", category: "Bedroom", description: "Original pillow double pack, king size", price: "$171", store: "Casper", url: "https://casper.com/products/double-original-pillow?variant=41670973128785", purchased: false },
  // --- KITCHEN ---
  { id: "4", name: "All-Clad French Whisk", category: "Kitchen", description: "12-inch stainless steel French whisk for narrow vessels", price: "$30", store: "All-Clad", url: "https://www.all-clad.com/stainless-steel-whisk-12-inch.html", purchased: false },
  { id: "5", name: "All-Clad Pastry Brush", category: "Kitchen", description: "Silicone tools pastry brush/baster with stainless handle", price: "$30", store: "All-Clad", url: "https://www.all-clad.com/silicone-tools-pastry-brush.html", purchased: false },
  { id: "6", name: "All-Clad Precision Ladle", category: "Kitchen", description: "Stainless steel 6-oz ladle with pouring rim", price: "$35", store: "Williams-Sonoma", url: "https://www.williams-sonoma.com/products/all-clad-stainless-steel-precision-ladle/", purchased: false },
  { id: "7", name: "All-Clad Precision Turner", category: "Kitchen", description: "High-quality stainless steel spatula/turner", price: "$35", store: "Williams-Sonoma", url: "https://www.williams-sonoma.com/products/all-clad-stainless-steel-precision-turner/", purchased: false },
  { id: "8", name: "All-Clad Whisk", category: "Kitchen", description: "12-inch professional stainless steel balloon whisk", price: "$30", store: "All-Clad", url: "https://www.all-clad.com/stainless-steel-whisk-12-inch.html", purchased: false },
  { id: "9", name: "Marcato Pasta Machine", category: "Kitchen", description: "Atlas 150 Plus with nine thickness settings", price: "$155", store: "Sur La Table", url: "https://www.surlatable.com/product/marcato-atlas-150-plus-pasta-machine/9857194", purchased: false },
  { id: "10", name: "Meal Prep Bowl Set", category: "Kitchen", description: "Set of five stainless steel microwavable prep bowls", price: "$115", store: "Black + Blum", url: "https://blackblum.com/products/meal-prep-bowl-set-x5", purchased: false },
  { id: "11", name: "Meater Pro Thermometer", category: "Kitchen", description: "Wireless smart meat thermometer with guided cook", price: "$130", store: "Meater", url: "https://store-us.meater.com/products/meater-pro", purchased: false },
  { id: "12", name: "Simple Human Sensor Can", category: "Kitchen", description: "58L dual-compartment rectangular voice/motion sensor can", price: "$250", store: "simplehuman", url: "https://www.simplehuman.com/products/58l-sensor-can?variant=45055652266115", purchased: false },
  { id: "13", name: "Smithey Carbon Steel Wok", category: "Kitchen", description: "12-inch hand-forged carbon steel wok with helper handle", price: "$325", store: "Smithey", url: "https://smithey.com/collections/carbon-steel/products/carbon-steel-wok?variant=40920029200541", purchased: false },
];

const COLLECTION = "registry";

function GoldDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "8px 0" }}>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, #b8972e, transparent)" }} />
      <span style={{ color: "#b8972e", fontSize: "16px", lineHeight: "1" }}>✦</span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, #b8972e, transparent)" }} />
    </div>
  );
}

function ItemRow({ item, animDelay, onToggle, pulse }: { item: RegistryItem; animDelay?: number; onToggle: (item: RegistryItem) => void; pulse: boolean; }) {
  return (
    <div className={`item${item.purchased ? " bought" : ""}`} style={{ animationDelay: animDelay ? `${animDelay}s` : undefined }}>
      <div>
        <div className="item-name">{item.name}</div>
        <div className="item-meta">
          <span className="item-category">{item.category}</span>
          <span className="item-description">{item.description}</span>
          {item.url ? (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="item-store-link" onClick={(e) => e.stopPropagation()}>
              — {item.store}
              <svg className="external-icon" width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7" />
                <path d="M8 1h3m0 0v3m0-3L5.5 6.5" />
              </svg>
            </a>
          ) : (
            <span className="item-store">— {item.store}</span>
          )}
        </div>
      </div>
      <div className="item-price">{item.price}</div>
      <div className={`checkbox${item.purchased ? " ticked" : ""}${pulse ? " pulse" : ""}`} onClick={() => onToggle(item)} role="checkbox" aria-checked={item.purchased}>
        {item.purchased && <svg className="checkmark" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" /></svg>}
      </div>
    </div>
  );
}

export default function WeddingRegistry() {
  const [items, setItems]             = useState<RegistryItem[]>([]);
  const [loaded, setLoaded]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [justChecked, setJustChecked] = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;
    async function init() {
      try {
        const snapshot = await getDocs(collection(db, COLLECTION));
        if (snapshot.empty) {
          await Promise.all(DEFAULT_ITEMS.map((item) => setDoc(doc(db, COLLECTION, item.id), item)));
        }
        unsubscribe = onSnapshot(collection(db, COLLECTION), (snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RegistryItem));
          data.sort((a, b) => Number(a.id) - Number(b.id));
          setItems(data);
          setLoaded(true);
        }, (err) => { setError("Unable to load registry."); setLoaded(true); });
      } catch (err) { setError("Unable to connect to registry."); setLoaded(true); }
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

  const copyAddress = () => {
    navigator.clipboard.writeText("511 NW 9th st, Bentonville, AR 72712");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const available = items.filter((i) => !i.purchased);
  const purchased = items.filter((i) =>  i.purchased);
  const pct       = items.length ? (purchased.length / items.length) * 100 : 0;

  if (!loaded) return <div style={{ background: "#faf7ee", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontFamily: "'Great Vibes', cursive", fontSize: "28px", color: "#b8972e" }}>Loading…</span></div>;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        
        .page { background-color: #faf7ee; min-height: 100vh; font-family: 'Cormorant Garamond', Georgia, serif; color: #1a1a18; padding: 0 16px 80px; }
        .header { text-align: center; padding: 64px 24px 32px; animation: fadeIn .9s ease both; }
        .pre-heading { font-size: 12px; letter-spacing: .35em; text-transform: uppercase; color: #b8972e; margin-bottom: 14px; }
        .names { font-family: 'Great Vibes', cursive; font-size: clamp(54px, 11vw, 92px); line-height: 1.05; }
        .ampersand { font-family: 'Great Vibes', cursive; font-size: clamp(42px, 8vw, 70px); display: block; color: #b8972e; margin: -6px 0; }
        .wedding-date { font-style: italic; font-size: 17px; color: #6b5a30; letter-spacing: .12em; margin-top: 14px; font-weight: 300; }
        .intro-text { font-style: italic; font-size: 15px; color: #6b5a30; line-height: 1.75; font-weight: 300; padding: 14px 0; }

        .info-container { max-width: 560px; margin: 24px auto 0; }
        .how-to-box { border: 1px solid rgba(184,151,46,.15); padding: 20px; margin-bottom: 16px; background: rgba(184,151,46,.03); border-radius: 4px; text-align: left; }
        .how-to-step { font-size: 13px; color: #8a7040; letter-spacing: .03em; line-height: 1.6; margin-bottom: 8px; }
        .how-to-step strong { color: #b8972e; font-weight: 500; text-transform: uppercase; font-size: 11px; margin-right: 6px; }

        .shipping-box { border: 1px solid rgba(184,151,46,.15); padding: 20px; background: #fff; border-radius: 4px; text-align: center; margin-bottom: 24px; }
        .shipping-label { font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: #b8972e; margin-bottom: 8px; display: block; }
        .address-text { font-size: 18px; color: #1a1a18; letter-spacing: .02em; margin-bottom: 12px; }
        .copy-btn { 
          background: none; border: 1px solid #b8972e; color: #b8972e; padding: 6px 14px; font-family: 'Cormorant Garamond', serif; 
          font-size: 12px; text-transform: uppercase; letter-spacing: .1em; cursor: pointer; transition: all 0.2s; border-radius: 2px;
        }
        .copy-btn:hover { background: #b8972e; color: #fff; }

        .progress-wrap { max-width: 780px; margin: 0 auto 32px; padding: 0 24px; }
        .progress-label { display: flex; justify-content: space-between; font-size: 11px; letter-spacing: .22em; text-transform: uppercase; color: #8a7040; margin-bottom: 8px; }
        .progress-track { height: 3px; background: rgba(184,151,46,.15); border-radius: 2px; overflow: hidden; }
        .progress-fill { height: 100%; background: #b8972e; border-radius: 2px; transition: width .6s ease; }

        .frame { max-width: 780px; margin: 0 auto; padding: 0 24px; border: 1px solid rgba(184,151,46,.28); border-radius: 2px; position: relative; }
        .item { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 20px; padding: 22px 0; border-bottom: 1px solid rgba(184,151,46,.14); }
        .item.bought { opacity: .35; }
        .item-name { font-size: 19px; font-weight: 500; }
        .item-meta { display: flex; gap: 10px; align-items: baseline; margin-top: 5px; flex-wrap: wrap; }
        .item-category { font-size: 10px; letter-spacing: .25em; text-transform: uppercase; color: #b8972e; }
        .item-description { font-style: italic; font-size: 14px; color: #5a4e38; }
        
        /* THE FIX FOR THE GIANT ICONS */
        .item-store-link { 
          font-size: 12px; color: #8a7040; text-decoration: none; 
          display: inline-flex; align-items: center; gap: 4px;
        }
        .external-icon { 
          width: 11px !important; 
          height: 11px !important; 
          flex-shrink: 0;
          display: inline-block;
          vertical-align: middle;
        }

        .item-price { font-size: 17px; color: #6b5a30; }
        .checkbox { width: 22px; height: 22px; border: 1.5px solid rgba(184,151,46,.55); border-radius: 2px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .checkbox.ticked { background: #b8972e; border-color: #b8972e; }
        .checkmark { width: 12px; height: 12px; stroke: #faf7ee; fill: none; stroke-width: 2.2; }
        .bought-divider { text-align: center; font-size: 11px; letter-spacing: .28em; text-transform: uppercase; color: #b8972e; padding: 28px 0 10px; opacity: .65; }
        .footer { text-align: center; padding-top: 52px; font-family: 'Great Vibes', cursive; font-size: 26px; color: #b8972e; opacity: .65; }
      `}</style>

      <div className="page">
        <div className="header" style={{ maxWidth: 700, margin: "0 auto" }}>
          <p className="pre-heading">Wedding Registry</p>
          <div className="names">Iris <span className="ampersand">&amp;</span> Luke</div>
          <p className="wedding-date">The Seventh of June, Two Thousand &amp; Twenty-Six</p>
          
          <div className="info-container">
            <GoldDivider />
            <p className="intro-text">
              Your presence at our celebration is the greatest gift of all.<br />
              Should you wish to honour us further, we have curated a selection below.
            </p>

            <div className="how-to-box">
              <p className="how-to-step"><strong>1. Select</strong> Click the store link to purchase your gift directly from the retailer.</p>
              <p className="how-to-step"><strong>2. Mark</strong> Return here and click the gold box to let us and other guests know it’s been claimed.</p>
            </div>

            <div className="shipping-box">
              <span className="shipping-label">Please ship all gifts to:</span>
              <p className="address-text">
                511 NW 9th st<br />
                Bentonville, AR 72712
              </p>
              <button className="copy-btn" onClick={copyAddress}>
                {copied ? "Address Copied!" : "Copy Address"}
              </button>
            </div>

            <GoldDivider />
          </div>
        </div>

        <div className="progress-wrap">
          <div className="progress-label"><span>Gifts Claimed</span><span>{purchased.length} of {items.length}</span></div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
        </div>

        <div className="frame">
          {available.map((item, idx) => (
            <ItemRow key={item.id} item={item} animDelay={idx * 0.04} onToggle={togglePurchased} pulse={justChecked === item.id} />
          ))}
          {purchased.length > 0 && (
            <>
              <div className="bought-divider">✦ &nbsp; Purchased &nbsp; ✦</div>
              {purchased.map((item) => <ItemRow key={item.id} item={item} onToggle={togglePurchased} pulse={justChecked === item.id} />)}
            </>
          )}
        </div>
        <div className="footer">With Love &amp; Gratitude</div>
      </div>
    </>
  );
}