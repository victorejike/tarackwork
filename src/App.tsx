import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken
} from "./firebase";
import {
  getOutreachItems,
  appendOutreachItem,
  updateOutreachItem,
  overwriteOutreachItems,
  sendGmailEmail
} from "./googleApi";
import { OutreachItem, OutreachStatus } from "./types";
import { SpreadsheetSelector } from "./components/SpreadsheetSelector";
import { OutreachTable } from "./components/OutreachTable";
import { OutreachForm } from "./components/OutreachForm";
import { FollowUpScheduler } from "./components/FollowUpScheduler";
import { OutreachCharts } from "./components/OutreachCharts";
import {
  Briefcase,
  LayoutDashboard,
  CalendarCheck,
  BarChart4,
  LogOut,
  RefreshCw,
  Plus,
  ExternalLink,
  ChevronRight,
  Sparkles,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Spreadsheet settings
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem("ejicode_spreadsheet_id");
  });
  const [spreadsheetLink, setSpreadsheetLink] = useState<string | null>(() => {
    return localStorage.getItem("ejicode_spreadsheet_link");
  });

  // Application Data & States
  const [items, setItems] = useState<OutreachItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [activeTab, setActiveTab] = useState<"tracker" | "reminders" | "analytics">("tracker");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OutreachItem | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [syncingRows, setSyncingRows] = useState(false);

  // Set up Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authCtxUser, authCtxToken) => {
        setUser(authCtxUser);
        setToken(authCtxToken);
        // Store token in localStorage ONLY for FollowUpScheduler sweep callbacks while active
        localStorage.setItem("ejicode_google_token", authCtxToken);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("ejicode_google_token");
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch items whenever sheet is selected
  useEffect(() => {
    if (token && spreadsheetId) {
      loadData();
    }
  }, [token, spreadsheetId]);

  const loadData = async () => {
    if (!token || !spreadsheetId) return;
    setLoadingItems(true);
    setErrorMsg(null);
    try {
      const fetched = await getOutreachItems(token, spreadsheetId);
      setItems(fetched);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load rows from Google Sheet.");
    } finally {
      setLoadingItems(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        // Sync to localStorage for scheduler helper
        localStorage.setItem("ejicode_google_token", result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      localStorage.removeItem("ejicode_google_token");
      setItems([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectSpreadsheet = (id: string, viewLink: string) => {
    setSpreadsheetId(id);
    setSpreadsheetLink(viewLink);
    localStorage.setItem("ejicode_spreadsheet_id", id);
    localStorage.setItem("ejicode_spreadsheet_link", viewLink);
    showSuccess("Tracker Google Sheet associated successfully!");
  };

  const handleChangeSpreadsheet = () => {
    if (window.confirm("Do you want to switch to a different Google Sheet? Your data in the current sheet will be preserved.")) {
      setSpreadsheetId(null);
      setSpreadsheetLink(null);
      localStorage.removeItem("ejicode_spreadsheet_id");
      localStorage.removeItem("ejicode_spreadsheet_link");
      setItems([]);
    }
  };

  // Toast message helpers
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Add or update outreach entries
  const handleSaveOutreach = async (formData: Omit<OutreachItem, "id" | "emailSentStatus">) => {
    if (!token || !spreadsheetId) return;
    setSyncingRows(true);
    setErrorMsg(null);

    try {
      if (editingItem) {
        // Edit flow
        const updatedItem: OutreachItem = {
          ...editingItem,
          ...formData,
        };

        const index = items.findIndex((i) => i.id === editingItem.id);
        if (index === -1) throw new Error("Index out of bounds");

        // Save on Google Sheets
        await updateOutreachItem(token, spreadsheetId, index, updatedItem);

        // Update local state
        const nextItems = [...items];
        nextItems[index] = updatedItem;
        setItems(nextItems);
        showSuccess(`Outreach entry of ${updatedItem.companyName} updated!`);
      } else {
        // Add flow
        const newItem: OutreachItem = {
          ...formData,
          id: `lead-${Date.now()}`,
          emailSentStatus: formData.followUpDate ? "Pending" : "N/A",
        };

        // Append to Google Sheets
        await appendOutreachItem(token, spreadsheetId, newItem);

        // Reload data to ensure alignment
        await loadData();
        showSuccess(`Logged new outreach for ${newItem.companyName}!`);
      }
      setIsFormOpen(false);
      setEditingItem(undefined);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to sync updates to Google Sheet.");
    } finally {
      setSyncingRows(false);
    }
  };

  // Delete an outreach row
  const handleDeleteOutreach = async (target: OutreachItem) => {
    if (!token || !spreadsheetId) return;
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${target.companyName}'s outreach row from this Google Sheet?`
    );
    if (!confirmed) return;

    setSyncingRows(true);
    try {
      const nextItems = items.filter((i) => i.id !== target.id);
      // Bulk overwrite sheet rows
      await overwriteOutreachItems(token, spreadsheetId, nextItems);
      setItems(nextItems);
      showSuccess(`Outreach row of ${target.companyName} removed from Sheet.`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to process delete in spreadsheet.");
    } finally {
      setSyncingRows(false);
    }
  };

  // Quick Advance Stage
  const handleAdvanceStage = async (target: OutreachItem, nextStatus: OutreachStatus) => {
    if (!token || !spreadsheetId) return;

    const index = items.findIndex((i) => i.id === target.id);
    if (index === -1) return;

    setSyncingRows(true);
    try {
      const updated: OutreachItem = {
        ...target,
        status: nextStatus,
        lastContactDate: new Date().toISOString().split("T")[0],
      };

      await updateOutreachItem(token, spreadsheetId, index, updated);
      const nextItems = [...items];
      nextItems[index] = updated;
      setItems(nextItems);
      showSuccess(`${target.companyName} advanced to: ${nextStatus}!`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to advance stage: " + err.message);
    } finally {
      setSyncingRows(false);
    }
  };

  // Immediate send via email helper
  const handleSendImmediate = async (item: OutreachItem) => {
    const confirm = window.confirm(
      `Do you want to send the pre-defined follow-up email immediately to ${item.contactPerson} (${item.emailAddress}) now?`
    );
    if (!confirm) return;

    setSyncingRows(true);
    try {
      // Find index
      const index = items.findIndex((i) => i.id === item.id);
      if (index === -1) throw new Error("Item index mismatch");

      const today = new Date();
      
      // Update entry with sent log
      const updated: OutreachItem = {
        ...item,
        emailSentStatus: "Sent",
        emailSentDate: today.toLocaleString(),
      };

      // In real Gmail API, trigger sending!
      await sendGmailEmail(
        token!,
        item.emailAddress,
        `Following up from Ejicode Company - Update`,
        `Hi ${item.contactPerson},\n\nI hope you are doing well!\n\nJust following up on our previous touchpoint regarding Ejicode Company tech and software development services.\n\nLet me know your availability for a short call!\n\nBest,\n${user?.displayName || "Ejicode Representative"}\nEjicode Sales Specialist`
      );

      // Write changes back to Sheets
      await updateOutreachItem(token!, spreadsheetId!, index, updated);
      const nextItems = [...items];
      nextItems[index] = updated;
      setItems(nextItems);
      showSuccess(`Follow-up email dispatched via Gmail! Sheet rows synchronous.`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to dispatch follow-up email: " + err.message);
    } finally {
      setSyncingRows(false);
    }
  };

  // Follow-up sweep callback (for scheduler)
  const handleSchedulerSendCompleted = async (updatedItem: OutreachItem) => {
    if (!token || !spreadsheetId) return;
    const index = items.findIndex((i) => i.id === updatedItem.id);
    if (index === -1) return;

    try {
      // Update Google sheets immediately for each item sent
      await updateOutreachItem(token, spreadsheetId, index, updatedItem);
      setItems((prev) => {
        const copy = [...prev];
        copy[index] = updatedItem;
        return copy;
      });
    } catch (err) {
      console.error("Failed to sync scheduler dispatch back to Sheet:", err);
    }
  };

  // Loader / Needs Authorization Landing Screen
  if (needsAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="bg-white border border-slate-100 rounded-[32px] p-8 md:p-12 max-w-lg w-full shadow-xl text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-md">
            ej
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-amber-500 bg-amber-50 px-3 py-1 rounded-full">
              Sales Workbench
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-3">
              Ejicode Outreach Tracker
            </h1>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Connect Google Sheets and Gmail pipelines to manage client outreach, milestone progressions, and automated follow-ups.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-3">
            <div className="flex gap-3 text-xs">
              <span className="text-sky-500 font-bold shrink-0">✓</span>
              <p className="text-slate-600 font-semibold leading-relaxed">
                Reads/writes outreach pipelines directly to your Google Sheets.
              </p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="text-indigo-500 font-bold shrink-0">✓</span>
              <p className="text-slate-600 font-semibold leading-relaxed">
                Sends predefined follow-ups via your official Gmail account.
              </p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="text-emerald-500 font-bold shrink-0">✓</span>
              <p className="text-slate-600 font-semibold leading-relaxed">
                Visualizes outreach conversion funnels and success trends.
              </p>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
              {errorMsg}
            </p>
          )}

          <div className="flex justify-center pt-2">
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="gsi-material-button w-full sm:w-auto shadow-sm"
              style={{ cursor: "pointer" }}
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: "block" }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    ></path>
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    ></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isLoggingIn ? "Authorizing Google Account..." : "Sign in with Google"}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Choose Spreadsheet Screen if none associated
  if (!spreadsheetId) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-12">
        {/* Simple header */}
        <div className="max-w-4xl mx-auto flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 bg-slate-900 text-white rounded-lg px-2 py-1 text-sm">ej</span>
            <span className="font-bold text-slate-800 text-sm tracking-tight">Ejicode Workbench</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="max-w-xl mx-auto text-center mt-12 mb-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Set up outreach directory</h1>
          <p className="text-slate-400 text-xs mt-2 max-w-sm mx-auto">
            Create or select a central spreadsheet inside Google Drive to sync, query, and modify contacts from Ejicode Workspace.
          </p>
        </div>

        <SpreadsheetSelector
          accessToken={token!}
          onSelect={handleSelectSpreadsheet}
          selectedId={spreadsheetId}
        />
      </div>
    );
  }

  // Primary Workspace Dashboard Layout
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-slate-900 selection:text-white">
      {/* Upper Navigation Bar */}
      <header className="bg-white border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Brand/Product Logo details */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">
              ej
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 tracking-tight">Ejicode Workbench</span>
                <span className="text-[9px] font-bold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Live Sync
                </span>
              </div>
              <p className="text-[10px] text-slate-400 max-w-[200px] sm:max-w-xs truncate" title={spreadsheetId}>
                Sheets ID: {spreadsheetId.slice(0, 8)}...{spreadsheetId.slice(-6)}
              </p>
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {spreadsheetLink && (
              <a
                href={spreadsheetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                title="View Sheet raw data directly"
              >
                <FileSpreadsheet size={14} className="text-emerald-600" />
                <span className="hidden sm:inline">Open in Drive</span>
                <ExternalLink size={12} />
              </a>
            )}

            <button
              onClick={handleChangeSpreadsheet}
              className="text-xs text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Change Sheet
            </button>

            <button
              onClick={loadData}
              disabled={loadingItems}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition-all cursor-pointer disabled:opacity-40"
              title="Force fetch updates from Sheets"
            >
              <RefreshCw className={`h-4 w-4 ${loadingItems ? "animate-spin" : ""}`} />
            </button>

            <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>

            <div className="flex items-center gap-2.5 pl-1.5">
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-slate-900">{user?.displayName || "Ejicode Representative"}</p>
                <p className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Sign out of panel"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Dynamic Toasts / Alerts notifications */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-5 py-3 rounded-2xl text-xs md:text-sm font-semibold shadow-sm flex items-center gap-2 animate-fade-in">
            <span className="text-emerald-500 text-lg">✓</span>
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-100 text-rose-850 px-5 py-3 rounded-2xl text-xs md:text-sm font-semibold shadow-sm flex items-center gap-2 animate-fade-in">
            <span className="text-rose-500 font-bold">!</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dashboard Title Panel & Tab selection */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-200/50 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Outreach & Leads Workspace</h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Sales pipeline, automated follow-ups via Gmail templates, and custom progress charts.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingItem(undefined);
              setIsFormOpen(true);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-2xl flex items-center gap-1.5 shadow-sm transition-transform transform active:scale-95 text-xs select-none cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Outreach Record</span>
          </button>
        </div>

        {/* Workspace Mode Selection (Tabs) */}
        <div className="flex gap-2 p-1.5 bg-slate-200/50 rounded-2xl max-w-md border border-slate-200/35">
          <button
            onClick={() => setActiveTab("tracker")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "tracker"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
            }`}
          >
            <LayoutDashboard size={14} />
            <span>Leads Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab("reminders")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === "reminders"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
            }`}
          >
            <CalendarCheck size={14} />
            <span>Reminders</span>
            {items.filter((i) => i.followUpDate && i.emailSentStatus === "Pending").length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black tracking-tighter">
                {items.filter((i) => i.followUpDate && i.emailSentStatus === "Pending").length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
            }`}
          >
            <BarChart4 size={14} />
            <span>Success Rate</span>
          </button>
        </div>

        {/* Tab view rendering */}
        <div className="min-h-[400px]">
          {loadingItems ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="animate-spin text-slate-800" size={32} />
              <span className="text-sm text-slate-400 font-bold">Synchronizing client workspace records...</span>
            </div>
          ) : (
            <>
              {activeTab === "tracker" && (
                <OutreachTable
                  items={items}
                  onEdit={(item) => {
                    setEditingItem(item);
                    setIsFormOpen(true);
                  }}
                  onDelete={handleDeleteOutreach}
                  onSendImmediate={handleSendImmediate}
                  onUpgradeStatus={handleAdvanceStage}
                />
              )}

              {activeTab === "reminders" && (
                <FollowUpScheduler
                  items={items}
                  userName={user?.displayName || "Ejicode Representative"}
                  userEmail={user?.email || "sales@ejicode.com"}
                  onSendDone={handleSchedulerSendCompleted}
                  isProcessingExternal={syncingRows}
                />
              )}

              {activeTab === "analytics" && <OutreachCharts items={items} />}
            </>
          )}
        </div>

      </main>

      {/* Footer Info details */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-medium">
        <p>&copy; {new Date().getFullYear()} Ejicode Company. All client pipelines are secured through Google Enterprise OAuth.</p>
      </footer>

      {/* Edit or Add Modal Form */}
      {isFormOpen && (
        <OutreachForm
          onClose={() => {
            setIsFormOpen(false);
            setEditingItem(undefined);
          }}
          onSave={handleSaveOutreach}
          initialItem={editingItem}
        />
      )}
    </div>
  );
}
