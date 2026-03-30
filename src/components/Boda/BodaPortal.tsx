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
  LogOut,
  Mic,
  Volume2,
  Stethoscope
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { SOSIncident, IncidentStatus, UserRole, VoiceMessage } from "../../types";
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
  availableIncidents: SOSIncident[];
  voiceMessages: VoiceMessage[];
  onAcceptJob: (id: string) => void;
  onUpdateStatus: (status: IncidentStatus) => void;
  onUpdateMedicStatus?: (status: "pending" | "picked_up") => void;
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

export default function BodaPortal({ assignedIncident, availableIncidents, voiceMessages, onAcceptJob, onUpdateStatus, onUpdateMedicStatus, onLogout }: BodaPortalProps) {
  const [activeTab, setActiveTab] = useState<"job" | "map" | "chat">("job");

  const latestMessage = voiceMessages[voiceMessages.length - 1];

  const ALLAN_GALPHIN_COORDS = { lat: 0.354, lng: 32.739 }; // Example coordinates for Allan Galphin

  const getMapsUrl = (lat: number, lng: number) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  };

  if (!assignedIncident) {
    return (
      <div className="flex flex-col min-h-[80vh] p-3 sm:p-6 gap-4 sm:gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">Available Jobs</h2>
          <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-green-50 text-green-600 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></div>
            Online
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {availableIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center gap-3 sm:gap-4 bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-dashed border-slate-200">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <Bike className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">No Active Alerts</p>
                <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">Waiting for dispatch...</p>
              </div>
            </div>
          ) : (
            availableIncidents.map(incident => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-slate-50 shadow-sm space-y-3 sm:space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 tracking-tight text-sm">{incident.reporterName}</h4>
                      <p className="text-[9px] sm:text-[10px] font-bold text-blue-600 uppercase tracking-widest">{incident.location.campusZone}</p>
                    </div>
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">{Math.floor((Date.now() - incident.timestamp) / 60000)}m ago</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {incident.symptoms.map(s => (
                    <span key={s} className="px-2 py-0.5 bg-slate-50 rounded-md text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      {s}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => onAcceptJob(incident.id)}
                  className="w-full py-3 sm:py-4 bg-blue-600 text-white rounded-xl sm:rounded-2xl font-black uppercase text-[10px] sm:text-xs tracking-[0.2em] hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  Accept Emergency Job
                </button>
              </motion.div>
            ))
          )}
        </div>

        <button 
          onClick={onLogout}
          className="mt-auto flex items-center justify-center gap-2 py-4 text-slate-400 font-bold text-[10px] sm:text-xs hover:text-red-600 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 sm:w-4 h-3.5 sm:h-4" />
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-120px)] gap-3 sm:gap-6 overflow-hidden">
      {/* Active Job Header */}
      <div className="bg-blue-600 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] text-white shadow-xl shadow-blue-200 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-0.5 sm:mb-1">Active Emergency</p>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight">{assignedIncident.reporterName}</h2>
            <p className="text-[10px] sm:text-xs font-bold opacity-90">{assignedIncident.location.campusZone}</p>
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <button className="p-2 sm:p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button 
              onClick={() => {
                setActiveTab("chat");
                window.dispatchEvent(new CustomEvent("toggleVoiceChat"));
              }}
              className="p-2 sm:p-3 bg-white text-blue-600 rounded-xl shadow-lg transition-all"
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Transcription Ticker */}
      {latestMessage && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-900 border-l-4 border-blue-600 p-3 sm:p-4 rounded-2xl flex items-center gap-3 shrink-0"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Live Transcription • {latestMessage.senderRole}</p>
            <p className="text-xs font-bold text-white truncate">{latestMessage.text}</p>
          </div>
        </motion.div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
        <div className="flex border-b border-slate-50 shrink-0">
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
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
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Mission Steps</h4>
                <div className="grid grid-cols-1 gap-2">
                  {/* Medic Pickup Step */}
                  {assignedIncident.medicPickupRequired && (
                    <div className={cn(
                      "w-full p-4 rounded-2xl border-2 flex flex-col gap-3 transition-all",
                      assignedIncident.medicPickupStatus === "pending" 
                        ? "border-amber-600 bg-amber-50 text-amber-700 shadow-lg shadow-amber-100" 
                        : "border-green-100 bg-green-50 text-green-600 opacity-60"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            assignedIncident.medicPickupStatus === "pending" ? "bg-amber-600 text-white" : "bg-green-600 text-white"
                          )}>
                            <Stethoscope className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-black uppercase tracking-tight">Pick up Medic at Allan Galphin</span>
                        </div>
                        {assignedIncident.medicPickupStatus === "picked_up" && <CheckCircle2 className="w-5 h-5" />}
                      </div>
                      
                      {assignedIncident.medicPickupStatus === "pending" && (
                        <div className="flex gap-2">
                          <a 
                            href={getMapsUrl(ALLAN_GALPHIN_COORDS.lat, ALLAN_GALPHIN_COORDS.lng)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-3 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center shadow-md"
                          >
                            Navigate to Clinic
                          </a>
                          <button
                            onClick={() => onUpdateMedicStatus?.("picked_up")}
                            className="flex-1 py-3 bg-white text-amber-600 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm"
                          >
                            Confirm Pickup
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Standard Steps */}
                  {[
                    { id: IncidentStatus.EN_ROUTE, label: "En Route to Victim", icon: Navigation },
                    { id: IncidentStatus.ARRIVED, label: "Arrived at Scene", icon: CheckCircle2 },
                  ].map((step, idx) => {
                    const isCurrent = assignedIncident.status === step.id;
                    const isPast = [IncidentStatus.DISPATCHED, IncidentStatus.EN_ROUTE, IncidentStatus.ARRIVED].indexOf(assignedIncident.status) > (idx + 1);
                    const Icon = step.icon;
                    const isDisabled = assignedIncident.medicPickupRequired && assignedIncident.medicPickupStatus === "pending";

                    return (
                      <button
                        key={step.id}
                        onClick={() => onUpdateStatus(step.id)}
                        disabled={isPast || isCurrent || isDisabled}
                        className={cn(
                          "w-full p-4 rounded-2xl border-2 flex flex-col gap-3 transition-all",
                          isCurrent ? "border-blue-600 bg-blue-50 text-blue-700 shadow-lg shadow-blue-100" :
                          isPast ? "border-green-100 bg-green-50 text-green-600" :
                          "border-slate-50 bg-white text-slate-300",
                          isDisabled && "opacity-40 grayscale"
                        )}
                      >
                        <div className="flex items-center justify-between">
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
                          {isCurrent && <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />}
                        </div>

                        {isCurrent && (
                          <a 
                            href={getMapsUrl(assignedIncident.location.lat, assignedIncident.location.lng)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center shadow-md"
                          >
                            Navigate to Victim
                          </a>
                        )}
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
                  <a 
                    href={getMapsUrl(assignedIncident.location.lat, assignedIncident.location.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
                  >
                    Open in Maps
                  </a>
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
