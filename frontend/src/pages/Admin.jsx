import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://192.168.1.44:8000";
const ADMIN_SESSION_KEY = "qr_admin_session";

function getStoredSession() {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.expiresAt) {
      return null;
    }

    if (Date.now() >= parsed.expiresAt) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

function getAuthConfig(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

function Admin() {
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ name: "", category: "", price: "", description: "" });
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [session, setSession] = useState(() => getStoredSession());
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = useMemo(
    () => ({
      totalFoods: foods.length,
      totalOrders: orders.length,
      completedOrders: orders.filter((order) => order.status === "Completed").length,
      pendingOrders: orders.filter((order) => order.status !== "Completed").length,
    }),
    [foods, orders]
  );

  const handleSidebarToggle = () => setSidebarOpen((open) => !open);
  const closeSidebar = () => setSidebarOpen(false);
  const handleSectionChange = (section) => {
    setActiveSection(section);
    closeSidebar();
  };

  useEffect(() => {
    let isMounted = true;

    async function validateExistingSession() {
      if (!session?.token) {
        if (isMounted) {
          setAuthLoading(false);
        }
        return;
      }

      try {
        await axios.get(`${API_BASE}/admin/session`, getAuthConfig(session.token));
      } catch {
        clearSession();
        if (isMounted) {
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    validateExistingSession();

    return () => {
      isMounted = false;
    };
  }, [session?.token]);

  useEffect(() => {
    if (!session?.token) {
      setFoods([]);
      setOrders([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setFeedback("");

      try {
        const [foodRes, orderRes] = await Promise.all([
          axios.get(`${API_BASE}/admin/foods`, getAuthConfig(session.token)),
          axios.get(`${API_BASE}/admin/orders`, getAuthConfig(session.token)),
        ]);

        if (!isMounted) {
          return;
        }

        setFoods(Array.isArray(foodRes.data) ? foodRes.data : []);
        setOrders(Array.isArray(orderRes.data) ? orderRes.data : []);
      } catch {
        if (!isMounted) {
          return;
        }

        setFeedback("Unable to load admin data. Please login again.");
        clearSession();
        setSession(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [session?.token]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginInput = (event) => {
    const { name, value } = event.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError("");

    if (!loginForm.email || !loginForm.password) {
      setLoginError("Please enter admin email and password.");
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/admin/login`, {
        email: loginForm.email,
        password: loginForm.password,
      });

      const nextSession = {
        token: response.data.token,
        expiresAt: response.data.expiresAt,
      };

      saveSession(nextSession);
      setSession(nextSession);
      setLoginForm({ email: "", password: "" });
      setFeedback("");
    } catch {
      setLoginError("Invalid admin credentials.");
    }
  };

  const handleLogout = async () => {
    if (session?.token) {
      try {
        await axios.post(`${API_BASE}/admin/logout`, {}, getAuthConfig(session.token));
      } catch {
        // Ignore logout API errors and clear local session anyway.
      }
    }

    clearSession();
    setSession(null);
    setFeedback("");
    setLoginError("");
  };

  const fetchFoods = async () => {
    if (!session?.token) {
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/admin/foods`, getAuthConfig(session.token));
      setFoods(Array.isArray(response.data) ? response.data : []);
    } catch {
      setFeedback("Failed to refresh menu items.");
    }
  };

  const fetchOrders = async () => {
    if (!session?.token) {
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/admin/orders`, getAuthConfig(session.token));
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch {
      setFeedback("Failed to refresh orders.");
    }
  };

  const handleDeleteFood = async (foodId) => {
    if (!session?.token) {
      setFeedback("Session expired. Please login again.");
      return;
    }

    try {
      await axios.delete(`${API_BASE}/admin/foods/${foodId}`, getAuthConfig(session.token));
      setFeedback("Menu item deleted successfully.");
      fetchFoods();
    } catch {
      setFeedback("Failed to delete menu item.");
    }
  };

  const handleCompleteOrder = async (orderId) => {
    if (!session?.token) {
      setFeedback("Session expired. Please login again.");
      return;
    }

    try {
      await axios.put(`${API_BASE}/admin/orders/${orderId}/complete`, {}, getAuthConfig(session.token));
      setFeedback("Order marked as completed.");
      fetchOrders();
    } catch {
      setFeedback("Failed to update order status.");
    }
  };

  const handleAddFood = async (event) => {
    event.preventDefault();
    setFeedback("");

    const price = parseFloat(form.price);
    if (!form.name || !form.category || !price || price <= 0) {
      setFeedback("Please enter a valid name, category, and price.");
      return;
    }

    if (!session?.token) {
      setFeedback("Session expired. Please login again.");
      return;
    }

    try {
      await axios.post(
        `${API_BASE}/admin/foods/add`,
        {
          ...form,
          price,
        },
        getAuthConfig(session.token)
      );

      setForm({ name: "", category: "", price: "", description: "" });
      setFeedback("Menu item added successfully.");
      fetchFoods();
    } catch {
      setFeedback("Failed to add menu item.");
    }
  };

  if (authLoading) {
    return (
      <div className="page page-admin">
        <main className="panel login-panel">
          <p className="empty">Checking admin session...</p>
        </main>
      </div>
    );
  }

  if (!session?.token) {
    return (
      <div className="page page-admin login-wrap">
        <header className="hero">
          <p className="eyebrow">Admin Panel</p>
          <h1>Admin Login</h1>
          <p className="subtitle">Sign in to manage menu items and monitor restaurant orders.</p>
        </header>

        <main className="panel login-panel">
          <div className="panel-header">
            <h2>Secure Access</h2>
            <p className="muted">Use your admin credentials.</p>
          </div>

          {loginError && <p className="admin-feedback">{loginError}</p>}

          <form className="admin-form" onSubmit={handleLogin}>
            <label>
              Admin Email
              <input
                name="email"
                value={loginForm.email}
                onChange={handleLoginInput}
                placeholder="admin@gmail.com"
              />
            </label>

            <label>
              Password
              <input
                name="password"
                value={loginForm.password}
                onChange={handleLoginInput}
                type="password"
                placeholder="admin"
              />
            </label>

            <p className="muted">Default credentials: admin@gmail.com / admin</p>

            <button className="btn btn-order" type="submit">
              Login
            </button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="page page-admin">
      <header className="hero">
        <div className="hero-header-row">
          <p className="eyebrow">Admin Panel</p>
          <button
            className="sidebar-toggle"
            type="button"
            onClick={handleSidebarToggle}
            aria-label="Toggle admin menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        <h1>Restaurant Control</h1>
        <p className="subtitle">
          Manage menu items, monitor kitchen orders, and keep your QR menu experience
          perfectly in sync.
        </p>
      </header>

      <div className="admin-shell">
        <div
          className={`sidebar-backdrop${sidebarOpen ? " active" : ""}`}
          onClick={closeSidebar}
        />

        <aside className={`panel admin-sidebar${sidebarOpen ? " open" : ""}`}>
          <div className="panel-header">
            <h2>Admin Menu</h2>
          </div>

          <nav className="admin-nav">
            <button
              type="button"
              className={`admin-nav-item ${activeSection === "dashboard" ? "active" : ""}`}
              onClick={() => handleSectionChange("dashboard")}
            >
              Dashboard
            </button>
            <button
              type="button"
              className={`admin-nav-item ${activeSection === "menu" ? "active" : ""}`}
              onClick={() => handleSectionChange("menu")}
            >
              Menu Items
            </button>
            <button
              type="button"
              className={`admin-nav-item ${activeSection === "orders" ? "active" : ""}`}
              onClick={() => handleSectionChange("orders")}
            >
              Orders
            </button>
          </nav>

          <div className="admin-sidebar-footer">
            <p className="muted">Logged in as</p>
            <p><strong>admin@gmail.com</strong></p>
            <button className="btn btn-ghost" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </aside>

        <main className="admin-main">
          {feedback && <p className="admin-feedback">{feedback}</p>}

          {activeSection === "dashboard" && (
            <>
              <section className="metrics-grid">
                <article className="metric-card">
                  <p className="metric-label">Menu Items</p>
                  <p className="metric-value">{stats.totalFoods}</p>
                </article>
                <article className="metric-card">
                  <p className="metric-label">Total Orders</p>
                  <p className="metric-value">{stats.totalOrders}</p>
                </article>
                <article className="metric-card">
                  <p className="metric-label">Pending Orders</p>
                  <p className="metric-value">{stats.pendingOrders}</p>
                </article>
                <article className="metric-card">
                  <p className="metric-label">Completed Orders</p>
                  <p className="metric-value">{stats.completedOrders}</p>
                </article>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <h2>Quick Notes</h2>
                </div>
                <p className="muted">Use the sidebar to switch between dashboard, menu management, and orders.</p>
              </section>
            </>
          )}

          {activeSection === "menu" && (
            <section className="panel admin-panel">
              <div className="panel-header">
                <h2>Menu Manager</h2>
              </div>

              <form className="admin-form" onSubmit={handleAddFood}>
                <div className="form-row">
                  <label>
                    Item name
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      placeholder="Masala Dosa"
                    />
                  </label>
                  <label>
                    Category
                    <input
                      name="category"
                      value={form.category}
                      onChange={handleFormChange}
                      placeholder="Breakfast"
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Price
                    <input
                      name="price"
                      value={form.price}
                      onChange={handleFormChange}
                      placeholder="250"
                      type="number"
                      min="1"
                    />
                  </label>
                  <label>
                    Description
                    <input
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      placeholder="Crispy rice crepe with potato filling"
                    />
                  </label>
                </div>
                <button className="btn btn-order" type="submit">
                  Add Menu Item
                </button>
              </form>

              <div className="admin-list">
                <h3>Current Menu Items</h3>
                {loading ? (
                  <p className="empty">Loading menu items...</p>
                ) : foods.length === 0 ? (
                  <p className="empty">No menu items found.</p>
                ) : (
                  <div className="menu-grid admin-grid">
                    {foods.map((food) => (
                      <article key={food._id || food.name} className="menu-card admin-card">
                        <div className="food-meta">
                          <p className="chip">{food.category || "Other"}</p>
                          <p className="muted">₹{food.price}</p>
                        </div>
                        <h3>{food.name}</h3>
                        <p className="food-desc">{food.description || "No description"}</p>
                        <div className="admin-card-actions">
                          <button
                            className="btn btn-ghost"
                            type="button"
                            onClick={() => handleDeleteFood(food._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {activeSection === "orders" && (
            <section className="panel admin-panel">
              <div className="panel-header">
                <h2>Order Activity</h2>
                <p className="muted">Latest orders from the kitchen queue.</p>
              </div>

              {orders.length === 0 ? (
                <p className="empty">No orders available yet.</p>
              ) : (
                <div className="orders-grid admin-orders">
                  {orders.map((order) => (
                    <article key={order._id} className="order-card admin-card">
                      <div className="order-head">
                        <h3>Table {order.tableNumber}</h3>
                        <span className={`chip ${order.status === "Completed" ? "chip-complete" : "chip-pending"}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="order-items">
                        {order.items.map((item) => (
                          <p key={`${order._id}-${item.foodId}-${item.name}`} className="cart-row">
                            <span>{item.name}</span>
                            <span>x {item.qty}</span>
                          </p>
                        ))}
                      </div>
                      {order.status !== "Completed" && (
                        <button
                          className="btn btn-order"
                          type="button"
                          onClick={() => handleCompleteOrder(order._id)}
                        >
                          Complete Order
                        </button>
                      )}
                      <p className="muted">Placed {new Date(order.createdAt).toLocaleString()}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default Admin;
