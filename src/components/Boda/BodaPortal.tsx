import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bike, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Phone, 
  MessageSquare,
  Activity,
  ChevronRight,
  ShieldAlert,
  Info,
  Clock,
  LogOut
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { SOSIncident, IncidentStatus, UserRole } from "../../types";
import { cn } from "../../lib/utils";

// Fix Leaflet marker icon using CDN URLs to avoid module resolution issues
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface BodaPortalProps {
  assignedIncident: SOSIncident | null;
  onUpdateStatus: (status: IncidentStatus) => void;
  onLogout: () => void;
}

function MapUpdater({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 18, { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function BodaPortal({ assignedIncident, onUpdateStatus, onLogout }: BodaPortalProps) {
  const [activeTab, setActiveTab] = useState<"job" | "map" | "chat">("job");

  if (!assignedIncident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center gap-8">
        <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 animate-pulse">
          <Bike className="w-16 h-16" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Waiting for Jobs</h2>
          <p className="text-slate-500 font-medium max-w-xs mx-auto">
            Stay on this screen to receive emergency dispatch alerts from Allan Galphin Health Centre.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">
          <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></div>
          System Online • UCU Mukono
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 py-2 text-slate-400 font-bold text-xs hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] gap-6 overflow-hidden">
      {/* Active Job Header */}
      <div className="bg-blue-600 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Active Emergency</p>
            <h2 className="text-2xl font-black tracking-tight">{assignedIncident.reporterName}</h2>
            <p className="text-xs font-bold opacity-90">{assignedIncident.location.campusZone}</p>
          </div>
          <div className="flex gap-2">
            <button className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <Phone className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveTab("chat")}
              className={cn(
                "p-3 rounded-xl shadow-lg transition-all",
                activeTab === "chat" ? "bg-white text-blue-600" : "bg-white/10 text-white border border-white/20"
              )}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
        <div className="flex border-b border-slate-50">
          {(["job", "map", "chat"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2",
                activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 relative">
          {activeTab === "job" && (
            <div className="space-y-6">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                    <p className="text-sm font-bold text-slate-900">{assignedIncident.location.specificLocation || assignedIncident.location.campusZone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Severity</p>
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{assignedIncident.severity}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Current Status</h4>
                <div className="space-y-2">
                  {[
                    { id: IncidentStatus.DISPATCHED, label: "Job Accepted", icon: Clock },
                    { id: IncidentStatus.EN_ROUTE, label: "En Route to Scene", icon: Navigation },
                    { id: IncidentStatus.ARRIVED, label: "Arrived at Scene", icon: CheckCircle2 },
                  ].map((step, idx) => {
                    const isCurrent = assignedIncident.status === step.id;
                    const isPast = [IncidentStatus.DISPATCHED, IncidentStatus.EN_ROUTE, IncidentStatus.ARRIVED].indexOf(assignedIncident.status) > idx;
                    const Icon = step.icon;

                    return (
                      <button
                        key={step.id}
                        onClick={() => onUpdateStatus(step.id)}
                        disabled={isPast}
                        className={cn(
                          "w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all",
                          isCurrent ? "border-blue-600 bg-blue-50 text-blue-700 shadow-lg shadow-blue-100" :
                          isPast ? "border-green-100 bg-green-50 text-green-600" :
                          "border-slate-50 bg-white text-slate-300"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            isCurrent ? "bg-blue-600 text-white" :
                            isPast ? "bg-green-600 text-white" :
                            "bg-slate-50 text-slate-300"
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-tight">{step.label}</span>
                        </div>
                        {isPast && <CheckCircle2 className="w-5 h-5" />}
                        {isCurrent && <ChevronRight className="w-5 h-5 animate-pulse" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-blue-900 text-sm uppercase tracking-tight mb-1">First Aid Guidance</h4>
                  <p className="text-xs text-blue-700 leading-relaxed font-medium">
                    If patient is unconscious, roll them onto their side. If bleeding, apply direct pressure.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "map" && (
            <div className="absolute inset-0 z-0">
              <MapContainer 
                center={[assignedIncident.location.lat || 0.354, assignedIncident.location.lng || 32.739]} 
                zoom={17} 
                className="w-full h-full"
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker 
                  position={[assignedIncident.location.lat || 0.354, assignedIncident.location.lng || 32.739]}
                  icon={DefaultIcon}
                >
                  <Popup>
                    <div className="p-2">
                      <p className="font-black text-slate-900 text-xs uppercase tracking-tight mb-1">{assignedIncident.reporterName}</p>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{assignedIncident.location.campusZone}</p>
                    </div>
                  </Popup>
                </Marker>
                <MapUpdater center={[assignedIncident.location.lat || 0.354, assignedIncident.location.lng || 32.739]} />
              </MapContainer>
              <div className="absolute bottom-6 left-6 right-6 z-10">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Navigation</p>
                      <p className="text-xs font-bold text-slate-900">Heading to {assignedIncident.location.campusZone}</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                    Open in Maps
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "chat" && (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Voice Chat Coordination</p>
              <p className="text-[10px] text-slate-400 font-medium mt-2">Direct line to Allan Galphin Dispatch</p>
              <button 
                onClick={() => {
                  // This would trigger the global voice chat overlay
                  window.dispatchEvent(new CustomEvent("toggleVoiceChat"));
                }}
                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100"
              >
                Open Voice Chat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
