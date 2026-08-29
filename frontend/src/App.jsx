import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:5000";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  // CRM data
  const [customers, setCustomers] = useState([]);
  const [deals, setDeals] = useState([]);

  // Loading/error states
  const [crmLoading, setCrmLoading] = useState(true);
  const [crmError, setCrmError] = useState("");

  // AI Chat states
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  // ==================================================
  // LOAD CRM DATA
  // ==================================================

  useEffect(() => {
    loadCRMData();
  }, []);

  const loadCRMData = async () => {
    setCrmLoading(true);
    setCrmError("");

    try {
      const [customersResponse, dealsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/customers`),
        fetch(`${API_BASE_URL}/api/deals`),
      ]);

      if (!customersResponse.ok) {
        throw new Error("Failed to load customers.");
      }

      if (!dealsResponse.ok) {
        throw new Error("Failed to load deals.");
      }

      const customersData = await customersResponse.json();
      const dealsData = await dealsResponse.json();

      // Handle either direct arrays or { customers: [...] }
      setCustomers(
        Array.isArray(customersData)
          ? customersData
          : customersData.customers || []
      );

      // Handle either direct arrays or { deals: [...] }
      setDeals(
        Array.isArray(dealsData)
          ? dealsData
          : dealsData.deals || []
      );
    } catch (error) {
      console.error("CRM loading error:", error);
      setCrmError(error.message);
    } finally {
      setCrmLoading(false);
    }
  };

  // ==================================================
  // DASHBOARD CALCULATIONS
  // ==================================================

  const totalCustomers = customers.length;

  const totalDeals = deals.length;

  const wonDeals = deals.filter(
    (deal) =>
      String(deal.status || "").toLowerCase() === "won"
  ).length;

  const contactedLeads = deals.filter(
    (deal) =>
      String(deal.status || "").toLowerCase() === "contacted"
  ).length;

  const totalDealValue = deals.reduce(
    (total, deal) =>
      total + Number(deal.value || 0),
    0
  );

  // ==================================================
  // AI CHAT
  // ==================================================

  const sendMessage = async () => {
    if (!message.trim() || loading) {
      return;
    }

    setLoading(true);
    setReply("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: message.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          "Something went wrong"
        );
      }

      setReply(
        data.reply ||
        "No response received from the AI."
      );
    } catch (error) {
      console.error("Chat error:", error);

      setReply(
        `Error: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // ENTER KEY
  // ==================================================

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  // ==================================================
  // FORMAT CURRENCY
  // ==================================================

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  // ==================================================
  // MAIN UI
  // ==================================================

  return (
    <div className="app">

      {/* ============================================
          SIDEBAR
      ============================================ */}

      <aside className="sidebar">

        <h1>Nelgates CRM</h1>

        <nav>

          <button
            className={
              activePage === "Dashboard"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("Dashboard")
            }
          >
            🏠 Dashboard
          </button>

          <button
            className={
              activePage === "Customers"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("Customers")
            }
          >
            👥 Customers
          </button>

          <button
            className={
              activePage === "Deals"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("Deals")
            }
          >
            💼 Deals
          </button>

          <button
            className={
              activePage === "AI Chat"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("AI Chat")
            }
          >
            🤖 AI Assistant
          </button>

        </nav>

      </aside>

      {/* ============================================
          MAIN CONTENT
      ============================================ */}

      <main className="main">

        {/* HEADER */}

        <header className="header">

          <h2>{activePage}</h2>

          <span>
            CRM Assistant
          </span>

        </header>

        {/* ==========================================
            CRM ERROR
        ========================================== */}

        {crmError && (
          <div className="error-box">
            <strong>CRM Error:</strong>{" "}
            {crmError}

            <button
              onClick={loadCRMData}
            >
              Retry
            </button>
          </div>
        )}

        {/* ==========================================
            DASHBOARD
        ========================================== */}

        {activePage === "Dashboard" && (

          <section>

            {crmLoading ? (

              <div className="loading">
                Loading CRM data...
              </div>

            ) : (

              <>

                <div className="cards">

                  <div className="card">
                    <h3>
                      Customers
                    </h3>

                    <p>
                      {totalCustomers}
                    </p>
                  </div>

                  <div className="card">
                    <h3>
                      Total Deals
                    </h3>

                    <p>
                      {totalDeals}
                    </p>
                  </div>

                  <div className="card">
                    <h3>
                      Won Deals
                    </h3>

                    <p>
                      {wonDeals}
                    </p>
                  </div>

                  <div className="card">
                    <h3>
                      Contacted Leads
                    </h3>

                    <p>
                      {contactedLeads}
                    </p>
                  </div>

                  <div className="card">
                    <h3>
                      Total Deal Value
                    </h3>

                    <p>
                      {formatCurrency(
                        totalDealValue
                      )}
                    </p>
                  </div>

                </div>

                <div className="welcome">

                  <h2>
                    Welcome to Nelgates CRM 👋
                  </h2>

                  <p>
                    Manage customers, deals and
                    notes using the CRM dashboard.
                  </p>

                  <p>
                    Your dashboard is connected
                    to the CRM backend.
                  </p>

                </div>

              </>

            )}

          </section>
        )}

        {/* ==========================================
            CUSTOMERS
        ========================================== */}

        {activePage === "Customers" && (

          <section className="content-box">

            <div className="section-header">

              <h2>
                Customers
              </h2>

              <button
                onClick={loadCRMData}
                className="refresh-button"
              >
                🔄 Refresh
              </button>

            </div>

            {crmLoading ? (

              <div className="loading">
                Loading customers...
              </div>

            ) : customers.length === 0 ? (

              <div className="empty">
                No customers found.
              </div>

            ) : (

              <div className="customer-list">

                {customers.map((customer) => (

                  <div
                    className="customer"
                    key={customer.id}
                  >

                    <strong>
                      {customer.name}
                    </strong>

                    <span>
                      {customer.email || "No email"}
                    </span>

                    <span>
                      {customer.company ||
                        "No company"}
                    </span>

                  </div>

                ))}

              </div>

            )}

          </section>
        )}

        {/* ==========================================
            DEALS
        ========================================== */}

        {activePage === "Deals" && (

          <section className="content-box">

            <div className="section-header">

              <h2>
                Deals
              </h2>

              <button
                onClick={loadCRMData}
                className="refresh-button"
              >
                🔄 Refresh
              </button>

            </div>

            {crmLoading ? (

              <div className="loading">
                Loading deals...
              </div>

            ) : deals.length === 0 ? (

              <div className="empty">
                No deals found.
              </div>

            ) : (

              <div className="deal-list">

                {deals.map((deal) => (

                  <div
                    className="deal"
                    key={deal.id}
                  >

                    <strong>
                      {deal.title}
                    </strong>

                    <span>
                      {formatCurrency(
                        deal.value
                      )}
                    </span>

                    <span className="status">
                      {deal.status}
                    </span>

                  </div>

                ))}

              </div>

            )}

          </section>
        )}

        {/* ==========================================
            AI CHAT
        ========================================== */}

        {activePage === "AI Chat" && (

          <section className="chat-box">

            <h2>
              🤖 CRM AI Assistant
            </h2>

            <p>
              Ask questions about customers,
              deals and CRM data.
            </p>

            {/* INPUT */}

            <div className="chat-input">

              <input
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Ask something about your CRM..."
                disabled={loading}
              />

              <button
                onClick={sendMessage}
                disabled={
                  loading ||
                  !message.trim()
                }
              >
                {loading
                  ? "Thinking..."
                  : "Send"}
              </button>

            </div>

            {/* AI RESPONSE */}

            {reply && (

              <div className="chat-response">

                <h3>
                  🤖 AI Assistant
                </h3>

                <p>
                  {reply}
                </p>

              </div>

            )}

          </section>
        )}

      </main>

    </div>
  );
}

export default App;