import { Outlet } from "react-router-dom";
import Nav from "./Nav";
import Footer from "./Footer";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Nav />
      <main className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
