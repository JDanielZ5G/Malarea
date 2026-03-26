import React, { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy, addDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { PatientReport, OutbreakAlert, Urgency } from "../../types";
import { analyzeOutbreak } from "../../services/gemini";
import { ShieldAlert, TrendingUp, Users, MapPin, Loader2, CheckCircle2, Clock, Filter, Search, Activity, ClipboardList } from "lucide-react";
import { cn } from "../../lib/utils";
import MapViz from "./MapViz";
import { DISTRICTS } from "../../constants";

export default function OutbreakMonitor() {
  const [reports, setReports] = useState<PatientReport[]>([]);
  const [alerts, setAlerts] = useState<OutbreakAlert[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Filtering state
  const [filterDistrict, setFilterDistrict] = useState<string>("All");
  const [filterUrgency, setFilterUrgency] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const qReports = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PatientReport)));
    });

    const qAlerts = query(collection(db, "alerts"), orderBy("timestamp", "desc"));
    const unsubscribeAlerts = onSnapshot(qAlerts, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OutbreakAlert)));
    });

    return () => {
      unsubscribeReports();
      unsubscribeAlerts();
    };
  }, []);

  const filteredReports = reports.filter(r => {
    const matchesDistrict = filterDistrict === "All" || r.location.district === filterDistrict;
    const matchesUrgency = filterUrgency === "All" || r.aiDiagnosis?.urgency === filterUrgency.toLowerCase();
    const matchesSearch = r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         r.symptoms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDistrict && matchesUrgency && matchesSearch;
  });

  const handleRunAIAnalysis = async () => {
    if (reports.length < 3) {
      alert("Not enough reports to perform a meaningful outbreak analysis.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const districts = [...new Set(reports.map(r => r.location.district))];
      
      for (const district of districts) {
        const districtReports = reports.filter(r => r.location.district === district);
        const result = await analyzeOutbreak(districtReports);
        
        if (result.isOutbreak) {
          await addDoc(collection(db, "alerts"), {
            district,
            condition: result.condition,
            severity: result.severity,
            affectedCount: districtReports.length,
            aiAnalysis: result.analysis,
            timestamp: Date.now(),
            isResolved: false
          });
        }
      }
    } catch (error) {
      console.error("Outbreak analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-uganda-red/10 rounded-2xl flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-uganda-red" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Outbreak Monitor</h2>
            <p className="text-slate-500 font-medium">National Health Surveillance Dashboard</p>
          </div>
        </div>
        <button
          onClick={handleRunAIAnalysis}
          disabled={isAnalyzing}
          className="px-6 py-3 bg-uganda-black text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              AI Analyzing Patterns...
            </>
          ) : (
            <>
              <Activity className="w-5 h-5" />
              Run AI Analysis
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search patients or symptoms..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full font-medium"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={filterDistrict}
            onChange={e => setFilterDistrict(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none font-bold text-slate-700"
          >
            <option value="All">All Districts</option>
            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={filterUrgency}
            onChange={e => setFilterUrgency(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none font-bold text-slate-700"
          >
            <option value="All">All Urgency</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Map Visualization */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                <MapPin className="w-5 h-5 text-uganda-red" />
                Geospatial Hotspots
              </h3>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-uganda-red/10 text-uganda-red rounded-full text-[10px] font-black uppercase tracking-widest">
                  High Risk
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-uganda-yellow/10 text-uganda-red rounded-full text-[10px] font-black uppercase tracking-widest">
                  Stable
                </div>
              </div>
            </div>
            <div className="h-[400px] bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 relative">
              <MapViz reports={filteredReports} />
            </div>
          </div>
          
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                <ClipboardList className="w-5 h-5 text-uganda-red" />
                Recent Patient Reports
              </h3>
              <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {filteredReports.length} Total
              </span>
            </div>
            <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
              {filteredReports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-slate-900 tracking-tight">Patient: {report.patientId}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                          report.aiDiagnosis?.urgency === Urgency.CRITICAL ? "bg-uganda-red text-white" :
                          report.aiDiagnosis?.urgency === Urgency.HIGH ? "bg-orange-500 text-white" :
                          "bg-uganda-yellow text-uganda-black"
                        )}>
                          {report.aiDiagnosis?.urgency}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                        <MapPin className="w-3 h-3" />
                        {report.location.district} • {new Date(report.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {report.symptoms.map(s => (
                      <span key={s} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="p-3 bg-uganda-yellow/5 rounded-xl border border-uganda-yellow/10">
                    <p className="text-xs font-bold text-uganda-red uppercase tracking-widest mb-1">AI Diagnosis</p>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{report.aiDiagnosis?.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
              <ShieldAlert className="w-5 h-5 text-uganda-red" />
              AI Outbreak Alerts
            </h3>
            <div className="space-y-4">
              {alerts.filter(a => !a.isResolved).length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No Active Alerts Detected</p>
                </div>
              ) : (
                alerts.filter(a => !a.isResolved).map((alert) => (
                  <div key={alert.id} className="p-5 bg-uganda-red/5 rounded-2xl border border-uganda-red/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-uganda-red/5 rounded-bl-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 bg-uganda-red text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                        {alert.severity} Risk
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {alert.affectedCount} Cases
                      </span>
                    </div>
                    <h4 className="font-black text-slate-900 mb-1 tracking-tight">{alert.condition}</h4>
                    <p className="text-xs font-bold text-uganda-red uppercase tracking-widest">{alert.district}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{alert.aiAnalysis}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
