import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection, query, orderBy, onSnapshot, updateDoc } from "firebase/firestore";
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
  Bell
} from "lucide-react";
import { cn } from "./lib/utils";
import ReporterPortal from "./components/Reporter/ReporterPortal";
import DispatchPortal from "./components/Dispatch/DispatchPortal";
import BodaPortal from "./components/Boda/BodaPortal";
import FloatingFirstAid from "./components/Shared/FloatingFirstAid";
import VoiceChat from "./components/Shared/VoiceChat";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<SOSIncident[]>([]);
  const [resources, setResources] = useState<ResourceStatus[]>([]);
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);

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

    const qIncidents = query(collection(db, "incidents"), orderBy("timestamp", "desc"));
    const unsubscribeIncidents = onSnapshot(qIncidents, (snapshot) => {
      setIncidents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SOSIncident)));
    });

    const qResources = query(collection(db, "resources"));
    const unsubscribeResources = onSnapshot(qResources, (snapshot) => {
      setResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResourceStatus)));
    });

    return () => {
      unsubscribeAuth();
      unsubscribeIncidents();
      unsubscribeResources();
    };
  }, []);

  const handleLogin = async (role: UserRole) => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const profileData: UserProfile = {
        uid: user.uid,
        email: user.email || "",
        role,
        name: user.displayName || "User",
        phone: "0700 000 000"
      };
      await setDoc(doc(db, "users", user.uid), profileData);
      setProfile(profileData);

      // Bootstrap resources if official
      if (role === UserRole.NURSE || role === UserRole.BODA_COORDINATOR) {
        const initialResources: ResourceStatus[] = [
          { id: "amb-1", type: "ambulance", name: "Ambulance A", status: "available", lastUpdated: Date.now() },
          { id: "amb-2", type: "ambulance", name: "Ambulance B", status: "available", lastUpdated: Date.now() },
          { id: "boda-1", type: "boda", name: "Rider: Musoke", status: "available", lastUpdated: Date.now() },
          { id: "boda-2", type: "boda", name: "Rider: Okello", status: "available", lastUpdated: Date.now() },
          { id: "staff-1", type: "staff", name: "Dr. Sarah", status: "available", lastUpdated: Date.now() },
        ];
        for (const res of initialResources) {
          await setDoc(doc(db, "resources", res.id), res);
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleSOS = async (incident: Partial<SOSIncident>) => {
    if (!user || !profile) return;
    const newIncident: SOSIncident = {
      id: `SOS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      reporterId: user.uid,
      reporterName: profile.name,
      reporterPhone: profile.phone,
      symptoms: incident.symptoms || [],
      severity: incident.severity || IncidentStatus.RECEIVED as any,
      description: incident.description || "",
      location: incident.location as any,
      status: IncidentStatus.RECEIVED,
      timestamp: Date.now(),
      auditTrail: [{ status: IncidentStatus.RECEIVED, timestamp: Date.now(), note: "Incident reported" }]
    };
    await setDoc(doc(db, "incidents", newIncident.id), newIncident);
    setActiveIncidentId(newIncident.id);
  };

  const updateIncident = async (id: string, updates: Partial<SOSIncident>) => {
    await updateDoc(doc(db, "incidents", id), updates);
  };

  const updateResource = async (id: string, updates: Partial<ResourceStatus>) => {
    await updateDoc(doc(db, "resources", id), updates);
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 relative z-10"
        >
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-100">
              <Activity className="w-12 h-12 text-white" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <UgandaFlag />
              <h1 className="text-3xl font-black tracking-tighter text-slate-900">EDIS</h1>
            </div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest text-center">
              Digital Emergency Dispatch & Information System
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleLogin(UserRole.REPORTER)}
              className="w-full group relative p-6 bg-white rounded-2xl border-2 border-slate-100 hover:border-red-600 hover:bg-red-50 transition-all text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-all text-red-600">
                  <Bell className="w-6 h-6" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-red-600 transition-colors" />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Reporter Portal</h3>
              <p className="text-xs font-medium text-slate-500">Students, Staff, and Visitors. One-tap SOS trigger.</p>
            </button>

            <button
              onClick={() => handleLogin(UserRole.NURSE)}
              className="w-full group relative p-6 bg-white rounded-2xl border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50 transition-all text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all text-blue-600">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Dispatch Dashboard</h3>
              <p className="text-xs font-medium text-slate-500">Allan Galphin Clinic Staff. Manage alerts and fleet.</p>
            </button>

            <button
              onClick={() => handleLogin(UserRole.BODA_RIDER)}
              className="w-full group relative p-6 bg-white rounded-2xl border-2 border-slate-100 hover:border-green-600 hover:bg-green-50 transition-all text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-all text-green-600">
                  <Bike className="w-6 h-6" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-green-600 transition-colors" />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Boda Responder</h3>
              <p className="text-xs font-medium text-slate-500">Rapid response network. Receive jobs and navigate.</p>
            </button>
          </div>

          <p className="mt-10 text-center text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
            UCU Mukono • Allan Galphin Health Centre
          </p>
        </motion.div>
      </div>
    );
  }

  const activeIncident = incidents.find(i => i.id === activeIncidentId) || incidents.find(i => i.reporterId === user.uid && i.status !== IncidentStatus.COMPLETED);
  const assignedIncident = incidents.find(i => i.assignedResource?.id === user.uid || (profile.role === UserRole.BODA_RIDER && i.status === IncidentStatus.DISPATCHED && !i.assignedResource));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tighter">EDIS</h2>
            <div className="flex items-center gap-2">
              <UgandaFlag />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Allan Galphin • UCU Mukono</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{new Date().toLocaleTimeString()}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">System Online</p>
          </div>
          <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
            <div className="text-right">
              <p className="text-xs font-black text-slate-900">{profile.name}</p>
              <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">{profile.role}</p>
            </div>
            <button 
              onClick={() => auth.signOut()}
              className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-600 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {profile.role === UserRole.REPORTER && (
            <>
              <ReporterPortal onSOS={handleSOS} activeIncident={activeIncident || null} />
              <FloatingFirstAid />
            </>
          )}

          {profile.role === UserRole.NURSE && (
            <DispatchPortal 
              incidents={incidents} 
              resources={resources} 
              onUpdateIncident={updateIncident}
              onUpdateResource={updateResource}
            />
          )}

          {profile.role === UserRole.BODA_RIDER && (
            <BodaPortal 
              assignedIncident={assignedIncident || null} 
              onUpdateStatus={(status) => updateIncident(assignedIncident!.id, { status })}
              onLogout={() => auth.signOut()}
            />
          )}
        </div>
      </main>

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
