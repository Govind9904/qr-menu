import { useEffect, useState } from "react";
import axios from "axios";

function Kitchen() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  function fetchOrders() {
    axios
      .get("http://localhost:5000/orders")
      .then((res) => setOrders(res.data));
  }

  const completeOrder = (id) => {
    axios.put(`http://localhost:5000/orders/${id}`).then(() => fetchOrders());
  };

  return (
    <div className="page page-kitchen">
      <header className="hero">
        <p className="eyebrow">Kitchen Dashboard</p>
        <h1>Live Orders</h1>
        <p className="subtitle">Track incoming tables and mark prepared orders as complete.</p>
      </header>

      <main className="panel">
        <div className="panel-header">
          <h2>Active Queue</h2>
          <p className="muted">{orders.length} orders</p>
        </div>

        {orders.length === 0 ? (
          <p className="empty">No orders yet.</p>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <article key={order._id} className="order-card">
                <div className="order-head">
                  <h3>Table {order.tableNumber}</h3>
                  <p
                    className={`chip ${
                      order.status === "Completed" ? "chip-complete" : "chip-pending"
                    }`}
                  >
                    {order.status}
                  </p>
                </div>

                <div className="order-items">
                  {order.items.map((item) => (
                    <p key={`${order._id}-${item.foodId}-${item.name}`} className="cart-row">
                      <span>{item.name}</span>
                      <span>x {item.qty}</span>
                    </p>
                  ))}
                </div>

                <button
                  className="btn btn-order"
                  onClick={() => completeOrder(order._id)}
                  disabled={order.status === "Completed"}
                >
                  {order.status === "Completed" ? "Completed" : "Mark Complete"}
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Kitchen;
