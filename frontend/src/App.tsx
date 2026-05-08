import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Home } from "./pages/Home";
import { Login } from "./pages/login";
import { NotFound } from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Dashbord from "./pages/dashbord";
import AllTickets from "./pages/AllTickets";
import MyTickets from "./pages/MyTickets";
import AssignedTickets from "./pages/AssignedTickets";
import TicketDetails from "./pages/TicketDetails";
import CreateTicket from "./pages/CreateTicket";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Team from "./pages/Team";
import Analytics from "./pages/Analytics";
import Projects from "./pages/Projects";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ══════ PUBLIC ROUTES ══════ */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* ══════ PROTECTED ROUTES ══════ */}
        <Route
          path="/Dashbord"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashbord />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-tickets"
          element={
            <ProtectedRoute>
              <Layout>
                <MyTickets />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/all-tickets"
          element={
            <ProtectedRoute>
              <Layout>
                <AllTickets />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/assigned-tickets"
          element={
            <ProtectedRoute>
              <Layout>
                <AssignedTickets />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <TicketDetails />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-ticket"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateTicket />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
  path="/team"
  element={
    <ProtectedRoute>
      <Layout>
        <Team />
      </Layout>
    </ProtectedRoute>
  }
  
/>
<Route
  path="/analytics"
  element={
    <ProtectedRoute>
      <Layout>
        <Analytics />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route
  path="/projects"
  element={
    <ProtectedRoute>
      <Layout>
        <Projects />
      </Layout>
    </ProtectedRoute>
  }
/>

        {/* ══════ 404 ══════ */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;