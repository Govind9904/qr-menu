import { useEffect, useState } from "react";
import axios from "axios";
import menuData from "../data/menuData.json";

function Menu() {
  const [foods, setFoods] = useState(menuData);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/foods")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setFoods(res.data);
        }
      })
      .catch(() => {
        console.warn("Failed to fetch backend menu, using local menu data.");
      });
  }, []);

  const tableNumber = new URLSearchParams(window.location.search).get("table");
  const groupedFoods = foods.reduce((groups, food) => {
    const key = food.category || "Others";
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(food);
    return groups;
  }, {});

  const addToCart = (food) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.foodId === String(food.id));

      if (existingItem) {
        return prevCart.map((item) =>
          item.foodId === String(food.id) ? { ...item, qty: item.qty + 1 } : item
        );
      }

      return [
        ...prevCart,
        {
          foodId: String(food.id),
          name: food.name,
          qty: 1,
          price: food.price,
        },
      ];
    });
  };

  const placeOrder = async () => {
    if (!tableNumber) {
      alert("Missing table number in URL. Use /menu?table=1");
      return;
    }

    if (cart.length === 0) {
      alert("Please add at least one item to place an order.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/orders", {
        tableNumber: Number(tableNumber),
        items: cart,
      });

      alert("Order Placed");
      setCart([]);
    } catch {
      alert("Failed to place order. Please try again.");
    }
  };

  const totalItems = cart.reduce((total, item) => total + item.qty, 0);
  const subtotal = cart.reduce((total, item) => total + item.qty * item.price, 0);

  return (
    <div className="page page-menu">
      <header className="hero">
        <p className="eyebrow">QR Menu</p>
        <h1>Table {tableNumber || "?"}</h1>
        <p className="subtitle">Tap dishes to build your order and send it to the kitchen.</p>
      </header>

      <main className="layout">
        <section className="panel">
          <div className="panel-header">
            <h2>Menu</h2>
          </div>

          {foods.length === 0 ? (
            <p className="empty">No menu items found.</p>
          ) : (
            Object.entries(groupedFoods).map(([category, items]) => (
              <div key={category} className="menu-group">
                <h3 className="group-title">{category}</h3>
                <div className="menu-grid">
                  {items.map((food) => (
                    <article key={food.id} className="menu-card">
                      <div className="food-meta">
                        <p className="chip">{food.type || food.category}</p>
                        <p className="muted">{food.prepTime || "Quick serve"}</p>
                      </div>
                      <h3>{food.name}</h3>
                      <p className="food-desc">{food.description || "Chef special item."}</p>
                      <p className="price">₹{food.price}</p>
                      <button className="btn btn-add" onClick={() => addToCart(food)}>
                        Add to Cart
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        <aside className="panel cart-panel">
          <div className="panel-header">
            <h2>Your Cart</h2>
            <p className="muted">{totalItems} items</p>
          </div>

          {cart.length === 0 ? (
            <p className="empty">No items added yet.</p>
          ) : (
            <div className="cart-list">
              {cart.map((item) => (
                <p key={item.foodId} className="cart-row">
                  <span>
                    {item.name} x {item.qty}
                  </span>
                  <span>₹{item.qty * item.price}</span>
                </p>
              ))}
            </div>
          )}

          <div className="cart-footer">
            <p className="total">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </p>
            <button className="btn btn-order" onClick={placeOrder}>
              Place Order
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default Menu;
