const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI, Type } = require("@google/genai");

const {
  getCustomers,
  getDeals,
  findCustomerByName,
  getDealsByStatus,
  updateDealStatus,
  addCustomerNote,
  assignDeal,
} = require("./tools/crmTools");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;

// =====================================================
// GEMINI
// =====================================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// You can change this later through .env if needed.
// Example:
// GEMINI_MODEL=gemini-3-flash-preview
const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3-flash-preview";

// =====================================================
// CRM TOOL DEFINITIONS
// =====================================================

const crmTools = [
  {
    functionDeclarations: [

      // -------------------------------------------------
      // 1. GET CUSTOMERS
      // -------------------------------------------------

      {
        name: "get_customers",
        description:
          "Get all customers stored in the CRM.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },

      // -------------------------------------------------
      // 2. GET DEALS
      // -------------------------------------------------

      {
        name: "get_deals",
        description:
          "Get all deals stored in the CRM.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },

      // -------------------------------------------------
      // 3. FIND CUSTOMER
      // -------------------------------------------------

      {
        name: "find_customer",
        description:
          "Find a customer by exact or close matching name. Use this before performing customer-specific actions.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description:
                "The customer's name",
            },
          },
          required: ["name"],
        },
      },

      // -------------------------------------------------
      // 4. GET DEALS BY STATUS
      // -------------------------------------------------

      {
        name: "get_deals_by_status",
        description:
          "Get all deals with a particular status such as New, Contacted, Won, or Lost.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            status: {
              type: Type.STRING,
              description:
                "Deal status: New, Contacted, Won, or Lost",
            },
          },
          required: ["status"],
        },
      },

      // -------------------------------------------------
      // 5. UPDATE DEAL STATUS
      // -------------------------------------------------

      {
        name: "update_deal_status",
        description:
          "Update the status of an existing CRM deal. Only use this after identifying the exact deal.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            dealId: {
              type: Type.NUMBER,
              description:
                "The exact ID of the deal to update",
            },

            status: {
              type: Type.STRING,
              description:
                "The new status: New, Contacted, Won, or Lost",
            },
          },
          required: ["dealId", "status"],
        },
      },

      // -------------------------------------------------
      // 6. ADD NOTE
      // -------------------------------------------------

      {
        name: "add_note",
        description:
          "Add a note to an existing CRM customer. Verify that the customer exists before adding the note.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            customerName: {
              type: Type.STRING,
              description:
                "The exact customer name",
            },

            text: {
              type: Type.STRING,
              description:
                "The note to add",
            },
          },
          required: ["customerName", "text"],
        },
      },

      // -------------------------------------------------
      // 7. ASSIGN LEAD
      // -------------------------------------------------

      {
        name: "assign_lead",
        description:
          "Assign an existing CRM deal/lead to a salesperson. Verify that the deal exists before assigning it.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            dealId: {
              type: Type.NUMBER,
              description:
                "The exact deal ID",
            },

            assignedTo: {
              type: Type.STRING,
              description:
                "The salesperson name",
            },
          },
          required: ["dealId", "assignedTo"],
        },
      },

    ],
  },
];

// =====================================================
// TOOL EXECUTOR
// =====================================================

function executeTool(name, args) {

  console.log("\n==============================");
  console.log("AI TOOL CALL");
  console.log("Tool:", name);
  console.log("Arguments:", args);
  console.log("==============================");

  switch (name) {

    // -------------------------------------------------
    // GET CUSTOMERS
    // -------------------------------------------------

    case "get_customers":
      return getCustomers();

    // -------------------------------------------------
    // GET DEALS
    // -------------------------------------------------

    case "get_deals":
      return getDeals();

    // -------------------------------------------------
    // FIND CUSTOMER
    // -------------------------------------------------

    case "find_customer":
      return findCustomerByName(args.name);

    // -------------------------------------------------
    // GET DEALS BY STATUS
    // -------------------------------------------------

    case "get_deals_by_status":
      return getDealsByStatus(args.status);

    // -------------------------------------------------
    // UPDATE DEAL STATUS
    // -------------------------------------------------

    case "update_deal_status": {

      const validStatuses = [
        "New",
        "Contacted",
        "Won",
        "Lost",
      ];

      if (!validStatuses.includes(args.status)) {
        return {
          success: false,
          error:
            "Invalid status. Allowed values are New, Contacted, Won, Lost.",
        };
      }

      // Safety check:
      // Make sure the deal actually exists.

      const deals = getDeals();

      const deal = deals.find(
        (item) =>
          item.id === Number(args.dealId)
      );

      if (!deal) {
        return {
          success: false,
          error:
            `Deal with ID ${args.dealId} was not found in the CRM.`,
        };
      }

      console.log(
        `Updating deal ${deal.id}: ${deal.title}`
      );

      return updateDealStatus(
        Number(args.dealId),
        args.status
      );
    }

    // -------------------------------------------------
    // ADD NOTE
    // -------------------------------------------------

    case "add_note": {

      // First verify the customer exists.

      const customer =
        findCustomerByName(args.customerName);

      if (!customer) {
        return {
          success: false,
          error:
            `Customer "${args.customerName}" was not found in the CRM.`,
        };
      }

      console.log(
        `Adding note to customer: ${customer.name}`
      );

      return addCustomerNote(
        customer.name,
        args.text
      );
    }

    // -------------------------------------------------
    // ASSIGN LEAD
    // -------------------------------------------------

    case "assign_lead": {

      // First verify the deal exists.

      const deals = getDeals();

      const deal = deals.find(
        (item) =>
          item.id === Number(args.dealId)
      );

      if (!deal) {
        return {
          success: false,
          error:
            `Deal with ID ${args.dealId} was not found.`,
        };
      }

      console.log(
        `Assigning deal ${deal.id} to ${args.assignedTo}`
      );

      return assignDeal(
        Number(args.dealId),
        args.assignedTo
      );
    }

    // -------------------------------------------------
    // UNKNOWN TOOL
    // -------------------------------------------------

    default:

      return {
        success: false,
        error:
          `Unknown CRM tool: ${name}`,
      };
  }
}

// =====================================================
// BASIC ROUTE
// =====================================================

app.get("/", (req, res) => {

  res.json({
    message:
      "CRM backend is running",
  });

});

// =====================================================
// CRM GET ROUTES
// =====================================================

// Get all customers

app.get("/api/customers", (req, res) => {

  res.json(
    getCustomers()
  );

});

// Get all deals

app.get("/api/deals", (req, res) => {

  res.json(
    getDeals()
  );

});

// =====================================================
// CUSTOMER SEARCH
// =====================================================

app.get(
  "/api/customers/:name",
  (req, res) => {

    const customer =
      findCustomerByName(
        req.params.name
      );

    if (!customer) {

      return res.status(404).json({
        error:
          "Customer not found",
      });

    }

    res.json(customer);
  }
);

// =====================================================
// DEALS BY STATUS
// =====================================================

app.get(
  "/api/deals/status/:status",
  (req, res) => {

    const deals =
      getDealsByStatus(
        req.params.status
      );

    res.json({
      count: deals.length,
      deals,
    });

  }
);

// =====================================================
// UPDATE DEAL
// =====================================================

app.post(
  "/api/deals/:id/status",
  (req, res) => {

    const { status } =
      req.body;

    if (!status) {

      return res.status(400).json({
        error:
          "Status is required",
      });

    }

    const validStatuses = [
      "New",
      "Contacted",
      "Won",
      "Lost",
    ];

    if (!validStatuses.includes(status)) {

      return res.status(400).json({
        success: false,
        error:
          "Invalid status. Allowed values are New, Contacted, Won, Lost.",
      });

    }

    const result =
      updateDealStatus(
        Number(req.params.id),
        status
      );

    if (!result.success) {

      return res
        .status(400)
        .json(result);

    }

    res.json(result);
  }
);

// =====================================================
// ADD NOTE
// =====================================================

app.post(
  "/api/notes",
  (req, res) => {

    const {
      customerName,
      text,
    } = req.body;

    if (!customerName || !text) {

      return res.status(400).json({
        error:
          "customerName and text are required",
      });

    }

    const customer =
      findCustomerByName(
        customerName
      );

    if (!customer) {

      return res.status(404).json({
        success: false,
        error:
          `Customer "${customerName}" was not found in the CRM.`,
      });

    }

    const result =
      addCustomerNote(
        customer.name,
        text
      );

    res.json(result);
  }
);

// =====================================================
// ASSIGN LEAD
// =====================================================

app.post(
  "/api/leads/:id/assign",
  (req, res) => {

    const {
      assignedTo,
    } = req.body;

    if (!assignedTo) {

      return res.status(400).json({
        error:
          "assignedTo is required",
      });

    }

    const result =
      assignDeal(
        Number(req.params.id),
        assignedTo
      );

    if (!result.success) {

      return res
        .status(400)
        .json(result);

    }

    res.json(result);
  }
);

// =====================================================
// AI CHAT
// =====================================================

app.post(
  "/api/chat",
  async (req, res) => {

    try {

      const {
        message,
      } = req.body;

      if (!message) {

        return res.status(400).json({
          error:
            "Message is required",
        });

      }

      console.log("\n\nUSER:");
      console.log(message);

      // =================================================
      // INITIAL USER MESSAGE
      // =================================================

      let contents = [
        {
          role: "user",
          parts: [
            {
              text: message,
            },
          ],
        },
      ];

      // =================================================
      // AI + TOOL LOOP
      // =================================================

      const MAX_ATTEMPTS = 5;

      for (
        let attempt = 0;
        attempt < MAX_ATTEMPTS;
        attempt++
      ) {

        console.log(
          `\nAI ATTEMPT: ${attempt + 1}`
        );

        // =================================================
        // CALL GEMINI
        // =================================================

        const response =
          await ai.models.generateContent({

            model: GEMINI_MODEL,

            contents,

            config: {

              // =================================================
              // SYSTEM INSTRUCTION
              // =================================================

              systemInstruction: `
You are an AI-powered CRM assistant for a sales/support team.

You have access to CRM tools.

IMPORTANT RULES:

1. Answer only using actual CRM data.

2. Never invent customers, deals, notes, employees, values, or statuses.

3. If something does not exist, clearly say that it was not found.

4. Use CRM tools whenever the user asks about CRM data.

5. Before changing a deal, identify the exact deal from CRM data.

6. Never guess a deal ID.

7. Before adding a note, verify that the customer exists.

8. Before assigning a lead, verify that the deal exists.

9. Valid deal statuses are:
   New,
   Contacted,
   Won,
   Lost.

10. Explain successful actions clearly.

11. If an action cannot be safely performed, do not perform it.

12. When answering counts, calculate them from the tool results.

13. Do not claim an action succeeded unless the CRM tool returned success.

14. When the user refers to a customer by name, use the CRM tools to verify the customer.

15. When multiple deals could match the user's request, do not guess. Ask the user to clarify.

16. For update operations, always verify the exact deal before changing it.

17. For assigning a deal, verify the exact deal before changing the salesperson.

18. For adding a note, verify the exact customer before writing the note.

19. IMPORTANT:
    After a CRM write operation succeeds, do not call the same write tool again.

20. Once update_deal_status, add_note, or assign_lead returns success=true,
    the requested action is complete.

21. After a successful write operation, provide a concise final answer.

RESPONSE FORMAT RULES:

22. Always return a clean, natural-language response suitable for displaying directly in a chat UI.

23. Do not use Markdown formatting.
    Do not use **bold**, *italic*, # headings, backticks, or Markdown tables.

24. Do not return raw JSON unless the user explicitly asks for JSON.

25. Do not expose internal tool calls, function names, tool arguments, IDs, or implementation details unless the user asks for them.

26. For lists, use simple numbered or bullet-style lines with plain text.

27. Keep responses concise and easy to read.

28. When summarizing CRM data, organize the information using simple labels and line breaks.

29. When reporting a count, state the count clearly in one sentence.

30. When an action succeeds, clearly state what was changed.

31. When an action cannot be performed because the requested CRM record does not exist, clearly explain that the record was not found and that no action was taken.
`,

              tools:
                crmTools,

            },
          });

        // =================================================
        // CHECK FOR FUNCTION CALLS
        // =================================================

        const functionCalls =
          response.functionCalls || [];

        // =================================================
        // NO TOOL CALL
        // =================================================

        if (
          functionCalls.length === 0
        ) {

          return res.json({
            reply:
              response.text ||
              "I could not generate a response.",
          });

        }

        // =================================================
        // EXECUTE TOOL CALLS
        // =================================================

        for (
          const call of functionCalls
        ) {

          let toolResult;

          try {

            toolResult =
              executeTool(
                call.name,
                call.args || {}
              );

          } catch (error) {

            console.error(
              "TOOL ERROR:",
              error
            );

            toolResult = {
              success: false,
              error:
                error.message,
            };
          }

          // =================================================
          // LOG TOOL RESULT
          // =================================================

          console.log(
            "TOOL RESULT:"
          );

          console.log(
            toolResult
          );

          // =================================================
          // STOP AFTER SUCCESSFUL WRITE OPERATION
          // =================================================

          const writeTools = [
            "update_deal_status",
            "add_note",
            "assign_lead",
          ];

          const isWriteTool =
            writeTools.includes(call.name);

          if (
            isWriteTool &&
            toolResult &&
            toolResult.success === true
          ) {

            console.log(
              "\nWRITE OPERATION SUCCESSFUL."
            );

            console.log(
              "Stopping AI tool loop."
            );

            // IMPORTANT:
            // Do not send the successful write result
            // back to Gemini because that can cause
            // Gemini to repeat the same write operation.

            return res.json({
              reply:
                toolResult.message ||
                "The CRM operation was completed successfully.",
            });

          }

          // =================================================
          // SEND TOOL RESULT BACK TO GEMINI
          // =================================================

          if (
            response.candidates &&
            response.candidates[0] &&
            response.candidates[0].content
          ) {

            contents.push(
              response.candidates[0].content
            );

          }

          contents.push({

            role: "user",

            parts: [

              {
                functionResponse: {

                  name:
                    call.name,

                  response: {
                    result:
                      toolResult,
                  },

                  ...(call.id
                    ? {
                        id:
                          call.id,
                      }
                    : {}),

                },
              },

            ],

          });

        }
      }

      // =================================================
      // TOO MANY TOOL CALLS
      // =================================================

      return res.status(500).json({

        error:
          "AI used too many tool calls. Please try again.",

      });

    } catch (error) {

      // =================================================
      // GEMINI / SERVER ERROR
      // =================================================

      console.error(
        "\nGEMINI ERROR:"
      );

      console.error(error);

      const errorText =
        String(
          error?.message ||
          error ||
          ""
        );

      const errorUpper =
        errorText.toUpperCase();

      // =================================================
      // GEMINI QUOTA / RATE LIMIT
      // =================================================

      if (
        errorText.includes("429") ||
        errorUpper.includes("RESOURCE_EXHAUSTED") ||
        errorText
          .toLowerCase()
          .includes("quota exceeded") ||
        errorText
          .toLowerCase()
          .includes("rate limit")
      ) {

        console.log(
          "Gemini quota/rate limit detected."
        );

        return res.status(429).json({

          error:
            "Gemini API quota/rate limit exceeded.",

          details:
            "The CRM backend is running correctly, but Gemini is temporarily unavailable because the API quota/rate limit has been reached. Please wait for the quota window to reset or use a project/model with available quota.",

        });

      }

      // =================================================
      // AUTHENTICATION / API KEY ERROR
      // =================================================

      if (
        errorUpper.includes("API KEY") ||
        errorUpper.includes("UNAUTHENTICATED") ||
        errorUpper.includes("PERMISSION_DENIED")
      ) {

        return res.status(500).json({

          error:
            "Gemini API authentication failed.",

          details:
            "Check that GEMINI_API_KEY exists in your .env file and that the API key is valid.",

        });

      }

      // =================================================
      // GENERAL ERROR
      // =================================================

      return res.status(500).json({

        error:
          "Failed to process AI request.",

        details:
          error?.message ||
          "Unknown server error.",

      });

    }

  }
);

// =====================================================
// START SERVER
// =====================================================

app.listen(
  PORT,
  () => {

    console.log(
      `CRM backend running on http://localhost:${PORT}`
    );

    console.log(
      `Gemini model: ${GEMINI_MODEL}`
    );

  }
);