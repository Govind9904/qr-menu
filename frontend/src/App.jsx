import Menu from "./pages/Menu";
import Kitchen from "./pages/Kitchen";
import Admin from "./pages/Admin";

function App() {
  const path = window.location.pathname;

  if (path === "/kitchen" || path === "/kitchen/") {
    return <Kitchen />;
  }

  if (path === "/admin" || path === "/admin/") {
    return <Admin />;
  }

  return <Menu />;
}

export default App;
