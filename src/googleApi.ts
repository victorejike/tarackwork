import { OutreachItem, OutreachStatus } from "./types";

// Helper function to convert OutreachItem to sheet row array
export function itemToRow(item: OutreachItem): string[] {
  return [
    item.id,
    item.companyName,
    item.contactPerson,
    item.emailAddress,
    item.phone,
    item.status,
    item.lastContactDate,
    item.followUpDate,
    item.followUpTemplateId,
    item.notes,
    item.emailSentStatus,
    item.emailSentDate || ""
  ];
}

// Helper function to map a row array to OutreachItem
export function rowToItem(row: string[], index: number): OutreachItem {
  return {
    id: row[0] || `row-${index}`,
    companyName: row[1] || "",
    contactPerson: row[2] || "",
    emailAddress: row[3] || "",
    phone: row[4] || "",
    status: (row[5] as OutreachStatus) || OutreachStatus.INITIAL_OUTREACH,
    lastContactDate: row[6] || "",
    followUpDate: row[7] || "",
    followUpTemplateId: row[8] || "",
    notes: row[9] || "",
    emailSentStatus: (row[10] as "Pending" | "Sent" | "N/A") || "N/A",
    emailSentDate: row[11] || undefined,
  };
}

// Drive API: Search for existing Ejicode spreadsheets
export const findOutreachSpreadsheets = async (accessToken: string) => {
  const query = encodeURIComponent("name contains 'Ejicode Outreach Tracker' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&fields=files(id,name,webViewLink,createdTime)&pageSize=10`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to search Google Drive files");
  }

  const data = await res.json();
  return data.files || [];
};

// Sheets API: Create a brand new tracker spreadsheet with headers
export const createTrackerSpreadsheet = async (accessToken: string): Promise<{ id: string; webViewLink: string }> => {
  const url = "https://sheets.googleapis.com/v4/spreadsheets";
  
  const payload = {
    properties: {
      title: `Ejicode Outreach Tracker`
    },
    sheets: [
      {
        properties: {
          title: "Outreach Tracker",
          gridProperties: {
            frozenRowCount: 1
          }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: "ID" }, userEnteredFormat: { textFormat: { bold: true } } },
                  { userEnteredValue: { stringValue: "Company Name" }, userEnteredFormat: { textFormat: { bold: true } } },
                  { userEnteredValue: { stringValue: "Contact Person" }, userEnteredFormat: { textFormat: { bold: true } } },
                  { userEnteredValue: { stringValue: "Email Address" }, userEnteredFormat: { textFormat: { bold: true } } },
                  { userEnteredValue: { stringValue: "Phone" }, userEnteredFormat: { textFormat: { bold: true } } },
                  { userEnteredValue: { stringValue: "Outreach Status" }, userEnteredFormat: { textFormat: { bold: true } } },
                  { userEnteredValue: { stringValue: "Last Contact Date" }, userEnteredFormat: { textFormat: { bold: true } } },
                  { userEnteredValue: { stringValue: "Follow-up Date" }, userEnteredFormat: { textFormat: { bold: true } } },
                  { userEnteredValue: { stringValue: "Follow-up Email Template" }, userEnteredFormat: { textFormat: { bold: true } } },
                  { userEnteredValue: { stringValue: "Notes" }, userEnteredFormat: { textFormat: { bold: true } } },
                  { userEnteredValue: { stringValue: "Email Sent Status" }, userEnteredFormat: { textFormat: { bold: true } } },
                  { userEnteredValue: { stringValue: "Email Sent Date" }, userEnteredFormat: { textFormat: { bold: true } } }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to create tracker spreadsheet");
  }

  const data = await res.json();
  const id = data.spreadsheetId;
  const webViewLink = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${id}/edit`;

  return { id, webViewLink };
};

// Sheets API: Read all outreach rows from specified spreadsheet
export const getOutreachItems = async (accessToken: string, spreadsheetId: string): Promise<OutreachItem[]> => {
  const range = "Outreach Tracker!A2:L2000"; // Read up to 2000 items
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to fetch spreadsheet rows");
  }

  const data = await res.json();
  const rows: string[][] = data.values || [];
  
  return rows.map((row, index) => rowToItem(row, index));
};

// Sheets API: Add a new outreach row to the spreadsheet
export const appendOutreachItem = async (accessToken: string, spreadsheetId: string, item: OutreachItem): Promise<void> => {
  const range = "Outreach Tracker!A2";
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const payload = {
    values: [itemToRow(item)]
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to add outreach entry to Google Sheet");
  }
};

// Sheets API: Update an existing row in the spreadsheet based on its index
export const updateOutreachItem = async (
  accessToken: string,
  spreadsheetId: string,
  itemIndex: number,
  item: OutreachItem
): Promise<void> => {
  const rowNumber = itemIndex + 2; // Row 1 is header, index 0 is row 2
  const range = `Outreach Tracker!A${rowNumber}:L${rowNumber}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const payload = {
    values: [itemToRow(item)]
  };

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to update outreach entry at row ${rowNumber}`);
  }
};

// Sheets API: Bulk overwrite items (useful for deletes or bulk uploads)
export const overwriteOutreachItems = async (
  accessToken: string,
  spreadsheetId: string,
  items: OutreachItem[]
): Promise<void> => {
  // First clear the sheet values below header
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Outreach%20Tracker!A2:L2000:clear`;
  await fetch(clearUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (items.length === 0) return;

  // Append new values
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Outreach%20Tracker!A2?valueInputOption=USER_ENTERED`;
  const payload = {
    values: items.map(item => itemToRow(item))
  };

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to write items in spreadsheet bulk refresh");
  }
};

// Gmail API: Helper to Base64Url encode string for Gmail send API
function makeRawEmail(to: string, subject: string, body: string) {
  const parts = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'Content-Type: text/plain; charset="utf-8"',
    'MIME-Version: 1.0',
    '',
    body,
  ];
  const email = parts.join('\r\n');
  
  return btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Gmail API: Send email using access token
export const sendGmailEmail = async (
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<{ id: string }> => {
  const url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
  const rawEmail = makeRawEmail(to, subject, body);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: rawEmail }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to send email via Gmail");
  }

  return await res.json();
};
