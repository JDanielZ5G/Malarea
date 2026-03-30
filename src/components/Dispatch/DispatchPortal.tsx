import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Phone, 
  MessageSquare,
  Activity,
  Truck,
  Bike,
  Settings,
  MoreVertical,
  Search,
  Filter,
  ChevronRight,
  Stethoscope,
  Wind,
  Droplets,
  Zap
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { SOSIncident, IncidentStatus, ResourceStatus, Urgency, UserRole } from "../../types";
import { cn } from "../../lib/utils";

// Fix Leaflet marker icon using CDN URLs to avoid module resolution issues
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface DispatchPortalProps {
  incidents: SOSIncident[];
  resources: ResourceStatus[];
  userRole: UserRole;
  onUpdateIncident: (id: string, updates: Partial<SOSIncident>) => void;
  onUpdateResource: (id: string, updates: Partial<ResourceStatus>) => void;
}

export default function DispatchPortal({ incidents, resources, userRole, onUpdateIncident, onUpdateResource }: DispatchPortalProps) {
  const [selectedIncident, setSelectedIncident] = useState<SOSIncident | null>(null);
  const [activeTab, setActiveTab] = useState<"alerts" | "fleet" | "staff">("alerts");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFleetPicker, setShowFleetPicker] = useState(false);

  const canAssign = userRole === UserRole.ADMIN || userRole === UserRole.DOCTOR;

  const activeIncidents = incidents.filter(i => i.status !== IncidentStatus.COMPLETED);
  const filteredIncidents = activeIncidents.filter(i => 
    i.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.location.campusZone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssignResource = (incidentId: string, resource: ResourceStatus) => {
    if (!canAssign) return;
    onUpdateIncident(incidentId, {
      status: IncidentStatus.DISPATCHED,
      assignedResource: {
        type: resource.type === "ambulance" ? "ambulance" : "boda",
        id: resource.id,
        name: resource.name,
        phone: "0800 123 456" // Mock phone
      },
      auditTrail: [
        ...incidents.find(i => i.id === incidentId)!.auditTrail,
        { status: IncidentStatus.DISPATCHED, timestamp: Date.now(), note: `Assigned to ${resource.name}` }
      ]
    });
    onUpdateResource(resource.id, { status: "on_call" });
    setShowFleetPicker(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] lg:h-[calc(100vh-120px)] gap-4 lg:gap-6 overflow-hidden relative">
      {/* Sidebar: Alerts & Fleet */}
      <div className={cn(
        "w-full lg:w-96 flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden shrink-0 transition-all duration-300",
        selectedIncident ? "hidden lg:flex" : "flex"
      )}>
        <div className="p-4 lg:p-6 border-b border-slate-50 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg lg:text-xl font-black text-slate-900 tracking-tight uppercase">Allan Galphin Dispatch</h2>
            <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          
          <div className="flex bg-slate-50 p-1 rounded-2xl">
            {(["alerts", "fleet", "staff"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all outline-none text-sm font-bold"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-4 max-h-[40vh] lg:max-h-none">
          {activeTab === "alerts" && (
            <AnimatePresence mode="popLayout">
              {filteredIncidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 lg:py-20 text-center">
                  <Activity className="w-10 lg:w-12 h-10 lg:h-12 text-slate-200 mb-2" />
                  <p className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">No Active Alerts</p>
                </div>
              ) : (
                filteredIncidents.map(incident => (
                  <motion.button
                    key={incident.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedIncident(incident)}
                    className={cn(
                      "w-full p-4 lg:p-5 rounded-3xl border-2 text-left transition-all group relative overflow-hidden",
                      selectedIncident?.id === incident.id 
                        ? "border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-100" 
                        : "border-slate-50 hover:border-slate-200 bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2 lg:mb-3">
                      <span className={cn(
                        "px-2 lg:px-3 py-1 rounded-full text-[8px] lg:text-[9px] font-black uppercase tracking-widest",
                        incident.severity === Urgency.CRITICAL ? "bg-red-600 text-white" :
                        incident.severity === Urgency.SERIOUS ? "bg-orange-500 text-white" :
                        "bg-blue-600 text-white"
                      )}>
                        {incident.severity}
                      </span>
                      <span className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.floor((Date.now() - incident.timestamp) / 60000)}m ago
                      </span>
                    </div>
                    
                    <h4 className="font-black text-slate-900 mb-1 tracking-tight text-sm lg:text-base">{incident.reporterName}</h4>
                    <p className="text-[9px] lg:text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 lg:mb-3">{incident.location.campusZone}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-3 lg:mb-4">
                      {incident.symptoms.slice(0, 2).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-slate-100 rounded-md text-[8px] lg:text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 lg:pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          incident.status === IncidentStatus.RECEIVED ? "bg-red-600 animate-pulse" :
                          incident.status === IncidentStatus.DISPATCHED ? "bg-orange-500" :
                          "bg-green-600"
                        )}></div>
                        <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-500">
                          {incident.status}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </motion.button>
                ))
              )}
            </AnimatePresence>
          )}

          {activeTab === "fleet" && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Resource Readiness</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-blue-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ambulances</p>
                    <p className="text-lg font-black text-slate-900">{resources.filter(r => r.type === "ambulance" && r.status === "available").length}/{resources.filter(r => r.type === "ambulance").length}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-blue-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Boda Fleet</p>
                    <p className="text-lg font-black text-slate-900">{resources.filter(r => r.type === "boda" && r.status === "available").length}/{resources.filter(r => r.type === "boda").length}</p>
                  </div>
                </div>
              </div>

              {resources.filter(r => r.type !== "staff").map(resource => (
                <div key={resource.id} className="p-4 bg-white rounded-2xl border border-slate-100 space-y-3 group hover:border-blue-600 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        resource.type === "ambulance" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {resource.type === "ambulance" ? <Truck className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm tracking-tight">{resource.name}</h4>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            resource.status === "available" ? "bg-green-600" :
                            resource.status === "on_call" ? "bg-orange-500" :
                            "bg-slate-300"
                          )}></div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{resource.status}</span>
                        </div>
                      </div>
                    </div>
                    {resource.status === "available" && selectedIncident && selectedIncident.status === IncidentStatus.RECEIVED && canAssign && (
                      <button
                        onClick={() => handleAssignResource(selectedIncident.id, resource)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                      >
                        Assign
                      </button>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    {(["available", "on_call", "maintenance"] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => onUpdateResource(resource.id, { status })}
                        className={cn(
                          "flex-1 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all",
                          resource.status === status 
                            ? "bg-slate-900 text-white" 
                            : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                        )}
                      >
                        {status.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "staff" && (
            <div className="space-y-4">
              {resources.filter(r => r.type === "staff").map(staff => (
                <div key={staff.id} className="p-4 bg-white rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm tracking-tight">{staff.name}</h4>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">On Duty • Allan Galphin</p>
                      </div>
                    </div>
                    <div className={cn(
                      "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest",
                      staff.status === "available" ? "bg-green-50 text-green-600" : "bg-slate-50 text-slate-400"
                    )}>
                      {staff.status}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {(["available", "busy", "off_duty"] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => onUpdateResource(staff.id, { status: status as any })}
                        className={cn(
                          "flex-1 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all",
                          staff.status === status 
                            ? "bg-slate-900 text-white" 
                            : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                        )}
                      >
                        {status.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Map & Incident Details */}
      <div className={cn(
        "flex-1 flex flex-col gap-4 lg:gap-6 overflow-hidden",
        !selectedIncident ? "hidden lg:flex" : "flex"
      )}>
        {/* Map Container */}
        <div className={cn(
          "bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden relative z-0 transition-all duration-300",
          selectedIncident ? "h-40 lg:flex-1" : "flex-1"
        )}>
          <MapContainer 
            center={[0.354, 32.739]} 
            zoom={16} 
            className="w-full h-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {activeIncidents.map(incident => (
              <Marker 
                key={incident.id} 
                position={[incident.location.lat || 0.354, incident.location.lng || 32.739]}
                eventHandlers={{
                  click: () => setSelectedIncident(incident)
                }}
              >
                <Popup>
                  <div className="p-2">
                    <p className="font-black text-slate-900 text-xs uppercase tracking-tight mb-1">{incident.reporterName}</p>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{incident.location.campusZone}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
            {resources.filter(r => r.status === "available" && r.type !== "staff").map(resource => (
              <Marker
                key={resource.id}
                position={resource.type === "ambulance" ? [0.355, 32.740] : [0.353, 32.738]} // Mock positions
                icon={L.divIcon({
                  className: "custom-div-icon",
                  html: `<div style="background-color: ${resource.type === "ambulance" ? "#D90000" : "#003399"}; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.2);"></div>`,
                  iconSize: [12, 12],
                  iconAnchor: [6, 6]
                })}
              >
                <Popup>
                  <div className="p-2">
                    <p className="font-black text-slate-900 text-[10px] uppercase tracking-tight">{resource.name}</p>
                    <p className="text-[8px] font-bold text-green-600 uppercase tracking-widest">Available</p>
                  </div>
                </Popup>
              </Marker>
            ))}
            <MapUpdater center={selectedIncident ? [selectedIncident.location.lat, selectedIncident.location.lng] : null} />
          </MapContainer>

          {/* Map Overlays */}
          <div className="absolute top-4 lg:top-6 left-4 lg:left-6 z-10 space-y-2">
            <div className="bg-white/90 backdrop-blur-md p-3 lg:p-4 rounded-2xl lg:rounded-3xl border border-white/20 shadow-xl flex items-center gap-3 lg:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 lg:w-3 h-2 lg:h-3 rounded-full bg-red-600 animate-pulse"></div>
                <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-slate-900">{activeIncidents.length} Active Alerts</span>
              </div>
              <div className="w-px h-3 lg:h-4 bg-slate-200"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 lg:w-3 h-2 lg:h-3 rounded-full bg-green-600"></div>
                <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-slate-900">{resources.filter(r => r.status === "available").length} Responders Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Incident Details */}
        <AnimatePresence>
          {selectedIncident && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white p-4 sm:p-6 lg:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 overflow-y-auto lg:overflow-visible"
            >
              <div className="flex-1 space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <button 
                      onClick={() => setSelectedIncident(null)}
                      className="lg:hidden p-1.5 sm:p-2 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
                    </button>
                    <div className="w-10 sm:w-12 lg:w-14 h-10 sm:h-12 lg:h-14 bg-slate-50 rounded-xl lg:rounded-2xl flex items-center justify-center text-slate-400">
                      <User className="w-5 sm:w-6 lg:w-8 h-5 sm:h-6 lg:h-8" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-xl lg:text-2xl font-black text-slate-900 tracking-tight leading-none mb-0.5 sm:mb-1">{selectedIncident.reporterName}</h3>
                      <p className="text-[9px] sm:text-[10px] lg:text-xs font-bold text-blue-600 uppercase tracking-widest">{selectedIncident.location.campusZone} • {selectedIncident.location.specificLocation}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 sm:gap-2">
                    <button className="p-2 sm:p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                      <Phone className="w-3.5 sm:w-5 h-3.5 sm:h-5" />
                    </button>
                    <button className="p-2 sm:p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                      <MessageSquare className="w-3.5 sm:w-5 h-3.5 sm:h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">Reporter Info</p>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <Phone className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-blue-600" />
                        {selectedIncident.reporterPhone}
                      </p>
                      {selectedIncident.ucuId && (
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          ID: {selectedIncident.ucuId}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">Victim / Patient</p>
                    <p className="text-xs font-bold text-slate-900">
                      {selectedIncident.victimName || "Not specified"}
                    </p>
                  </div>
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">Severity</p>
                    <span className={cn(
                      "px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest",
                      selectedIncident.severity === Urgency.CRITICAL ? "bg-red-600 text-white" :
                      selectedIncident.severity === Urgency.SERIOUS ? "bg-orange-500 text-white" :
                      "bg-blue-600 text-white"
                    )}>
                      {selectedIncident.severity}
                    </span>
                  </div>
                </div>

                {selectedIncident.photoUrl && (
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">Photographic Proof</p>
                    <div className="w-full max-w-sm h-32 sm:h-48 rounded-xl overflow-hidden border-2 border-slate-200">
                      <img 
                        src={selectedIncident.photoUrl} 
                        alt="Emergency Proof" 
                        className="w-full h-full object-cover cursor-zoom-in"
                        onClick={() => window.open(selectedIncident.photoUrl, '_blank')}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}

                <div className="p-3 sm:p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-[8px] sm:text-[9px] font-black text-blue-600 uppercase tracking-widest mb-0.5 sm:mb-1">Description</p>
                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                    {selectedIncident.description || "No additional details provided."}
                  </p>
                </div>

                <div className="p-3 sm:p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-amber-600 rounded-lg text-white">
                      <Stethoscope className="w-4 sm:w-5 h-4 sm:h-5" />
                    </div>
                    <div>
                      <p className="text-[8px] sm:text-[9px] font-black text-amber-600 uppercase tracking-widest">Medic Support</p>
                      <p className="text-[10px] sm:text-xs font-bold text-amber-900">Require Medic Pickup?</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onUpdateIncident(selectedIncident.id, { medicPickupRequired: !selectedIncident.medicPickupRequired })}
                    className={cn(
                      "px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all",
                      selectedIncident.medicPickupRequired ? "bg-amber-600 text-white shadow-lg shadow-amber-200" : "bg-white text-amber-600 border border-amber-200"
                    )}
                  >
                    {selectedIncident.medicPickupRequired ? "Required" : "Not Required"}
                  </button>
                </div>
              </div>

              <div className="w-full lg:w-64 space-y-3 sm:space-y-4">
                <h4 className="text-[10px] sm:text-xs font-black text-slate-900 uppercase tracking-widest mb-2 sm:mb-4">Quick Actions</h4>
                
                {selectedIncident.status === IncidentStatus.RECEIVED && canAssign && (
                  <button 
                    onClick={() => setShowFleetPicker(true)}
                    className="w-full py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                  >
                    <Truck className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    Dispatch Responder
                  </button>
                )}

                {selectedIncident.status === IncidentStatus.RECEIVED && !canAssign && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Awaiting Dispatch by Doctor/Admin</p>
                  </div>
                )}

                <button 
                  onClick={() => onUpdateIncident(selectedIncident.id, { status: IncidentStatus.ARRIVED })}
                  className="w-full py-2.5 sm:py-3 bg-green-600 text-white rounded-xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  Mark Arrived
                </button>
                <button 
                  onClick={() => onUpdateIncident(selectedIncident.id, { status: IncidentStatus.COMPLETED })}
                  className="w-full py-2.5 sm:py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest hover:bg-slate-950 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  Complete Incident
                </button>
                <button className="w-full py-2.5 sm:py-3 bg-white border-2 border-slate-100 text-slate-400 rounded-xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest hover:border-red-600 hover:text-red-600 transition-all flex items-center justify-center gap-2">
                  <AlertTriangle className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  Escalate
                </button>
                <button 
                  onClick={() => setSelectedIncident(null)}
                  className="w-full py-2 sm:py-3 text-slate-400 font-bold text-[10px] sm:text-xs hover:text-slate-600 transition-colors"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fleet Picker Modal (Mobile Friendly) */}
        <AnimatePresence>
          {showFleetPicker && selectedIncident && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
              >
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Select Responder</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available fleet for dispatch</p>
                  </div>
                  <button 
                    onClick={() => setShowFleetPicker(false)}
                    className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {resources.filter(r => r.type !== "staff" && r.status === "available").length === 0 ? (
                    <div className="py-12 text-center">
                      <Bike className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No available responders</p>
                    </div>
                  ) : (
                    resources.filter(r => r.type !== "staff" && r.status === "available").map(resource => (
                      <button
                        key={resource.id}
                        onClick={() => handleAssignResource(selectedIncident.id, resource)}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-blue-600 hover:bg-white transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            resource.type === "ambulance" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {resource.type === "ambulance" ? <Truck className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
                          </div>
                          <div className="text-left">
                            <h4 className="font-black text-slate-900 text-sm tracking-tight">{resource.name}</h4>
                            <p className="text-[9px] font-black uppercase tracking-widest text-green-600">Available</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                      </button>
                    ))
                  )}
                </div>

                <div className="p-6 bg-slate-50">
                  <button 
                    onClick={() => setShowFleetPicker(false)}
                    className="w-full py-4 bg-white border-2 border-slate-200 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:text-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
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
