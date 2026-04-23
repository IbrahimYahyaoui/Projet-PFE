import Profile from "./pages/Profile";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/login";
import { NotFound } from "./pages/NotFound";
import Dashbord from "./pages/dashbord";
import Users from "./pages/Users";
import Layout from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import CreateTicket from "./pages/CreateTicket";
import MyTickets from "./pages/MyTickets";
import AllTickets from "./pages/AllTickets";
import TicketDetails from "./pages/TicketDetails";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

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
  path="/tickets/:id"
  element={
    <ProtectedRoute>
      <Layout>
        <TicketDetails />
      </Layout>
    </ProtectedRoute>
  }
/>

        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;