const fs = require("fs");
const path = require("path");

// Path to CRM data
const CRM_FILE = path.join(__dirname, "..", "data", "crm.json");

// Read CRM data
function readCRM() {
  const data = fs.readFileSync(CRM_FILE, "utf-8");
  return JSON.parse(data);
}

// Write CRM data
function writeCRM(data) {
  fs.writeFileSync(
    CRM_FILE,
    JSON.stringify(data, null, 2),
    "utf-8"
  );
}


// 1. Get all customers


function getCustomers() {
  const crm = readCRM();

  return crm.customers;
}


// 2. Get all deals


function getDeals() {
  const crm = readCRM();

  return crm.deals;
}


// 3. Find customer by name


function findCustomerByName(name) {
  const crm = readCRM();

  const customer = crm.customers.find(
    (customer) =>
      customer.name.toLowerCase() === name.toLowerCase()
  );

  return customer || null;
}


// 4. Get customer history


function getCustomerHistory(customerName) {
  const crm = readCRM();

  const customer = crm.customers.find(
    (customer) =>
      customer.name.toLowerCase() === customerName.toLowerCase()
  );

  if (!customer) {
    return {
      found: false,
      message: `Customer "${customerName}" was not found in the CRM.`
    };
  }

  const deals = crm.deals.filter(
    (deal) => deal.customerId === customer.id
  );

  const notes = crm.notes.filter(
    (note) => note.customerId === customer.id
  );

  return {
    found: true,
    customer,
    deals,
    notes
  };
}


// 5. Get deals above a certain value


function getDealsAboveValue(minValue) {
  const crm = readCRM();

  return crm.deals.filter(
    (deal) => deal.value > minValue
  );
}

// --------------------------------------------------
// 6. Get deals by status
// --------------------------------------------------

function getDealsByStatus(status) {
  const crm = readCRM();

  return crm.deals.filter(
    (deal) =>
      deal.status.toLowerCase() === status.toLowerCase()
  );
}

// --------------------------------------------------
// 7. Update deal status
// --------------------------------------------------

function updateDealStatus(dealId, newStatus) {
  const crm = readCRM();

  const validStatuses = [
    "New",
    "Contacted",
    "Won",
    "Lost"
  ];

  if (!validStatuses.includes(newStatus)) {
    return {
      success: false,
      message:
        `Invalid status "${newStatus}". ` +
        `Allowed statuses: ${validStatuses.join(", ")}`
    };
  }

  const deal = crm.deals.find(
    (deal) => deal.id === Number(dealId)
  );

  if (!deal) {
    return {
      success: false,
      message: `Deal with ID ${dealId} was not found.`
    };
  }

  const oldStatus = deal.status;

  deal.status = newStatus;

  deal.lastUpdated = new Date()
    .toISOString()
    .split("T")[0];

  writeCRM(crm);

  return {
    success: true,
    message:
      `Deal "${deal.title}" was moved from ` +
      `"${oldStatus}" to "${newStatus}".`,
    deal
  };
}

// --------------------------------------------------
// 8. Add note to customer
// --------------------------------------------------

function addCustomerNote(customerName, text) {
  const crm = readCRM();

  const customer = crm.customers.find(
    (customer) =>
      customer.name.toLowerCase() === customerName.toLowerCase()
  );

  if (!customer) {
    return {
      success: false,
      message:
        `Customer "${customerName}" was not found in the CRM.`
    };
  }

  const newId =
    Math.max(
      0,
      ...crm.notes.map((note) => note.id)
    ) + 1;

  const newNote = {
    id: newId,
    customerId: customer.id,
    text,
    createdAt: new Date()
      .toISOString()
      .split("T")[0]
  };

  crm.notes.push(newNote);

  writeCRM(crm);

  return {
    success: true,
    message:
      `Note successfully added to ${customer.name}.`,
    note: newNote
  };
}

// --------------------------------------------------
// 9. Assign deal to salesperson
// --------------------------------------------------

function assignDeal(dealId, salesperson) {
  const crm = readCRM();

  const deal = crm.deals.find(
    (deal) => deal.id === Number(dealId)
  );

  if (!deal) {
    return {
      success: false,
      message: `Deal with ID ${dealId} was not found.`
    };
  }

  deal.assignedTo = salesperson;

  deal.lastUpdated = new Date()
    .toISOString()
    .split("T")[0];

  writeCRM(crm);

  return {
    success: true,
    message:
      `Deal "${deal.title}" was assigned to ${salesperson}.`,
    deal
  };
}

// --------------------------------------------------
// Export tools
// --------------------------------------------------

module.exports = {
  getCustomers,
  getDeals,
  findCustomerByName,
  getCustomerHistory,
  getDealsAboveValue,
  getDealsByStatus,
  updateDealStatus,
  addCustomerNote,
  assignDeal
};