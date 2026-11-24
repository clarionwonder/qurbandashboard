/* eslint-disable @typescript-eslint/no-explicit-any */
// Demo mode (DEMO_MODE=true): an in-memory stand-in for Supabase with sample data,
// so the app can be tried locally with no database or payment keys. Data resets on restart.
import "server-only";

type Row = Record<string, any>;
interface DemoState { tables: Record<string, Row[]>; seq: number; featured: string }

function seed(): DemoState {
  const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  let idc = 1;
  const nid = () => uid(idc++);

  const campaign = {
    id: nid(), slug: "qurban-1448", title: "Qurban Aidiladha 1448H", type: "qurban", status: "open",
    description: "Sertai ibadah qurban bersama GERMY tahun ini. Sembelihan dibuat pada hari pertama hingga ketiga Tasyrik, dan daging diagihkan kepada asnaf dan keluarga memerlukan di sekitar Selangor.",
    location: "Tapak Sembelihan GERMY, Kuala Selangor", event_date: "2027-05-17",
    bank_name: "Maybank", bank_account_name: "GERMY RESOURCES", bank_account_no: "5621 0098 7712",
    created_at: "2026-11-01T02:00:00Z",
  };
  const campaign2 = { ...campaign, id: nid(), slug: "aqiqah-2027", title: "Aqiqah Sepanjang Tahun 2027", type: "aqiqah", event_date: null, description: "Aqiqah untuk cahaya mata anda, diuruskan sepenuhnya oleh GERMY.", status: "open" };
  const pk = (o: Row) => ({ id: nid(), campaign_id: campaign.id, active: true, description: null, max_animals: null, created_at: "2026-11-01T02:00:00Z", ...o });
  const packages = [
    pk({ name: "Lembu Tempatan", animal_kind: "cow", shares_per_animal: 7, price_per_share: 780, max_animals: 20, code_prefix: "LMB", sort_order: 1, description: "Lembu baka tempatan, dipilih cukup umur dan sihat." }),
    pk({ name: "Kambing", animal_kind: "goat", shares_per_animal: 1, price_per_share: 1250, max_animals: 30, code_prefix: "KBG", sort_order: 2, description: "Seekor kambing untuk seorang peserta." }),
    pk({ name: "Unta", animal_kind: "camel", shares_per_animal: 7, price_per_share: 1650, max_animals: 2, code_prefix: "UNT", sort_order: 3, description: "Unta import, bilangan terhad." }),
  ];
  const names = ["Ahmad Faiz bin Ismail", "Nurul Huda binti Rahman", "Mohd Hafiz bin Yusof", "Siti Aishah binti Omar", "Kamarul Ariffin bin Hassan", "Farah Nadia binti Zainal", "Azman bin Abdullah", "Rosnah binti Ahmad", "Syafiq bin Kamal", "Aina Sofea binti Rizal", "Zulkifli bin Mahmud", "Hidayah binti Salleh", "Iskandar bin Daud", "Mariam binti Hashim", "Hakim bin Roslan", "Nor Azura binti Ali", "Firdaus bin Jamal", "Liyana binti Mokhtar", "Rahim bin Osman", "Sakinah binti Idris"];
  const orders: Row[] = [];
  const animals: Row[] = [];
  const shares: Row[] = [];
  let seq = 1;
  function addOrder(pkg: Row, buyer: string, qty: number, status: string, method: string, part?: string[], daysAgo = 3) {
    const created = new Date(Date.now() - daysAgo * 86400000).toISOString();
    const participants = part ?? Array.from({ length: qty }, (_, i) => (i === 0 ? buyer : names[(names.indexOf(buyer) + i * 3) % names.length]));
    const o = {
      id: nid(), ref: `GQ26${String(seq++).padStart(5, "0")}`, campaign_id: campaign.id, package_id: pkg.id, buyer_name: buyer,
      buyer_phone: "01" + String(23456789 + seq * 1111).slice(0, 8), buyer_email: buyer.split(" ")[0].toLowerCase() + "@email.com",
      buyer_address: null, quantity: qty, participants, amount: pkg.price_per_share * qty, status, payment_method: method,
      gateway_bill_id: null, gateway_txn_id: status === "paid" && method !== "manual" ? "TX" + (88120 + seq) : null,
      proof_path: status === "awaiting_verification" ? "x/proof.jpg" : null, paid_at: status === "paid" ? created : null, admin_notes: null, created_at: created,
    };
    orders.push(o);
    if (status !== "paid") return o;
    let remaining = qty, idx = 0;
    while (remaining > 0) {
      const used = (a: Row) => shares.filter((s) => s.animal_id === a.id).length;
      let a = animals.find((x) => x.package_id === pkg.id && x.status === "filling" && pkg.shares_per_animal - used(x) >= remaining);
      if (!a && remaining < pkg.shares_per_animal) a = animals.find((x) => x.package_id === pkg.id && x.status === "filling");
      if (!a) {
        const n = animals.filter((x) => x.package_id === pkg.id).length + 1;
        a = { id: nid(), campaign_id: campaign.id, package_id: pkg.id, seq: n, code: `${pkg.code_prefix}-${String(n).padStart(3, "0")}`, status: "filling", notes: null, slaughtered_at: null, distributed_at: null };
        animals.push(a);
      }
      const take = Math.min(pkg.shares_per_animal - used(a), remaining);
      for (let i = 0; i < take; i++) shares.push({ id: nid(), order_id: o.id, animal_id: a.id, slot: used(a) + 1, participant_name: participants[idx++], created_at: created });
      remaining -= take;
      if (used(a) >= pkg.shares_per_animal) a.status = "full";
    }
    return o;
  }
  const [cow, goat, camel] = packages;
  const featuredOrder = addOrder(cow, names[0], 3, "paid", "billplz", ["Ahmad Faiz bin Ismail", "Ismail bin Kassim (arwah)", "Zaleha binti Musa"], 20);
  addOrder(cow, names[1], 2, "paid", "toyyibpay", undefined, 18);
  addOrder(cow, names[2], 2, "paid", "bayarcash", undefined, 17);
  addOrder(cow, names[3], 7, "paid", "senangpay", undefined, 15);
  addOrder(cow, names[4], 1, "paid", "manual", undefined, 12);
  addOrder(cow, names[5], 3, "paid", "billplz", undefined, 9);
  addOrder(cow, names[6], 2, "paid", "toyyibpay", undefined, 6);
  addOrder(goat, names[7], 1, "paid", "billplz", undefined, 8);
  addOrder(goat, names[8], 2, "paid", "senangpay", undefined, 5);
  addOrder(camel, names[9], 1, "paid", "bayarcash", undefined, 4);
  addOrder(camel, names[10], 2, "paid", "billplz", undefined, 2);
  addOrder(cow, names[11], 2, "awaiting_verification", "manual", undefined, 1);
  addOrder(goat, names[12], 1, "awaiting_verification", "manual", undefined, 1);
  addOrder(cow, names[13], 1, "pending", "billplz", undefined, 0.01);
  addOrder(cow, names[14], 4, "cancelled", "toyyibpay", undefined, 10);
  // progress for the preview: first cow slaughtered, goats distributed
  animals[0].status = "slaughtered"; animals[0].slaughtered_at = "2027-05-17T01:30:00Z"; animals[0].notes = "Tag 4412";
  animals.filter((a) => a.package_id === goat.id).forEach((a, i) => { a.status = i === 0 ? "distributed" : "slaughtered"; a.slaughtered_at = "2027-05-17T03:00:00Z"; });

  const tables: Record<string, Row[]> = {
    campaigns: [campaign, campaign2], packages, animals, orders, shares, payment_events: [
      { id: 1, order_id: featuredOrder.id, provider: "billplz", kind: "callback", verified: true, payload: {}, created_at: featuredOrder.created_at },
      { id: 2, order_id: featuredOrder.id, provider: "billplz", kind: "return", verified: true, payload: {}, created_at: featuredOrder.created_at },
    ],
    admins: [{ user_id: "u1", email: "admin@germy.my" }],
  };

  return { tables, seq, featured: featuredOrder.id };
}

const g = globalThis as unknown as { __germyDemo?: DemoState };
const state = () => (g.__germyDemo ??= seed());
const T = () => state().tables;

const fk: Record<string, string> = { packages: "package_id", campaigns: "campaign_id", animals: "animal_id", orders: "order_id" };

function splitTop(s: string) {
  const out: string[] = []; let d = 0, cur = "";
  for (const ch of s) { if (ch === "(") d++; if (ch === ")") d--; if (ch === "," && d === 0) { out.push(cur.trim()); cur = ""; } else cur += ch; }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function embed(row: Row, sel: string): Row {
  const r = { ...row };
  for (const part of splitTop(sel)) {
    const m = part.match(/^(?:(\w+):)?(\w+)(?:!\w+)?\((.*)\)$/);
    if (!m) continue;
    const [, alias, table, inner] = m;
    const target = T()[table]?.find((x) => x.id === row[fk[table]]);
    r[alias ?? table] = target ? embed(target, inner) : null;
  }
  return r;
}

function defaults(table: string, row: Row): Row {
  const now = new Date().toISOString();
  const base: Row = { id: crypto.randomUUID(), created_at: now };
  if (table === "orders") {
    const s = state();
    return { ...base, ref: `GQ26${String(s.seq++).padStart(5, "0")}`, status: "pending", gateway_bill_id: null, gateway_txn_id: null, proof_path: null, paid_at: null, admin_notes: null, buyer_address: null, ...row };
  }
  if (table === "campaigns") return { ...base, status: "draft", description: null, location: null, event_date: null, bank_name: null, bank_account_name: null, bank_account_no: null, ...row };
  if (table === "packages") return { ...base, active: true, sort_order: 0, code_prefix: "A", description: null, max_animals: null, ...row };
  return { ...base, ...row };
}

class Q implements PromiseLike<any> {
  private filters: ((r: Row) => boolean)[] = [];
  private sort: [string, boolean][] = [];
  private lim = 0; private sel = "*"; private mode: "many" | "single" | "maybe" = "many";
  private op: "select" | "insert" | "update" = "select"; private payload: any;
  constructor(private t: string) {}
  select(s = "*") { this.sel = s; return this; }
  eq(k: string, v: any) { if (!k.includes(".")) this.filters.push((r) => String(r[k]) === String(v)); return this; }
  neq(k: string, v: any) { this.filters.push((r) => String(r[k]) !== String(v)); return this; }
  in(k: string, v: any[]) { this.filters.push((r) => v.includes(r[k])); return this; }
  or(expr: string) {
    const parts = expr.split(",").map((p) => p.match(/^(\w+)\.ilike\.%(.*)%$/)).filter(Boolean) as RegExpMatchArray[];
    if (parts.length) this.filters.push((r) => parts.some(([, k, term]) => String(r[k] ?? "").toLowerCase().includes(term.toLowerCase())));
    return this;
  }
  order(k: string, o?: { ascending?: boolean }) { this.sort.push([k, o?.ascending !== false]); return this; }
  limit(n: number) { this.lim = n; return this; }
  single() { this.mode = "single"; return this; }
  maybeSingle() { this.mode = "maybe"; return this; }
  insert(p: any) { this.op = "insert"; this.payload = p; return this; }
  update(p: any) { this.op = "update"; this.payload = p; return this; }
  then<A, B>(res?: ((v: any) => A | PromiseLike<A>) | null, rej?: ((e: any) => B | PromiseLike<B>) | null) {
    return Promise.resolve(this.run()).then(res, rej);
  }
  private run() {
    const tables = T();
    const rows = (tables[this.t] ??= []);
    if (this.op === "insert") {
      const items = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((r: Row) => defaults(this.t, r));
      rows.push(...items);
      return { data: this.mode === "many" ? items : items[0], error: null };
    }
    let out = rows.filter((r) => this.filters.every((f) => f(r)));
    if (this.op === "update") { out.forEach((r) => Object.assign(r, this.payload)); return { data: null, error: null }; }
    for (const [k, asc] of [...this.sort].reverse()) out = [...out].sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * (asc ? 1 : -1));
    if (this.lim) out = out.slice(0, this.lim);
    out = out.map((r) => embed(r, this.sel));
    if (this.mode !== "many") return { data: out[0] ?? null, error: null };
    return { data: out, error: null };
  }
}

/** Same allocation rules as the mark_order_paid database function. */
function markPaid(orderId: string, method: string, txn: string | null) {
  const { orders, packages, animals, shares } = T();
  const o = orders.find((x) => x.id === orderId);
  if (!o || o.status === "paid") return o ?? null;
  const pkg = packages.find((p) => p.id === o.package_id)!;
  const names: string[] = Array.from({ length: o.quantity }, (_, i) => o.participants?.[i] || o.buyer_name);
  const used = (a: Row) => shares.filter((s) => s.animal_id === a.id).length;
  let remaining = o.quantity, idx = 0;
  while (remaining > 0) {
    let a = animals.filter((x) => x.package_id === pkg.id && x.status === "filling").sort((x, y) => x.seq - y.seq)
      .find((x) => pkg.shares_per_animal - used(x) >= remaining);
    if (!a && remaining < pkg.shares_per_animal) a = animals.filter((x) => x.package_id === pkg.id && x.status === "filling").sort((x, y) => x.seq - y.seq)[0];
    if (!a) {
      const n = Math.max(0, ...animals.filter((x) => x.package_id === pkg.id).map((x) => x.seq)) + 1;
      a = { id: crypto.randomUUID(), campaign_id: pkg.campaign_id, package_id: pkg.id, seq: n, code: `${pkg.code_prefix}-${String(n).padStart(3, "0")}`, status: "filling", notes: null, slaughtered_at: null, distributed_at: null };
      animals.push(a);
    }
    const take = Math.min(pkg.shares_per_animal - used(a), remaining);
    for (let i = 0; i < take; i++) {
      const taken = new Set(shares.filter((s) => s.animal_id === a!.id).map((s) => s.slot));
      let slot = 1; while (taken.has(slot)) slot++;
      shares.push({ id: crypto.randomUUID(), order_id: o.id, animal_id: a.id, slot, participant_name: names[idx++], created_at: new Date().toISOString() });
    }
    remaining -= take;
    if (used(a) >= pkg.shares_per_animal) a.status = "full";
  }
  Object.assign(o, { status: "paid", paid_at: new Date().toISOString(), payment_method: method, gateway_txn_id: txn ?? o.gateway_txn_id });
  return o;
}

export function demoClient(): any {
  return {
    from: (t: string) => new Q(t),
    rpc: async (name: string, args: any) => {
      if (name === "is_admin") return { data: true, error: null };
      if (name === "mark_order_paid") return { data: markPaid(args.p_order_id, args.p_method, args.p_txn_id), error: null };
      return { data: null, error: null };
    },
    storage: { from: () => ({ upload: async () => ({ error: null }), createSignedUrl: async () => ({ data: { signedUrl: null } }) }) },
    auth: {
      getUser: async () => ({ data: { user: { id: "u1", email: "demo@germy.my" } } }),
      signInWithPassword: async () => ({ error: null }),
      signOut: async () => ({ error: null }),
    },
  };
}
