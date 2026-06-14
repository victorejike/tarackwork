import React, { useState, useEffect } from "react";
import { Database, Plus, Search, FileText, ExternalLink, RefreshCw } from "lucide-react";
import { findOutreachSpreadsheets, createTrackerSpreadsheet } from "../googleApi";

interface SpreadsheetSelectorProps {
  accessToken: string;
  onSelect: (spreadsheetId: string, webLink: string) => void;
  selectedId: string | null;
}

export const SpreadsheetSelector: React.FC<SpreadsheetSelectorProps> = ({
  accessToken,
  onSelect,
  selectedId,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [customId, setCustomId] = useState<string>("");

  const loadSpreadsheets = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await findOutreachSpreadsheets(accessToken);
      setSpreadsheets(list);
      // Auto-select first spreadsheet if none is selected yet
      if (list.length > 0 && !selectedId) {
        onSelect(list[0].id, list[0].webViewLink || `https://docs.google.com/spreadsheets/d/${list[0].id}/edit`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to search spreadsheets in Google Drive.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadSpreadsheets();
    }
  }, [accessToken]);

  const handleCreateNew = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const newSheet = await createTrackerSpreadsheet(accessToken);
      onSelect(newSheet.id, newSheet.webViewLink);
      await loadSpreadsheets(); // Refresh the list
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not construct the spreadsheet. Please verify Drive scopes.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinCustomId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customId.trim()) return;
    
    // Extract ID from full URL if provided
    let extractedId = customId.trim();
    if (extractedId.includes("/d/")) {
      const match = extractedId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        extractedId = match[1];
      }
    }
    
    onSelect(extractedId, `https://docs.google.com/spreadsheets/d/${extractedId}/edit`);
    setCustomId("");
  };

  return (
    <div className="bg-[#161B22] border border-white/5 shadow-2xl rounded-2xl p-6 md:p-8 max-w-2xl mx-auto my-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl">
          <Database size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#E2E8F0] tracking-tight">Outreach Google Spreadsheet</h2>
          <p className="text-sm text-slate-400">All data persists durably within your secure Google Drive</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Select spreadsheet in standard list */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <RefreshCw className="animate-spin text-indigo-400" size={24} />
            <span className="text-sm text-slate-400 font-medium">Searching Google Drive for trackers...</span>
          </div>
        ) : spreadsheets.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Detected spreadsheets</span>
              <button
                onClick={loadSpreadsheets}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={12} /> Refresh List
              </button>
            </div>
            
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {spreadsheets.map((sheet) => {
                const isActive = selectedId === sheet.id;
                return (
                  <div
                    key={sheet.id}
                    onClick={() => onSelect(sheet.id, sheet.webViewLink || `https://docs.google.com/spreadsheets/d/${sheet.id}/edit`)}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      isActive
                        ? "border-indigo-500 bg-indigo-500/10 text-[#E2E8F0] shadow-md shadow-indigo-500/5"
                        : "border-white/5 bg-[#1C212A] hover:bg-[#242B35] text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className={`${isActive ? "text-indigo-400" : "text-slate-400"}`} size={20} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate text-[#E2E8F0]">{sheet.name}</p>
                        <p className="text-[10px] text-slate-400">
                          Created {new Date(sheet.createdTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <a
                      href={sheet.webViewLink || `https://docs.google.com/spreadsheets/d/${sheet.id}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-400 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0"
                      title="Open directly in Google Sheets"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl bg-white/5">
            <p className="text-sm text-slate-400 font-medium mb-1">No tracked spreads found on Google Drive</p>
            <p className="text-xs text-slate-500">Create a tracker below to initialize Ejicode outreach channels</p>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCreateNew}
            disabled={isCreating}
            className="flex-1 flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-600/10 transition-all text-sm disabled:opacity-50 select-none cursor-pointer"
          >
            {isCreating ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                Creating Outreach Spreadsheet...
              </>
            ) : (
              <>
                <Plus size={18} />
                Create New Outreach Sheet
              </>
            )}
          </button>
        </div>

        {/* Enter Custom Sheet ID form */}
        <form onSubmit={handleJoinCustomId} className="mt-4 pt-4 border-t border-white/5 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Or enter custom Google Spreadsheet ID or URL"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 bg-[#1C212A] text-[#E2E8F0] placeholder-slate-500"
            />
          </div>
          <button
            type="submit"
            className="bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors select-none cursor-pointer"
          >
            Load
          </button>
        </form>
      </div>
    </div>
  );
};
