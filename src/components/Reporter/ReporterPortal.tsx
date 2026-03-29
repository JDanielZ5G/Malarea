import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  AlertCircle, 
  MapPin, 
  ChevronRight, 
  Camera, 
  Clock, 
  CheckCircle2, 
  Navigation,
  Info,
  ShieldAlert,
  Phone,
  MessageSquare
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { EMERGENCY_SYMPTOMS, CAMPUS_ZONES, THEME_COLORS } from "../../constants";
import { SOSIncident, Urgency, IncidentStatus } from "../../types";
import { cn } from "../../lib/utils";

// Fix Leaflet marker icon using CDN URLs to avoid module resolution issues
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface ReporterPortalProps {
  onSOS: (incident: Partial<SOSIncident>) => void;
  activeIncident: SOSIncident | null;
}

function DraggableMarker({ position, onPositionChange }: { position: [number, number], onPositionChange: (pos: [number, number]) => void }) {
  const markerRef = useRef<L.Marker>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          onPositionChange([lat, lng]);
        }
      },
    }),
    [onPositionChange],
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={DefaultIcon}
    >
      <Popup minWidth={90}>
        <span className="text-xs font-bold">Drag to your exact location</span>
      </Popup>
    </Marker>
  );
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

export default function ReporterPortal({ onSOS, activeIncident }: ReporterPortalProps) {
  const [step, setStep] = useState<"home" | "triage" | "location" | "status">("home");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<Urgency>(Urgency.MODERATE);
  const [campusZone, setCampusZone] = useState(CAMPUS_ZONES[0]);
  const [specificLocation, setSpecificLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (activeIncident) {
      setStep("status");
    } else {
      setStep("home");
    }
  }, [activeIncident]);

  const handleSOSClick = () => {
    setStep("triage");
    // Start capturing GPS in background
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        (err) => {
          console.error("Geolocation error:", err);
          // Default to UCU Mukono center if geolocation fails
          setCoords({ lat: 0.354, lng: 32.739 });
          setIsLocating(false);
        }
      );
    } else {
      // Default to UCU Mukono center
      setCoords({ lat: 0.354, lng: 32.739 });
    }
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSubmit = () => {
    onSOS({
      symptoms: selectedSymptoms,
      severity,
      description,
      location: {
        lat: coords?.lat || 0.354,
        lng: coords?.lng || 32.739,
        campusZone,
        specificLocation
      }
    });
  };

  if (step === "home") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 p-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSOSClick}
          className="w-64 h-64 rounded-full bg-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)] flex flex-col items-center justify-center text-white border-8 border-white animate-pulse"
        >
          <AlertCircle className="w-24 h-24 mb-2" />
          <span className="text-4xl font-black tracking-tighter uppercase">SOS</span>
          <span className="text-xs font-bold opacity-80 mt-1">TAP FOR EMERGENCY</span>
        </motion.button>
        
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Need Immediate Help?</h3>
          <p className="text-slate-500 font-medium max-w-xs mx-auto">
            Your location and medical details will be sent directly to Allan Galphin Health Centre.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <ShieldAlert className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-xs font-bold text-slate-900">Campus Security</span>
            <span className="text-[10px] text-slate-400 font-medium">0800 123 456</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <Phone className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-xs font-bold text-slate-900">Clinic Hotline</span>
            <span className="text-[10px] text-slate-400 font-medium">0800 789 012</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === "triage") {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-xl mx-auto space-y-8 pb-20"
      >
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">What's the Emergency?</h2>
          <p className="text-slate-500 font-medium">Select all that apply to help us triage correctly.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EMERGENCY_SYMPTOMS.map(symptom => (
            <button
              key={symptom}
              onClick={() => toggleSymptom(symptom)}
              className={cn(
                "p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group",
                selectedSymptoms.includes(symptom) 
                  ? "border-red-600 bg-red-50 text-red-700" 
                  : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
              )}
            >
              <span className="font-bold text-sm">{symptom}</span>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                selectedSymptoms.includes(symptom) ? "bg-red-600 border-red-600" : "border-slate-200"
              )}>
                {selectedSymptoms.includes(symptom) && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Severity Level</label>
          <div className="flex gap-2">
            {[Urgency.MODERATE, Urgency.SERIOUS, Urgency.CRITICAL].map(level => (
              <button
                key={level}
                onClick={() => setSeverity(level)}
                className={cn(
                  "flex-1 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all border-2",
                  severity === level 
                    ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-200" 
                    : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={() => setStep("home")}
            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => setStep("location")}
            disabled={selectedSymptoms.length === 0}
            className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            Next: Location
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    );
  }

  if (step === "location") {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-xl mx-auto space-y-8 pb-20"
      >
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Confirm Location</h2>
          <p className="text-slate-500 font-medium">We've captured your GPS, but please provide campus details.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          {/* Map Integration */}
          <div className="h-64 rounded-2xl overflow-hidden border-2 border-slate-100 relative z-0">
            <MapContainer 
              center={[coords?.lat || 0.354, coords?.lng || 32.739]} 
              zoom={17} 
              className="w-full h-full"
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {coords && (
                <DraggableMarker 
                  position={[coords.lat, coords.lng]} 
                  onPositionChange={([lat, lng]) => setCoords({ lat, lng })} 
                />
              )}
              <MapUpdater center={coords ? [coords.lat, coords.lng] : null} />
            </MapContainer>
            <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Navigation className="w-3 h-3 text-blue-600" />
                Drag pin to adjust
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">GPS Status</p>
              <p className="text-sm font-bold text-slate-900 truncate">
                {isLocating ? "Acquiring signal..." : coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : "Signal weak - use dropdown"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-900 uppercase tracking-widest">Campus Zone / Hostel</label>
              <select
                value={campusZone}
                onChange={(e) => setCampusZone(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-600 focus:bg-white transition-all outline-none font-bold text-slate-900"
              >
                {CAMPUS_ZONES.map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-900 uppercase tracking-widest">Specific Details (Room #, Landmark)</label>
              <input
                type="text"
                value={specificLocation}
                onChange={(e) => setSpecificLocation(e.target.value)}
                placeholder="e.g. Room 204, Near the big tree"
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-600 focus:bg-white transition-all outline-none font-bold text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-900 uppercase tracking-widest">Incident Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any other details for the medical team..."
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-600 focus:bg-white transition-all outline-none font-bold text-slate-900 h-24 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={() => setStep("triage")}
            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
          >
            SEND EMERGENCY ALERT
            <ShieldAlert className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    );
  }

  if (step === "status" && activeIncident) {
    const statusSteps = [
      { id: IncidentStatus.RECEIVED, label: "Received", icon: Clock },
      { id: IncidentStatus.DISPATCHED, label: "Dispatched", icon: Navigation },
      { id: IncidentStatus.EN_ROUTE, label: "En Route", icon: Navigation },
      { id: IncidentStatus.ARRIVED, label: "Arrived", icon: CheckCircle2 },
    ];

    const currentStatusIndex = statusSteps.findIndex(s => s.id === activeIncident.status);

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto space-y-6 pb-20"
      >
        <div className="bg-red-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-red-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-2">Emergency ID: {activeIncident.id}</p>
            <h2 className="text-3xl font-black tracking-tight mb-4">Help is on the way!</h2>
            <div className="flex items-center gap-3 p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-600">
                <Navigation className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-bold">
                  {activeIncident.assignedResource 
                    ? `${activeIncident.assignedResource.type === "ambulance" ? "Ambulance" : "Boda"} Dispatched` 
                    : "Assigning nearest responder..."}
                </p>
                {activeIncident.assignedResource && (
                  <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">
                    {activeIncident.assignedResource.name} • {activeIncident.assignedResource.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Live Incident Tracker</h3>
          <div className="relative flex justify-between">
            <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100"></div>
            <div 
              className="absolute top-5 left-0 h-0.5 bg-red-600 transition-all duration-500" 
              style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
            ></div>
            
            {statusSteps.map((s, idx) => {
              const Icon = s.icon;
              const isActive = idx <= currentStatusIndex;
              const isCurrent = idx === currentStatusIndex;
              
              return (
                <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all border-2",
                    isCurrent ? "bg-red-600 border-red-600 scale-110 shadow-lg shadow-red-200" :
                    isActive ? "bg-red-100 border-red-600 text-red-600" :
                    "bg-white border-slate-100 text-slate-300"
                  )}>
                    <Icon className={cn("w-5 h-5", isCurrent && "text-white")} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    isActive ? "text-red-600" : "text-slate-300"
                  )}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 group hover:border-blue-600 transition-all">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Phone className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Call Dispatch</p>
              <p className="text-[10px] text-slate-400 font-bold">Allan Galphin</p>
            </div>
          </button>
          <button className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 group hover:border-green-600 transition-all">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Voice Chat</p>
              <p className="text-[10px] text-slate-400 font-bold">With Responder</p>
            </div>
          </button>
        </div>

        <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-blue-900 text-sm uppercase tracking-tight mb-1">Stay Calm</h4>
            <p className="text-sm text-blue-700 leading-relaxed font-medium">
              Help is approaching your location. Use the floating first-aid panel below if you need immediate guidance while waiting.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}
