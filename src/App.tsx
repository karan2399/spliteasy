import { useState } from "react";
import Tesseract from "tesseract.js";
import type { Person, Item } from "./types";

function App() {
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState("");

  const [items, setItems] = useState<Item[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  // Add Person
  const addPerson = () => {
    if (!name.trim()) return;
    setPeople([...people, { id: crypto.randomUUID(), name }]);
    setName("");
  };

  // Add Item
  const addItem = () => {
    if (!itemName || !itemPrice) return;
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        name: itemName,
        quantity: 1,
        price: parseFloat(itemPrice),
        taxPercent: 0,
        sharedBy: [],
      },
    ]);
    setItemName("");
    setItemPrice("");
  };

  // Calculate Split Totals
  const calculateTotals = () => {
    const totals: Record<string, number> = {};
    people.forEach((p) => (totals[p.id] = 0));

    items.forEach((item) => {
      if (item.sharedBy.length === 0) return;

      const base = item.price * item.quantity;
      const finalPrice = base + (base * item.taxPercent) / 100;
      const split = finalPrice / item.sharedBy.length;

      item.sharedBy.forEach((pid) => {
        totals[pid] += split;
      });
    });

    return totals;
  };

  const calculateGrandTotal = () => {
    return items.reduce((total, item) => {
      const base = item.price * item.quantity;
      const finalPrice = base + (base * item.taxPercent) / 100;
      return total + finalPrice;
    }, 0);
  };


  // OCR Handler
  const handleReceiptUpload = async (file: File) => {
    const { data } = await Tesseract.recognize(file, "eng");
    const text = data.text;
    parseReceiptText(text);
  };
  const parseReceiptText = (text: string) => {
    const lines = text.split("\n");
    const newItems: Item[] = [];

    lines.forEach((line) => {
      // Only match prices that appear AFTER $
      const match = line.match(/([a-zA-Z\s]+)\s*\$\s*(\d+(\.\d{1,2})?)/);

      if (match) {
        const name = match[1].trim();
        const price = parseFloat(match[2]);

        if (name && !isNaN(price)) {
          newItems.push({
            id: crypto.randomUUID(),
            name,
            price,
            quantity: 1,
            taxPercent: 0,
            sharedBy: [],
          });
        }
      }
    });

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    } else {
      alert("No items detected. Please check receipt or type manually.");
    }
  };

  const safeNum = (n: any, fallback = 0) =>
    typeof n === "number" && !isNaN(n) ? n : fallback;

  const calcItemBase = (item: Item) => {
    const price = safeNum(item.price);
    const qty = safeNum(item.quantity, 1);
    return price * qty;
  };

  const calcItemTax = (item: Item) => {
    const base = calcItemBase(item);
    const tax = safeNum(item.taxPercent);
    return (base * tax) / 100;
  };

  const calcItemTotal = (item: Item) => {
    return calcItemBase(item) + calcItemTax(item);
  };



  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>🧾 Ease Split</h1>

        {/* People Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Add People</h2>
          <div style={styles.row}>
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
            />
            <button style={styles.button} onClick={addPerson}>
              Add
            </button>
          </div>
          <div style={styles.chipContainer}>
            {people.map((p) => (
              <div key={p.id} style={styles.chip}>
                {p.name}
              </div>
            ))}
          </div>
        </div>

        {/* Items Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Add Items</h2>
          <div style={styles.row}>
            <input
              style={styles.input}
              placeholder="Item name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <input
              style={styles.input}
              placeholder="Price"
              type="number"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
            />
            <button style={styles.button} onClick={addItem}>
              Add
            </button>
          </div>

          {items.map((item) => (
            <div key={item.id} style={styles.itemCard}>
              <div style={styles.itemHeader}>
                <div>
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: "#333" }}>
                    Base: ${calcItemBase(item).toFixed(2)}
                  </div>
                  <div style={{ fontSize: 12, color: "#333" }}>
                    Tax ({item.taxPercent}%): ${calcItemTax(item).toFixed(2)}
                  </div>
                </div>

                <div style={{ fontWeight: 700 }}>
                  ${calcItemTotal(item).toFixed(2)}
                </div>
              </div>


              <div style={styles.row}>
                <label>
                  Tax:
                  <select
                    style={styles.select}
                    value={item.taxPercent}
                    onChange={(e) => {
                      const tax = parseFloat(e.target.value);
                      setItems(
                        items.map((i) =>
                          i.id === item.id ? { ...i, taxPercent: tax } : i
                        )
                      );
                    }}
                  >
                    <option value={0}>No Tax</option>
                    <option value={5}>5%</option>
                    <option value={13}>13%</option>
                    <option value={15}>15%</option>
                    <option value={18}>18%</option>
                  </select>
                </label>

                <label>
                  Qty:
                  <select
                    style={styles.select}
                    value={item.quantity}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value);
                      setItems(
                        items.map((i) =>
                          i.id === item.id ? { ...i, quantity: qty } : i
                        )
                      );
                    }}
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>

                <div style={{ marginLeft: 16 }}>
                  Shared by:
                  {people.map((p) => (
                    <label key={p.id} style={{ marginLeft: 8 }}>
                      <input
                        type="checkbox"
                        checked={item.sharedBy.includes(p.id)}
                        onChange={() => {
                          const updated = item.sharedBy.includes(p.id)
                            ? item.sharedBy.filter((id) => id !== p.id)
                            : [...item.sharedBy, p.id];

                          setItems(
                            items.map((i) =>
                              i.id === item.id ? { ...i, sharedBy: updated } : i
                            )
                          );
                        }}
                      />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Receipt Upload */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Upload Receipt</h2>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              if (!e.target.files) return;
              const file = e.target.files[0];
              await handleReceiptUpload(file);
            }}
          />
        </div>

        {/* Summary */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Summary</h2>

          {/* Grand Total */}
          <div style={{ ...styles.summary, fontSize: 16, color: "#662222" }}>
            Total: ${calculateGrandTotal().toFixed(2)}
          </div>

          {/* Per person */}
          {Object.entries(calculateTotals()).map(([pid, amount]) => {
            const person = people.find((p) => p.id === pid);
            return (
              <div key={pid} style={styles.summary}>
                {person?.name}: ${amount.toFixed(2)}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

// ================== Styles ==================
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    backgroundColor: "#2F5755",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 800,
  },
  title: {
    textAlign: "center",
    color: "#E8E2D8",
    marginBottom: 32,
  },
  section: {
    backgroundColor: "#6F8F72",
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  sectionTitle: {
    marginBottom: 16,
    color: "#111827",
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid #ccc",
    flex: 1,
    minWidth: 120,
  },
  select: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 8,
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  },
  chipContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  chip: {
    padding: "6px 12px",
    backgroundColor: "#2F5755",
    color: "#fff",
    borderRadius: 20,
    fontSize: 14,
  },
  itemCard: {
    backgroundColor: "#BFC6C4",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    border: "1px solid #e5e7eb",
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontWeight: 600,
    marginBottom: 12,
  },
  summary: {
    padding: 8,
    fontWeight: "bold",
    borderBottom: "1px solid #e5e7eb",
    color: "#000",
  },
};

export default App;
