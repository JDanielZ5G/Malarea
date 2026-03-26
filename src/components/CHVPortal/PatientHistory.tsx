import React from "react";
import { PatientReport } from "../../types";
import { Clock, FileText, Activity } from "lucide-react";
import { cn } from "../../lib/utils";

interface PatientHistoryProps {
  reports: PatientReport[];
  patientId: string;
}

export default function PatientHistory({ reports, patientId }: PatientHistoryProps) {
  const patientReports = reports
    .filter(r => r.patientId === patientId)
    .sort((a, b) => b.timestamp - a.timestamp);

  if (patientReports.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-900 font-bold">
        <Activity className="w-5 h-5 text-emerald-500" />
        <h3>Patient History: {patientReports[0].patientName}</h3>
      </div>
      
      <div className="relative border-l-2 border-slate-100 ml-3 pl-6 space-y-6">
        {patientReports.map((report, idx) => (
          <div key={report.id} className="relative">
            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-emerald-500" />
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(report.timestamp).toLocaleDateString()}
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                  report.aiDiagnosis?.urgency === "critical" ? "bg-red-100 text-red-600" :
                  report.aiDiagnosis?.urgency === "high" ? "bg-orange-100 text-orange-600" :
                  "bg-emerald-100 text-emerald-600"
                )}>
                  {report.aiDiagnosis?.urgency}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-800 mb-2">{report.aiDiagnosis?.recommendation}</p>
              <div className="flex flex-wrap gap-1">
                {report.symptoms.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
