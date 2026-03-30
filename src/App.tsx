import React, { useState, useEffect } from "react";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, updateDoc, where, or } from "firebase/firestore";
import { UserProfile, SOSIncident, UserRole, ResourceStatus, IncidentStatus, VoiceMessage } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { 
  HeartPulse, 
  ShieldAlert, 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard, 
  MessageSquare,
  Activity,
  ChevronRight,
  Bike,
  Truck,
  Stethoscope,
  Bell,
  AlertTriangle,
  RefreshCcw,
  Mic
} from "lucide-react";
import { cn } from "./lib/utils";
import ReporterPortal from "./components/Reporter/ReporterPortal";
import DispatchPortal from "./components/Dispatch/DispatchPortal";
import BodaPortal from "./components/Boda/BodaPortal";
import FloatingFirstAid from "./components/Shared/FloatingFirstAid";
import VoiceChat from "./components/Shared/VoiceChat";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) errorMessage = parsed.error;
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">System Error</h2>
            <p className="text-slate-500 mb-8 font-medium">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              <RefreshCcw className="w-5 h-5" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

function MainApp() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [incidents, setIncidents] = useState<SOSIncident[]>([]);
  const [resources, setResources] = useState<ResourceStatus[]>([]);
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
  const [showStaffLogin, setShowStaffLogin] = useState(false);
  const [staffId, setStaffId] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const activeIncident = user ? (incidents.find(i => i.id === activeIncidentId) || incidents.find(i => i.reporterId === user.uid && i.status !== IncidentStatus.COMPLETED)) : undefined;
  const assignedIncident = (user && profile) ? incidents.find(i => i.assignedResource?.id === user.uid || (profile.role === UserRole.BODA_RIDER && i.status === IncidentStatus.DISPATCHED && !i.assignedResource)) : undefined;

  useEffect(() => {
    if (!activeIncidentId && profile && user) {
      if (profile.role === UserRole.REPORTER && activeIncident) {
        setActiveIncidentId(activeIncident.id);
      } else if (profile.role === UserRole.BODA_RIDER && assignedIncident) {
        setActiveIncidentId(assignedIncident.id);
      }
    }
  }, [activeIncident, assignedIncident, profile, user, activeIncidentId]);

  useEffect(() => {
    const handleToggleVoiceChat = () => {
      if (activeIncidentId) {
        setShowVoiceChat(true);
      }
    };
    window.addEventListener("toggleVoiceChat", handleToggleVoiceChat);
    return () => window.removeEventListener("toggleVoiceChat", handleToggleVoiceChat);
  }, [activeIncidentId]);

  const UgandaFlag = () => (
    <div className="flex items-center gap-1 h-6 w-10 overflow-hidden rounded shadow-sm border border-slate-200 shrink-0">
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
    if (profile) {
      setCurrentRole(profile.role);
    } else {
      setCurrentRole(null);
    }
  }, [profile]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !profile) return;

    let qIncidents;
    if (profile.role === UserRole.ADMIN || profile.role === UserRole.NURSE || profile.role === UserRole.BODA_COORDINATOR || profile.role === UserRole.DOCTOR) {
      qIncidents = query(collection(db, "incidents"), orderBy("timestamp", "desc"));
    } else if (profile.role === UserRole.BODA_RIDER) {
      qIncidents = query(
        collection(db, "incidents"), 
        or(
          where("status", "==", IncidentStatus.DISPATCHED),
          where("assignedResource.id", "==", user.uid)
        ),
        orderBy("timestamp", "desc")
      );
    } else {
      // Reporter
      qIncidents = query(
        collection(db, "incidents"), 
        where("reporterId", "==", user.uid),
        orderBy("timestamp", "desc")
      );
    }

    const unsubscribeIncidents = onSnapshot(qIncidents, (snapshot) => {
      setIncidents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SOSIncident)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "incidents");
    });

    const qResources = query(collection(db, "resources"));
    const unsubscribeResources = onSnapshot(qResources, (snapshot) => {
      setResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResourceStatus)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "resources");
    });

    return () => {
      unsubscribeIncidents();
      unsubscribeResources();
    };
  }, [user, profile]);

  const handleLogin = async (role: UserRole) => {
    if (isLoggingIn) return;
    
    // Merge Staff Login: If Dispatch Dashboard is clicked, show staff login form
    if (role === UserRole.NURSE || role === UserRole.ADMIN || role === UserRole.DOCTOR) {
      setShowStaffLogin(true);
      return;
    }

    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      let finalRole: UserRole = role;
      if (user.email === "wjdaniel379@gmail.com" || user.email === "trizzydaniels352@gmail.com") {
        finalRole = UserRole.ADMIN;
      }
      const profileData: UserProfile = {
        uid: user.uid,
        email: user.email || "",
        role: finalRole,
        name: user.displayName || "User",
        phone: "0700 000 000"
      };
      
      try {
        await setDoc(doc(db, "users", user.uid), profileData);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }
      
      setProfile(profileData);

      // Bootstrap resources if official
      const currentRole = finalRole as UserRole;
      if (currentRole === UserRole.NURSE || currentRole === UserRole.BODA_COORDINATOR || currentRole === UserRole.ADMIN || currentRole === UserRole.DOCTOR) {
        const initialResources: ResourceStatus[] = [
          { id: "amb-1", type: "ambulance", name: "Ambulance A", status: "available", lastUpdated: Date.now() },
          { id: "amb-2", type: "ambulance", name: "Ambulance B", status: "available", lastUpdated: Date.now() },
          { id: "boda-1", type: "boda", name: "Rider: Musoke", status: "available", lastUpdated: Date.now() },
          { id: "boda-2", type: "boda", name: "Rider: Okello", status: "available", lastUpdated: Date.now() },
          { id: "staff-1", type: "staff", name: "Dr. Sarah", status: "available", lastUpdated: Date.now() },
        ];
        for (const res of initialResources) {
          try {
            await setDoc(doc(db, "resources", res.id), res);
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `resources/${res.id}`);
          }
        }
      }
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request') {
        console.log("Popup request cancelled - another one is likely in progress");
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log("User closed the login popup");
      } else {
        console.error("Login failed:", error);
        if (error instanceof Error && error.message.includes('{"error":')) {
          throw error; // Let ErrorBoundary handle it
        }
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      // For Staff ID login, we'll assume the email is staffid@ucu.ac.ug
      // This is a common pattern for mapping IDs to Firebase Auth emails
      const email = `${staffId.toLowerCase()}@ucu.ac.ug`;
      const result = await signInWithEmailAndPassword(auth, email, staffPassword);
      const user = result.user;
      
      // Check if this user already has a profile, if not create one as ADMIN or NURSE
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        let finalRole = UserRole.ADMIN;
        if (staffId.toLowerCase().startsWith('nurse')) finalRole = UserRole.NURSE;
        if (staffId.toLowerCase().startsWith('rider')) finalRole = UserRole.BODA_RIDER;
        if (staffId.toLowerCase().startsWith('doctor')) finalRole = UserRole.DOCTOR;
        
        const profileData: UserProfile = {
          uid: user.uid,
          email: user.email || "",
          role: finalRole,
          name: staffId.toUpperCase(),
          phone: "0700 000 000"
        };
        await setDoc(docRef, profileData);
        setProfile(profileData);
      } else {
        setProfile(docSnap.data() as UserProfile);
      }
    } catch (error: any) {
      console.error("Staff login failed:", error);
      setLoginError("Invalid Staff ID or Password. Please ensure Email/Password auth is enabled in Firebase Console.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const bootstrapSampleAccounts = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    const samples = [
      { id: 'nurse01', role: UserRole.NURSE, name: 'Nurse Sarah' },
      { id: 'nurse02', role: UserRole.NURSE, name: 'Nurse John' },
      { id: 'rider01', role: UserRole.BODA_RIDER, name: 'Rider Musoke' },
      { id: 'rider02', role: UserRole.BODA_RIDER, name: 'Rider Okello' },
      { id: 'admin01', role: UserRole.ADMIN, name: 'Admin Allan' },
      { id: 'doctor01', role: UserRole.DOCTOR, name: 'Dr. Mukasa' },
    ];

    try {
      for (const sample of samples) {
        const email = `${sample.id}@ucu.ac.ug`;
        try {
          const result = await createUserWithEmailAndPassword(auth, email, 'password123');
          const profileData: UserProfile = {
            uid: result.user.uid,
            email,
            role: sample.role,
            name: sample.name,
            phone: "0700 000 000"
          };
          await setDoc(doc(db, "users", result.user.uid), profileData);
        } catch (e: any) {
          if (e.code === 'auth/email-already-in-use') {
            console.log(`${email} already exists`);
          } else {
            throw e;
          }
        }
      }
      alert("Sample accounts bootstrapped! Use password 'password123'");
    } catch (error: any) {
      setLoginError("Failed to bootstrap: " + error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDemoLogin = (role: UserRole, name: string) => {
    const demoProfile: UserProfile = {
      uid: `demo-${role}-${Date.now()}`,
      email: `${role}@demo.edis`,
      role,
      name,
      phone: "0700 000 000"
    };
    setProfile(demoProfile);
    setShowStaffLogin(false);
  };

  const handleSOS = async (incident: Partial<SOSIncident>) => {
    if (!user || !profile) return;
    const newIncident: SOSIncident = {
      id: `SOS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      reporterId: user.uid,
      reporterName: profile.name,
      reporterPhone: incident.reporterPhone || profile.phone,
      symptoms: incident.symptoms || [],
      severity: incident.severity || IncidentStatus.RECEIVED as any,
      description: incident.description || "",
      photoUrl: incident.photoUrl,
      victimName: incident.victimName,
      ucuId: incident.ucuId,
      location: incident.location as any,
      status: IncidentStatus.RECEIVED,
      timestamp: Date.now(),
      auditTrail: [{ status: IncidentStatus.RECEIVED, timestamp: Date.now(), note: "Incident reported" }]
    };
    try {
      await setDoc(doc(db, "incidents", newIncident.id), newIncident);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `incidents/${newIncident.id}`);
    }
    setActiveIncidentId(newIncident.id);
  };

  const handleAcceptIncident = async (incidentId: string) => {
    if (!user || !profile) return;
    try {
      await updateDoc(doc(db, "incidents", incidentId), {
        status: IncidentStatus.DISPATCHED,
        assignedResource: {
          type: "boda",
          id: user.uid,
          name: profile.name,
          phone: profile.phone
        },
        auditTrail: [
          ...incidents.find(i => i.id === incidentId)!.auditTrail,
          { status: IncidentStatus.DISPATCHED, timestamp: Date.now(), note: `Accepted by ${profile.name}` }
        ]
      });
      
      // Also update resource status if it exists
      const resourceRef = doc(db, "resources", user.uid);
      const resourceSnap = await getDoc(resourceRef);
      if (resourceSnap.exists()) {
        await updateDoc(resourceRef, { status: "on_call" });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `incidents/${incidentId}`);
    }
    setActiveIncidentId(incidentId);
  };

  const updateIncident = async (id: string, updates: Partial<SOSIncident>) => {
    try {
      await updateDoc(doc(db, "incidents", id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `incidents/${id}`);
    }
  };

  const updateResource = async (id: string, updates: Partial<ResourceStatus>) => {
    try {
      await updateDoc(doc(db, "resources", id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `resources/${id}`);
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
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-2 shadow-2xl shadow-blue-200">
            <Activity className="w-12 h-12 text-white" />
          </div>
          <UgandaFlag />
          <p className="text-slate-900 font-black tracking-widest uppercase text-[10px]">EDIS • UCU Mukono</p>
        </motion.div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl border border-slate-100 relative z-10"
        >
          <div className="flex flex-col items-center mb-8 sm:mb-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-xl shadow-blue-100">
              <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <UgandaFlag />
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-slate-900">EDIS</h1>
            </div>
            <p className="text-slate-500 font-bold text-[10px] sm:text-xs uppercase tracking-widest text-center">
              Digital Emergency Dispatch & Information System
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {!showStaffLogin ? (
              <>
                <button
                  onClick={() => handleLogin(UserRole.REPORTER)}
                  disabled={isLoggingIn}
                  className="w-full group relative p-4 sm:p-6 bg-white rounded-2xl border-2 border-slate-100 hover:border-red-600 hover:bg-red-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-all text-red-600">
                      <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-hover:text-red-600 transition-colors" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Reporter Portal</h3>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500">Students, Staff, and Visitors. One-tap SOS trigger.</p>
                </button>

                <button
                  onClick={() => handleLogin(UserRole.NURSE)}
                  disabled={isLoggingIn}
                  className="w-full group relative p-4 sm:p-6 bg-white rounded-2xl border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all text-blue-600">
                      <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Dispatch Dashboard</h3>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500">Allan Galphin Clinic Staff. Login with Staff ID.</p>
                </button>

                <button
                  onClick={() => handleLogin(UserRole.BODA_RIDER)}
                  disabled={isLoggingIn}
                  className="w-full group relative p-4 sm:p-6 bg-white rounded-2xl border-2 border-slate-100 hover:border-green-600 hover:bg-green-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-all text-green-600">
                      <Bike className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-hover:text-green-600 transition-colors" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Boda Responder</h3>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500">Rapid response network. Receive jobs and navigate.</p>
                </button>
              </>
            ) : (
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">Staff Authentication</h3>
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Staff ID</label>
                  <input
                    type="text"
                    required
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    placeholder="Enter Staff ID"
                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-600 focus:bg-white transition-all outline-none font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Password</label>
                  <input
                    type="password"
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-600 focus:bg-white transition-all outline-none font-bold text-sm"
                  />
                </div>
                {loginError && (
                  <p className="text-[10px] font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                    {loginError}
                  </p>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowStaffLogin(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                  >
                    {isLoggingIn ? "Logging in..." : "Login"}
                  </button>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={bootstrapSampleAccounts}
                    disabled={isLoggingIn}
                    className="w-full py-3 bg-slate-50 text-slate-400 rounded-xl text-[8px] font-black uppercase tracking-widest hover:text-blue-600 transition-colors border border-dashed border-slate-200"
                  >
                    Bootstrap Sample Staff Accounts
                  </button>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDemoLogin(UserRole.NURSE, "Demo Nurse")}
                      className="py-2 bg-blue-50 text-blue-600 rounded-lg text-[7px] font-black uppercase tracking-widest hover:bg-blue-100"
                    >
                      Demo Nurse
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoLogin(UserRole.DOCTOR, "Demo Doctor")}
                      className="py-2 bg-red-50 text-red-600 rounded-lg text-[7px] font-black uppercase tracking-widest hover:bg-red-100"
                    >
                      Demo Doctor
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoLogin(UserRole.BODA_RIDER, "Demo Rider")}
                      className="py-2 bg-green-50 text-green-600 rounded-lg text-[7px] font-black uppercase tracking-widest hover:bg-green-100"
                    >
                      Demo Rider
                    </button>
                  </div>
                </div>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest text-slate-400 bg-white px-2">
                    Or continue with
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleLogin(UserRole.ADMIN)}
                  disabled={isLoggingIn}
                  className="w-full py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </button>
              </form>
            )}
          </div>

          <p className="mt-8 sm:mt-10 text-center text-[8px] sm:text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
            UCU Mukono • Allan Galphin Health Centre
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-3 sm:px-6 py-2 sm:py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg sm:rounded-xl shadow-lg shadow-blue-200">
            <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tighter leading-none">EDIS</h2>
            <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
              <UgandaFlag />
              <span className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[80px] sm:max-w-none">Allan Galphin • UCU Mukono</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-6">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-[10px] sm:text-xs font-black text-slate-900 uppercase tracking-tight">{new Date().toLocaleTimeString()}</p>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">System Online</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-6 border-l border-slate-100">
            {profile.role === UserRole.ADMIN && (
              <select 
                value={currentRole || ""}
                onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                className="hidden md:block bg-slate-50 border-none text-[8px] font-black uppercase tracking-widest text-blue-600 rounded-lg px-2 py-1 outline-none cursor-pointer"
              >
                {Object.values(UserRole).map(r => (
                  <option key={r} value={r}>{r.replace('_', ' ')} View</option>
                ))}
              </select>
            )}
            <div className="text-right hidden sm:block">
              <p className="text-[10px] sm:text-xs font-black text-slate-900 truncate max-w-[60px] sm:max-w-none">{profile.name}</p>
              <p className="text-[8px] sm:text-[9px] font-bold text-blue-600 uppercase tracking-widest">{currentRole || profile.role}</p>
            </div>
            <button 
              onClick={() => auth.signOut()}
              className="p-1.5 sm:p-2.5 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-3 sm:p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {currentRole === UserRole.REPORTER && (
            <>
              <ReporterPortal onSOS={handleSOS} activeIncident={activeIncident || null} />
              <FloatingFirstAid />
            </>
          )}

          {(currentRole === UserRole.NURSE || currentRole === UserRole.ADMIN || currentRole === UserRole.DOCTOR || currentRole === UserRole.BODA_COORDINATOR) && (
            <DispatchPortal 
              incidents={incidents} 
              resources={resources} 
              userRole={currentRole as UserRole}
              onUpdateIncident={updateIncident}
              onUpdateResource={updateResource}
            />
          )}

          {currentRole === UserRole.BODA_RIDER && (
            <BodaPortal 
              assignedIncident={assignedIncident || null} 
              availableIncidents={incidents.filter(i => i.status === IncidentStatus.RECEIVED)}
              voiceMessages={voiceMessages.filter(m => m.incidentId === assignedIncident?.id)}
              onAcceptJob={handleAcceptIncident}
              onUpdateStatus={(status) => updateIncident(assignedIncident!.id, { status })}
              onUpdateMedicStatus={(status) => updateIncident(assignedIncident!.id, { medicPickupStatus: status })}
              onLogout={() => auth.signOut()}
            />
          )}
        </div>
      </main>

      {/* Floating Voice Chat Trigger */}
      {activeIncidentId && !showVoiceChat && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
          {/* Live Transcription Bubble */}
          {voiceMessages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 max-w-[200px] sm:max-w-xs pointer-events-auto"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Live Transcription</span>
              </div>
              <p className="text-[10px] font-bold text-slate-900 line-clamp-2 italic">
                "{voiceMessages[voiceMessages.length - 1].text}"
              </p>
            </motion.div>
          )}

          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowVoiceChat(true)}
            className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white pointer-events-auto"
          >
            <Mic className="w-8 h-8" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full border-2 border-white animate-pulse" />
          </motion.button>
        </div>
      )}

      {/* Voice Chat Overlay */}
      {showVoiceChat && activeIncidentId && (
        <VoiceChat 
          incidentId={activeIncidentId}
          currentUserRole={profile.role}
          messages={voiceMessages}
          onSendMessage={(text, lang) => {
            const newMsg: VoiceMessage = {
              id: Math.random().toString(36).substr(2, 9),
              incidentId: activeIncidentId,
              senderId: user.uid,
              senderRole: profile.role,
              text,
              timestamp: Date.now(),
              language: lang
            };
            setVoiceMessages(prev => [...prev, newMsg]);
          }}
          onClose={() => setShowVoiceChat(false)}
        />
      )}
    </div>
  );
}
