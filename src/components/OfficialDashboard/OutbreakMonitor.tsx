import React, { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy, addDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { PatientReport, OutbreakAlert, Urgency } from "../../types";
import { analyzeOutbreak } from "../../services/gemini";
import { ShieldAlert, TrendingUp, Users, MapPin, Loader2, CheckCircle2, Clock } from "lucide-react";
import { cn } from "../../lib/utils";

export default function OutbreakMonitor() {
  const [reports, setReports] = useState<PatientReport[]>([]);
  const [alerts, setAlerts] = useState<OutbreakAlert[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const handleRunAIAnalysis = async () => {
    if (reports.length < 3) {
      alert("Not enough reports to perform a meaningful outbreak analysis.");
      return;
    }

    setIsAnalyzing(true);
    try {
      // Group reports by district
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">District Health Monitor</h2>
          <p className="text-slate-500">Real-time surveillance and AI-powered outbreak detection</p>
        </div>
        <button
          onClick={handleRunAIAnalysis}
          disabled={isAnalyzing}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-slate-200"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Running Surveillance...
            </>
          ) : (
            <>
              <ShieldAlert className="w-5 h-5" />
              Run Outbreak Analysis
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Reports</span>
          </div>
          <div className="text-4xl font-bold text-slate-900">{reports.length}</div>
          <div className="mt-2 text-sm text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Active Surveillance
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Alerts</span>
          </div>
          <div className="text-4xl font-bold text-slate-900">{alerts.filter(a => !a.isResolved).length}</div>
          <div className="mt-2 text-sm text-red-600 font-medium">
            Requires Immediate Attention
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Districts Covered</span>
          </div>
          <div className="text-4xl font-bold text-slate-900">
            {[...new Set(reports.map(r => r.location.district))].length}
          </div>
          <div className="mt-2 text-sm text-blue-600 font-medium">
            Cross-district Monitoring
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Recent Patient Reports
          </h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {reports.map(report => (
              <div key={report.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-slate-900">{report.patientName}</h4>
                    <p className="text-xs text-slate-500">{report.location.district} • {new Date(report.timestamp).toLocaleString()}</p>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    report.aiDiagnosis?.urgency === "critical" ? "bg-red-100 text-red-600" :
                    report.aiDiagnosis?.urgency === "high" ? "bg-orange-100 text-orange-600" :
                    "bg-emerald-100 text-emerald-600"
                  )}>
                    {report.aiDiagnosis?.urgency || "Normal"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {report.symptoms.map(s => (
                    <span key={s} className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[10px] rounded-full border border-slate-100">
                      {s}
                    </span>
                  ))}
                </div>
                {report.malnutritionScan && (
                  <div className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-100 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-medium text-orange-800">
                      Malnutrition Scan: {report.malnutritionScan.status.replace("_", " ")}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Active Outbreak Alerts
          </h3>
          <div className="space-y-4">
            {alerts.filter(a => !a.isResolved).map(alert => (
              <div key={alert.id} className="bg-white p-6 rounded-2xl border-l-4 border-l-red-500 border-y border-r border-slate-100 shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                      Potential {alert.condition} Outbreak
                    </h4>
                    <p className="text-sm text-slate-500 font-medium">
                      District: {alert.district} • {alert.affectedCount} Cases Detected
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-red-600">
                    <ShieldAlert className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase">{alert.severity}</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {alert.aiAnalysis}
                  </p>
                </div>
                <button className="w-full py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Under Investigation
                </button>
              </div>
            ))}
            {alerts.filter(a => !a.isResolved).length === 0 && (
              <div className="bg-emerald-50 p-8 rounded-2xl border border-emerald-100 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h4 className="font-bold text-emerald-900">No Active Outbreaks</h4>
                <p className="text-sm text-emerald-700">All districts are currently stable.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
