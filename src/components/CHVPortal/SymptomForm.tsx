import React, { useState } from "react";
import { SYMPTOMS_LIST, DISTRICTS } from "../../constants";
import { PatientReport, Urgency } from "../../types";
import { analyzeSymptoms } from "../../services/gemini";
import { Loader2, CheckCircle, AlertCircle, Activity } from "lucide-react";
import { cn } from "../../lib/utils";

interface SymptomFormProps {
  onReportSubmit: (report: Partial<PatientReport>) => void;
}

export default function SymptomForm({ onReportSubmit }: SymptomFormProps) {
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [district, setDistrict] = useState(DISTRICTS[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleAnalyze = async () => {
    if (!patientName || !age || selectedSymptoms.length === 0) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeSymptoms({
        patientName,
        age: parseInt(age),
        gender,
        symptoms: selectedSymptoms,
        description
      });
      setAiResult(result);
    } catch (error) {
      console.error("AI Analysis failed:", error);
      alert("AI Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    const finalPatientId = patientId || patientName.toLowerCase().replace(/\s+/g, '-') + '-' + age;
    onReportSubmit({
      patientId: finalPatientId,
      patientName,
      age: parseInt(age),
      gender,
      symptoms: selectedSymptoms,
      description,
      location: { lat: 0, lng: 0, district },
      aiDiagnosis: aiResult,
      timestamp: Date.now()
    });
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-2xl font-semibold text-slate-900">Patient Symptom Report</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Patient Name</label>
          <input
            type="text"
            value={patientName}
            onChange={e => setPatientName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-uganda-red focus:border-transparent outline-none transition-all"
            placeholder="Enter name"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Patient ID (Optional)</label>
          <input
            type="text"
            value={patientId}
            onChange={e => setPatientId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-uganda-red focus:border-transparent outline-none transition-all"
            placeholder="Auto-generated if empty"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Age</label>
          <input
            type="number"
            value={age}
            onChange={e => setAge(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-uganda-red focus:border-transparent outline-none transition-all"
            placeholder="Enter age"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Gender</label>
          <select
            value={gender}
            onChange={e => setGender(e.target.value as any)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-uganda-red focus:border-transparent outline-none transition-all"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">District</label>
          <select
            value={district}
            onChange={e => setDistrict(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-uganda-red focus:border-transparent outline-none transition-all"
          >
            {DISTRICTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Symptoms</label>
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS_LIST.map(s => (
            <button
              key={s}
              onClick={() => toggleSymptom(s)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                selectedSymptoms.includes(s)
                  ? "bg-uganda-red text-white shadow-lg shadow-uganda-red/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Additional Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-uganda-red focus:border-transparent outline-none transition-all h-24 resize-none"
          placeholder="Describe symptoms in detail..."
        />
      </div>

      {!aiResult ? (
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full py-3 bg-uganda-red text-white rounded-xl font-bold hover:bg-uganda-red/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-uganda-red/20"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uganda MoH AI Analyzing...
            </>
          ) : (
            "Analyze with Gemini AI"
          )}
        </button>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-uganda-red" />
              AI Preliminary Assessment
            </h3>
            <span className={cn(
              "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest",
              aiResult.urgency === "critical" ? "bg-uganda-red text-white" :
              aiResult.urgency === "high" ? "bg-orange-500 text-white" :
              aiResult.urgency === "medium" ? "bg-blue-500 text-white" :
              "bg-uganda-yellow text-uganda-black"
            )}>
              {aiResult.urgency} Urgency
            </span>
          </div>
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-800">Possible Conditions:</span> {aiResult.possibleConditions.join(", ")}
          </p>
          <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-slate-100">
            <AlertCircle className="w-5 h-5 text-uganda-red shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700 italic font-medium">{aiResult.recommendation}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAiResult(null)}
              className="flex-1 py-2 text-xs font-bold text-slate-400 hover:text-uganda-red transition-colors uppercase tracking-widest"
            >
              Re-analyze
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2 bg-uganda-red text-white text-xs font-bold rounded-lg hover:bg-uganda-red/90 transition-all shadow-md shadow-uganda-red/10 uppercase tracking-widest"
            >
              Submit Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
