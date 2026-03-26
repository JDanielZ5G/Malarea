import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { UserProfile, PatientReport } from "./types";
import SymptomForm from "./components/CHVPortal/SymptomForm";
import VisionScan from "./components/CHVPortal/VisionScan";
import OutbreakMonitor from "./components/OfficialDashboard/OutbreakMonitor";
import { DISTRICTS } from "./constants";
import { motion, AnimatePresence } from "motion/react";
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
  ChevronRight
} from "lucide-react";
import { cn } from "./lib/utils";
import { addDoc, collection } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"symptoms" | "vision" | "dashboard">("symptoms");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
    return () => unsubscribe();
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <HeartPulse className="w-16 h-16 text-emerald-500" />
          <p className="text-slate-500 font-medium animate-pulse">Initializing HealthLink AI...</p>
        </motion.div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8 text-center"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
              <Activity className="w-3 h-3" />
              Buildathon with AI 2026 Entry
            </div>
            <div className="p-4 bg-emerald-100 rounded-3xl shadow-inner">
              <HeartPulse className="w-12 h-12 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">HealthLink AI</h1>
            <p className="text-slate-500 font-medium">Bridging the gap in community healthcare with AI</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => handleLogin("chv")}
              className="group relative p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                  <Stethoscope className="w-6 h-6 text-emerald-600" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Community Health Volunteer</h3>
              <p className="text-sm text-slate-500">Record symptoms, use vision for malnutrition scans, and submit reports.</p>
            </button>

            <button
              onClick={() => handleLogin("official")}
              className="group relative p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <ShieldAlert className="w-6 h-6 text-blue-600" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">District Health Official</h3>
              <p className="text-sm text-slate-500">Monitor outbreaks, analyze trends, and receive real-time alerts.</p>
            </button>
          </div>

          <div className="pt-8 border-t border-slate-200 flex justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Real-time</span>
            </div>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Vision AI</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col p-6 gap-8 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-200">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">HealthLink AI</span>
        </div>

        <nav className="flex-1 space-y-2">
          {profile.role === "chv" ? (
            <>
              <button
                onClick={() => setActiveTab("symptoms")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all",
                  activeTab === "symptoms" ? "bg-emerald-50 text-emerald-600" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <FileText className="w-5 h-5" />
                Symptom Report
              </button>
              <button
                onClick={() => setActiveTab("vision")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all",
                  activeTab === "vision" ? "bg-emerald-50 text-emerald-600" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <Camera className="w-5 h-5" />
                Vision Scan
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveTab("dashboard")}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all",
                activeTab === "dashboard" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
              Outbreak Monitor
            </button>
          )}
        </nav>

        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{profile.name}</p>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{profile.role}</p>
            </div>
          </div>
          <button
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
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
              // This is a simplified prototype flow
              alert("Scan complete! You can now attach this to a symptom report.");
              setActiveTab("symptoms");
            }} />}
            {activeTab === "dashboard" && <OutbreakMonitor />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
