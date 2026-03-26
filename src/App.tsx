import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { UserProfile, PatientReport } from "./types";
import SymptomForm from "./components/CHVPortal/SymptomForm";
import VisionScan from "./components/CHVPortal/VisionScan";
import OutbreakMonitor from "./components/OfficialDashboard/OutbreakMonitor";
import { DISTRICTS } from "./constants";
import { motion, AnimatePresence } from "motion/react";
import PatientHistory from "./components/CHVPortal/PatientHistory";
import { 
  Stethoscope, 
  ShieldAlert, 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard, 
  Camera, 
  FileText,
  HeartPulse,
  Activity,
  ChevronRight,
  History
} from "lucide-react";
import { cn } from "./lib/utils";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"symptoms" | "vision" | "dashboard" | "history">("symptoms");
  const [allReports, setAllReports] = useState<PatientReport[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const UgandaFlag = () => (
    <div className="flex items-center gap-1 h-6 w-10 overflow-hidden rounded shadow-sm border border-slate-200">
      <div className="h-full w-full flex flex-col">
        <div className="h-[16.6%] bg-black"></div>
        <div className="h-[16.6%] bg-uganda-yellow"></div>
        <div className="h-[16.6%] bg-uganda-red"></div>
        <div className="h-[16.6%] bg-black"></div>
        <div className="h-[16.6%] bg-uganda-yellow"></div>
        <div className="h-[16.6%] bg-uganda-red"></div>
      </div>
    </div>
  );

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const qReports = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      setAllReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PatientReport)));
    });

    return () => {
      unsubscribeAuth();
      unsubscribeReports();
    };
  }, []);

  const handleLogin = async (role: "chv" | "official") => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const profileData: UserProfile = {
        uid: user.uid,
        email: user.email || "",
        role,
        name: user.displayName || "User",
        district: DISTRICTS[0]
      };
      await setDoc(doc(db, "users", user.uid), profileData);
      setProfile(profileData);
      setActiveTab(role === "chv" ? "symptoms" : "dashboard");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleReportSubmit = async (report: Partial<PatientReport>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "reports"), {
        ...report,
        chvId: user.uid
      });
      alert("Report submitted successfully!");
      setActiveTab("symptoms");
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit report.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFEF5] flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-20 h-20 bg-uganda-yellow/10 rounded-3xl flex items-center justify-center mb-2">
            <HeartPulse className="w-12 h-12 text-uganda-red" />
          </div>
          <UgandaFlag />
          <p className="text-slate-500 font-bold animate-pulse tracking-widest uppercase text-[10px]">Uganda MoH • HealthLink AI</p>
        </motion.div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-[#FFFEF5] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-2 bg-uganda-black"></div>
        <div className="absolute top-2 left-0 w-full h-2 bg-uganda-yellow"></div>
        <div className="absolute top-4 left-0 w-full h-2 bg-uganda-red"></div>
        <div className="absolute top-6 left-0 w-full h-2 bg-uganda-black"></div>
        <div className="absolute top-8 left-0 w-full h-2 bg-uganda-yellow"></div>
        <div className="absolute top-10 left-0 w-full h-2 bg-uganda-red"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 relative z-10"
        >
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-uganda-yellow/10 rounded-3xl flex items-center justify-center mb-6">
              <HeartPulse className="w-12 h-12 text-uganda-red" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <UgandaFlag />
              <h1 className="text-3xl font-black tracking-tight text-slate-900">HealthLink AI</h1>
            </div>
            <p className="text-slate-500 font-medium text-center">
              Uganda Community Health Surveillance System
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleLogin("chv")}
              className="w-full group relative p-6 bg-white rounded-2xl border-2 border-slate-100 hover:border-uganda-yellow hover:bg-uganda-yellow/5 transition-all text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-uganda-yellow/10 rounded-lg group-hover:bg-uganda-yellow group-hover:text-uganda-black transition-all">
                  <Stethoscope className="w-6 h-6 text-uganda-red" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-uganda-red transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Community Health Volunteer</h3>
              <p className="text-sm text-slate-500">Submit patient reports and perform vision scans in the field.</p>
            </button>

            <button
              onClick={() => handleLogin("official")}
              className="w-full group relative p-6 bg-white rounded-2xl border-2 border-slate-100 hover:border-uganda-red hover:bg-uganda-red/5 transition-all text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-uganda-red/10 rounded-lg group-hover:bg-uganda-red group-hover:text-white transition-all">
                  <ShieldAlert className="w-6 h-6 text-uganda-red" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-uganda-red transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">District Health Official</h3>
              <p className="text-sm text-slate-500">Monitor outbreaks, analyze trends, and manage alerts.</p>
            </button>
            
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-6">
              <div className="flex items-center gap-3 mb-2">
                <ShieldAlert className="w-5 h-5 text-uganda-red" />
                <span className="font-bold text-sm text-slate-700">Buildathon with AI 2026 Entry</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                Empowering Uganda's Community Health Volunteers with real-time AI diagnostics and outbreak monitoring.
              </p>
            </div>
          </div>

          <p className="mt-10 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Republic of Uganda • Ministry of Health
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFEF5] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-100 flex flex-col p-6 gap-8 z-10 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-uganda-red rounded-xl shadow-lg shadow-uganda-red/20">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-slate-900 tracking-tight">HealthLink AI</span>
            <div className="flex items-center gap-1.5">
              <UgandaFlag />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Uganda MoH</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {profile.role === "chv" ? (
            <>
              <button
                onClick={() => setActiveTab("symptoms")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all",
                  activeTab === "symptoms" ? "bg-uganda-yellow/10 text-uganda-red" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <FileText className="w-5 h-5" />
                Symptom Report
              </button>
              <button
                onClick={() => setActiveTab("vision")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all",
                  activeTab === "vision" ? "bg-uganda-yellow/10 text-uganda-red" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <Camera className="w-5 h-5" />
                Vision Scan
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all",
                  activeTab === "history" ? "bg-uganda-yellow/10 text-uganda-red" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <History className="w-5 h-5" />
                Patient History
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveTab("dashboard")}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all",
                activeTab === "dashboard" ? "bg-uganda-red/5 text-uganda-red" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
              Outbreak Monitor
            </button>
          )}
        </nav>

        <div className="pt-6 border-t border-slate-50 space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{profile.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{profile.role}</p>
              </div>
            </div>
            <button
              onClick={() => auth.signOut()}
              className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-slate-400 hover:text-uganda-red transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
          <div className="flex justify-center">
            <UgandaFlag />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="mb-10 flex justify-between items-end max-w-5xl mx-auto">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-uganda-red animate-pulse"></div>
              <span className="text-xs font-bold text-uganda-red uppercase tracking-widest">System Active</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              {activeTab === "symptoms" && "Patient Reporting"}
              {activeTab === "vision" && "Malnutrition Scan"}
              {activeTab === "dashboard" && "Outbreak Surveillance"}
              {activeTab === "history" && "Patient History"}
            </h2>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString('en-UG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-xs font-medium text-slate-400">East Africa Time (EAT)</p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="max-w-5xl mx-auto"
          >
            {activeTab === "symptoms" && <SymptomForm onReportSubmit={handleReportSubmit} />}
            {activeTab === "vision" && <VisionScan onScanComplete={(res) => {
              alert("Scan complete! You can now attach this to a symptom report.");
              setActiveTab("symptoms");
            }} />}
            {activeTab === "dashboard" && <OutbreakMonitor />}
            {activeTab === "history" && (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-4 overflow-x-auto">
                  {[...new Set(allReports.map(r => r.patientId))].map(pid => (
                    <button
                      key={pid}
                      onClick={() => setSelectedPatientId(pid)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
                        selectedPatientId === pid ? "bg-uganda-red text-white shadow-lg shadow-uganda-red/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {allReports.find(r => r.patientId === pid)?.patientName}
                    </button>
                  ))}
                </div>
                {selectedPatientId ? (
                  <PatientHistory reports={allReports} patientId={selectedPatientId} />
                ) : (
                  <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-200">
                    <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Select a patient to view their history</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
